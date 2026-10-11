const express = require("express");
const Order = require("../models/Order");
const Meal = require("../models/Meal");
const { auth } = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// POST create order (prices and total are recalculated from the database)
router.post("/", async (req, res) => {
  try {
    const { produits, type, table, note } = req.body;

    if (!Array.isArray(produits) || produits.length === 0) {
      return res.status(400).json({ message: "Panier vide" });
    }
    if (!["sur place", "à emporter"].includes(type)) {
      return res.status(400).json({ message: "Mode de service invalide" });
    }
    if (type === "sur place" && !String(table || "").trim()) {
      return res.status(400).json({ message: "Numéro de table requis" });
    }

    const meals = await Meal.find({
      _id: { $in: produits.map((p) => p.mealId) },
    });
    const byId = new Map(meals.map((m) => [String(m._id), m]));

    const lines = [];
    for (const p of produits) {
      const meal = byId.get(String(p.mealId));
      const q = Number(p.quantite);
      if (!meal || !Number.isInteger(q) || q < 1) {
        return res
          .status(400)
          .json({
            message: "Un plat du panier n'existe plus. Retirez-le du panier.",
          });
      }
      if (meal.disponible === false) {
        return res
          .status(400)
          .json({
            message: `« ${meal.nom} » est épuisé. Retirez-le du panier.`,
          });
      }
      lines.push({
        mealId: meal._id,
        nom: meal.nom,
        prix: meal.prix,
        quantite: q,
      });
    }
    const total = lines.reduce((s, l) => s + l.prix * l.quantite, 0);

    const order = await Order.create({
      user: req.user._id,
      utilisateur: req.user.nom,
      produits: lines,
      total,
      type,
      table: type === "sur place" ? String(table).trim() : "",
      note: String(note || "").slice(0, 200),
    });
    res.status(201).json(order);
  } catch (e) {
    console.error("POST /orders error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET my orders
router.get("/", async (req, res) => {
  try {
    res.json(await Order.find({ user: req.user._id }).sort({ date: -1 }));
  } catch (e) {
    console.error("GET /orders error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PATCH cancel one of my orders (only while "en attente")
router.patch("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, statut: "en attente" },
      { statut: "annulée" },
      { new: true },
    );
    if (!order) {
      return res.status(409).json({
        message:
          "Cette commande est déjà en préparation et ne peut plus être annulée.",
      });
    }
    res.json(order);
  } catch (e) {
    console.error("PATCH /orders/cancel error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
