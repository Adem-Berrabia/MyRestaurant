const fs = require("fs");
fs.mkdirSync("screens", { recursive: true });

const names = {
  Accueil: "Accueil",
  Menu: "Menu",
  Categories: "Catégories",
  DetailPlat: "Détail du plat",
  Panier: "Panier",
  Reservation: "Réservation",
  Historique: "Historique",
  Profil: "Profil",
};

for (const [file, title] of Object.entries(names)) {
  fs.writeFileSync(
    `screens/${file}Screen.js`,
    `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ${file}Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>${title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
});
`,
  );
}
