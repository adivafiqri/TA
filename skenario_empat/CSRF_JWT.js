require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cookieParser());
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

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }
    const cookieValue = req.cookies["token"];
    const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (cookieValue !== token) {
      return res.status(401).json({ message: "Forbidden cookie tidak sama" });
    }

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

// Protected route
app.patch("/users/:userId", authMiddleware, async (req, res) => {
  try {
    // Check if the user is authorized to access the resource
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update user data
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const change_user = await userCollection.updateOne(
      { id: req.userId },
      { $set: { username, password } }
    );

    if (!change_user) {
      return res.status(404).send("Gagal Melakukan update!");
    }

    res.status(200).json({ message: "User data updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
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
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    userId: user.id,
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
    expiresIn: "1h",
    algorithm: "HS384",
  });
}

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

// Start the server
app.listen({ proxy: "http://127.0.0.1:8080", port: 3000 }, () => {
  console.log("Server is running on port 3000");
});
