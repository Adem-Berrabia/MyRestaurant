const express = require("express");
const Reservation = require("../models/Reservation");
const { auth } = require("../middleware/auth");
const cfg = require("../config");

const router = express.Router();
router.use(auth);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
const nowHM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toMin = (hm) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

function allSlots() {
  const out = [];
  for (let t = toMin(cfg.OPEN); t < toMin(cfg.CLOSE); t += cfg.STEP) {
    out.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return out;
}

function lastBookableDate() {
  const d = new Date();
  d.setDate(d.getDate() + cfg.DAYS_AHEAD);
  return iso(d);
}

// seats already booked per slot for a date (cancelled ones don't count)
async function seatsTaken(date) {
  const rows = await Reservation.aggregate([
    { $match: { date, statut: { $ne: "annulée" } } },
    { $group: { _id: "$heure", seats: { $sum: "$nombrePersonnes" } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.seats]));
}

// GET /api/reservations/availability?date=YYYY-MM-DD
router.get("/availability", async (req, res) => {
  try {
    const date = String(req.query.date || "");
    if (!DATE_RE.test(date))
      return res.status(400).json({ message: "Date invalide" });

    const taken = await seatsTaken(date);
    const isToday = date === todayISO();
    const now = nowHM();

    const slots = allSlots().map((heure) => {
      const past = isToday && heure <= now;
      const left = Math.max(0, cfg.CAPACITY - (taken.get(heure) || 0));
      return { heure, left: past ? 0 : left, past };
    });

    res.json({ date, capacity: cfg.CAPACITY, maxParty: cfg.MAX_PARTY, slots });
  } catch (e) {
    console.error("GET /reservations/availability error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST create a reservation
router.post("/", async (req, res) => {
  try {
    const date = String(req.body.date || "");
    const heure = String(req.body.heure || "");
    const n = Number(req.body.nombrePersonnes);

    if (!DATE_RE.test(date))
      return res.status(400).json({ message: "Date invalide" });
    if (date < todayISO())
      return res.status(400).json({ message: "Cette date est déjà passée" });
    if (date > lastBookableDate()) {
      return res
        .status(400)
        .json({
          message: `Réservation possible jusqu'à ${cfg.DAYS_AHEAD} jours à l'avance`,
        });
    }
    if (!allSlots().includes(heure))
      return res.status(400).json({ message: "Créneau invalide" });
    if (date === todayISO() && heure <= nowHM()) {
      return res.status(400).json({ message: "Ce créneau est déjà passé" });
    }
    if (!Number.isInteger(n) || n < 1 || n > cfg.MAX_PARTY) {
      return res
        .status(400)
        .json({ message: `Nombre de personnes : 1 à ${cfg.MAX_PARTY}` });
    }

    const taken = (await seatsTaken(date)).get(heure) || 0;
    const left = cfg.CAPACITY - taken;
    if (n > left) {
      return res.status(409).json({
        message:
          left <= 0
            ? "Ce créneau est complet"
            : `Il ne reste que ${left} place(s) sur ce créneau`,
      });
    }

    const r = await Reservation.create({
      user: req.user._id,
      utilisateur: req.user.nom,
      date,
      heure,
      nombrePersonnes: n,
    });
    res.status(201).json(r);
  } catch (e) {
    console.error("POST /reservations error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET my reservations
router.get("/", async (req, res) => {
  try {
    res.json(
      await Reservation.find({ user: req.user._id }).sort({
        date: -1,
        heure: -1,
      }),
    );
  } catch (e) {
    console.error("GET /reservations error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PATCH cancel one of my reservations
router.patch("/:id/cancel", async (req, res) => {
  try {
    const r = await Reservation.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { statut: "annulée" },
      { new: true },
    );
    if (!r) return res.status(404).json({ message: "Réservation introuvable" });
    res.json(r);
  } catch (e) {
    console.error("PATCH /reservations/cancel error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
