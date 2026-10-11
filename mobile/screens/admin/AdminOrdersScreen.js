import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getAdminOrders, setOrderStatus } from "../../services/api";
import { colors, radius, shadow, formatPrice, statusStyle } from "../../theme";

const STATUSES = Object.keys(statusStyle);

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("Toutes");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setOrders(await getAdminOrders());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load on focus, then refresh every 15 s while the screen is visible
  useFocusEffect(
    useCallback(() => {
      load();
      const t = setInterval(load, 15000);
      return () => clearInterval(t);
    }, []),
  );

  const apply = async (order, statut) => {
    try {
      const updated = await setOrderStatus(order._id, statut);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
    } catch (e) {
      Alert.alert("Erreur", e.message);
    }
  };

  const change = (order, statut) => {
    if (order.statut === statut) return;
    if (statut === "annulée") {
      Alert.alert("Annuler la commande", "Confirmer l'annulation ?", [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => apply(order, statut),
        },
      ]);
    } else {
      apply(order, statut);
    }
  };

  const counts = { Toutes: orders.length };
  STATUSES.forEach(
    (s) => (counts[s] = orders.filter((o) => o.statut === s).length),
  );

  const q = query.trim().toLowerCase().replace("#", "");
  const matches = (o) =>
    !q ||
    o._id.slice(-5).toLowerCase().includes(q) ||
    String(o.utilisateur || "")
      .toLowerCase()
      .includes(q) ||
    String(o.table || "").toLowerCase() === q ||
    o.produits.some((p) => String(p.nom).toLowerCase().includes(q));

  const data = orders.filter(
    (o) => (filter === "Toutes" || o.statut === filter) && matches(o),
  );

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
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Client, n° de commande, table, plat..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery("")}>
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
          {["Toutes", ...STATUSES].map((s) => {
            const active = filter === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(s)}
              >
                <Text style={[styles.chipText, active && { color: "#fff" }]}>
                  {s} ({counts[s]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={data}
        keyExtractor={(o) => o._id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: 4, flexGrow: 1 }}
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
            <Text style={styles.emptyText}>{error || "Aucune commande."}</Text>
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

              <View style={styles.meta}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.muted}
                />
                <Text style={styles.metaText}>{item.utilisateur}</Text>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.muted}
                  style={{ marginLeft: 14 }}
                />
                <Text style={styles.metaText}>{where}</Text>
              </View>

              <View style={styles.divider} />
              {item.produits.map((p, i) => (
                <View key={i} style={styles.line}>
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

              <Text style={styles.actionsTitle}>Changer le statut</Text>
              <View style={styles.actions}>
                {STATUSES.map((s) => {
                  const active = item.statut === s;
                  const c = statusStyle[s];
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.action,
                        { borderColor: c.fg },
                        active && { backgroundColor: c.fg },
                      ]}
                      onPress={() => change(item, s)}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          { color: active ? "#fff" : c.fg },
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }}
      />
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
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.text },
  chips: { paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    fontWeight: "600",
    color: colors.text,
    textTransform: "capitalize",
  },
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
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
  },
  metaText: { marginLeft: 5, color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  lineName: { flex: 1, fontSize: 15, color: colors.text },
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
  actionsTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: colors.muted,
    fontWeight: "700",
    fontSize: 13,
  },
  actions: { flexDirection: "row", flexWrap: "wrap" },
  action: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  actionText: { fontWeight: "700", fontSize: 12, textTransform: "capitalize" },
});
