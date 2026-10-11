const { rateLimit } = require("express-rate-limit");

const make = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    ...extra,
  });

// whole API: 300 requests / minute / IP
const apiLimiter = make(
  60 * 1000,
  300,
  "Trop de requêtes, réessayez dans un instant.",
);

// login: 10 failed attempts / 15 min / IP (successful logins are not counted)
const loginLimiter = make(
  15 * 60 * 1000,
  10,
  "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
  { skipSuccessfulRequests: true },
);

// registration: 20 / hour / IP
const registerLimiter = make(
  60 * 60 * 1000,
  20,
  "Trop d'inscriptions depuis cette adresse. Réessayez plus tard.",
);

// password change: 10 / 15 min / IP
const passwordLimiter = make(
  15 * 60 * 1000,
  10,
  "Trop de tentatives. Réessayez dans 15 minutes.",
);

module.exports = { apiLimiter, loginLimiter, registerLimiter, passwordLimiter };
