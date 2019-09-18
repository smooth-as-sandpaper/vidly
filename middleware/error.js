const winston = require("winston");

// Only catches errors in request processing pipeline
//  i.e., this does not include startup errors (e.g. connecting to MongoDB)
module.exports = function (err, req, res, next) {
  winston.error(err.message, err);

  // 500 - internal service error
  res.status(500).send("Something failed.");
};
