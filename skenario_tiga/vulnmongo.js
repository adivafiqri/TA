const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
require("dotenv").config();

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken
let commentsCollection;
let userCollection;
dbPromise.then((db) => {
  commentsCollection = db.collection(process.env.COMMENTS_COLLECTION_NAME);
  userCollection = db.collection(process.env.USER_COLLECTION_NAME);
});

app.get(
  "/api/articles/:articleId/comments/:commentId",
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
      author: author,
    };
    return res.status(200).json(metadata);
  }
);

async function retrieveAuthor(authorId) {
  // Implement logic to retrieve author information from the database
  // For example:
  //author colections
  return await userCollection.findOne({ id: authorId });
}

// Start the server
app.listen(3000, () => console.log("Server started on port 3000"));
