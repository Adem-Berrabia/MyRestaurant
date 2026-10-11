import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { colors, radius } from "../../theme";

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const [nom, setNom] = useState(user?.nom || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const clean = nom.trim();
    if (clean.length < 2 || clean.length > 50) {
      return Alert.alert("Nom invalide", "Entre 2 et 50 caractères.");
    }
    try {
      setBusy(true);
      await updateProfile(clean);
      Alert.alert("Profil mis à jour ✅", "Votre nom a été modifié.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Nom complet</Text>
      <View style={styles.field}>
        <Ionicons name="person-outline" size={20} color={colors.muted} />
        <TextInput
          style={styles.input}
          value={nom}
          onChangeText={setNom}
          maxLength={50}
        />
      </View>

      <Text style={styles.label}>Email</Text>
      <View style={[styles.field, styles.fieldOff]}>
        <Ionicons name="mail-outline" size={20} color={colors.muted} />
        <Text style={[styles.input, { color: colors.muted }]}>
          {user?.email}
        </Text>
        <Ionicons name="lock-closed" size={16} color={colors.muted} />
      </View>
      <Text style={styles.hint}>L'email ne peut pas être modifié.</Text>

      <TouchableOpacity
        style={[styles.button, busy && { opacity: 0.6 }]}
        disabled={busy}
        onPress={save}
      >
        <Text style={styles.buttonText}>
          {busy ? "Enregistrement..." : "Enregistrer"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 52,
  },
  fieldOff: { backgroundColor: colors.bg },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: colors.text },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6, marginLeft: 8 },
  button: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
