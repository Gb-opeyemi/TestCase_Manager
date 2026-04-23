# TestCase Manager

## Project Overview
TestCase Manager is a web application for managing software test cases. It allows teams to sign in, view dashboards, manage test cases, leave comments, and manage users based on role permissions.

The project was developed in two phases:
- Phase 1 focused on building an intentionally insecure version of the application for analysis.
- Phase 2 focused on improving the application step by step by applying secure web development practices.

The current version in this repository is the secured version. Its main security focus is protecting authentication, authorization, session handling, database access, user input, and sensitive actions.

The vulnerable version of the application can be found at this earlier commit: [Phase 1 insecure version](https://github.com/Gb-opeyemi/TestCase_Manager/tree/9bf4699e86d8a56366c5c0a4f2daf8f4ae3af4ac).

## Features and Security Objectives

### Main Features
- User sign in and sign out
- Role-based access for Admin, Tester, Developer, and Stakeholder
- Dashboard with test case summary information
- Test case listing and detail pages
- Create, edit, and delete test cases for authorized roles
- Add comments to test cases
- Admin-only user management
- Audit logging for sensitive actions

### Security Objectives
- Prevent SQL injection in login and test case operations
- Protect passwords using hashing instead of plaintext storage
- Use secure server-side sessions instead of trusting client-side identity data
- Enforce backend authorization rules for protected actions
- Validate user input before processing it
- Prevent stored XSS by rendering user-controlled content safely
- Protect state-changing requests with CSRF checks
- Reduce brute-force login attempts with rate limiting
- Avoid exposing raw internal errors to users
- Record sensitive actions for accountability and review

## Project Structure
The project is organised into a simple frontend and backend structure.

```text
TestCase_Manager/
├── data/
│   └── testcase-manager.sqlite
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── dashboard.js
│   │   ├── login.js
│   │   ├── main.js
│   │   ├── notifications.js
│   │   ├── session.js
│   │   ├── testcase-create.js
│   │   ├── testcase-detail.js
│   │   ├── testcase-edit.js
│   │   ├── testcases.js
│   │   ├── user-edit.js
│   │   └── user-management.js
│   ├── dashboard.html
│   ├── index.html
│   ├── login.html
│   ├── testcase-create.html
│   ├── testcase-detail.html
│   ├── testcase-edit.html
│   ├── testcases.html
│   ├── user-edit.html
│   └── user-management.html
├── src/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── comments.js
│   │   ├── dashboard.js
│   │   ├── testcases.js
│   │   └── users.js
│   ├── utils/
│   │   ├── audit.js
│   │   ├── errors.js
│   │   ├── passwords.js
│   │   ├── rate-limit.js
│   │   └── validation.js
│   └── server.js
├── package.json
├── package-lock.json
└── README.md
```

### Folder and File Summary
- `public/`: Contains the frontend pages, CSS, and browser-side JavaScript.
- `public/css/styles.css`: Main shared styling for the interface.
- `public/js/`: Client-side logic for login, dashboard, test cases, users, sessions, and notifications.
- `src/server.js`: Application entry point. Sets up Express, sessions, middleware, static files, and routes.
- `src/config/database.js`: Initializes SQLite tables and manages database access.
- `src/middleware/auth.js`: Authentication, role checks, and CSRF-related middleware.
- `src/routes/`: Route handlers for authentication, dashboard data, test cases, comments, and users.
- `src/utils/passwords.js`: Password hashing and password verification helpers.
- `src/utils/rate-limit.js`: Login rate limiting logic.
- `src/utils/validation.js`: Shared backend input validation helpers.
- `src/utils/errors.js`: Safer error response helpers.
- `src/utils/audit.js`: Audit logging helper for sensitive actions.
- `data/`: Contains the SQLite database created when the app runs.

## Setup and Installation Instructions

### Requirements
- Node.js
- npm

### Install Locally
1. Clone or download the repository.
2. Open a terminal in the project folder.
3. Install dependencies:

```bash
npm install
```

4. Start the application:

```bash
npm run dev
```

5. Open the application in your browser:

```text
http://localhost:3000
```

### Optional Configuration
The application can run with default settings, but you can also configure:
- `PORT` to change the local port
- `HOST` to change the host address
- `SESSION_SECRET` to replace the default session secret
- `NODE_ENV=production` to enable production cookie behaviour

Example:

```bash
SESSION_SECRET=my-secret PORT=3000 npm run dev
```

## Usage Guidelines

### Signing In
Open the login page and sign in with a valid account. After successful login, the application redirects to the dashboard.

### Navigating the App
- `Dashboard`: View summary information about test cases.
- `Test Cases`: View the test case list and open test case detail pages.
- `Create/Edit Test Case`: Available to Admin and Tester roles.
- `Comments`: Signed-in users can add comments to test cases.
- `User Management`: Available to Admin only.

### Role Behaviour
- `Admin`: Full access, including user management and test case management.
- `Tester`: Can manage test cases and add comments.
- `Developer`: Can view test cases and add comments.
- `Stakeholder`: Can view test cases and add comments.

### Demo Accounts
The application does not include public user registration. To test the different roles locally, use the seeded accounts below:

- `Admin`: `admin@testcase.com` / `admin123`
- `Tester`: `tester@testcase.com` / `tester123`
- `Developer`: `developer@testcase.com` / `developer123`
- `Stakeholder`: `stakeholder@testcase.com` / `stakeholder123`

### Important Notes
- The current repository reflects the secured version of the application.
- The database file is created automatically when the server starts.
- Some pages depend on a valid signed-in session, so direct access without logging in will redirect or fail.

## Security Improvements
The following security improvements were introduced in the secure phase of the project:

- **Password hashing**: Passwords are hashed before storage instead of being saved in plaintext.
- **Secure server-side sessions**: Session state is stored on the server rather than trusting client-side browser storage.
- **Backend authorization**: Protected actions are enforced on the backend using role checks.
- **SQL injection prevention**: Database operations use parameterized queries.
- **Input validation**: The backend validates IDs, emails, roles, status values, text lengths, and media URLs.
- **Stored XSS prevention**: User-controlled content is rendered safely in the frontend.
- **CSRF protection**: State-changing requests require a valid CSRF token.
- **Safer error handling**: The application returns safe user-facing error messages instead of raw internal errors.
- **Rate limiting**: Login attempts are rate limited to reduce brute-force risk.
- **Audit logging**: Sensitive actions such as login, test case changes, comments, and user updates are logged.

## Testing Process
Testing included both functional testing and security testing.

### Functional Testing
Manual testing was used to confirm:
- successful login and logout
- dashboard loading
- test case creation, editing, viewing, and deletion
- comment creation
- role-based behaviour
- admin user management

### Security Testing
The main security controls tested included:
- SQL injection prevention
- stored XSS prevention
- backend authorization and role enforcement
- CSRF protection
- input validation
- password storage and verification
- login rate limiting
- safer error handling
- audit logging

### Tools and Methods
- Browser manual testing
- Browser developer tools
- Local route testing with direct requests
- SQLite inspection using `sqlite3` or `DB Browser for SQLite`
- Source code review of routes, middleware, and utilities

### Summary of Key Findings
- SQL injection payloads were treated as plain input after parameterized queries were introduced.
- Stored XSS payloads no longer executed in the browser after safe rendering changes.
- Restricted roles were blocked from protected backend actions after authorization was enforced.
- Requests without a valid CSRF token were rejected.
- Passwords were no longer stored in plaintext.
- Sensitive actions were recorded in the audit log table.

## Contributions and References

### Libraries and Frameworks
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [express-session](https://www.npmjs.com/package/express-session)
- [sqlite3](https://www.npmjs.com/package/sqlite3)

### Security References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Cross Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
