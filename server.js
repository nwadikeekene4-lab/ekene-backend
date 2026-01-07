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
  // Add your Vercel URL here. You can use an array to keep localhost for testing.
  origin: [
    "http://localhost:5173", 
    "https:ekene-shop.vercel.app" // REPLACE with your actual live Vercel URL
  ],
  credentials: true
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());

app.use(routes);

async function startServer() {
  await Product.sync({ alter: true }); 
  await DeliveryOption.sync();
  await CartItem.sync();
  await Order.sync({ alter: true });

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();