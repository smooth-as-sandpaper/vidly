const mongoose = require("mongoose");
const Joi = require("joi");
const moment = require('moment');

const rentalSchema = new mongoose.Schema({
  movie: {
    type: new mongoose.Schema({
      title: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 50
      },
      dailyRentalRate: {
        type: Number,
        required: true,
        min: 0,
        max: 50
      }
    }),
    required: true
  },
  customer: {
    type: new mongoose.Schema({
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
    }),
    required: true
  },
  dateOut: {
    type: Date,
    required: true,
    default: Date.now
  },
  dateReturned: {
    type: Date
  },
  rentalFee: {
    type: Number,
    min: 0
  }
});

// create new static method, Rental.lookup
rentalSchema.statics.lookup = function (customerId, movieId) {
  // this references Rental class
  return this.findOne({
    'customer._id': customerId,
    'movie._id': movieId
  });
}

// create new instance method, return
rentalSchema.methods.return = function () {
  this.dateReturned = Date.now();

  const daysRented = moment().diff(this.dateOut, 'days');
  this.rentalFee = daysRented * this.movie.dailyRentalRate;
}

const Rental = mongoose.model("Rental", rentalSchema);

// Don't want client to set/modify dateOut/dateReturned/rentalFee,
// so we don't include it as part of the schema
function validateRental(rental) {
  const schema = {
    movieId: Joi.objectId().required(),
    customerId: Joi.objectId().required()
  };
  return Joi.validate(rental, schema);
}

exports.Rental = Rental;
exports.validateRental = validateRental;
