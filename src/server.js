const express = require("express");
const session = require("express-session");
const path = require("path");

const { initializeDatabase } = require("./config/database");
const authRoutes = require("./routes/auth");
const commentRoutes = require("./routes/comments");
const dashboardRoutes = require("./routes/dashboard");
const testCaseRoutes = require("./routes/testcases");
const userRoutes = require("./routes/users");
const { ensureCsrfToken } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const publicDirectory = path.join(__dirname, "..", "public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    // This signs the session cookie for the browser.
    secret: process.env.SESSION_SECRET || "my-session-secret", //Set session secret in env file
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", //Send over HTTPS in production
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);
app.use(ensureCsrfToken);
app.use(express.static(publicDirectory));
app.use(authRoutes);
app.use(commentRoutes);
app.use(dashboardRoutes);
app.use(testCaseRoutes);
app.use(userRoutes);

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
