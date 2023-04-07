require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken
let shopPermissions;
let shopsCollections;

dbPromise.then((db) => {
  shopPermissions = db.collection(process.env.SHOP_PERMISSIONS_COLLECTION_NAME);
  shopsCollections = db.collection(process.env.SHOPS_COLLECTION_NAME);
});

// Handler untuk endpoint /shops/:shopId/revenue_data.json
app.get("/shops/:shopId/revenue_data.json", async (req, res) => {
  console.log(req.params.shopId);
  // Ambil data revenue dari database untuk toko dengan shopId

  const shop = await shopsCollections.findOne({
    id: req.params.shopId,
  });

  if (!shop) {
    return res.status(404).send("Toko tidak ditemukan");
  }

  // Menampilkan data penjualan untuk toko dengan ID shopId
  // Kirimkan data revenue dalam bentuk JSON
  res.send(`Revenue data untuk toko ${shop.name} sejumlah ${shop.revenue} `);
});

app.listen(4000, () => {
  console.log("Server started on port 4000");
});
