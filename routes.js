const express = require("express");
const router = express.Router();
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const nodemailer = require("nodemailer");

const Product = require("./models");
const { CartItem } = require("./cart");
const Order = require("./order");

// 1. CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: "dw4jcixiu",
  api_key: "135649185935467",
  api_secret: "qLLVAoiC1AVNJuG3CDn5fJqoo_w",
  secure: true 
});

// --- UPDATED LOGIN ROUTE WITH DEBUGGING ---
router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "password123";

  if (username === expectedUsername && password === expectedPassword) {
    console.log("✅ Admin Login Successful");
    res.json({ success: true, message: "Login successful" });
  } else {
    console.log("❌ Admin Login Failed: Incorrect Credentials");
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// 1b. NODEMAILER CONFIG
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "nwadikeekene4@gmail.com",
    pass: "uiocdtdlpqnrqkng" 
  },
  tls: { rejectUnauthorized: false }
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: "shop_products" },
});
const upload = multer({ storage: storage });

const ensureFullUrl = (path) => {
  if (!path || path === "null" || typeof path !== 'string') return "https://placehold.co/100x100?text=No+Image";
  if (path.startsWith('http')) return path; // Use the Cloudinary URL as is
  const fileName = path.split('/').pop(); 
  return `https://res.cloudinary.com/dw4jcixiu/image/upload/shop_products/${fileName}`;
};

// 2. PRODUCT ROUTES
router.post("/admin/products", upload.single("image"), async (req, res) => {
  try {
    const product = await Product.create({
      name: req.body.name,
      price: parseFloat(req.body.price),
      image: req.file ? req.file.path : null, 
      rating: { stars: 0, count: 0 }
    });
    res.json(product);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/admin/products/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      price: parseFloat(req.body.price)
    };
    if (req.file) updateData.image = req.file.path;
    await Product.update(updateData, { where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/admin/products/:id", async (req, res) => {
  try {
    await Product.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/products", async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. CART ROUTES
router.get("/cart", async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({ 
      include: [{ model: Product, as: "product" }] 
    });
    res.json(cartItems);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/cart/add", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let item = await CartItem.findOne({ where: { productId } });
    if (item) { 
      item.quantity += parseInt(quantity); 
      await item.save(); 
    } else { 
      item = await CartItem.create({ 
        productId, 
        quantity: parseInt(quantity), 
        deliveryOptionId: 'standard' 
      }); 
    }
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/cart/clear", async (req, res) => {
  try { await CartItem.destroy({ where: {} }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/cart/:id", async (req, res) => {
  try { await CartItem.destroy({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. PAYMENT & ORDER CREATION
router.post("/paystack/init", async (req, res) => {
  try {
    const { email, amount, customerDetails } = req.body;
    const response = await axios.post("https://api.paystack.co/transaction/initialize",
      { 
        email, 
        amount: Math.round(amount * 100), 
        // FIXED: Updated callback URL to your new Render Frontend
        callback_url: "https://my-website-69a6.onrender.com/checkout",
        metadata: {
          custom_fields: [
            { display_name: "Customer Name", variable_name: "customer_name", value: customerDetails.name },
            { display_name: "Phone Number", variable_name: "customer_phone", value: customerDetails.phone }
          ]
        }
      },
      { headers: { Authorization: `Bearer sk_test_8d7e8f2afd48e47417dd99a89eb042fafa49ad0a` } }
    );
    res.json(response.data);
  } catch (err) { 
    console.error("Paystack Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Paystack Init Failed" }); 
  }
});

router.post("/payment/verify", async (req, res) => {
  try {
    const { reference, customerDetails } = req.body;
    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer sk_test_8d7e8f2afd48e47417dd99a89eb042fafa49ad0a` } }
    );

    if (paystackRes.data.data.status === "success") {
      const cartItems = await CartItem.findAll({ 
        include: [{ model: Product, as: "product" }] 
      });

      const orderAmount = paystackRes.data.data.amount / 100;
      const customerEmail = paystackRes.data.data.customer.email;

      let itemRows = "";
      cartItems.forEach(item => {
        const name = item.product ? item.product.name : "Unknown Item";
        const price = item.product ? item.product.price : 0;
        const qty = item.quantity || 1;
        const total = price * qty;
        itemRows += `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${qty}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₦${price.toLocaleString()}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">₦${total.toLocaleString()}</td>
          </tr>`;
      });

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Payment Receipt</h2>
          <p>Hello <b>${customerDetails.name}</b>,</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Price</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p><strong>Grand Total: ₦${orderAmount.toLocaleString()}</strong></p>
        </div>`;

      transporter.sendMail({
        from: '"Ekene Shop" <nwadikeekene4@gmail.com>',
        to: customerEmail,
        subject: `Your Order Receipt [Ref: ${reference}]`,
        html: emailHtml
      });

      await Order.create({
        reference,
        amount: orderAmount,
        customerName: customerDetails.name,
        address: customerDetails.address,
        city: customerDetails.city,
        country: customerDetails.country,
        phone: customerDetails.phone,
        status: "Paid",
        items: cartItems.map(item => ({
          quantity: item.quantity,
          product: { 
            name: item.product.name, 
            price: item.product.price, 
            image: ensureFullUrl(item.product.image)
          },
          deliveryOption: { deliveryDays: customerDetails.selectedDate }
        }))
      });

      await CartItem.destroy({ where: {} });
      return res.json({ success: true });
    }
    res.json({ success: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. ORDER MANAGEMENT
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['createdAt', 'DESC']] });
    const formattedOrders = orders.map(order => {
      const plainOrder = order.get({ plain: true });
      if (typeof plainOrder.items === 'string') {
        try { plainOrder.items = JSON.parse(plainOrder.items); } catch(e) { plainOrder.items = []; }
      }
      return plainOrder;
    });
    res.json(formattedOrders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order) {
      order.status = req.body.status;
      await order.save();
      res.json(order);
    } else { res.status(404).json({ error: "Order not found" }); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/orders", async (req, res) => {
  try { await Order.destroy({ where: {}, truncate: true }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/orders/:id", async (req, res) => {
  try { await Order.destroy({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;