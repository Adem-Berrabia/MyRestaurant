import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MealCard from "../../components/MealCard";
import { getMeals, getCategories } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import { colors, radius } from "../../theme";

export default function MenuScreen({ navigation, route }) {
  const { addToCart } = useCart();
  const { ids: favIds } = useFavorites();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showFav, setShowFav] = useState(false);
  const [categories, setCategories] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Category chosen from the Catégories tab
  useEffect(() => {
    const c = route.params?.categorie;
    if (c) {
      setSelected(c);
      setShowFav(false);
      navigation.setParams({ categorie: undefined });
    }
  }, [route.params?.categorie]);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getCategories());
    } catch (e) {}
  }, []);

  const loadMeals = useCallback(async () => {
    try {
      setError("");
      setMeals(await getMeals({ search, categorie: selected }));
    } catch (e) {
      setError(
        "Impossible de charger le menu. Vérifiez la connexion au serveur.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selected]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = setTimeout(loadMeals, 300); // debounce
    return () => clearTimeout(timer);
  }, [loadMeals]);

  const quickAdd = (meal) => {
    addToCart(meal, 1);
    setToast(`${meal.nom} ajouté au panier`);
    setTimeout(() => setToast(""), 1600);
  };

  const shown = showFav ? meals.filter((m) => favIds.includes(m._id)) : meals;

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un plat..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <TouchableOpacity
            style={[styles.chip, !selected && !showFav && styles.chipActive]}
            onPress={() => {
              setSelected(null);
              setShowFav(false);
            }}
          >
            <Text
              style={[
                styles.chipText,
                !selected && !showFav && styles.chipTextActive,
              ]}
            >
              Tous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, styles.chipRow, showFav && styles.chipActive]}
            onPress={() => {
              setShowFav(true);
              setSelected(null);
            }}
          >
            <Ionicons
              name="heart"
              size={14}
              color={showFav ? "#fff" : colors.danger}
            />
            <Text
              style={[
                styles.chipText,
                { marginLeft: 5 },
                showFav && styles.chipTextActive,
              ]}
            >
              Favoris ({favIds.length})
            </Text>
          </TouchableOpacity>

          {categories.map((c) => {
            const active = c === selected;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  setSelected(c);
                  setShowFav(false);
                }}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : error ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.muted}
          />
          <Text style={styles.msg}>{error}</Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => {
              setLoading(true);
              loadMeals();
            }}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMeals();
              }}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <MealCard
              meal={item}
              onPress={() =>
                navigation.navigate("DetailPlat", { id: item._id })
              }
              onAdd={() => quickAdd(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons
                name={showFav ? "heart-outline" : "fast-food-outline"}
                size={48}
                color={colors.muted}
              />
              <Text style={styles.msg}>
                {showFav
                  ? "Aucun favori. Touchez le cœur d'un plat pour l'ajouter."
                  : "Aucun plat trouvé."}
              </Text>
            </View>
          }
        />
      )}

      {toast ? (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: colors.text },
  chips: { paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipRow: { flexDirection: "row", alignItems: "center" },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  center: { alignItems: "center", marginTop: 50, paddingHorizontal: 30 },
  msg: {
    textAlign: "center",
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
  },
  retry: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  retryText: { color: "#fff", fontWeight: "700" },
  toast: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  toastText: { color: "#fff", marginLeft: 8, fontWeight: "600" },
});
