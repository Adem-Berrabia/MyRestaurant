import { API_URL } from "../config";

// Accepts a full URL (https://...) or a server path (/uploads/...)
export const imageUrl = (img) => {
  if (!img) return null;
  return /^https?:\/\//i.test(img) ? img : API_URL + img;
};
