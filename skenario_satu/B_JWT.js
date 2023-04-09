require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const port = 5000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

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

    const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.headers["X-User-Id"] = decoded.userId;
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }

    console.log(err);
    return next(err);
  }
};

// Protected route
app.patch("/users/:userId", authMiddleware, async (req, res) => {
  try {
    const xUserId = req.headers["x-user-id"];
    console.log("X-User-Id header:", xUserId);
    // Check if the user is authorized to access the resource
    if (req.userId !== req.params.userId || xUserId !== req.params.userId) {
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
      { userId: req.userId },
      { $set: { username, password } }
    );

    if (!change_user) {
      return res.status(404).send("Gagal Melakukan update!");
    }
    res.set("X-User-Id", req.headers["X-User-Id"]);
    res.status(200).json({ message: "User data updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await userCollection.findOne({
    username: username,
    password: password,
  });

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const accessToken = generateAccessToken({
    userId: user.userId,
    name: username,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    userId: user.userId,
    name: username,
    email: user.email,
    role: user.role,
  });

  refreshTokensCollection.insertOne({ token: refreshToken }, (err) => {
    if (err) return res.sendStatus(500);
  });
  res.set("X-User-Id", user.userId);
  res.json({
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
    algorithm: "HS384",
  });
}

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

// Start the server
app.listen(port, () => console.log(`Server started on port ${port}`));
