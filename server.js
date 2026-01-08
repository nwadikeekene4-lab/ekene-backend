const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config(); // Load variables before anything else

const Product = require("./models");
const Order = require("./order");
const { CartItem } = require("./cart");
const { DeliveryOption } = require("./deliveryoptions");
const routes = require("./routes"); 

const app = express();

// --- 1. ROBUST CORS CONFIGURATION (Express v5 Compatible) ---
const corsOptions = {
  // Replace with your actual Vercel URL
  origin: ["https://ekene-shop.vercel.app", "http://localhost:3000"], 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS globally
app.use(cors(corsOptions));

// FIXED: Express v5 requires a name for wildcards. 
// We use "/*path" instead of "*" to handle Preflight (OPTIONS) requests.
app.options("/*path", cors(corsOptions)); 

// --- 2. MIDDLEWARE ---
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- 3. START SERVER & SYNC ---
async function startServer() {
  try {
    // Sync Database Tables
    await Product.sync({ alter: true }); 
    await DeliveryOption.sync();
    await CartItem.sync();
    await Order.sync({ alter: true });
    console.log("✅ Database synced successfully");

    // --- 4. ROUTES ---
    // Important: app.use(routes) must be after CORS and express.json()
    app.use(routes);

    const PORT = process.env.PORT || 5000;
    // '0.0.0.0' is critical for Render to bind correctly
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
  }
}

startServer();