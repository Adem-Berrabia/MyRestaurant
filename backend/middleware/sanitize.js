// Remove keys like "$ne" or "a.b" from the request body so users can't
// inject MongoDB operators (NoSQL injection).
function clean(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else {
      clean(obj[key]);
    }
  }
}

module.exports = (req, res, next) => {
  clean(req.body);
  next();
};
