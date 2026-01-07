const express = require("express");
const cors = require("cors");
const path = require("path");
const Product = require("./models");
const Order = require("./order");
const { CartItem } = require("./cart");
const { DeliveryOption } = require("./deliveryoptions");
const routes = require("./routes"); 

const app = express();
require("dotenv").config();

// --- UPDATED CORS CONFIGURATION ---
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://ekene-shop.vercel.app" 
  ],
  credentials: true
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());

// Note: app.use(routes) is moved into startServer below to prevent "Cannot GET" errors

async function startServer() {
  try {
    // Sync Database Tables
    await Product.sync({ alter: true }); 
    await DeliveryOption.sync();
    await CartItem.sync();
    await Order.sync({ alter: true });
    console.log("✅ Database synced successfully");

    // ACTIVATE ROUTES AFTER SYNC
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