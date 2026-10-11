export const colors = {
  primary: "#D9480F",
  primarySoft: "#FFF0E6",
  bg: "#F7F5F2",
  card: "#FFFFFF",
  text: "#1F1B16",
  muted: "#7A726A",
  border: "#E8E3DC",
  success: "#2F9E44",
  danger: "#E03131",
};

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

export const shadow = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

export const formatPrice = (p) => `${Number(p).toFixed(2)} DT`;

// Order status -> badge colors
export const statusStyle = {
  "en attente": { bg: "#FFF4D6", fg: "#B7791F", icon: "time-outline" },
  "en préparation": { bg: "#E0EDFF", fg: "#1C64F2", icon: "flame-outline" },
  prête: { bg: "#DDF5E3", fg: "#2F9E44", icon: "checkmark-circle-outline" },
  terminée: { bg: "#ECECEC", fg: "#555555", icon: "bag-check-outline" },
  annulée: { bg: "#FDE2E2", fg: "#E03131", icon: "close-circle-outline" },
};
