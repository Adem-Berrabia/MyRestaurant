const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const {
  loginLimiter,
  registerLimiter,
  passwordLimiter,
} = require("../middleware/limiters");

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD = 72; // bcrypt ignores everything after 72 bytes

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const publicUser = (u) => ({
  id: u._id,
  nom: u.nom,
  email: u.email,
  role: u.role,
});

// POST /api/auth/register
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const nom = String(req.body.nom || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (nom.length < 2 || nom.length > 50) {
      return res.status(400).json({ message: "Nom : 2 à 50 caractères" });
    }
    if (!EMAIL_RE.test(email) || email.length > 100) {
      return res.status(400).json({ message: "Email invalide" });
    }
    if (password.length < 6 || password.length > MAX_PASSWORD) {
      return res
        .status(400)
        .json({ message: `Mot de passe : 6 à ${MAX_PASSWORD} caractères` });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "Cet email est déjà utilisé" });
    }

    const hash = await bcrypt.hash(password, 10);
    // role is always "client" here; it can never come from the request
    const user = await User.create({
      nom,
      email,
      password: hash,
      role: "client",
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    console.error("POST /auth/register error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok)
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    console.error("POST /auth/login error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/auth/me
router.get("/me", auth, (req, res) => res.json(publicUser(req.user)));

// PATCH /api/auth/me  (edit display name)
router.patch("/me", auth, async (req, res) => {
  try {
    const nom = String(req.body.nom || "").trim();
    if (nom.length < 2 || nom.length > 50) {
      return res.status(400).json({ message: "Nom : 2 à 50 caractères" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nom },
      { new: true },
    );
    res.json(publicUser(user));
  } catch (e) {
    console.error("PATCH /auth/me error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// PATCH /api/auth/password  (change password)
router.patch("/password", auth, passwordLimiter, async (req, res) => {
  try {
    const current = String(req.body.currentPassword || "");
    const next = String(req.body.newPassword || "");

    if (next.length < 6 || next.length > MAX_PASSWORD) {
      return res
        .status(400)
        .json({
          message: `Nouveau mot de passe : 6 à ${MAX_PASSWORD} caractères`,
        });
    }

    const user = await User.findById(req.user._id); // includes the hash
    if (!(await bcrypt.compare(current, user.password))) {
      return res.status(400).json({ message: "Mot de passe actuel incorrect" });
    }
    if (current === next) {
      return res
        .status(400)
        .json({ message: "Le nouveau mot de passe doit être différent" });
    }

    user.password = await bcrypt.hash(next, 10);
    await user.save();
    res.json({ message: "Mot de passe modifié" });
  } catch (e) {
    console.error("PATCH /auth/password error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
