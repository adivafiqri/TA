require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();

app.use(express.json());

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken
let userCollection;
let refreshTokensCollection;
dbPromise.then((db) => {
  userCollection = db.collection(process.env.USER_COLLECTION_NAME);
  refreshTokensCollection = db.collection(
    process.env.REFRESH_TOKENS_COLLECTION_NAME
  );
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Authenticate user in MongoDB

  const user = await userCollection.findOne({
    username: username,
    password: password,
  });

  if (!user) {
    return res.sendStatus(401);
  }

  // Generate tokens and respond to client
  const accessToken = generateAccessToken({
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  //memasukan refresh token ke collection
  refreshTokensCollection.insertOne({ token: refreshToken }, (err, result) => {
    if (err) return res.sendStatus(500);
  });

  //respons ke cookie dengan httpOnly false
  res.cookie("token", accessToken, { httpOnly: false });
  //respons
  res.json({
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30s",
    algorithm: "HS384",
  });
}

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }

    const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log(decoded.userId);
    req.userId = decoded.userId;
    next();
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

// Start the server
app.listen(3000, () => console.log("Server started on port 3000"));
