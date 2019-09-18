const { Movie, validateMovie } = require("../models/movie");
const { Genre } = require("../models/genre");
const validate = require('../middleware/validate');
const express = require("express");
const router = express.Router();
const validateObjectId = require('../middleware/validateObjectId');
const auth = require("../middleware/auth"); // to authorize user
const admin = require("../middleware/admin"); // to verify token has admin priviliges

// POST
router.post("/", [auth, validate(validateMovie)], async (req, res) => {
  const genre = await Genre.findById(req.body.genreId);
  if (!genre) return res.status(400).send("Invalid genre.");

  const movie = new Movie({
    title: req.body.title,
    genre,
    numberInStock: req.body.numberInStock,
    dailyRentalRate: req.body.dailyRentalRate
  });
  await movie.save();

  res.send(movie);
});

// PUT by ID
router.put("/:id", [auth, validate(validateMovie), validateObjectId], async (req, res) => {
  const genre = await Genre.findById(req.body.genreId);
  if (!genre) return res.status(400).send("Invalid genre.");

  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      genre: {
        _id: genre._id,
        name: genre.name
      },
      numberInStock: req.body.numberInStock,
      dailyRentalRate: req.body.dailyRentalRate
    },
    { new: true }
  );

  // Check if movie exists
  if (!movie) return res.status(404).send("Movie with given ID not found.");

  res.send(movie);
});

// GET ALL
router.get("/", async (req, res) => {
  const movies = await Movie.find()
    //.populate("genre", "name -_id")
    .sort("name");
  res.send(movies);
});

// GET by ID
router.get("/:id", validateObjectId, async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  // Check if movie exists
  if (!movie) return res.status(404).send("Movie with given ID not found.");

  res.send(movie);
});

// DELETE by ID
router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const movie = await Movie.findByIdAndRemove(req.params.id);

  // Check if movie exists
  if (!movie) return res.status(404).send("Movie with given ID not found.");

  res.send(movie);
});

module.exports = router;
