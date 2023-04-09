require("dotenv").config();
const express = require("express");
const app = express();
const { V3 } = require("paseto");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const port = 5000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken

let userCollection;
let refreshTokensCollection;

dbPromise.then((db) => {
  userCollection = db.collection(process.env.USER_COLLECTION_NAME);
  refreshTokensCollection = db.collection(
    process.env.REFRESH_TOKENS_COLLECTION_NAME
  );
});

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }
    const cookieValue = req.cookies["token"];
    const decoded = await V3.decrypt(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decoded);
    if (cookieValue !== token) {
      return res.status(401).json({ message: "Forbidden cookie tidak sama" });
    }
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err.code === "ERR_PASETO_CLAIM_INVALID") {
      return res.status(403).json({ error: "Token Expired" });
    } else if (err.code === "ERR_PASETO_INVALID") {
      return res.status(403).json({ error: "Invalid Token" });
    } else {
      return res.status(500).json({ error: "Server error" });
    }
  }
};

// Protected route
app.patch("/users/:userId", authMiddleware, async (req, res) => {
  try {
    // Check if the user is authorized to access the resource
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update user data
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const change_user = await userCollection.updateOne(
      { id: req.userId },
      { $set: { username, password } }
    );

    if (!change_user) {
      return res.status(404).send("Gagal Melakukan update!");
    }

    res.status(200).json({ message: "User data updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//POST : login
app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await userCollection.findOne({
    username: username,
    password: password,
  });

  if (!user) {
    return res.sendStatus(401);
  }

  const accessToken = await generateAccessToken({
    userId: user.id,
    name: username,
    email: user.email,
    role: user.role,
  });
  const refreshToken = await generateRefreshToken({
    userId: user.id,
    name: username,
    email: user.email,
    role: user.role,
  });

  try {
    await refreshTokensCollection.insertOne({ token: refreshToken });
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
  //respons ke cookie dengan httpOnly false
  res.cookie("token", accessToken, { httpOnly: false });
  res.json({ accessToken: accessToken, refreshToken: refreshToken });
});

//fungsi generate access token
function generateAccessToken(user) {
  return V3.encrypt(user, process.env.ACCESS_TOKEN_SECRET, {
    audience: "urn:example:client",
    issuer: "https://op.example.com",
    expiresIn: "1h",
  });
}
//fungsi generate refresh token
function generateRefreshToken(user) {
  return V3.encrypt(user, process.env.REFRESH_TOKEN_SECRET);
}

// Start the server
app.listen(port, () => console.log(`Server started on port ${port}`));
