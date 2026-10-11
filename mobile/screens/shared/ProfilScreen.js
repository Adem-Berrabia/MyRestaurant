import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getOrders, getReservations } from "../../services/api";
import { colors, radius, shadow } from "../../theme";

export default function ProfilScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { count, clearCart } = useCart();
  const isAdmin = user?.role === "admin";
  const [nbOrders, setNbOrders] = useState(0);
  const [nbRes, setNbRes] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) return;
      (async () => {
        try {
          setNbOrders((await getOrders()).length);
          setNbRes((await getReservations()).length);
        } catch (e) {}
      })();
    }, [isAdmin]),
  );

  const confirmLogout = () =>
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: () => {
          clearCart();
          logout();
        },
      },
    ]);

  const Row = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
    >
      <View style={styles.avatar}>
        <Text style={styles.initial}>
          {(user?.nom || "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.name}>{user?.nom}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <View
        style={[
          styles.roleBadge,
          isAdmin && { backgroundColor: colors.primary },
        ]}
      >
        <Text style={[styles.roleText, isAdmin && { color: "#fff" }]}>
          {isAdmin ? "Administrateur" : "Client"}
        </Text>
      </View>

      {!isAdmin ? (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{nbOrders}</Text>
              <Text style={styles.statLabel}>Commandes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{nbRes}</Text>
              <Text style={styles.statLabel}>Réservations</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{count}</Text>
              <Text style={styles.statLabel}>Dans le panier</Text>
            </View>
          </View>

          <View style={styles.list}>
            <Row
              icon="receipt-outline"
              label="Mes commandes"
              onPress={() => navigation.navigate("Historique")}
            />
            <Row
              icon="calendar-outline"
              label="Mes réservations"
              onPress={() => navigation.navigate("Reservation")}
            />
          </View>
        </>
      ) : (
        <View style={[styles.list, { marginTop: 22 }]}>
          <Row
            icon="people-outline"
            label="Gérer les utilisateurs"
            onPress={() => navigation.navigate("AdminUsers")}
          />
        </View>
      )}

      <Text style={styles.group}>Compte</Text>
      <View style={styles.list}>
        <Row
          icon="person-circle-outline"
          label="Modifier mon profil"
          onPress={() => navigation.navigate("EditProfile")}
        />
        <Row
          icon="key-outline"
          label="Changer le mot de passe"
          onPress={() => navigation.navigate("ChangePassword")}
        />
      </View>

      <TouchableOpacity style={styles.logout} onPress={confirmLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  avatar: {
    alignSelf: "center",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  initial: { color: "#fff", fontSize: 40, fontWeight: "800" },
  name: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginTop: 10,
  },
  email: { textAlign: "center", color: colors.muted, marginTop: 2 },
  roleBadge: {
    alignSelf: "center",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  roleText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  stats: { flexDirection: "row", marginVertical: 20 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 12,
    marginHorizontal: 4,
    alignItems: "center",
    ...shadow,
  },
  statNum: { fontSize: 22, fontWeight: "800", color: colors.primary },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  group: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.muted,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  list: { backgroundColor: colors.card, borderRadius: radius.lg, ...shadow },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    padding: 14,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  logoutText: {
    marginLeft: 8,
    color: colors.danger,
    fontWeight: "800",
    fontSize: 16,
  },
});
