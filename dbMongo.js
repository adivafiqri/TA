const MongoClient = require("mongodb").MongoClient;

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db(process.env.MONGO_DB_NAME);
  } catch (err) {
    console.error(err);
  }
}

module.exports = connect;
