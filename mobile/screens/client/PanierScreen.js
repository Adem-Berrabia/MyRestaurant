import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";
import { createOrder } from "../../services/api";
import { getUser } from "../../services/user";
import { imageUrl } from "../../utils/image";
import { colors, radius, shadow, formatPrice } from "../../theme";

const TYPES = [
  { key: "sur place", label: "Sur place", icon: "restaurant-outline" },
  { key: "à emporter", label: "À emporter", icon: "bag-handle-outline" },
];

export default function PanierScreen({ navigation }) {
  const { items, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const [type, setType] = useState("sur place");
  const [table, setTable] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const confirmDelete = (item) =>
    Alert.alert("Supprimer", `Retirer ${item.nom} du panier ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => removeFromCart(item._id),
      },
    ]);

  const placeOrder = async () => {
    if (type === "sur place" && !table.trim()) {
      return Alert.alert("Table requise", "Indiquez votre numéro de table.");
    }
    try {
      setSending(true);
      const utilisateur = await getUser();
      await createOrder({
        utilisateur,
        produits: items.map((i) => ({
          mealId: i._id,
          nom: i.nom,
          prix: i.prix,
          quantite: i.quantite,
        })),
        total,
        type,
        table: type === "sur place" ? table.trim() : "",
        note: note.trim(),
      });
      clearCart();
      setTable("");
      setNote("");
      Alert.alert(
        "Commande envoyée ✅",
        "Merci ! Votre commande est enregistrée.",
        [
          {
            text: "Suivre ma commande",
            onPress: () => navigation.navigate("Historique"),
          },
          { text: "OK" },
        ],
      );
    } catch (e) {
      Alert.alert(
        "Erreur",
        String(e.message || "Impossible d'envoyer la commande."),
      );
    } finally {
      setSending(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cart-outline" size={52} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <Text style={styles.emptySub}>Ajoutez des plats depuis le menu.</Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate("Menu")}
        >
          <Text style={styles.ctaText}>Voir le menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item) => (
          <View key={item._id} style={styles.row}>
            {item.image ? (
              <Image
                source={{ uri: imageUrl(item.image) }}
                style={styles.image}
              />
            ) : (
              <View style={[styles.image, styles.ph]}>
                <Ionicons
                  name="restaurant-outline"
                  size={24}
                  color={colors.muted}
                />
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {item.nom}
              </Text>
              <Text style={styles.unit}>{formatPrice(item.prix)} / unité</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item._id, -1)}
                >
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantite}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item._id, 1)}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.right}>
              <Text style={styles.lineTotal}>
                {formatPrice(item.prix * item.quantite)}
              </Text>
              <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={8}>
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={styles.section}>Mode de service</Text>
        <View style={styles.segment}>
          {TYPES.map((t) => {
            const active = type === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.segBtn, active && styles.segActive]}
                onPress={() => setType(t.key)}
              >
                <Ionicons
                  name={t.icon}
                  size={18}
                  color={active ? "#fff" : colors.text}
                />
                <Text style={[styles.segText, active && { color: "#fff" }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {type === "sur place" ? (
          <TextInput
            style={styles.input}
            placeholder="Numéro de table (ex : 5)"
            placeholderTextColor={colors.muted}
            value={table}
            onChangeText={setTable}
            keyboardType="number-pad"
            maxLength={3}
          />
        ) : null}

        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          placeholder="Note pour la cuisine (facultatif)"
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={200}
        />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.button, sending && { opacity: 0.6 }]}
          disabled={sending}
          onPress={placeOrder}
        >
          <Text style={styles.buttonText}>
            {sending ? "Envoi..." : "Commander"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  emptyWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  emptySub: { color: colors.muted, marginTop: 4, marginBottom: 20 },
  cta: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: radius.pill,
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 10,
    marginBottom: 10,
    ...shadow,
  },
  image: { width: 72, height: 72, borderRadius: radius.md },
  ph: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  unit: { fontSize: 12, color: colors.muted, marginVertical: 3 },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 72,
    marginLeft: 6,
  },
  lineTotal: { fontSize: 15, fontWeight: "800", color: colors.primary },

  section: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 14,
    marginBottom: 10,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  segBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: radius.pill,
  },
  segActive: { backgroundColor: colors.primary },
  segText: { marginLeft: 6, fontWeight: "700", color: colors.text },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },

  footer: {
    backgroundColor: colors.card,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  totalLabel: { fontSize: 18, fontWeight: "600", color: colors.text },
  totalValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.pill,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
