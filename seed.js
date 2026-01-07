const sequelize = require("./config");
const Product = require("./models");
const { DeliveryOption } = require("./deliveryOptions");
const { CartItem } = require("./cart");

async function seed() {
  try {
    console.log("🚀 Starting the smart seed process...");

    // 1. Sync the database structure without deleting data
    await sequelize.sync({ alter: true });

    // 2. Clear out the CartItems table to prevent Foreign Key errors
    // This removes old cart links that might point to missing products
    await CartItem.destroy({ where: {}, truncate: true, cascade: true });
    console.log("✅ Cart cleared of old/broken data.");

    // 3. Define the 10 Default Products
    const productsData = [
      { name: "2slot-white toaster", price: 25, image: "images/2-slot-toaster-white.jpg", rating: { stars: 4.5, count: 120 } },
      { name: "3 piece-cooking set", price: 15, image: "images/3-piece-cooking-set.jpg", rating: { stars: 2.5, count: 85 } },
      { name: "adults-plain-cotton-tshirt-2-pack-teal", price: 36, image: "images/adults-plain-cotton-tshirt-2-pack-teal.jpg", rating: { stars: 1.5, count: 200 } },
      { name: "artistic -bowl-set-set", price: 45, image: "images/artistic-bowl-set-6-piece.jpg", rating: { stars: 4.0, count: 140 } },
      { name: "electric-steel-hot", price: 28, image: "images/electric-steel-hot-water-kettle-white.jpg", rating: { stars: 3.5, count: 95 } },
      { name: "black-and-silver-espresso-maker", price: 22, image: "images/black-and-silver-espresso-maker.jpg", rating: { stars: 4.5, count: 160 } },
      { name: "non-stick-cooking-set", price: 50, image: "images/non-stick-cooking-set-4-pieces.jpg", rating: { stars: 4.5, count: 840 } },
      { name: "glass-screw-lid-food-containers", price: 120, image: "images/glass-screw-lid-food-containers.jpg", rating: { stars: 4.0, count: 260 } },
      { name: "intermediate-composite-basketball", price: 199, image: "images/intermediate-composite-basketball.jpg", rating: { stars: 2.5, count: 510 } },
      { name: "elegant-white-dinner-plate-set", price: 18, image: "images/elegant-white-dinner-plate-set.jpg", rating: { stars: 3.0, count: 77 } }
    ];

    console.log("🔄 Re-syncing default products...");

    for (const p of productsData) {
      // Delete the default product by name first to ensure no duplicates/glitches
      await Product.destroy({ where: { name: p.name } });
      // Re-insert it fresh
      await Product.create(p);
    }
    console.log("✅ 10 Default products are now live in the database.");

    // 4. Seed Delivery Options
    const deliveryOptionsData = [
      { id: 'standard', deliveryDays: '3-5 days', price: 5.0 },
      { id: 'express', deliveryDays: '1-2 days', price: 10.0 },
      { id: 'overnight', deliveryDays: 'Next day', price: 20.0 }
    ];

    for (const option of deliveryOptionsData) {
      await DeliveryOption.findOrCreate({
        where: { id: option.id },
        defaults: option
      });
    }
    console.log("✅ Delivery options seeded.");

    console.log("\n✨ SEEDING COMPLETE! Your Admin products were kept safe.");
    process.exit();
    
  } catch (err) {
    console.error("❌ SEEDING FAILED:", err);
    process.exit(1);
  }
}

seed();