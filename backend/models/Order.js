const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  utilisateur: { type: String, required: true }, // display name
  produits: [
    {
      mealId: { type: mongoose.Schema.Types.ObjectId, ref: "Meal" },
      nom: String,
      prix: Number,
      quantite: Number,
    },
  ],
  total: { type: Number, required: true },
  type: {
    type: String,
    enum: ["sur place", "à emporter"],
    default: "sur place",
  },
  table: { type: String, default: "" },
  note: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  statut: {
    type: String,
    enum: ["en attente", "en préparation", "prête", "terminée", "annulée"],
    default: "en attente",
  },
});

module.exports = mongoose.model("Order", orderSchema, "orders");
