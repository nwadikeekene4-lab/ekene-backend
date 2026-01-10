const { DataTypes } = require("sequelize");
const sequelize = require("./config");

const Product = sequelize.define("Product", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: DataTypes.STRING,
  price: DataTypes.FLOAT,
  // CHANGED: Use TEXT to allow long Cloudinary URLs
  image: DataTypes.TEXT, 
  rating: {
    type: DataTypes.JSON,
    defaultValue: { stars: 0, count: 0 }
  },
  createdAt: {
    type: DataTypes.DATE(3),
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE(3),
    defaultValue: DataTypes.NOW
  }
});

module.exports = Product;