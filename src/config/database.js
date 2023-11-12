// Load environment variables
require("dotenv").config();

const mongoose = require("mongoose");

// Database connection states
const dbState = [
  { value: 0, label: "Disconnected" },
  { value: 1, label: "Connected" },
  { value: 2, label: "Connecting" },
  { value: 3, label: "Disconnecting" },
];

// Check if the database is local
const isLocalDtb = process.env.DB_HOST?.includes("localhost");

// Function to establish a connection to the database
const connection = async () => {
  // Set connection options based on environment (local or remote)
  const options = !isLocalDtb
    ? {
        user: process.env.DB_USER,
        pass: process.env.DB_PASSWORD,
        dbName: process.env.DB_NAME,
      }
    : {};

  // Connect to the MongoDB database using Mongoose
  await mongoose.connect(process.env.DB_HOST, options);

  // Get the state of the connection
  const state = Number(mongoose.connection.readyState);
  console.log(dbState.find((f) => f.value === state).label, "to the Database"); // Display the connection state
};

module.exports = connection;
