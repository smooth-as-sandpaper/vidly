const mongoose = require("mongoose");
const Joi = require("joi");

const Customer = mongoose.model(
  "Customer",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    phone: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    isGold: {
      type: Boolean,
      default: false
    }
  })
);

// Validate that request satisfies schema
function validateCustomer(customer) {
  const schema = {
    name: Joi.string()
      .required()
      .min(2)
      .max(50),
    phone: Joi.string()
      .required()
      .min(2)
      .max(50),
    isGold: Joi.boolean()
  };
  return Joi.validate(customer, schema);
}

exports.Customer = Customer;
exports.validateCustomer = validateCustomer;
