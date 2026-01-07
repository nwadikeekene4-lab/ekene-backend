const { DataTypes } = require("sequelize");
const sequelize = require("./config");

const Order = sequelize.define("Order", {
  reference: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false
  },
  // ✅ ADDED: Status field for tracking
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Pending" 
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: true 
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Order;