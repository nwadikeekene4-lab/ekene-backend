const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); 

const Product = require("./models");
const Order = require("./order");
const { CartItem } = require("./cart");
const { DeliveryOption = { sync: () => Promise.resolve() } } = require("./deliveryoptions");
const routes = require("./routes"); 

const app = express();

// --- 1. DYNAMIC CORS & PREFLIGHT FIX ---
const allowedOrigins = [
  "https://ekene-shop.vercel.app",
  "https://ekene-shop-five.vercel.app", // Added common Vercel suffix just in case
  "http://localhost:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    // If no origin (like mobile apps or curl) or it's in our list
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("CORS Blocked for origin: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200 // CRITICAL: Chrome needs 200, not 204
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// --- INSTRUCTION 2 INTEGRATED: Manual Chrome Preflight Handler ---
// This ensures that Chrome's "OPTIONS" request always succeeds before the POST
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    // Set headers manually to be 100% sure Chrome is happy
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200); 
  }
  next();
});

// --- 2. MIDDLEWARE & LOGIN DEBUGGER ---
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// This debugger helps you see if your Render Environment Variables are working
app.use((req, res, next) => {
  if (req.path === '/admin/login' && req.method === 'POST') {
    console.log("--- 🛡️ Login Attempt Security Log ---");
    console.log("Username Entered:", req.body.username);
    console.log("Server Config (Username):", process.env.ADMIN_USERNAME);
    console.log("Server Config (Password Loaded):", process.env.ADMIN_PASSWORD ? "YES" : "NO");
  }
  next();
});

// --- 3. START SERVER & SYNC ---
async function startServer() {
  try {
    await Product.sync({ alter: true }); 
    if (DeliveryOption.sync) await DeliveryOption.sync();
    await CartItem.sync();
    await Order.sync({ alter: true });
    console.log("✅ Database synced successfully");

    // Important: Routes must come AFTER CORS middleware
    app.use(routes);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Accepting requests from: ${allowedOrigins.join(", ")}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
  }
}

startServer();