const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

if (process.env.DATABASE_URL) {
  // --- PRODUCTION (RENDER) ---
  // If Render's DATABASE_URL exists, use it with SSL required
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for cloud databases like Render
      },
    },
  });
} else {
  // --- LOCAL (YOUR COMPUTER) ---
  // Otherwise, use your separate local .env variables
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: "postgres",
    }
  );
}

module.exports = sequelize;