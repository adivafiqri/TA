require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();

app.use(express.json());

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken
let commentsCollection;
let userCollection;
let refreshTokensCollection;
dbPromise.then((db) => {
  commentsCollection = db.collection(process.env.COMMENTS_COLLECTION_NAME);
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

app.get(
  "/api/articles/:articleId/comments/:commentId",
  authMiddleware,
  async (req, res, next) => {
    const articleId = req.params.articleId;
    const commentId = req.params.commentId;
    //menggunakan mongodb
    const comment = await commentsCollection.findOne({
      articleId: parseInt(articleId),
      id: parseInt(commentId),
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }
    // Retrieve author information from the database
    const author = await retrieveAuthor(comment.authorId);
    const metadata = {
      id: comment.id,
      content: comment.content,
      author: author, // BAGIAN PENTING SENSITIVE DATA
    };
    return res.status(200).json(metadata);
  }
);

async function retrieveAuthor(authorId) {
  const user = await userCollection.findOne({ id: authorId });

  if (!user) {
    return null;
  }

  // Mask sensitive data supaya tidak terjadi
  const maskedUser = {
    id: user.id,
    name: user.name,
    email: "**********",
    role: user.role,
  };

  return maskedUser;
}

// Start the server
app.listen(3000, () => console.log("Server started on port 3000"));
