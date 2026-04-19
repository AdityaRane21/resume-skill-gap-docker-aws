require("dotenv").config();
const path = require("path");
const express = require("express");

const app = require("./src/app");
const connectToDB = require("./src/config/database");

const publicPath = path.join(__dirname, "public");

// Serve static files
app.use(express.static(publicPath));

// ✅ Health check route (VERY IMPORTANT)
app.get("/", (req, res) => {
    res.status(200).send("OK");
});

// SPA fallback
app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
        return next();
    }
    return res.sendFile(path.join(publicPath, "index.html"));
});

const PORT = process.env.PORT || 3000;

// ✅ Start server ONLY after DB connects
connectToDB()
    .then(() => {
        console.log("Connected to Database");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("DB connection failed:", err);
        process.exit(1);
    });