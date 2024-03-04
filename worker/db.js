const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        const username = "sysadmin";
        const password = "sysadmin";
        const dbName = "codingfame";

        const connectionString = `mongodb://${username}:${password}@localhost:27017/${dbName}`;

        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error disconnecting from MongoDB:", error);
    }
}

module.exports = { connectToDatabase, disconnectFromDatabase };
