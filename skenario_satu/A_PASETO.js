require("dotenv").config();
const express = require("express");
const app = express();
const { V3 } = require("paseto");

app.use(express.json());

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken
let shopPermissions;
let shopsCollections;
let userCollection;
let refreshTokensCollection;

dbPromise.then((db) => {
  shopPermissions = db.collection(process.env.SHOP_PERMISSIONS_COLLECTION_NAME);
  shopsCollections = db.collection(process.env.SHOPS_COLLECTION_NAME);
  userCollection = db.collection(process.env.USER_COLLECTION_NAME);
  refreshTokensCollection = db.collection(
    process.env.REFRESH_TOKENS_COLLECTION_NAME
  );
});

// Fungsi untuk memeriksa apakah pengguna memiliki hak akses ke toko yang dimaksud
const checkPermission = async (shopId, userId) => {
  try {
    // Mencari hak akses pengguna ke toko tertentu
    const permission = await shopPermissions.findOne({
      shop_id: shopId,
      user_id: userId,
    });

    // Jika pengguna memiliki hak akses, return true, jika tidak return false
    if (permission) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    const payload = await V3.decrypt(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(payload.userId);
    const hasPermission = await checkPermission(
      req.params.shopId,
      payload.userId
    );

    if (hasPermission) {
      req.userId = payload.userId;
      next();
    } else {
      res.status(403).send("Forbidden");
    }
  } catch (err) {
    if (err.code === "ERR_PASETO_CLAIM_INVALID") {
      return res.status(403).json({ error: "Token Expired" });
    } else if (err.code === "ERR_PASETO_INVALID") {
      return res.status(403).json({ error: "Invalid Token" });
    } else {
      return res.status(500).json({ error: "Server error" });
    }
  }
};

// Handler untuk endpoint /shops/:shopId/revenue_data.json
app.get(
  "/shops/:shopId/revenue_data.json",
  authMiddleware,
  async (req, res) => {
    // Menampilkan data penjualan untuk toko dengan ID shopId
    try {
      const shop = await shopsCollections.findOne({
        id: req.params.shopId,
      });

      if (!shop) {
        return res.status(404).send("Toko tidak ditemukan");
      }

      // Menampilkan data penjualan untuk toko dengan ID shopId
      // Kirimkan data revenue dalam bentuk JSON
      res.send(
        `Revenue data untuk toko ${shop.name} sejumlah ${shop.revenue} `
      );
    } catch (error) {
      console.log(error);
    }
  }
);

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
  return V3.encrypt(user, process.env.ACCESS_TOKEN_SECRET, {
    audience: "urn:example:adiva",
    issuer: "https://adiva.com",
    expiresIn: "1h",
  });
}
//fungsi generate refresh token
function generateRefreshToken(user) {
  return V3.encrypt(user, process.env.REFRESH_TOKEN_SECRET);
}

app.listen(8080, () => {
  console.log("Server started on port 8080");
});
