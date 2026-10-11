const express = require("express");
const User = require("../models/User");
const Order = require("../models/Order");
const Meal = require("../models/Meal");
const Reservation = require("../models/Reservation");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(auth, requireRole("admin"));

const STATUSES = [
  "en attente",
  "en préparation",
  "prête",
  "terminée",
  "annulée",
];
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const h = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    console.error("ADMIN error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Dashboard numbers
router.get(
  "/stats",
  h(async (req, res) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const notCancelled = { statut: { $ne: "annulée" } };

    const [ordersToday, pending, users, meals, reservations, today, all, top] =
      await Promise.all([
        Order.countDocuments({ date: { $gte: start } }),
        Order.countDocuments({ statut: "en attente" }),
        User.countDocuments(),
        Meal.countDocuments(),
        Reservation.countDocuments(),
        Order.aggregate([
          { $match: { date: { $gte: start }, ...notCancelled } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.aggregate([
          { $match: notCancelled },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.aggregate([
          { $match: notCancelled },
          { $unwind: "$produits" },
          {
            $group: {
              _id: "$produits.nom",
              qty: { $sum: "$produits.quantite" },
            },
          },
          { $sort: { qty: -1 } },
          { $limit: 5 },
        ]),
      ]);

    // Sales of the last 7 days (including today)
    const since = new Date(start);
    since.setDate(since.getDate() - 6);
    const recent = await Order.find({
      date: { $gte: since },
      ...notCancelled,
    }).select("date total");
    const sales7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      return { date: dayKey(d), total: 0, count: 0 };
    });
    const byDay = new Map(sales7.map((s) => [s.date, s]));
    recent.forEach((o) => {
      const s = byDay.get(dayKey(new Date(o.date)));
      if (s) {
        s.total += o.total;
        s.count += 1;
      }
    });

    res.json({
      ordersToday,
      pending,
      users,
      meals,
      reservations,
      revenueToday: today[0]?.total || 0,
      revenueTotal: all[0]?.total || 0,
      topMeals: top.map((t) => ({ nom: t._id, qty: t.qty })),
      sales7,
    });
  }),
);

// All orders
router.get(
  "/orders",
  h(async (req, res) => {
    res.json(await Order.find().sort({ date: -1 }).limit(200));
  }),
);

router.patch(
  "/orders/:id/status",
  h(async (req, res) => {
    if (!STATUSES.includes(req.body.statut)) {
      return res.status(400).json({ message: "Statut invalide" });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { statut: req.body.statut },
      { new: true },
    );
    if (!order)
      return res.status(404).json({ message: "Commande introuvable" });
    res.json(order);
  }),
);

// All reservations
router.get(
  "/reservations",
  h(async (req, res) => {
    res.json(await Reservation.find().sort({ _id: -1 }).limit(200));
  }),
);

router.delete(
  "/reservations/:id",
  h(async (req, res) => {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimée" });
  }),
);

// Users
router.get(
  "/users",
  h(async (req, res) => {
    res.json(await User.find().select("-password").sort({ createdAt: -1 }));
  }),
);

router.patch(
  "/users/:id/role",
  h(async (req, res) => {
    const { role } = req.body;
    if (!["client", "admin"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }
    if (String(req.params.id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez pas modifier votre propre rôle" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(user);
  }),
);

module.exports = router;
