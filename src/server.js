const express = require("express");
const path = require("path");

const { initializeDatabase } = require("./config/database");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const publicDirectory = path.join(__dirname, "..", "public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDirectory));
app.use(authRoutes);
app.use(dashboardRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "TestCase Manager",
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDirectory, "index.html"));
});

async function startServer() {
  await initializeDatabase();

  app.listen(PORT, HOST, () => {
    console.log(`TestCase Manager is running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start server.", error);
  process.exit(1);
});
