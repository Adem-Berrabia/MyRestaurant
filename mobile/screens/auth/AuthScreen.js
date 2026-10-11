import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { colors, radius } from "../../theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  const submit = async () => {
    if (isRegister && nom.trim().length < 2) {
      return Alert.alert(
        "Nom invalide",
        "Entrez votre nom (2 caractères minimum).",
      );
    }
    if (!EMAIL_RE.test(email.trim())) {
      return Alert.alert("Email invalide", "Entrez une adresse email valide.");
    }
    if (password.length < 6) {
      return Alert.alert("Mot de passe trop court", "6 caractères minimum.");
    }
    try {
      setBusy(true);
      if (isRegister) await register(nom.trim(), email.trim(), password);
      else await login(email.trim(), password);
      // on success this screen disappears (user is now set)
    } catch (e) {
      Alert.alert("Erreur", String(e.message || e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.wrap}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <Ionicons name="restaurant" size={40} color="#fff" />
        </View>
        <Text style={styles.brand}>MyRestaurant</Text>
        <Text style={styles.sub}>
          {isRegister ? "Créez votre compte" : "Connectez-vous pour commander"}
        </Text>

        {isRegister ? (
          <View style={styles.field}>
            <Ionicons name="person-outline" size={20} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              placeholderTextColor={colors.muted}
              value={nom}
              onChangeText={setNom}
            />
          </View>
        ) : null}

        <View style={styles.field}>
          <Ionicons name="mail-outline" size={20} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!show}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShow((s) => !s)} hitSlop={8}>
            <Ionicons
              name={show ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, busy && { opacity: 0.6 }]}
          disabled={busy}
          onPress={submit}
        >
          <Text style={styles.buttonText}>
            {busy
              ? "Veuillez patienter..."
              : isRegister
                ? "S'inscrire"
                : "Se connecter"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switch}
          onPress={() => setMode(isRegister ? "login" : "register")}
        >
          <Text style={styles.switchText}>
            {isRegister ? "Déjà un compte ? " : "Pas de compte ? "}
            <Text style={styles.switchLink}>
              {isRegister ? "Se connecter" : "S'inscrire"}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: {
    alignSelf: "center",
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginTop: 14,
  },
  sub: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 4,
    marginBottom: 28,
    fontSize: 15,
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
    marginBottom: 12,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: colors.text },
  button: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  switch: { alignItems: "center", marginTop: 22 },
  switchText: { color: colors.muted, fontSize: 15 },
  switchLink: { color: colors.primary, fontWeight: "800" },
});
