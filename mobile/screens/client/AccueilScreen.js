import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getMeals } from "../../services/api";
import { getUser } from "../../services/user";
import { imageUrl } from "../../utils/image";
import { colors, radius, shadow, formatPrice } from "../../theme";

const ACTIONS = [
  { label: "Réserver", icon: "calendar", target: "Reservation" },
  { label: "Commandes", icon: "receipt", target: "Historique" },
  { label: "Assistant", icon: "chatbubbles", target: "Chatbot" },
];

export default function AccueilScreen({ navigation }) {
  const [user, setUser] = useState("Invité");
  const [meals, setMeals] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setUser(await getUser());
        try {
          setMeals((await getMeals()).slice(0, 8));
        } catch (e) {}
      })();
    }, []),
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.hello}>Bonjour, {user} 👋</Text>
        <Text style={styles.title}>
          Que souhaitez-vous{"\n"}manger aujourd'hui ?
        </Text>
        <TouchableOpacity
          style={styles.heroBtn}
          onPress={() => navigation.navigate("Menu")}
        >
          <Text style={styles.heroBtnText}>Voir le menu</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.action}
            onPress={() => navigation.navigate(a.target)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={a.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Plats populaires</Text>
      <FlatList
        horizontal
        data={meals}
        keyExtractor={(m) => m._id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun plat pour le moment.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("DetailPlat", { id: item._id })}
          >
            {item.image ? (
              <Image
                source={{ uri: imageUrl(item.image) }}
                style={styles.cardImg}
              />
            ) : (
              <View style={[styles.cardImg, styles.ph]}>
                <Ionicons
                  name="restaurant-outline"
                  size={34}
                  color={colors.muted}
                />
              </View>
            )}
            <Text style={styles.cardName} numberOfLines={1}>
              {item.nom}
            </Text>
            <Text style={styles.cardPrice}>{formatPrice(item.prix)}</Text>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 34,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  hello: { color: "#FFD8C2", fontSize: 15, fontWeight: "600" },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 6,
    lineHeight: 34,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.pill,
    marginTop: 18,
  },
  heroBtnText: { color: colors.primary, fontWeight: "800", marginRight: 6 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    marginTop: -4,
  },
  action: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginHorizontal: 4,
    alignItems: "center",
    ...shadow,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionText: { fontSize: 12, fontWeight: "700", color: colors.text },
  section: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    width: 160,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 10,
    marginRight: 12,
    ...shadow,
  },
  cardImg: {
    width: "100%",
    height: 110,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  ph: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: 15, fontWeight: "700", color: colors.text },
  cardPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 2,
  },
  empty: { color: colors.muted },
});
