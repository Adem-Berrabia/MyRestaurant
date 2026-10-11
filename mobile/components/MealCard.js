import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "../context/FavoritesContext";
import { imageUrl } from "../utils/image";
import { colors, radius, shadow, formatPrice } from "../theme";

export default function MealCard({ meal, onPress, onAdd }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(meal._id);
  const soldOut = meal.disponible === false;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View>
        {meal.image ? (
          <Image
            source={{ uri: imageUrl(meal.image) }}
            style={[styles.image, soldOut && { opacity: 0.4 }]}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons
              name="restaurant-outline"
              size={30}
              color={colors.muted}
            />
          </View>
        )}
        {soldOut ? (
          <View style={styles.soldBadge}>
            <Text style={styles.soldText}>Épuisé</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.heart}
          onPress={() => toggle(meal._id)}
          hitSlop={8}
        >
          <Ionicons
            name={fav ? "heart" : "heart-outline"}
            size={18}
            color={fav ? colors.danger : colors.muted}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.name, soldOut && { color: colors.muted }]}
          numberOfLines={1}
        >
          {meal.nom}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {meal.description || meal.categorie}
        </Text>
        <Text style={[styles.price, soldOut && { color: colors.muted }]}>
          {formatPrice(meal.prix)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.addBtn, soldOut && styles.addOff]}
        onPress={onAdd}
        disabled={soldOut}
        hitSlop={8}
      >
        <Ionicons
          name={soldOut ? "ban" : "add"}
          size={soldOut ? 20 : 24}
          color="#fff"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginHorizontal: 16,
    marginVertical: 7,
    padding: 10,
    ...shadow,
  },
  image: { width: 92, height: 92, borderRadius: radius.md },
  placeholder: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  soldBadge: {
    position: "absolute",
    bottom: 6,
    alignSelf: "center",
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  soldText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  heart: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  desc: { fontSize: 13, color: colors.muted, marginVertical: 3 },
  price: { fontSize: 16, fontWeight: "800", color: colors.primary },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addOff: { backgroundColor: colors.border },
});
