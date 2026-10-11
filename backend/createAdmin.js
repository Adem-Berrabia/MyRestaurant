require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const [, , nom, email, password] = process.argv;

if (!nom || !email || !password) {
  console.log('Usage: node createAdmin.js "Nom" email motdepasse');
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.role = "admin";
    existing.password = hash;
    await existing.save();
    console.log(`Compte existant promu admin : ${existing.email}`);
  } else {
    await User.create({
      nom,
      email: email.toLowerCase(),
      password: hash,
      role: "admin",
    });
    console.log(`Admin créé : ${email}`);
  }
  await mongoose.disconnect();
})();
