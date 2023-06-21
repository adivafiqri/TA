require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

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

    const payload = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) reject(err);
        resolve(user);
      });
    });

    console.log(payload.userId);
    console.log(req.params.shopId);
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
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError" && err.message === "jwt malformed") {
      // Token is malformed
      return res.status(400).json({ message: "Invalid token" });
    } else {
      // Other error occurred
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
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

app.post("/api/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Authenticate user in MongoDB

  const user = await userCollection.findOne({
    username: username,
    password: password,
  });

  if (!user) {
    return res.sendStatus(401).json({ error: "Unauthorized" });
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
    email: user.email,
    role: user.role,
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
    expiresIn: "1h",
    algorithm: "HS384",
  });
}

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
