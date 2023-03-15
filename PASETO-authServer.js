require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());
const { V3 } = require("paseto");

const footer = {
  audience: "urn:example:client",
  issuer: "https://op.example.com",
  expiresIn: "30s",
};

let refreshTokens = [];

app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

  //bangkitkan access token
  (async () => {
    const verify = await V3.decrypt(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err) => {
        if (err) return res.sendStatus(403);
      }
    );

    const accessToken = generateAccessToken({ name: verify.name });
    res.json({ accessToken: await accessToken });
  })();
});

app.delete("/logout", (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  console.log(refreshTokens);
  res.sendStatus(204);
});

app.post("/login", (req, res) => {
  //AES 256 CTR
  const username = req.body.username;
  const user = { name: username };
  const accessToken = generateAccessToken({
    userId: user.userId,
    name: username,
  });
  const refreshToken = generateRefreshToken({
    userId: user.userId,
    name: username,
  });
  //access token
  (async () => {
    res.json({
      accessToken: await accessToken,
      refreshtoken: await refreshToken,
    });
    refreshTokens.push(await refreshToken);
    console.log(refreshTokens);
  })();
});

function generateAccessToken(user) {
  return V3.encrypt(user, process.env.ACCESS_TOKEN_SECRET, footer);
}
function generateRefreshToken(user) {
  return V3.encrypt(user, process.env.REFRESH_TOKEN_SECRET);
}

app.listen(8080);
