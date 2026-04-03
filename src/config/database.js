const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dataDirectory = path.join(__dirname, "..", "..", "data");
const databasePath = path.join(dataDirectory, "testcase-manager.sqlite");

function ensureDataDirectory() {
  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }
}

function connectDatabase() {
  ensureDataDirectory();
  return new sqlite3.Database(databasePath);
}

function run(query) {
  return new Promise((resolve, reject) => {
    const db = connectDatabase();

    db.run(query, function onRun(error) {
      db.close();

      if (error) {
        reject(error);
        return;
      }

      resolve({
        id: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function get(query) {
  return new Promise((resolve, reject) => {
    const db = connectDatabase();

    db.get(query, (error, row) => {
      db.close();

      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(query) {
  return new Promise((resolve, reject) => {
    const db = connectDatabase();

    db.all(query, (error, rows) => {
      db.close();

      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function seedUsers() {
  // This adds starter users for the app.
  const userCount = await get("SELECT COUNT(*) AS count FROM users");

  if (userCount.count > 0) {
    return;
  }

  const users = [
    { fullName: "Admin User", email: "admin@testcase.com", password: "admin123", role: "Admin" },
    { fullName: "Tester User", email: "tester@testcase.com", password: "tester123", role: "Tester" },
    { fullName: "Developer User", email: "developer@testcase.com", password: "developer123", role: "Developer" },
    {
      fullName: "Stakeholder User",
      email: "stakeholder@testcase.com",
      password: "stakeholder123",
      role: "Stakeholder",
    },
  ];

  for (const user of users) {
    await run(
      `
        INSERT INTO users (full_name, email, password, role)
        VALUES ('${user.fullName}', '${user.email}', '${user.password}', '${user.role}')
      `
    );
  }
}

async function seedTestCases() {
  // This adds sample test cases for the dashboard.
  const testCaseCount = await get("SELECT COUNT(*) AS count FROM test_cases");

  if (testCaseCount.count > 0) {
    return;
  }

  const testCases = [
    {
      title: "Login with valid account",
      summary: "Users can sign in with correct credentials",
      status: "Passed",
      priority: "High",
      createdBy: 2,
    },
    {
      title: "Reject invalid password",
      summary: "Users see an error when the password is incorrect",
      status: "Failed",
      priority: "High",
      createdBy: 2,
    },
  ];

  for (const testCase of testCases) {
    await run(
      `
        INSERT INTO test_cases (title, summary, status, priority, created_by)
        VALUES (
          '${testCase.title}',
          '${testCase.summary}',
          '${testCase.status}',
          '${testCase.priority}',
          ${testCase.createdBy}
        )
      `
    );
  }
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      description TEXT,
      status TEXT DEFAULT 'Pending',
      priority TEXT DEFAULT 'Medium',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedUsers();
  await seedTestCases();
}

module.exports = {
  all,
  databasePath,
  get,
  initializeDatabase,
  run,
};
