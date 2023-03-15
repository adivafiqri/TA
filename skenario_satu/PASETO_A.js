require("dotenv").config();
const express = require("express");
const app = express();
const {
  V4: { sign, verify },
} = require("paseto");

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

    const payload = await verify(token, process.env.ACCESS_TOKEN_SECRET);

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

// Handler untuk endpoint /login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Validasi username dan password
  if (username === process.env.USERNAME && password === process.env.PASSWORD) {
    // Generate access token menggunakan PASETO v4
    const accessToken = await sign(
      { userId: process.env.USER_ID },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION }
    );

    res.json({ accessToken });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
