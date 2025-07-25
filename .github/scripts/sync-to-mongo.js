const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// --- Configuration ---
// These are passed from the GitHub Actions workflow
const mongoURI = process.env.MONGO_URI;
const filePath = process.env.FILE_PATH;
const version = process.env.COMMIT_SHA;
const timestamp = process.env.COMMIT_TIMESTAMP;

// --- You can customize these ---
const dbName = "file_versions"; // The database to use
const collectionName = "file_history"; // The collection to store versions

// A quick check to ensure all required environment variables are present
if (!mongoURI || !filePath || !version || !timestamp) {
  console.error("Error: Missing one or more required environment variables.");
  process.exit(1);
}

async function syncToMongo() {
  const client = new MongoClient(mongoURI);

  try {
    // 1. Connect to MongoDB
    await client.connect();
    console.log("✅ Connected successfully to MongoDB.");
    const collection = client.db(dbName).collection(collectionName);

    // 2. Read the file's content
    const fileContent = fs.readFileSync(filePath, "utf8");
    console.log(`📄 Read content from ${filePath}.`);

    // 3. Prepare the document for insertion
    const versionDocument = {
      filename: path.basename(filePath),
      path: filePath,
      content: fileContent,
      version: version, // The commit SHA acts as the version ID
      timestamp: new Date(timestamp), // The time of the commit
      createdAt: new Date(), // The time this action ran
    };

    // 4. Insert the new version document into the collection
    const result = await collection.insertOne(versionDocument);
    console.log(
      `🚀 Successfully inserted document with _id: ${result.insertedId}`
    );
  } catch (err) {
    console.error("❌ An error occurred:", err);
    process.exit(1); // Exit with a non-zero code to fail the Action
  } finally {
    await client.close();
    console.log("🔌 MongoDB connection closed.");
  }
}

syncToMongo();
