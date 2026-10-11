const fs = require("fs");
const path = require("path");

const groups = {
  auth: ["AuthScreen"],
  client: [
    "AccueilScreen",
    "MenuScreen",
    "CategoriesScreen",
    "DetailPlatScreen",
    "PanierScreen",
    "ReservationScreen",
    "HistoriqueScreen",
  ],
  admin: [
    "AdminDashboardScreen",
    "AdminOrdersScreen",
    "AdminReservationsScreen",
    "AdminUsersScreen",
    "GestionMenuScreen",
  ],
  shared: ["ProfilScreen"],
};

const groupOf = {};
const screensDir = path.join(__dirname, "screens");

for (const [group, names] of Object.entries(groups)) {
  fs.mkdirSync(path.join(screensDir, group), { recursive: true });
  for (const name of names) {
    groupOf[name] = group;
    const from = path.join(screensDir, `${name}.js`);
    if (!fs.existsSync(from)) {
      console.log(`skip (not found): ${name}.js`);
      continue;
    }
    // the file is now one folder deeper: ../x becomes ../../x
    const code = fs
      .readFileSync(from, "utf8")
      .replace(/from (['"])\.\.\//g, "from $1../../");
    fs.writeFileSync(path.join(screensDir, group, `${name}.js`), code);
    fs.unlinkSync(from);
    console.log(`moved: ${name}.js -> screens/${group}/`);
  }
}

// update the imports in AppNavigator
const navPath = path.join(__dirname, "navigation", "AppNavigator.js");
const nav = fs
  .readFileSync(navPath, "utf8")
  .replace(/(['"])\.\.\/screens\/(\w+)(['"])/g, (m, q1, name, q2) =>
    groupOf[name] ? `${q1}../screens/${groupOf[name]}/${name}${q2}` : m,
  );
fs.writeFileSync(navPath, nav);
console.log("AppNavigator imports updated");
