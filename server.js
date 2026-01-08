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

// --- 1. ROBUST CORS CONFIGURATION ---
// We explicitly allow your Vercel URL to stop the browser from blocking it.
const corsOptions = {
  origin: ["https://ekene-shop.vercel.app", "http://localhost:3000"], 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// This handles the "OPTIONS" preflight check that browsers do before Login/Cart POSTs
app.options('*', cors(corsOptions)); 

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
    // Moved inside startServer to ensure DB is ready first
    app.use(routes);

    const PORT = process.env.PORT || 5000;
    // '0.0.0.0' is important for Render to bind correctly
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
  }
}

startServer();