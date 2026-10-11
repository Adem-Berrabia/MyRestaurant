import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "myrestaurant_user";

export async function getUser() {
  const name = await AsyncStorage.getItem(KEY);
  return name || "Invité";
}

export async function saveUser(name) {
  await AsyncStorage.setItem(KEY, String(name || "").trim() || "Invité");
}

export async function clearUser() {
  await AsyncStorage.removeItem(KEY);
}
