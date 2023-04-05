require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

//let refreshTokens = [];

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken
let refreshTokensCollection;
let userCollection;
dbPromise.then((db) => {
  refreshTokensCollection = db.collection(
    process.env.REFRESH_TOKENS_COLLECTION_NAME
  );
  userCollection = db.collection(process.env.USER_COLLECTION_NAME);
});

// endpoint untuk membuat token
app.get("/api/token", (req, res) => {
  const payload = { id: 1, role: "admin" };
  const options = { expiresIn: "1h", algorithm: "none" };

  const token = jwt.sign(payload, null, options);
  res.json({ token });
});

// endpoint untuk menambah user
app.post("/api/users", async (req, res) => {
  const { username, email, password, role } = req.body;
  // verifikasi token
  const token = req.headers.authorization.split(" ")[1];
  try {
    const decoded = jwt.verify(token, null, {
      algorithms: [
        "none",
        "HS256",
        "HS384",
        "HS512",
        "RS256",
        "RS384",
        "RS512",
        "ES256",
        "ES384",
        "ES512",
        "PS256",
        "PS384",
        "PS512",
      ],
    });
    if (decoded.role !== "admin") {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  // proses tambah user
  try {
    const result = await userCollection.insertOne({
      username: username,
      email: email,
      password: password,
      role: role,
    });
    if (result) {
      res.json({ message: "User added successfully" });
    } else {
      res.status(401).json({ message: "Gagal insert data!" });
    }
  } catch (err) {
    res.status(401).json({ message: "Gagal insert data!" });
  }
});

//Verify Access Token
app.get("/verify", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null)
    return res.sendStatus(401).json({ message: "Token not found" });
  jwt.verify(
    token,
    null,
    {
      algorithms: [
        "none",
        "HS256",
        "HS384",
        "HS512",
        "RS256",
        "RS384",
        "RS512",
        "ES256",
        "ES384",
        "ES512",
        "PS256",
        "PS384",
        "PS512",
      ],
    },
    (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Invalid token" });
      }
      req.user = decoded;
      console.log(req.user);
    }
  );
});

//Login
app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Authenticate user in MongoDB

  const user = await userCollection.findOne({
    username: username,
    password: password,
  });

  if (!user) {
    return res.sendStatus(401);
  }

  // Generate tokens and respond to client
  const accessToken = generateAccessToken({
    userId: user.userId,
    name: username,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    userId: user.userId,
    name: username,
  });

  //memasukan refresh token ke collection
  refreshTokensCollection.insertOne({ token: refreshToken }, (err, result) => {
    if (err) return res.sendStatus(500);
  });

  //respons
  res.json({
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    algorithm: "HS384",
    issuer: "urn:jwt",
  });
}
function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
