const mongoose = require("mongoose");

const avisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nomUser: { type: String, required: true },
    note: { type: Number, required: true, min: 1, max: 5 },
    commentaire: { type: String, default: "", maxlength: 500 },
    date: { type: Date, default: Date.now },
  },
  { _id: false },
);

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
  avis: { type: [avisSchema], default: [] },
  noteMoyenne: { type: Number, default: 0 },
  nombreAvis: { type: Number, default: 0 },
});

module.exports = mongoose.model("Meal", mealSchema, "meals");
