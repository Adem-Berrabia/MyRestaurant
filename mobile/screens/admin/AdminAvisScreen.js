import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getAdminAvis } from "../../services/api";
import { colors, radius, shadow } from "../../theme";

function Stars({ value, size = 14 }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= value ? "star" : "star-outline"}
          size={size}
          color="#F5A623"
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

export default function AdminAvisScreen() {
  const [avis, setAvis] = useState(null);

  useFocusEffect(
    useCallback(() => {
      getAdminAvis()
        .then(setAvis)
        .catch(() => setAvis([]));
    }, []),
  );

  if (avis === null) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={{ marginTop: 40 }}
      />
    );
  }

  const avg = avis.length
    ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1)
    : "–";

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryNum}>{avis.length}</Text>
        <Text style={styles.summaryLabel}>avis au total</Text>
        <View
          style={{ width: 1, height: 36, backgroundColor: colors.border }}
        />
        <Text style={styles.summaryNum}>{avg}</Text>
        <Text style={styles.summaryLabel}>note moyenne</Text>
      </View>

      <FlatList
        data={avis}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun avis pour le moment.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.mealName} numberOfLines={1}>
                {item.mealNom}
              </Text>
              <Stars value={item.note} />
            </View>
            <Text style={styles.user}>
              {item.nomUser} · {new Date(item.date).toLocaleDateString("fr-FR")}
            </Text>
            {item.commentaire ? (
              <Text style={styles.comment}>{item.commentaire}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: colors.card,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryNum: { fontSize: 22, fontWeight: "800", color: colors.text },
  summaryLabel: { fontSize: 12, color: colors.muted, marginRight: 4 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 30 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealName: { fontSize: 15, fontWeight: "800", color: colors.text, flex: 1 },
  user: { fontSize: 12, color: colors.muted, marginTop: 4 },
  comment: {
    fontSize: 13,
    color: colors.text,
    marginTop: 8,
    lineHeight: 18,
  },
});
