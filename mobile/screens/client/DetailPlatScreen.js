import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getMeal, addAvis } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { imageUrl } from "../../utils/image";
import { colors, radius, formatPrice } from "../../theme";

function Stars({ value, size = 18, onPress }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          disabled={!onPress}
          onPress={() => onPress && onPress(n)}
          hitSlop={4}
        >
          <Ionicons
            name={n <= value ? "star" : "star-outline"}
            size={size}
            color="#F5A623"
            style={{ marginRight: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function DetailPlatScreen({ route, navigation }) {
  const { id } = route.params;
  const { addToCart } = useCart();
  const [meal, setMeal] = useState(null);
  const [qty, setQty] = useState(1);
  const [myNote, setMyNote] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    getMeal(id)
      .then(setMeal)
      .catch(() => Alert.alert("Erreur", "Plat introuvable"));

  useEffect(() => {
    load();
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

  const submitAvis = async () => {
    if (!myNote) {
      Alert.alert("Note requise", "Choisissez une note de 1 à 5 étoiles.");
      return;
    }
    setSending(true);
    try {
      const updated = await addAvis(id, myNote, myComment.trim());
      setMeal(updated);
      setMyNote(0);
      setMyComment("");
      Alert.alert("Merci !", "Votre avis a été enregistré.");
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSending(false);
    }
  };

  const avis = meal.avis || [];

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

          {meal.nombreAvis > 0 ? (
            <View style={styles.ratingRow}>
              <Stars value={Math.round(meal.noteMoyenne)} />
              <Text style={styles.ratingText}>
                {meal.noteMoyenne.toFixed(1)} · {meal.nombreAvis} avis
              </Text>
            </View>
          ) : (
            <Text style={[styles.ratingText, { marginTop: 8 }]}>
              Aucun avis pour le moment
            </Text>
          )}

          <Text style={styles.h}>Description</Text>
          <Text style={styles.desc}>
            {meal.description || "Aucune description disponible."}
          </Text>

          <Text style={styles.h}>Laisser un avis</Text>
          <View style={styles.reviewBox}>
            <Stars value={myNote} size={28} onPress={setMyNote} />
            <TextInput
              style={styles.input}
              placeholder="Votre commentaire (optionnel)"
              placeholderTextColor={colors.muted}
              value={myComment}
              onChangeText={setMyComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.submitBtn, sending && { opacity: 0.6 }]}
              onPress={submitAvis}
              disabled={sending}
            >
              <Text style={styles.submitText}>
                {sending ? "Envoi..." : "Envoyer mon avis"}
              </Text>
            </TouchableOpacity>
          </View>

          {avis.length > 0 ? (
            <>
              <Text style={styles.h}>Avis des clients</Text>
              {avis
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((a, i) => (
                  <View key={i} style={styles.avisCard}>
                    <View style={styles.avisHead}>
                      <Text style={styles.avisName}>{a.nomUser}</Text>
                      <Stars value={a.note} size={14} />
                    </View>
                    {a.commentaire ? (
                      <Text style={styles.avisText}>{a.commentaire}</Text>
                    ) : null}
                  </View>
                ))}
            </>
          ) : null}
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingText: {
    fontSize: 13,
    color: colors.muted,
    marginLeft: 8,
    fontWeight: "600",
  },
  h: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginTop: 22,
    marginBottom: 6,
  },
  desc: { fontSize: 15, lineHeight: 23, color: colors.muted },
  reviewBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    marginTop: 12,
    minHeight: 60,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  avisCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avisHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avisName: { fontSize: 14, fontWeight: "700", color: colors.text },
  avisText: { fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18 },
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
