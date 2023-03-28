const { MongoClient, ServerApiVersion } = require("mongodb");

async function connectToMongo() {
  const uri =
    "mongodb+srv://adivafiqri:m7K0G0eMK7qL27ag@taadiva.3lgefed.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("skenario_dua"); // return the database connection
  } catch (e) {
    console.error("Error connecting to MongoDB", e);
  }
}

module.exports = connectToMongo;
