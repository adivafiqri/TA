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

app.post("/token", async (req, res) => {
  const refreshToken = req.body.token;

  if (refreshToken == null) return res.sendStatus(401);
  const findrefreshTokens = await refreshTokensCollection.findOne({
    token: refreshToken,
  });

  if (!findrefreshTokens) {
    console.log("tidak ada collection");
    return res.sendStatus(401);
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ name: user.name });
    res.json({ accessToken: accessToken, name: user.name });
  });
});

app.delete("/logout", (req, res) => {
  const refreshToken = req.body.token;
  refreshTokensCollection.deleteOne({ token: refreshToken }, (err, result) => {
    if (err) return res.sendStatus(500);
  });
  res.sendStatus(204);
});

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
    expiresIn: "30s",
    algorithm: "HS384",
  });
}

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

app.listen(4000, () => {
  console.log("Server started on port 4000");
});
