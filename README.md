# Scalable REST API with Authentication & Role-Based Access

A backend project built for the Backend Developer Intern assignment: a Node.js/Express REST API
with JWT authentication, role-based access control (user/admin), CRUD for a Tasks entity, and a
small vanilla-JS frontend to exercise the APIs.

## Tech stack

| Layer          | Choice                                              |
|----------------|------------------------------------------------------|
| Runtime        | Node.js + Express                                    |
| Database       | PostgreSQL (via Sequelize ORM — MySQL also supported, just swap `DATABASE_URL`) |
| Auth           | JWT (access + refresh tokens), bcrypt password hashing |
| Validation     | express-validator                                     |
| Docs           | Swagger / OpenAPI (swagger-jsdoc + swagger-ui-express), plus a Postman collection |
| Security       | helmet, cors, express-rate-limit, input validation/sanitization |
| Frontend       | Vanilla HTML/CSS/JS (no build step, easy to run anywhere) |

## Project structure

```
project/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # Sequelize + Postgres/MySQL connection
│   │   ├── models/                # User, Task (Sequelize models)
│   │   ├── middleware/            # auth (JWT + RBAC), validation, error handling
│   │   ├── controllers/           # business logic for auth & tasks
│   │   ├── routes/                # Express routers + Swagger annotations
│   │   ├── utils/                 # JWT helpers, admin seed script
│   │   ├── app.js                 # Express app (middleware + route wiring)
│   │   └── server.js              # entry point
│   ├── postman_collection.json
│   ├── .env
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── README.md
└── SCALABILITY.md
```

## Getting started

### 1. Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a MySQL instance if you'd rather use that)

### 2. Set up the database
```bash
createdb backend_intern_db
# or, in psql:  CREATE DATABASE backend_intern_db;
```

### 3. Configure environment variables
```bash
cd backend
cp .env.example .env
```
The default `.env.example` already points at `postgres://postgres:postgres@localhost:5432/backend_intern_db`.
Adjust the username/password/host to match your local Postgres setup, and **replace the JWT secrets**
with your own random strings before deploying anywhere.

### 4. Install & run the backend
```bash
npm install
npm run dev        # nodemon, auto-restarts on change
# or: npm start
```
The server starts on `http://localhost:5000`. On first run, Sequelize creates the `Users` and
`Tasks` tables automatically.

Optional: seed a ready-made admin account (`admin@example.com` / `AdminPass123!`):
```bash
npm run seed:admin
```

### 5. Run the frontend
The frontend is a static site with no build step — any static server works:
```bash
cd frontend
python3 -m http.server 8080
# then open http://localhost:8080
```
It talks to the backend at `http://localhost:5000/api/v1` (change `API_BASE` at the top of
`app.js` if your backend runs elsewhere).

### 6. Explore the API docs
- Swagger UI: `http://localhost:5000/api-docs`
- Postman: import `backend/postman_collection.json` (it auto-captures your access token after
  the Login request, via a small test script on that request)

## API overview

All endpoints are versioned under `/api/v1`.

| Method | Endpoint             | Access        | Description                          |
|--------|-----------------------|---------------|---------------------------------------|
| POST   | `/auth/register`      | Public        | Create a user account (always role `user`) |
| POST   | `/auth/login`          | Public        | Log in, returns access + refresh tokens |
| POST   | `/auth/refresh`        | Public*       | Exchange a refresh token for a new access token |
| GET    | `/auth/me`             | Private       | Get the logged-in user's profile     |
| GET    | `/tasks`               | Private       | List tasks (own tasks for `user`, all for `admin`); supports `?page`, `?limit`, `?status` |
| POST   | `/tasks`               | Private       | Create a task                        |
| GET    | `/tasks/:id`           | Private       | Get one task (owner or admin only)   |
| PUT    | `/tasks/:id`           | Private       | Update a task (owner or admin only)  |
| DELETE | `/tasks/:id`           | Private       | Delete a task (owner or admin only)  |
| GET    | `/admin/users`         | Admin only    | List all users                       |

\* requires a valid refresh token in the body, not a login session.

## Security practices implemented

- Passwords hashed with bcrypt (never stored or returned in plaintext)
- JWT access tokens (short-lived) + refresh tokens (longer-lived), signed with separate secrets
- Role is server-assigned at registration (`user`) — nobody can self-elevate to `admin` via the API
- Route-level RBAC middleware (`protect` + `authorize('admin')`)
- Task-level ownership checks (a `user` can only read/update/delete their own tasks; `admin`
  bypasses this)
- Request validation via `express-validator` on every write endpoint, with field-level error messages
- `helmet` for secure HTTP headers, `cors` for cross-origin control, `express-rate-limit` to blunt
  brute-force/abuse on the whole `/api` surface
- Centralized error handler that normalizes Sequelize/JWT/validation errors into consistent JSON
  responses and never leaks stack traces outside development mode
- `.env` kept out of version control; secrets never hardcoded

## Testing it yourself

The whole flow was verified end-to-end against a live Postgres instance during development:
register → login → create/list/update/delete tasks → admin-only route returns `403` for a
non-admin token and `200` with all users for an admin token → validation errors return `400`
with per-field messages → missing/expired tokens return `401`.

## Notes on choices made

- **Sequelize** was chosen over a raw query builder so the same code works against Postgres or
  MySQL with just a connection-string change (see `.env.example`), while still giving explicit
  control over the schema, unlike a heavier full-stack framework.
- **Task ownership** is enforced in the controller layer rather than only in the frontend, since
  the API needs to be safe even if called directly (e.g. via Postman or another client).
- `sync()` is used for schema creation to keep this assignment runnable in minutes; a production
  setup would use `sequelize-cli` migrations instead (see `SCALABILITY.md`).

See `SCALABILITY.md` for how this would evolve for production scale.
