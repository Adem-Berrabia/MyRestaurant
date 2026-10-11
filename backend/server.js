require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const sanitize = require("./middleware/sanitize");
const { apiLimiter } = require("./middleware/limiters");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET manquant dans .env");
  process.exit(1);
}

const app = express();
const uploadsDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // images must stay loadable
app.use(cors());
app.use(express.json({ limit: "25mb" })); // photos arrive as base64
app.use(sanitize);
app.use("/uploads", express.static(uploadsDir));
app.use("/api", apiLimiter);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/meals", require("./routes/meals"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/admin", require("./routes/admin"));

app.get("/", (req, res) => res.send("MyRestaurant API running"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, "0.0.0.0", () =>
      console.log(`Server on port ${process.env.PORT}`),
    );
  })
  .catch((err) => console.error(err));
