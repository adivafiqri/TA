require("dotenv").config();
const express = require("express");
const app = express();
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
  audience: "urn:example:client",
  issuer: "https://op.example.com",
  expiresIn: "30s",
};

// POST : TOKEN
app.post("/token", async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);

  try {
    const findrefreshTokens = await refreshTokensCollection.findOne({
      token: refreshToken,
    });

    if (!findrefreshTokens) {
      console.log("tidak ada collection");
      return res.sendStatus(401);
    }

    const verify = await V3.decrypt(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const accessToken = await generateAccessToken({ name: verify.name });
    res.json({ accessToken: await accessToken });
  } catch (err) {
    console.log(err);
    return res.sendStatus(403);
  }
});

//DELETE : LOGOUT
app.delete("/logout", async (req, res) => {
  const refreshToken = req.body.token;
  try {
    await refreshTokensCollection.deleteOne({ token: refreshToken });
    console.log("Deleted refresh token from database");
    return res.sendStatus(204);
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
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
    userId: user.userId,
    name: username,
  });
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

  res.json({ accessToken: accessToken, refreshToken: refreshToken });
});

//fungsi generate access token
function generateAccessToken(user) {
  return V3.encrypt(user, process.env.ACCESS_TOKEN_SECRET, footer);
}
//fungsi generate refresh token
function generateRefreshToken(user) {
  return V3.encrypt(user, process.env.REFRESH_TOKEN_SECRET);
}

app.listen(8080, () => {
  console.log("Server started on port 8080");
});
