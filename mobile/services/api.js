import { API_URL } from "../config";

let token = null;
let onUnauthorized = null;

export const setToken = (t) => {
  token = t;
};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (e) {
    throw new Error("Serveur injoignable. Vérifiez la connexion.");
  }

  if (!res.ok) {
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    let msg = `Erreur serveur (${res.status})`;
    try {
      const data = await res.json();
      if (data.message) msg = data.message;
    } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

const jsonSend = (method, path, body) =>
  request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// Auth
export const registerRequest = (nom, email, password) =>
  jsonSend("POST", "/api/auth/register", { nom, email, password });
export const loginRequest = (email, password) =>
  jsonSend("POST", "/api/auth/login", { email, password });

export const meRequest = () => request("/api/auth/me");
export const updateProfileRequest = (nom) =>
  jsonSend("PATCH", "/api/auth/me", { nom });
export const changePasswordRequest = (currentPassword, newPassword) =>
  jsonSend("PATCH", "/api/auth/password", { currentPassword, newPassword });
const mealBody = (meal, image) => ({
  ...meal,
  imageBase64: image ? image.base64 : undefined,
  imageExt: image ? image.ext : undefined,
});
export const chatRequest = (message) =>
  jsonSend("POST", "/api/chat", { message });
// Meals
export const getMeals = ({ search, categorie } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (categorie) params.append("categorie", categorie);
  return request(`/api/meals?${params.toString()}`);
};
export const getCategories = () => request("/api/meals/categories");
export const getMeal = (id) => request(`/api/meals/${id}`);
export const createMeal = (meal, image) =>
  jsonSend("POST", "/api/meals", mealBody(meal, image));
export const updateMeal = (id, meal, image) =>
  jsonSend("PUT", `/api/meals/${id}`, mealBody(meal, image));
export const deleteMeal = (id) =>
  request(`/api/meals/${id}`, { method: "DELETE" });

// Client: orders and reservations
export const createOrder = (order) => jsonSend("POST", "/api/orders", order);
export const getOrders = () => request("/api/orders");
export const cancelOrder = (id) =>
  request(`/api/orders/${id}/cancel`, { method: "PATCH" });
export const getAvailability = (date) =>
  request(`/api/reservations/availability?date=${encodeURIComponent(date)}`);
export const createReservation = (r) =>
  jsonSend("POST", "/api/reservations", r);
export const getReservations = () => request("/api/reservations");
export const cancelReservation = (id) =>
  request(`/api/reservations/${id}/cancel`, { method: "PATCH" });

// Admin
export const getStats = () => request("/api/admin/stats");
export const getAdminOrders = () => request("/api/admin/orders");
export const setOrderStatus = (id, statut) =>
  jsonSend("PATCH", `/api/admin/orders/${id}/status`, { statut });
export const getAdminReservations = () => request("/api/admin/reservations");
export const setMealAvailability = (id, disponible) =>
  jsonSend("PATCH", `/api/meals/${id}/availability`, { disponible });
export const deleteReservation = (id) =>
  request(`/api/admin/reservations/${id}`, { method: "DELETE" });
export const getUsers = () => request("/api/admin/users");
export const setUserRole = (id, role) =>
  jsonSend("PATCH", `/api/admin/users/${id}/role`, { role });
export const addAvis = (mealId, note, commentaire) =>
  jsonSend("POST", `/api/meals/${mealId}/avis`, { note, commentaire });
export const getAdminAvis = () => request("/api/admin/avis");
