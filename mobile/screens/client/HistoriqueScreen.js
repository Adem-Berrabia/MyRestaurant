import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getOrders, cancelOrder, getMeals } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { colors, radius, shadow, formatPrice, statusStyle } from "../../theme";

const STEPS = ["en attente", "en préparation", "prête", "terminée"];
const STEP_LABELS = ["Reçue", "Cuisine", "Prête", "Servie"];

function Tracker({ statut }) {
  if (statut === "annulée") {
    return (
      <View style={styles.cancelBox}>
        <Ionicons name="close-circle" size={18} color={colors.danger} />
        <Text style={styles.cancelText}>Commande annulée</Text>
      </View>
    );
  }
  const current = STEPS.indexOf(statut);
  return (
    <View style={styles.tracker}>
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <View key={s} style={styles.step}>
            <View style={styles.stepTop}>
              <View
                style={[
                  styles.line,
                  i === 0 && { backgroundColor: "transparent" },
                  i > 0 && done && styles.lineDone,
                ]}
              />
              <View style={[styles.dot, done && styles.dotDone]}>
                {done ? (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                ) : null}
              </View>
              <View
                style={[
                  styles.line,
                  i === STEPS.length - 1 && { backgroundColor: "transparent" },
                  i < current && styles.lineDone,
                ]}
              />
            </View>
            <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>
              {STEP_LABELS[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function HistoriqueScreen({ navigation }) {
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setOrders(await getOrders());
    } catch (e) {
      setError("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load on focus, then refresh every 15 s so the tracking stays live
  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 15000);
      return () => clearInterval(t);
    }, []),
  );

  const confirmCancel = (o) =>
    Alert.alert(
      "Annuler la commande",
      `Commande #${o._id.slice(-5).toUpperCase()} ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              const updated = await cancelOrder(o._id);
              setOrders((prev) =>
                prev.map((x) => (x._id === updated._id ? updated : x)),
              );
            } catch (e) {
              Alert.alert("Annulation impossible", e.message);
              load();
            }
          },
        },
      ],
    );

  const reorder = async (o) => {
    try {
      const meals = await getMeals();
      const byId = new Map(meals.map((m) => [String(m._id), m]));
      let added = 0;
      let missing = 0;
      o.produits.forEach((p) => {
        const meal = byId.get(String(p.mealId));
        if (meal && meal.disponible !== false) {
          addToCart(meal, p.quantite);
          added += 1;
        } else {
          missing += 1;
        }
      });
      if (added === 0) {
        return Alert.alert("Indisponible", "Ces plats ne sont plus au menu.");
      }
      Alert.alert(
        "Ajouté au panier ✅",
        missing
          ? `${missing} plat(s) n'existe(nt) plus au menu.`
          : "Tous les plats ont été ajoutés.",
        [
          { text: "Continuer" },
          {
            text: "Voir le panier",
            onPress: () => navigation.navigate("Tabs", { screen: "Panier" }),
          },
        ],
      );
    } catch (e) {
      Alert.alert("Erreur", e.message);
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={{ marginTop: 40 }}
      />
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      data={orders}
      keyExtractor={(o) => o._id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          colors={[colors.primary]}
        />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={52} color={colors.muted} />
          <Text style={styles.emptyText}>
            {error || "Aucune commande pour le moment."}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const st = statusStyle[item.statut] || statusStyle["en attente"];
        const where =
          item.type === "à emporter"
            ? "À emporter"
            : `Sur place · Table ${item.table || "-"}`;
        return (
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.num}>
                  Commande #{item._id.slice(-5).toUpperCase()}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.date).toLocaleString("fr-FR")}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: st.bg }]}>
                <Ionicons name={st.icon} size={14} color={st.fg} />
                <Text style={[styles.badgeText, { color: st.fg }]}>
                  {item.statut}
                </Text>
              </View>
            </View>

            <Tracker statut={item.statut} />

            <View style={styles.whereRow}>
              <Ionicons
                name={
                  item.type === "à emporter"
                    ? "bag-handle-outline"
                    : "restaurant-outline"
                }
                size={16}
                color={colors.muted}
              />
              <Text style={styles.where}>{where}</Text>
            </View>

            <View style={styles.divider} />

            {item.produits.map((p, idx) => (
              <View key={idx} style={styles.line2}>
                <Text style={styles.lineName}>
                  {p.quantite} × {p.nom}
                </Text>
                <Text style={styles.linePrice}>
                  {formatPrice(p.prix * p.quantite)}
                </Text>
              </View>
            ))}

            {item.note ? (
              <View style={styles.noteBox}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={15}
                  color={colors.muted}
                />
                <Text style={styles.noteText}>{item.note}</Text>
              </View>
            ) : null}

            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(item.total)}</Text>
            </View>

            <View style={styles.actions}>
              {item.statut === "en attente" ? (
                <TouchableOpacity
                  style={[styles.btn, styles.btnDanger]}
                  onPress={() => confirmCancel(item)}
                >
                  <Ionicons name="close" size={16} color={colors.danger} />
                  <Text style={[styles.btnText, { color: colors.danger }]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.btn, styles.btnMain]}
                onPress={() => reorder(item)}
              >
                <Ionicons name="repeat" size={16} color={colors.primary} />
                <Text style={[styles.btnText, { color: colors.primary }]}>
                  Commander à nouveau
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: { marginTop: 10, color: colors.muted, fontSize: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 14,
    ...shadow,
  },
  header: { flexDirection: "row", alignItems: "flex-start" },
  num: { fontSize: 16, fontWeight: "800", color: colors.text },
  date: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: {
    marginLeft: 4,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
  },

  tracker: { flexDirection: "row", marginTop: 16, marginBottom: 4 },
  step: { flex: 1, alignItems: "center" },
  stepTop: { flexDirection: "row", alignItems: "center", width: "100%" },
  line: { flex: 1, height: 3, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.primary },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: colors.primary },
  stepLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 5,
    fontWeight: "600",
  },
  stepLabelDone: { color: colors.text },
  cancelBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE2E2",
    padding: 10,
    borderRadius: radius.md,
    marginTop: 14,
  },
  cancelText: { marginLeft: 8, color: colors.danger, fontWeight: "700" },

  whereRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  where: { marginLeft: 6, color: colors.muted, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  line2: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  lineName: { fontSize: 15, color: colors.text, flex: 1 },
  linePrice: { fontSize: 15, color: colors.muted },
  noteBox: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: radius.md,
    marginTop: 8,
  },
  noteText: { marginLeft: 6, color: colors.muted, flex: 1 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  totalValue: { fontSize: 18, fontWeight: "800", color: colors.primary },

  actions: { flexDirection: "row", marginTop: 14 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    marginRight: 8,
  },
  btnMain: { borderColor: colors.primary, marginRight: 0 },
  btnDanger: { borderColor: colors.danger, flex: 0.6 },
  btnText: { marginLeft: 6, fontWeight: "700", fontSize: 13 },
});
