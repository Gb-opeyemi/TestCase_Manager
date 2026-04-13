const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { hashPassword, isHashedPassword } = require("../utils/passwords");

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

function run(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = connectDatabase();

    // This runs the SQL with separate parameter values.
    db.run(query, params, function onRun(error) {
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

function get(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = connectDatabase();

    // This reads one row with separate parameter values.
    db.get(query, params, (error, row) => {
      db.close();

      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(query, params = []) {
  return new Promise((resolve, reject) => {
    const db = connectDatabase();

    // This reads many rows with separate parameter values.
    db.all(query, params, (error, rows) => {
      db.close();

      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  // This checks if a column already exists.
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function seedUsers() {
  // This adds starter users for the app.
  const userCount = await get("SELECT COUNT(*) AS count FROM users");

  if (userCount.count > 0) {
    return;
  }

  const users = [
    // These starter users are saved with prebuilt password hashes.
    {
      fullName: "Admin User",
      email: "admin@testcase.com",
      passwordHash:
        "scrypt$0ccb9f0d199c6d2c80109a5da25c940f$8a49704731f1b59c75f0b1cd2bd2ac0d58c0e8c4b602ff34c7fad0401ee6e1a61c8118a8ba756161b6e02db0727cabf712730934cd14aa639fdf0b386de75620",
      role: "Admin",
    },
    {
      fullName: "Tester User",
      email: "tester@testcase.com",
      passwordHash:
        "scrypt$231d38eea49c260e0e529375db615618$20b99c5bf9a7172851e9f3ae9c9128336b8baa0854d4971dff95195fd6fc0c5977e5e741a4c64011ff7e252edf9c4529563971307bc8a14d031135d82af410f1",
      role: "Tester",
    },
    {
      fullName: "Developer User",
      email: "developer@testcase.com",
      passwordHash:
        "scrypt$45e68d9779d3e1764b7421dd8be68dae$8cce8ebe9e7d739600249d76df31c345f6f02bf8122ad994defd93641bac09adee7368c2f60d6f0d6d0239b446ad182c343b069f8bab018e96000bbd5ea220ec",
      role: "Developer",
    },
    {
      fullName: "Stakeholder User",
      email: "stakeholder@testcase.com",
      passwordHash:
        "scrypt$3911161abcc3435cebf4d7dda3051dd5$dba328be6f32bd624817d636508b7cc174572931b7ff5221a0e9e20eb73ad2900d7163d95f112bd3bb07b48dbd7cd18c495a8c0a871afc92a7a381e48eedaf0e",
      role: "Stakeholder",
    },
  ];

  for (const user of users) {
    // This saves starter users with hashed passwords.
    // This insert uses parameterized queries to avoid SQL Injection.
    await run(
      `
        INSERT INTO users (full_name, email, password, role)
        VALUES (?, ?, ?, ?)
      `,
      [user.fullName, user.email, user.passwordHash, user.role]
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
      createdBy: "tester@testcase.com",
    },
    {
      title: "Reject invalid password",
      summary: "Users see an error when the password is incorrect",
      status: "Failed",
      priority: "High",
      createdBy: "tester@testcase.com",
    },
  ];

  for (const testCase of testCases) {
    // This adds starter test case records.
    // This insert uses parameterized queries to avoid SQL Injection.
    await run(
      `
        INSERT INTO test_cases (title, summary, status, priority, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        testCase.title,
        testCase.summary,
        testCase.status,
        testCase.priority,
        testCase.createdBy,
        testCase.createdBy,
      ]
    );
  }
}

async function initializeDatabase() {
  // This creates the main users table.
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

  // This creates the main test cases table.
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

  // This adds extra fields used by the forms.
  await ensureColumn("test_cases", "preconditions", "TEXT");
  await ensureColumn("test_cases", "steps_to_reproduce", "TEXT");
  await ensureColumn("test_cases", "expected_result", "TEXT");
  await ensureColumn("test_cases", "actual_result", "TEXT");
  await ensureColumn("test_cases", "severity", "TEXT DEFAULT 'Medium'");
  await ensureColumn("test_cases", "tags", "TEXT");
  await ensureColumn("test_cases", "media_url", "TEXT");
  await ensureColumn("test_cases", "updated_by", "INTEGER");

  // This creates the comments table.
  await run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_case_id INTEGER NOT NULL,
      author_email TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // This creates the audit log table.
  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_email TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedUsers();
  await seedTestCases();
  await migratePlainTextPasswords();
}

async function migratePlainTextPasswords() {
  // This upgrades old plain passwords after startup.
  const users = await all("SELECT id, password FROM users");

  for (const user of users) {
    if (isHashedPassword(user.password)) {
      continue;
    }

    const hashedPassword = hashPassword(user.password);

    // This update uses parameterized queries to avoid SQL Injection.
    await run(
      `
        UPDATE users
        SET password = ?
        WHERE id = ?
      `,
      [hashedPassword, user.id]
    );
  }
}

module.exports = {
  all,
  databasePath,
  get,
  initializeDatabase,
  run,
};
