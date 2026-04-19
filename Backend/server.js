require("dotenv").config();
const path = require("path");
const express = require("express");

const app = require("./src/app");
const connectToDB = require("./src/config/database");

connectToDB();

const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// SPA fallback: serve index for non-API routes.
app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
        return next();
    }
    return res.sendFile(path.join(publicPath, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});