const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  utilisateur: { type: String, required: true }, // display name
  date: { type: String, required: true }, // YYYY-MM-DD
  heure: { type: String, required: true }, // HH:MM
  nombrePersonnes: { type: Number, required: true },
  statut: {
    type: String,
    enum: ["confirmée", "annulée"],
    default: "confirmée",
  },
});

module.exports = mongoose.model(
  "Reservation",
  reservationSchema,
  "reservations",
);
