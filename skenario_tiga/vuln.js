const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();

const comments = [
  { id: 1, articleId: 1, content: "This is a comment", authorId: 1 },
  { id: 2, articleId: 1, content: "Another comment", authorId: 2 },
  { id: 3, articleId: 2, content: "Comment on article 2", authorId: 1 },
  { id: 4, articleId: 2, content: "Another comment on article 2", authorId: 3 },
];

app.get("/api/articles/:articleId/comments/:commentId", (req, res, next) => {
  const articleId = req.params.articleId;
  const commentId = req.params.commentId;
  const comment = comments.find(
    (comment) => comment.articleId === +articleId && comment.id === +commentId
  );
  if (!comment) {
    return res.status(404).json({ message: "Comment not found." });
  }
  // Retrieve author information from the database
  const author = retrieveAuthor(comment.authorId);
  const metadata = {
    id: comment.id,
    content: comment.content,
    author: {
      id: author.id,
      name: author.name,
    },
  };
  return res.status(200).json(metadata);
});

function retrieveAuthor(authorId) {
  // Implement logic to retrieve author information from the database
  // For example:
  const authors = [
    {
      id: 0,
      username: "admin",
      password: "password",
      name: "admin",
      email: "admin@google.com",
      role: "admin",
    },
    {
      id: 1,
      username: "john",
      name: "John Doe",
      email: "john.doe@example.com",
      role: "user",
      noKTP: "123456789",
      password: "john",
    },
    {
      id: 2,
      username: "jane",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "user",
      noKTP: "123456987",
      password: "jane",
    },
    {
      id: 3,
      username: "bob",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      role: "user",
      noKTP: "12345212",
      password: "bob",
    },
  ];
  return authors.find((author) => author.id === authorId);
}

// Start the server
app.listen(3000, () => console.log("Server started on port 3000"));
