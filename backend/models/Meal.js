const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String, default: "" },
  categorie: { type: String, required: true },
  prix: { type: Number, required: true },
  image: { type: String, default: "" },
  disponible: { type: Boolean, default: true }, // false = épuisé
  // undefined = not filled in (unknown), [] = filled in: no allergen
  allergenes: { type: [String], default: undefined },
  vegetarien: { type: Boolean, default: undefined },
});

module.exports = mongoose.model("Meal", mealSchema, "meals");
