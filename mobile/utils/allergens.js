export const ALLERGENS = [
  { key: "gluten", label: "Gluten" },
  { key: "lait", label: "Lait" },
  { key: "oeufs", label: "Œufs" },
  { key: "poisson", label: "Poisson" },
  { key: "crustaces", label: "Crustacés" },
  { key: "arachides", label: "Arachides" },
  { key: "fruits-a-coque", label: "Fruits à coque" },
  { key: "soja", label: "Soja" },
  { key: "sesame", label: "Sésame" },
  { key: "celeri", label: "Céleri" },
  { key: "moutarde", label: "Moutarde" },
];

export const allergenLabel = (key) =>
  (ALLERGENS.find((a) => a.key === key) || { label: key }).label;
