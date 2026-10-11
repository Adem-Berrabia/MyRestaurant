import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getStats } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { parseISO, DAY_NAMES } from "../../utils/dates";
import { colors, radius, shadow, formatPrice } from "../../theme";

const CHART_H = 130;

function SalesChart({ data }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const total = data.reduce((s, d) => s + d.total, 0);
  const orders = data.reduce((s, d) => s + d.count, 0);

  return (
    <View style={styles.box}>
      <View style={styles.chartHead}>
        <View>
          <Text style={styles.chartTotal}>{formatPrice(total)}</Text>
          <Text style={styles.chartSub}>{orders} commande(s) sur 7 jours</Text>
        </View>
      </View>
      <View style={styles.bars}>
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          const h = d.total > 0 ? Math.max(6, (d.total / max) * CHART_H) : 3;
          return (
            <View key={d.date} style={styles.barCol}>
              <Text style={styles.barValue}>
                {d.total > 0 ? Math.round(d.total) : ""}
              </Text>
              <View
                style={[
                  styles.bar,
                  { height: h },
                  isToday
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: "#F5B895" },
                  d.total === 0 && { backgroundColor: colors.border },
                ]}
              />
              <Text
                style={[
                  styles.barLabel,
                  isToday && { color: colors.primary, fontWeight: "800" },
                ]}
              >
                {isToday ? "Auj." : DAY_NAMES[parseISO(d.date).getDay()]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [s, setS] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setS(await getStats());
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const cards = s
    ? [
        {
          label: "Commandes aujourd'hui",
          value: s.ordersToday,
          icon: "receipt",
          color: "#1C64F2",
        },
        {
          label: "Revenu aujourd'hui",
          value: formatPrice(s.revenueToday),
          icon: "cash",
          color: colors.success,
        },
        {
          label: "En attente",
          value: s.pending,
          icon: "time",
          color: "#B7791F",
        },
        {
          label: "Revenu total",
          value: formatPrice(s.revenueTotal),
          icon: "trending-up",
          color: colors.primary,
        },
        {
          label: "Réservations",
          value: s.reservations,
          icon: "calendar",
          color: "#7C3AED",
        },
        {
          label: "Plats au menu",
          value: s.meals,
          icon: "restaurant",
          color: "#0E7490",
        },
      ]
    : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
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
    >
      <Text style={styles.hello}>Bonjour, {user?.nom} 👋</Text>
      <Text style={styles.sub}>Voici l'activité du restaurant.</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.grid}>
        {cards.map((c) => (
          <View key={c.label} style={styles.card}>
            <View style={[styles.icon, { backgroundColor: c.color + "22" }]}>
              <Ionicons name={c.icon} size={20} color={c.color} />
            </View>
            <Text style={styles.value}>{c.value}</Text>
            <Text style={styles.label}>{c.label}</Text>
          </View>
        ))}
      </View>

      {s && s.sales7 ? (
        <>
          <Text style={styles.section}>Ventes des 7 derniers jours</Text>
          <SalesChart data={s.sales7} />
        </>
      ) : null}

      <Text style={styles.section}>Top 5 des plats</Text>
      <View style={styles.box}>
        {s && s.topMeals.length === 0 ? (
          <Text style={styles.empty}>Aucune vente pour le moment.</Text>
        ) : null}
        {s &&
          s.topMeals.map((m, i) => (
            <View key={m.nom} style={styles.topRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Text style={styles.topName}>{m.nom}</Text>
              <Text style={styles.topQty}>{m.qty} vendus</Text>
            </View>
          ))}
      </View>

      <Text style={styles.section}>Accès rapide</Text>
      <View style={styles.box}>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate("AdminOrders")}
        >
          <Ionicons name="receipt-outline" size={20} color={colors.primary} />
          <Text style={styles.linkText}>
            Traiter les commandes ({s ? s.pending : 0} en attente)
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate("AdminUsers")}
        >
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={styles.linkText}>Utilisateurs ({s ? s.users : 0})</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hello: { fontSize: 24, fontWeight: "800", color: colors.text },
  sub: { color: colors.muted, marginTop: 2, marginBottom: 16 },
  error: { color: colors.danger, marginBottom: 10 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    ...shadow,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 10 },
  label: { color: colors.muted, fontSize: 13, marginTop: 2 },
  section: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 10,
    marginBottom: 10,
  },
  box: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 6,
    ...shadow,
  },
  empty: { color: colors.muted, padding: 12 },
  topRow: { flexDirection: "row", alignItems: "center", padding: 10 },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "800",
  },
  topName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  topQty: { color: colors.muted },
  link: { flexDirection: "row", alignItems: "center", padding: 14 },
  linkText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  chartHead: { padding: 10, paddingBottom: 4 },
  chartTotal: { fontSize: 22, fontWeight: "800", color: colors.text },
  chartSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barValue: { fontSize: 10, color: colors.muted, marginBottom: 3, height: 14 },
  bar: { width: 22, borderRadius: 6 },
  barLabel: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
    fontWeight: "600",
  },
});
