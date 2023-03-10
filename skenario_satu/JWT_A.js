require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken
let shopPermissions;

dbPromise.then((db) => {
  shopPermissions = db.collection(process.env.SHOP_PERMISSIONS_COLLECTION_NAME);
});

// Fungsi untuk memeriksa apakah pengguna memiliki hak akses ke toko yang dimaksud
const checkPermission = async (shopId, userId) => {
  try {
    // Mencari hak akses pengguna ke toko tertentu
    const permission = await shopPermissions.findOne({
      shop_id: new ObjectId(shopId),
      user_id: new ObjectId(userId),
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

// Middleware untuk memeriksa token JWT dan hak akses pengguna ke toko
const authMiddleware = async (req, res, next) => {
  try {
    // Mendapatkan token JWT dari header Authorization
    const token = req.header("Authorization").replace("Bearer ", "");

    // Memeriksa apakah token valid dan mendapatkan payload-nya
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Memeriksa apakah pengguna memiliki hak akses ke toko yang dimaksud
    const hasPermission = await checkPermission(
      req.params.shopId,
      payload.userId
    );

    // Jika pengguna memiliki hak akses, lanjut ke handler selanjutnya, jika tidak, kirim respon 403 Forbidden
    if (hasPermission) {
      req.userId = payload.userId;
      next();
    } else {
      res.status(403).send("Forbidden");
    }
  } catch (error) {
    console.log(error);
    res.status(401).send("Unauthorized");
  }
};

// Handler untuk endpoint /shops/:shopId/revenue_data.json
app.get("/shops/:shopId/revenue_data.json", authMiddleware, (req, res) => {
  // Menampilkan data penjualan untuk toko dengan ID shopId
  res.send("Revenue data for shop " + req.params.shopId);
});

app.listen(4000, () => {
  console.log("Server started on port 4000");
});
