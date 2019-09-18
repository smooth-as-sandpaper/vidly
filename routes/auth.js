const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("Joi");
const validate = require('../middleware/validate');
const PasswordComplexity = require("joi-password-complexity");
const express = require("express");
const router = express.Router();

// POST - login
router.post("/", validate(validateAuth), async (req, res) => {
  // Make sure user is not yet registered
  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password.");

  const token = user.generateAuthToken();
  res.send(token);
});

function validateAuth(req) {
  const complexityOptions = {
    min: 7,
    max: 1024,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
    requirementCount: 3
  };

  const schema = {
    email: Joi.string()
      .required()
      .min(2)
      .max(255)
      .email(),
    password: new PasswordComplexity(complexityOptions).required()
  };
  return Joi.validate(req, schema);
}

module.exports = router;
