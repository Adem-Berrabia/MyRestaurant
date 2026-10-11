import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getMeal } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { imageUrl } from "../../utils/image";
import { colors, radius, formatPrice } from "../../theme";

export default function DetailPlatScreen({ route, navigation }) {
  const { id } = route.params;
  const { addToCart } = useCart();
  const [meal, setMeal] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    getMeal(id)
      .then(setMeal)
      .catch(() => Alert.alert("Erreur", "Plat introuvable"));
  }, [id]);

  if (!meal) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={{ marginTop: 40 }}
      />
    );
  }

  const soldOut = meal.disponible === false;

  const add = () => {
    addToCart(meal, qty);
    Alert.alert("Ajouté au panier ✅", `${qty} × ${meal.nom}`, [
      { text: "Continuer", onPress: () => navigation.goBack() },
      {
        text: "Voir le panier",
        onPress: () => navigation.navigate("Tabs", { screen: "Panier" }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {meal.image ? (
          <Image source={{ uri: imageUrl(meal.image) }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons
              name="restaurant-outline"
              size={64}
              color={colors.muted}
            />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{meal.categorie}</Text>
            </View>
            {soldOut ? (
              <View
                style={[
                  styles.tag,
                  { backgroundColor: "#FDE2E2", marginLeft: 8 },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.danger }]}>
                  Épuisé
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.name}>{meal.nom}</Text>
          <Text style={styles.price}>{formatPrice(meal.prix)}</Text>

          <Text style={styles.h}>Description</Text>
          <Text style={styles.desc}>
            {meal.description || "Aucune description disponible."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bar}>
        {soldOut ? (
          <View style={[styles.addBtn, styles.addOff, { marginLeft: 0 }]}>
            <Text style={styles.addText}>Plat indisponible pour le moment</Text>
          </View>
        ) : (
          <>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qty}>{qty}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty((q) => Math.min(20, q + 1))}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={add}>
              <Text style={styles.addText}>
                Ajouter · {formatPrice(meal.prix * qty)}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  image: { width: "100%", height: 280 },
  placeholder: {
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    backgroundColor: colors.bg,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    minHeight: 300,
  },
  tagRow: { flexDirection: "row" },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  tagText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  name: { fontSize: 26, fontWeight: "800", color: colors.text, marginTop: 10 },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 4,
  },
  h: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginTop: 22,
    marginBottom: 6,
  },
  desc: { fontSize: 15, lineHeight: 23, color: colors.muted },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    marginHorizontal: 14,
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  addBtn: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  addOff: { backgroundColor: colors.muted },
  addText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
