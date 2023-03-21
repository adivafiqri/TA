require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const port = 5000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(express.json());

const connectToMongo = require("./dbMongo");
const dbPromise = connectToMongo();

//refreshtoken
let usersCollection;

dbPromise.then((db) => {
    usersCollection = db.collection(process.env.USER_COLLECTION_NAME);
});

  // Middleware to verify JWT token
  const verifyToken = async (req, res, next) => {
    try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401).json({ message: "Token not found" });
    const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
              if (err) reject(err);
              resolve(user);
            });
          });
          
    console.log(decoded.userId);
    req.userId = decoded.userId;
    next();
    } catch (err) {
      console.log(err);
      return res.status(403).json({ message: "Invalid token" });
    }
  };

  // Protected route
  app.patch("/users/:userId", verifyToken, (req, res) => {
    // Check if the user is authorized to access the resource
    if (req.userId !== req.params.userId) {
      return res.status(403).json({ message: "Forbiddens" });
    }

    // Update user data
    const { username, password } = req.body;
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    usersCollection.updateOne(
      { userId: req.userId },
      { $set: { username, password } },
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Internal Server Error" });
        }
        if(result) return res.status(200).json({ message: "User data updated" });
      }
    );
  });

  // Start the server
  app.listen(port, () => console.log(`Server started on port ${port}`));
