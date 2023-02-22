require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());
const { V3 } = require("paseto");

const posts = [
  {
    username: "adiva",
    title: "Post 1",
  },
  {
    username: "Budi",
    title: "Post 2",
  },
];

app.get("/posts", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  //verifikasi token
  (async () => {
    const verify = await V3.decrypt(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      (err) => {
        if (err) return res.sendStatus(403);
      }
    );
    // console.log(verify);
    req.user = verify;
    res.json(posts.filter((post) => post.username === req.user.name));
  })();
});

app.listen(8181);
