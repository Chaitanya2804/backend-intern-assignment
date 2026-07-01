const { Sequelize } = require("sequelize");
require("dotenv").config();

// Falls back to a sensible local default so `npm run dev` works out of the box
// after `createdb backend_intern_db` (see README). Override DATABASE_URL for
// any real Postgres/MySQL instance (e.g. a hosted one for deployment).
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/backend_intern_db";

const dialect = connectionString.startsWith("mysql") ? "mysql" : "postgres";

const sequelize = new Sequelize(connectionString, {
  dialect,
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions:
    dialect === "postgres" && process.env.NODE_ENV === "production"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Database connected (${sequelize.getDialect()})`);
    // In production you'd use migrations instead of sync(); sync() is fine for this assignment scope
    await sequelize.sync();
  } catch (err) {
    console.error("Unable to connect to the database:", err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
