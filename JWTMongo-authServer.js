require("dotenv").config();

const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

let refreshTokens = [];

const connect = require("./db");
connect();

app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ name: user.name });
    res.json({ accessToken: accessToken });
  });
});

app.delete("/logout", (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.sendStatus(204);
});

const db = require("./dbMongo")();

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Authenticate user in MongoDB
  const collection = db.collection(process.env.MONGO_COLLECTION_NAME);
  const user = await collection.findOne({
    username: username,
    password: password,
  });

  if (!user) {
    return res.sendStatus(401);
  }

  // Generate tokens and respond to client
  const accessToken = generateAccessToken({ name: username });
  const refreshToken = jwt.sign(
    { name: username },
    process.env.REFRESH_TOKEN_SECRET
  );
  refreshTokens.push(refreshToken);
  res.json({ accessToken: accessToken, refreshToken: refreshToken });
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30s",
    algorithm: "HS384",
  });
}

app.listen(4000, () => {
  console.log("Server started on port 4000");
});
