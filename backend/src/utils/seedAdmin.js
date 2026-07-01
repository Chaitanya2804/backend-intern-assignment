// Run with: npm run seed:admin
// Creates a default admin account for testing role-based access.
require("dotenv").config();
const { connectDB } = require("../config/db");
const User = require("../models/User");

const run = async () => {
  await connectDB();

  const email = "admin@example.com";
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }

  await User.create({
    name: "Admin",
    email,
    password: "AdminPass123!",
    role: "admin",
  });

  console.log("Admin user created:");
  console.log("  email:    admin@example.com");
  console.log("  password: AdminPass123!");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
