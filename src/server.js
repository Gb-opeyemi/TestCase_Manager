const express = require("express");
const path = require("path");

const { initializeDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const publicDirectory = path.join(__dirname, "..", "public");

initializeDatabase();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDirectory));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "TestCase Manager",
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDirectory, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`TestCase Manager is running at http://${HOST}:${PORT}`);
});
