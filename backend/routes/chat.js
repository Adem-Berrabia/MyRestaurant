const express = require("express");
const Meal = require("../models/Meal");
const { auth } = require("../middleware/auth");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";

// 15 questions / minute / IP: a small model on a PC is slow
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de questions, patientez un instant." },
});

router.post("/", auth, chatLimiter, async (req, res) => {
  const message = String(req.body.message || "")
    .trim()
    .slice(0, 200);
  if (!message) return res.status(400).json({ message: "Message vide" });

  try {
    const meals = await Meal.find({ disponible: { $ne: false } }).lean();
    const menu = meals
      .map(
        (m) =>
          `- ${m.nom} | ${m.categorie} | ${m.prix} DT` +
          (m.vegetarien ? " | végétarien" : "") +
          (m.allergenes && m.allergenes.length
            ? ` | allergènes: ${m.allergenes.join(", ")}`
            : ""),
      )
      .join("\n");

    const system =
      "Tu es l'assistant du restaurant MyRestaurant. Réponds en français, en 2 ou 3 phrases courtes.\n" +
      "Tu parles UNIQUEMENT du menu ci-dessous. Cite les plats avec leur nom exact.\n" +
      "N'invente jamais un plat, un prix ou un ingrédient. Si l'information n'est pas dans le menu, dis de demander au personnel.\n" +
      "Ne donne aucun conseil médical.\n\nMENU :\n" +
      (menu || "(aucun plat disponible)");

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);

    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        options: { temperature: 0.3, num_predict: 200 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: message },
        ],
      }),
    });
    clearTimeout(timer);
    if (!r.ok) throw new Error("ollama " + r.status);

    const data = await r.json();
    const text = String(data?.message?.content || "").trim();
    if (!text) throw new Error("empty");

    // only dishes that really exist can be shown as cards
    const lower = text.toLowerCase();
    const mealIds = meals
      .filter((m) => lower.includes(String(m.nom).toLowerCase()))
      .slice(0, 3)
      .map((m) => String(m._id));

    res.json({ text, mealIds });
  } catch (e) {
    // the app then keeps its own rule-based answer
    res.status(503).json({ message: "Assistant IA indisponible" });
  }
});

module.exports = router;
