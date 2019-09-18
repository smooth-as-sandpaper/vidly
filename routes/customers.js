const { Customer, validateCustomer } = require("../models/customer");
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // to authorize user
const admin = require("../middleware/admin"); // to verify token has admin priviliges

// POST
router.post("/", [auth, validate(validateCustomer)], async (req, res) => {
  const customer = new Customer({
    name: req.body.name,
    phone: req.body.phone,
    isGold: req.body.isGold
  });
  await customer.save();

  res.status(200).send(customer);
});

// PUT by ID
router.put("/:id", [auth, validate(validateCustomer), validateObjectId], async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name, phone: req.body.phone, isGold: req.body.isGold },
    { new: true }
  );

  // Check if customer exists
  if (!customer) return res.status(404).send("Customer with given ID not found.");

  res.status(200).send(customer);
});

// GET ALL
router.get("/", async (req, res) => {
  const customers = await Customer.find().sort("name");
  res.status(200).send(customers);
});

// GET by ID
router.get("/:id", validateObjectId, async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  // Check if customer exists
  if (!customer)
    return res.status(404).send("Customer with given ID not found.");

  res.status(200).send(customer);
});

// DELETE by ID
router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const customer = await Customer.findByIdAndRemove(req.params.id);

  // Check if customer exists
  if (!customer)
    return res.status(404).send("Customer with given ID not found.");

  res.status(200).send(customer);
});

module.exports = router;
