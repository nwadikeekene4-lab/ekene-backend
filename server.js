const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); 

const Product = require("./models");
const Order = require("./order");
const { CartItem } = require("./cart");
const { DeliveryOption = { sync: () => Promise.resolve() } } = require("./deliveryoptions"); // Added safety check
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
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("CORS Blocked for origin: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200
};

// Apply CORS to standard requests
app.use(cors(corsOptions));

// FIX FOR EXPRESS 5: Manual Preflight Handshake Handler
// This replaces app.options('*') which causes the crash in Express 5
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200); // Send status 200 and stop processing
  }
  next();
});

// --- 2. MIDDLEWARE & LOGIN DEBUGGER ---
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  if (req.path === '/admin/login' && req.method === 'POST') {
    console.log("--- Login Attempt Detected ---");
    console.log("Username Received:", req.body.username);
    console.log("Expected Admin:", process.env.ADMIN_USERNAME);
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