// lib/mongodb.js
import { MongoClient } from "mongodb";

// Use environment-specific MongoDB URI
const uri = process.env.MONGODB_URI || "mongodb://mongo:27017/BCAN";

const options = {
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain a minimum of 5 socket connections
};

if (!uri) {
  throw new Error("Please add your Mongo URI to environment variables");
}

let client;
let clientPromise;

// In development, use a global variable to preserve the connection across module reloads
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new connection
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
