const express = require("express");
const cors = require("cors");
const path = require("path");
const Product = require("./models");
const Order = require("./order");
const { CartItem } = require("./cart");
const { DeliveryOption } = require("./deliveryoptions");
const routes = require("./routes"); // This imports everything from routes.js

const app = express();
require("dotenv").config();

// Enable CORS
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Serve uploaded images (Keep this for any local testing)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());

// USE THE ROUTES FILE
app.use(routes);

async function startServer() {
  await Product.sync({ alter: true }); 
  await DeliveryOption.sync();
  await CartItem.sync();
  await Order.sync({ alter: true });

 // This checks if the hosting service (Render) provided a port, otherwise uses 5000
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
}

startServer();