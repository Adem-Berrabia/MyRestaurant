import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getUsers, setUserRole } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { colors, radius, shadow } from "../../theme";

export default function AdminUsersScreen() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setUsers(await getUsers());
    } catch (e) {
      Alert.alert("Erreur", e.message);
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

  const toggle = (u) => {
    const next = u.role === "admin" ? "client" : "admin";
    Alert.alert(
      "Changer le rôle",
      `${u.nom} deviendra ${next === "admin" ? "administrateur" : "client"}.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              const updated = await setUserRole(u._id, next);
              setUsers((prev) =>
                prev.map((x) => (x._id === updated._id ? updated : x)),
              );
            } catch (e) {
              Alert.alert("Erreur", e.message);
            }
          },
        },
      ],
    );
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
      contentContainerStyle={{ padding: 16 }}
      data={users}
      keyExtractor={(u) => u._id}
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
      renderItem={({ item }) => {
        const isMe = String(item._id) === String(me?.id);
        const isAdmin = item.role === "admin";
        return (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.initial}>
                {item.nom.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>
                {item.nom}
                {isMe ? " (vous)" : ""}
              </Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={[styles.role, isAdmin && styles.roleAdmin]}>
                <Text style={[styles.roleText, isAdmin && { color: "#fff" }]}>
                  {isAdmin ? "Administrateur" : "Client"}
                </Text>
              </View>
            </View>
            {!isMe ? (
              <TouchableOpacity style={styles.btn} onPress={() => toggle(item)}>
                <Text style={styles.btnText}>
                  {isAdmin ? "Rétrograder" : "Promouvoir"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    ...shadow,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: "#fff", fontWeight: "800", fontSize: 20 },
  name: { fontSize: 16, fontWeight: "800", color: colors.text },
  email: { color: colors.muted, fontSize: 13, marginTop: 1 },
  role: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  roleAdmin: { backgroundColor: colors.primary },
  roleText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  btn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  btnText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
});
