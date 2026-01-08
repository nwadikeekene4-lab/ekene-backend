const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); // Load variables first

const Product = require("./models");
const Order = require("./order");
const { CartItem } = require("./cart");
const { DeliveryOption } = require("./deliveryoptions");
const routes = require("./routes"); 

const app = express();

// --- 1. DYNAMIC CORS & PREFLIGHT FIX ---
const allowedOrigins = [
  "https://ekene-shop.vercel.app",
  "https://ekene-shop.vercel.app/",
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps/Postman) or matches our list
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("CORS Blocked for origin: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Handle Preflight for all routes using Express v5 named wildcard syntax
app.options("/*path", cors(corsOptions)); 

// --- 2. MIDDLEWARE & LOGIN DEBUGGER ---
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// This middleware logs login attempts to the RENDER LOGS
app.use((req, res, next) => {
  if (req.path === '/admin/login' && req.method === 'POST') {
    console.log("--- Login Debug ---");
    console.log("Username Received:", req.body.username);
    console.log("Password Received:", req.body.password);
    console.log("Expect Username:", process.env.ADMIN_USERNAME);
    console.log("Expect Password:", process.env.ADMIN_PASSWORD);
  }
  next();
});

// --- 3. START SERVER & SYNC ---
async function startServer() {
  try {
    await Product.sync({ alter: true }); 
    await DeliveryOption.sync();
    await CartItem.sync();
    await Order.sync({ alter: true });
    console.log("✅ Database synced successfully");

    // --- 4. ROUTES ---
    app.use(routes);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
  }
}

startServer();