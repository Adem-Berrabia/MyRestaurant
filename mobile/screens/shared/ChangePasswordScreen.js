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
import { changePasswordRequest } from "../../services/api";
import { colors, radius } from "../../theme";

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!current)
      return Alert.alert("Champ requis", "Entrez votre mot de passe actuel.");
    if (next.length < 6 || next.length > 72) {
      return Alert.alert(
        "Mot de passe invalide",
        "Le nouveau mot de passe doit avoir 6 à 72 caractères.",
      );
    }
    if (next !== confirm) {
      return Alert.alert(
        "Non identiques",
        "La confirmation ne correspond pas.",
      );
    }
    try {
      setBusy(true);
      await changePasswordRequest(current, next);
      Alert.alert(
        "Mot de passe modifié ✅",
        "Utilisez-le à votre prochaine connexion.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setBusy(false);
    }
  };

  const Field = ({ label, value, onChange }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.field}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={72}
        />
      </View>
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {Field({
        label: "Mot de passe actuel",
        value: current,
        onChange: setCurrent,
      })}
      {Field({ label: "Nouveau mot de passe", value: next, onChange: setNext })}
      {Field({
        label: "Confirmer le nouveau mot de passe",
        value: confirm,
        onChange: setConfirm,
      })}

      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setShow((s) => !s)}
      >
        <Ionicons
          name={show ? "eye-off-outline" : "eye-outline"}
          size={18}
          color={colors.primary}
        />
        <Text style={styles.toggleText}>
          {show ? "Masquer" : "Afficher"} les mots de passe
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, busy && { opacity: 0.6 }]}
        disabled={busy}
        onPress={submit}
      >
        <Text style={styles.buttonText}>
          {busy ? "Modification..." : "Modifier le mot de passe"}
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
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: colors.text },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginLeft: 6,
  },
  toggleText: { marginLeft: 6, color: colors.primary, fontWeight: "700" },
  button: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
