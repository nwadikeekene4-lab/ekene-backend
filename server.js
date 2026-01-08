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

// --- FIXED CORS CONFIGURATION ---
// This allows all origins temporarily to stop the "CORS Failed" error
app.use(cors());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());

async function startServer() {
  try {
    // Sync Database Tables
    await Product.sync({ alter: true }); 
    await DeliveryOption.sync();
    await CartItem.sync();
    await Order.sync({ alter: true });
    console.log("✅ Database synced successfully");

    // ACTIVATE ROUTES
    // Important: This must be after express.json()
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