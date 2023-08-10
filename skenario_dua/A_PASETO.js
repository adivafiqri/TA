require("dotenv").config();
const express = require("express");
const app = express();
const { performance } = require("perf_hooks");
const { V3 } = require("paseto");

app.use(express.json());

//koneksi db
const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//collection db
let refreshTokensCollection;
let userCollection;
dbPromise.then((db) => {
  refreshTokensCollection = db.collection(
    process.env.REFRESH_TOKENS_COLLECTION_NAME
  );
  userCollection = db.collection(process.env.USER_COLLECTION_NAME);
});

//footer
const footer = {
  audience: "urn:example:adiva",
  issuer: "https:/adiva.com",
  expiresIn: "1h",
};

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
    userId: user.userId,
    name: username,
  });
  const jumlahtoken = accessToken.length;
  const refreshToken = await generateRefreshToken({
    userId: user.userId,
    name: username,
  });

  try {
    await refreshTokensCollection.insertOne({ token: refreshToken });
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }

  res.json({
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});
//DELETE : logout
app.delete("/logout", (req, res) => {
  const refreshToken = req.body.token;
  refreshTokensCollection.deleteOne({ token: refreshToken }, (err, result) => {
    if (err) return res.sendStatus(500);
  });
  res.sendStatus(204);
});
//fungsi generate access token
function generateAccessToken(user) {
  return V3.encrypt(user, process.env.ACCESS_TOKEN_SECRET, footer);
}
//fungsi generate refresh token
function generateRefreshToken(user) {
  return V3.encrypt(user, process.env.REFRESH_TOKEN_SECRET);
}

app.get("/posts", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  try {
    const verify = await V3.decrypt(token, process.env.ACCESS_TOKEN_SECRET);
    res.json(verify);
  } catch (err) {
    if (err.code === "ERR_PASETO_CLAIM_INVALID") {
      return res.status(403).json({ error: "Token Expired" });
    } else if (err.code === "ERR_PASETO_INVALID") {
      return res.status(403).json({ error: "Invalid Token" });
    } else {
      console.log(err);
      return res.status(500).json({ error: "Server error" });
    }
  }
});

app.listen(8080, () => {
  console.log("Server started on port 8080");
});
