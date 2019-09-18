const { Genre, validate } = require("../models/genre");
const express = require("express");
const validateObjectId = require('../middleware/validateObjectId');
const router = express.Router();
const auth = require("../middleware/auth"); // to verify user sends existing token
const admin = require("../middleware/admin"); // to verify token has admin priviliges

// POST
router.post("/", auth, async (req, res) => {
	// Validate input
	const { error } = validate(req.body);
	if (error) return res.status(400).send(error.details[0].message);

	const genre = new Genre({ name: req.body.name });
	await genre.save();

	res.send(genre);
});

// PUT by ID
router.put("/:id", [auth, validateObjectId], async (req, res) => {
	// Validate input
	const { error } = validate(req.body);
	if (error) return res.status(400).send(error.details[0].message);

	const genre = await Genre.findByIdAndUpdate(
		req.params.id,
		{ name: req.body.name },
		{ new: true }
	);

	// Check if genre exists
	if (!genre) return res.status(404).send("Genre with given ID not found.");

	res.send(genre);
});

// GET ALL
router.get("/", async (req, res) => {
	const genres = await Genre.find().sort("name");
	res.send(genres);
});

// GET by ID
router.get("/:id", validateObjectId, async (req, res) => {
	const genre = await Genre.findById(req.params.id);

	// Check if genre exists
	if (!genre) return res.status(404).send("Genre with given ID not found.");

	res.send(genre);
});

// DELETE by ID
router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
	const genre = await Genre.findByIdAndRemove(req.params.id);

	// Check if genre exists
	if (!genre) return res.status(404).send("Genre with given ID not found.");

	res.send(genre);
});

module.exports = router;
