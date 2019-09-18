const mongoose = require("mongoose");
const Joi = require("joi");
const { genreSchema } = require("./genre");

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: 1,
    maxLength: 50
  },
  genre: {
    type: genreSchema,
    required: true
  },
  numberInStock: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  dailyRentalRate: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  }
});

const Movie = mongoose.model("Movie", movieSchema);

// Validate that client's request satisfies schema
function validateMovie(movie) {
  const schema = {
    title: Joi.string()
      .required()
      .min(2)
      .max(50),
    genreId: Joi.objectId().required(),
    numberInStock: Joi.number()
      .min(0)
      .max(50)
      .required(),
    dailyRentalRate: Joi.number()
      .min(0)
      .max(50)
      .required()
  };
  return Joi.validate(movie, schema);
}

exports.Movie = Movie;
exports.validateMovie = validateMovie;
