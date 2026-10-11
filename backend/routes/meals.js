const express = require("express");
const fs = require("fs");
const path = require("path");
const Meal = require("../models/Meal");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();
const uploadsDir = path.join(__dirname, "..", "uploads");
const adminOnly = [auth, requireRole("admin")];

const ALLERGENS = [
  "gluten",
  "lait",
  "oeufs",
  "poisson",
  "crustaces",
  "arachides",
  "fruits-a-coque",
  "soja",
  "sesame",
  "celeri",
  "moutarde",
];

function saveImage(base64, ext) {
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(
    String(ext).toLowerCase(),
  )
    ? String(ext).toLowerCase()
    : "jpg";
  const filename = `${Date.now()}.${safeExt}`;
  fs.writeFileSync(
    path.join(uploadsDir, filename),
    Buffer.from(base64, "base64"),
  );
  return `/uploads/${filename}`;
}

// Keep only known allergen keys; undefined when the field was not sent
const cleanAllergens = (a) =>
  Array.isArray(a)
    ? [...new Set(a.filter((x) => ALLERGENS.includes(x)))]
    : undefined;

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.categorie) filter.categorie = req.query.categorie;
    if (req.query.search) {
      // escape regex characters so user input can't craft a slow or broken pattern
      const safe = String(req.query.search)
        .slice(0, 50)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.nom = { $regex: safe, $options: "i" };
    }
    res.json(await Meal.find(filter));
  } catch (e) {
    console.error("GET /meals error:", e);
    res.status(500).json({ message: e.message });
  }
});

router.get("/categories", async (req, res) => {
  try {
    res.json(await Meal.distinct("categorie"));
  } catch (e) {
    console.error("GET /categories error:", e);
    res.status(500).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Not found" });
    res.json(meal);
  } catch (e) {
    console.error("GET /meals/:id error:", e);
    res.status(500).json({ message: e.message });
  }
});

router.post("/", adminOnly, async (req, res) => {
  try {
    const {
      nom,
      description,
      categorie,
      prix,
      imageBase64,
      imageExt,
      allergenes,
      vegetarien,
    } = req.body;
    const data = {
      nom,
      description,
      categorie,
      prix: Number(prix),
      image: imageBase64 ? saveImage(imageBase64, imageExt) : "",
    };
    const al = cleanAllergens(allergenes);
    if (al) data.allergenes = al;
    if (typeof vegetarien === "boolean") data.vegetarien = vegetarien;

    res.status(201).json(await new Meal(data).save());
  } catch (e) {
    console.error("POST /meals error:", e);
    res.status(500).json({ message: e.message });
  }
});

router.put("/:id", adminOnly, async (req, res) => {
  try {
    const {
      nom,
      description,
      categorie,
      prix,
      imageBase64,
      imageExt,
      allergenes,
      vegetarien,
    } = req.body;
    const update = { nom, description, categorie, prix: Number(prix) };
    if (imageBase64) update.image = saveImage(imageBase64, imageExt);
    const al = cleanAllergens(allergenes);
    if (al) update.allergenes = al;
    if (typeof vegetarien === "boolean") update.vegetarien = vegetarien;

    res.json(
      await Meal.findByIdAndUpdate(req.params.id, update, { new: true }),
    );
  } catch (e) {
    console.error("PUT /meals error:", e);
    res.status(500).json({ message: e.message });
  }
});

// Mark a dish available / sold out
router.patch("/:id/availability", adminOnly, async (req, res) => {
  try {
    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      { disponible: Boolean(req.body.disponible) },
      { new: true },
    );
    if (!meal) return res.status(404).json({ message: "Plat introuvable" });
    res.json(meal);
  } catch (e) {
    console.error("PATCH /meals/availability error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await Meal.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /meals error:", e);
    res.status(500).json({ message: e.message });
  }
});
// Client leaves (or updates) a review on a dish — one review per user per dish
router.post("/:id/avis", auth, async (req, res) => {
  try {
    const { note, commentaire } = req.body;
    const n = Number(note);
    if (!n || n < 1 || n > 5) {
      return res
        .status(400)
        .json({ message: "La note doit être entre 1 et 5." });
    }

    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Plat introuvable" });

    const existing = meal.avis.find(
      (a) => String(a.user) === String(req.user.id),
    );
    if (existing) {
      existing.note = n;
      existing.commentaire = String(commentaire || "").slice(0, 500);
      existing.date = new Date();
    } else {
      meal.avis.push({
        user: req.user.id,
        nomUser: req.user.nom || "Client",
        note: n,
        commentaire: String(commentaire || "").slice(0, 500),
      });
    }

    meal.nombreAvis = meal.avis.length;
    meal.noteMoyenne =
      meal.avis.reduce((sum, a) => sum + a.note, 0) / meal.avis.length;

    await meal.save();
    res.json(meal);
  } catch (e) {
    console.error("POST /meals/:id/avis error:", e);
    res.status(500).json({ message: e.message });
  }
});
module.exports = router;
