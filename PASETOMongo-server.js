require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const { V3 } = require("paseto");

const app = express();
app.use(express.json());

//koneksi db
const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//collection db
let postsCollection;
dbPromise.then((db) => {
  postsCollection = db.collection(process.env.POSTS_COLLECTION_NAME);
});

app.get("/posts", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  try {
    const verify = await V3.decrypt(token, process.env.ACCESS_TOKEN_SECRET);
    const posts = await postsCollection
      .find({ username: verify.name })
      .toArray();
    res.json(posts);
  } catch (err) {
    if (err.code === "ERR_PASETO_CLAIM_INVALID") {
      return res.status(403).json({ error: "Token Expired" });
    } else {
      return res.status(500).json({ error: "Server error" });
    }
  }
});

app.listen(8181, () => {
  console.log("Server started on port 8181");
});
