const { DataTypes } = require("sequelize");
const sequelize = require("./config");
const Product = require("./models");
const { DeliveryOption } = require("./deliveryOptions");

const CartItem = sequelize.define("CartItem", {
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Product,
      key: "id"
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  deliveryOptionId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: DeliveryOption,
      key: "id"
    }
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

// Associations
CartItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(CartItem, { foreignKey: "productId" }); // Essential link

CartItem.belongsTo(DeliveryOption, { foreignKey: "deliveryOptionId", as: "deliveryOption" });

module.exports = { CartItem };