require("dotenv").config();

const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

let postsCollection;
dbPromise.then((db) => {
  postsCollection = db.collection(process.env.POSTS_COLLECTION_NAME);
});

app.get("/posts", authenticateToken, async (req, res) => {
  // Use postsCollection instead of posts
  const posts = await postsCollection
    .find({ username: req.user.name })
    .toArray();
  res.json(posts);
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(3000, () => {
  console.log("Server started on port 3000 testing");
});
