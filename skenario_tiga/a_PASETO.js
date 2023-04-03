require("dotenv").config();
const { V3 } = require("paseto");
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

function maskUserData(user) {
  const maskedUser = { ...user };
  if (user.noKTP) {
    maskedUser.noKTP = "****";
  }
  if (user.password) {
    maskedUser.password = "****";
  }
  return maskedUser;
}

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
  return V3.encrypt(user, process.env.ACCESS_TOKEN_SECRET, {
    audience: "urn:example:client",
    issuer: "https://op.example.com",
    expiresIn: "30s",
  });
}
//fungsi generate refresh token
function generateRefreshToken(user) {
  return V3.encrypt(user, process.env.REFRESH_TOKEN_SECRET);
}

// Middleware to verify PASETO token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    const payload = await V3.decrypt(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(payload.userId);
    next();
  } catch (err) {
    if (err.code === "ERR_PASETO_CLAIM_INVALID") {
      return res.status(403).json({ error: "Token Expired" });
    } else if (err.code === "ERR_PASETO_INVALID") {
      return res.status(403).json({ error: "Invalid Token" });
    } else {
      console.log(err);
      return res.status(500).json({ error: "Server error" });
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
