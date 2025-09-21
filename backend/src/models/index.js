// Export all models
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const ReturnDecision = require('./ReturnDecision');
const NGO = require('./NGO');
const Donation = require('./Donation');
const BaseModel = require('./BaseModel');

module.exports = {
  User,
  Product,
  Order,
  ReturnDecision,
  NGO,
  Donation,
  BaseModel
};