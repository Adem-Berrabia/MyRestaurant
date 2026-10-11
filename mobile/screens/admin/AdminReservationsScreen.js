import React, { useState, useCallback } from "react";
import {
  View,
  Text,
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
import { getAdminReservations, deleteReservation } from "../../services/api";
import { formatLong, toISO } from "../../utils/dates";
import { colors, radius, shadow } from "../../theme";

const FILTERS = ["Toutes", "Aujourd'hui", "À venir", "Annulées"];

export default function AdminReservationsScreen() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("À venir");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setList(await getAdminReservations());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const today = toISO(new Date());
  const cancelled = (r) => r.statut === "annulée";
  const data = list
    .filter((r) => {
      if (filter === "Aujourd'hui") return r.date === today && !cancelled(r);
      if (filter === "À venir") return r.date >= today && !cancelled(r);
      if (filter === "Annulées") return cancelled(r);
      return true;
    })
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));

  const confirmDelete = (r) =>
    Alert.alert("Supprimer", `Supprimer la réservation de ${r.utilisateur} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReservation(r._id);
            setList((prev) => prev.filter((x) => x._id !== r._id));
          } catch (e) {
            Alert.alert("Erreur", e.message);
          }
        },
      },
    ]);

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
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.chipText, active && { color: "#fff" }]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={data}
        keyExtractor={(r) => r._id}
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
            <Ionicons name="calendar-outline" size={52} color={colors.muted} />
            <Text style={styles.emptyText}>
              {error || "Aucune réservation."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, cancelled(item) && { opacity: 0.6 }]}>
            <View style={styles.iconBox}>
              <Ionicons name="calendar" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{item.utilisateur}</Text>
              <Text style={styles.when}>
                {formatLong(item.date)} à {item.heure}
              </Text>
              <Text style={styles.people}>
                {item.nombrePersonnes} personne(s) ·{" "}
                {item.statut || "confirmée"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
  chipText: { fontWeight: "600", color: colors.text },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: { marginTop: 10, color: colors.muted, fontSize: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    ...shadow,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 16, fontWeight: "800", color: colors.text },
  when: { fontSize: 15, color: colors.text, marginTop: 2 },
  people: { color: colors.muted, marginTop: 2, textTransform: "capitalize" },
});
