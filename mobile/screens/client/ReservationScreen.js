import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  getAvailability,
  createReservation,
  getReservations,
  cancelReservation,
} from "../../services/api";
import { nextDays, toISO, formatLong, DAY_NAMES } from "../../utils/dates";
import { colors, radius, shadow } from "../../theme";

const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export default function ReservationScreen() {
  const [days] = useState(() => nextDays(14));
  const [date, setDate] = useState(toISO(new Date()));
  const [info, setInfo] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [heure, setHeure] = useState(null);
  const [personnes, setPersonnes] = useState(2);
  const [sending, setSending] = useState(false);
  const [list, setList] = useState([]);

  const loadSlots = useCallback(async (d) => {
    setLoadingSlots(true);
    try {
      setInfo(await getAvailability(d));
    } catch (e) {
      setInfo(null);
      Alert.alert("Erreur", e.message);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      setList(await getReservations());
    } catch (e) {}
  }, []);

  useEffect(() => {
    setHeure(null);
    loadSlots(date);
  }, [date, loadSlots]);

  useFocusEffect(
    useCallback(() => {
      loadList();
    }, [loadList]),
  );

  const selected = info ? info.slots.find((s) => s.heure === heure) : null;
  const maxPeople =
    selected && info ? Math.min(info.maxParty, selected.left) : 1;

  const pickSlot = (slot) => {
    if (slot.left < 1) return;
    setHeure(slot.heure);
    setPersonnes((p) =>
      Math.max(1, Math.min(p, Math.min(info.maxParty, slot.left))),
    );
  };

  const submit = async () => {
    if (!heure) return Alert.alert("Créneau requis", "Choisissez une heure.");
    try {
      setSending(true);
      await createReservation({ date, heure, nombrePersonnes: personnes });
      Alert.alert(
        "Réservation confirmée ✅",
        `${formatLong(date)} à ${heure}\n${personnes} personne(s)`,
      );
      setHeure(null);
      setPersonnes(2);
      loadSlots(date);
      loadList();
    } catch (e) {
      Alert.alert("Réservation impossible", e.message);
      loadSlots(date); // availability may have changed
    } finally {
      setSending(false);
    }
  };

  const confirmCancel = (r) =>
    Alert.alert(
      "Annuler la réservation",
      `${formatLong(r.date)} à ${r.heure} ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelReservation(r._id);
              loadList();
              loadSlots(date);
            } catch (e) {
              Alert.alert("Erreur", e.message);
            }
          },
        },
      ],
    );

  const todayStr = toISO(new Date());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text style={styles.h}>1. Choisissez le jour</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 6 }}
      >
        {days.map((d) => {
          const s = toISO(d);
          const active = s === date;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.day, active && styles.dayActive]}
              onPress={() => setDate(s)}
            >
              <Text style={[styles.dayName, active && { color: "#fff" }]}>
                {s === todayStr ? "Auj." : DAY_NAMES[d.getDay()]}
              </Text>
              <Text style={[styles.dayNum, active && { color: "#fff" }]}>
                {d.getDate()}
              </Text>
              <Text style={[styles.dayMonth, active && { color: "#FFD8C2" }]}>
                {MONTHS_SHORT[d.getMonth()]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.h}>2. Choisissez l'heure</Text>
      {loadingSlots ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginVertical: 20 }}
        />
      ) : info ? (
        <View style={styles.slots}>
          {info.slots.map((s) => {
            const disabled = s.left < 1;
            const active = s.heure === heure;
            return (
              <TouchableOpacity
                key={s.heure}
                disabled={disabled}
                style={[
                  styles.slot,
                  disabled && styles.slotOff,
                  active && styles.slotActive,
                ]}
                onPress={() => pickSlot(s)}
              >
                <Text
                  style={[
                    styles.slotText,
                    disabled && { color: colors.muted },
                    active && { color: "#fff" },
                  ]}
                >
                  {s.heure}
                </Text>
                <Text style={[styles.slotSub, active && { color: "#FFD8C2" }]}>
                  {s.past ? "passé" : disabled ? "complet" : `${s.left} places`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Text style={styles.muted}>Impossible de charger les créneaux.</Text>
      )}

      <Text style={styles.h}>3. Nombre de personnes</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => setPersonnes((p) => Math.max(1, p - 1))}
        >
          <Ionicons name="remove" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.count}>{personnes}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => setPersonnes((p) => Math.min(maxPeople, p + 1))}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
        {selected ? <Text style={styles.limit}>max {maxPeople}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.button, (!heure || sending) && { opacity: 0.5 }]}
        disabled={!heure || sending}
        onPress={submit}
      >
        <Text style={styles.buttonText}>
          {sending
            ? "Envoi..."
            : heure
              ? `Réserver · ${formatLong(date)} à ${heure}`
              : "Choisissez un créneau"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.section}>Mes réservations</Text>
      {list.length === 0 ? (
        <Text style={styles.muted}>Aucune réservation.</Text>
      ) : (
        list.map((r) => {
          const cancelled = r.statut === "annulée";
          const upcoming = r.date >= todayStr;
          return (
            <View
              key={r._id}
              style={[styles.card, cancelled && { opacity: 0.6 }]}
            >
              <View style={styles.iconBox}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardMain}>
                  {formatLong(r.date)} à {r.heure}
                </Text>
                <Text style={styles.cardSub}>
                  {r.nombrePersonnes} personne(s)
                </Text>
                <View
                  style={[
                    styles.badge,
                    cancelled ? styles.badgeOff : styles.badgeOn,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: cancelled ? colors.danger : colors.success },
                    ]}
                  >
                    {r.statut || "confirmée"}
                  </Text>
                </View>
              </View>
              {!cancelled && upcoming ? (
                <TouchableOpacity onPress={() => confirmCancel(r)} hitSlop={8}>
                  <Ionicons
                    name="close-circle-outline"
                    size={26}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  h: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginTop: 14,
    marginBottom: 10,
  },
  muted: { color: colors.muted },
  day: {
    width: 62,
    alignItems: "center",
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayName: { fontSize: 12, fontWeight: "700", color: colors.muted },
  dayNum: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginVertical: 2,
  },
  dayMonth: { fontSize: 11, color: colors.muted },
  slots: { flexDirection: "row", flexWrap: "wrap" },
  slot: {
    width: "23%",
    marginRight: "2%",
    marginBottom: 10,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotOff: { backgroundColor: colors.bg, borderStyle: "dashed" },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 15, fontWeight: "800", color: colors.text },
  slotSub: { fontSize: 10, color: colors.muted, marginTop: 1 },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    marginHorizontal: 24,
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  limit: { color: colors.muted, marginLeft: 6 },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.pill,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  section: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 30,
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMain: { fontSize: 15, fontWeight: "800", color: colors.text },
  cardSub: { color: colors.muted, marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  badgeOn: { backgroundColor: "#DDF5E3" },
  badgeOff: { backgroundColor: "#FDE2E2" },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
});
