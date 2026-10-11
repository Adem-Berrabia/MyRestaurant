import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { answer } from "../../utils/chatbot";
import { imageUrl } from "../../utils/image";
import { colors, radius, shadow, formatPrice } from "../../theme";
import { getMeals, chatRequest } from "../../services/api";

const QUICK = [
  "Que me conseillez-vous ?",
  "Un plat végétarien",
  "Pas cher",
  "Allergie au gluten",
  "Intoxication alimentaire",
  "Œuf cru",
  "Je suis enceinte",
  "Hygiène",
];

export default function ChatbotScreen({ navigation }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const idRef = useRef(1);
  const scrollRef = useRef(null);
  const [meals, setMeals] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [added, setAdded] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      text: `Bonjour ${user?.nom || ""} ! Je suis l'assistant MyRestaurant 🍽️\n\nJe peux vous conseiller un plat, vous aider avec les allergènes et répondre à vos questions sur la sécurité alimentaire.`,
    },
  ]);

  useFocusEffect(
    useCallback(() => {
      getMeals()
        .then(setMeals)
        .catch(() => {});
    }, []),
  );

  const push = (m) =>
    setMessages((prev) => [...prev, { id: ++idRef.current, ...m }]);

  const send = (value) => {
    const text = String(value !== undefined ? value : input).trim();
    if (!text || typing) return;
    setInput("");
    push({ from: "user", text });
    setTyping(true);

    const r = answer(text, meals);

    // rules understood (including all safety answers): keep them
    if (!r.unknown) {
      setTimeout(() => {
        push({ from: "bot", text: r.text, meals: r.meals });
        setTyping(false);
      }, 450);
      return;
    }

    // rules did not understand: ask the local AI, fall back to the rule answer
    chatRequest(text)
      .then((ai) => {
        const shown = (ai.mealIds || [])
          .map((id) => meals.find((m) => m._id === id))
          .filter(Boolean);
        push({ from: "bot", text: ai.text, meals: shown });
      })
      .catch(() => push({ from: "bot", text: r.text }))
      .finally(() => setTyping(false));
  };

  const add = (meal) => {
    addToCart(meal, 1);
    setAdded((prev) => [...prev, meal._id]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.banner}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.muted}
        />
        <Text style={styles.bannerText}>
          Conseils généraux, sans valeur médicale. Allergie sévère : prévenez
          toujours le personnel.
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[styles.row, m.from === "user" && styles.rowUser]}
          >
            {m.from === "bot" ? (
              <View style={styles.avatar}>
                <Ionicons name="restaurant" size={16} color="#fff" />
              </View>
            ) : null}

            <View style={{ maxWidth: "82%" }}>
              <View
                style={[
                  styles.bubble,
                  m.from === "user" ? styles.bubbleUser : styles.bubbleBot,
                ]}
              >
                <Text
                  style={[styles.text, m.from === "user" && { color: "#fff" }]}
                >
                  {m.text}
                </Text>
              </View>

              {m.meals && m.meals.length ? (
                <View style={{ marginTop: 6 }}>
                  {m.meals.map((meal) => {
                    const done = added.includes(meal._id);
                    return (
                      <TouchableOpacity
                        key={meal._id}
                        style={styles.card}
                        activeOpacity={0.85}
                        onPress={() =>
                          navigation.navigate("DetailPlat", { id: meal._id })
                        }
                      >
                        {meal.image ? (
                          <Image
                            source={{ uri: imageUrl(meal.image) }}
                            style={styles.thumb}
                          />
                        ) : (
                          <View style={[styles.thumb, styles.thumbPh]}>
                            <Ionicons
                              name="restaurant-outline"
                              size={20}
                              color={colors.muted}
                            />
                          </View>
                        )}
                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                          <Text style={styles.cardName} numberOfLines={1}>
                            {meal.nom}
                          </Text>
                          <Text style={styles.cardCat} numberOfLines={1}>
                            {meal.categorie}
                          </Text>
                          <Text style={styles.cardPrice}>
                            {formatPrice(meal.prix)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.addBtn,
                            done && { backgroundColor: colors.success },
                          ]}
                          onPress={() => add(meal)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={done ? "checkmark" : "add"}
                            size={20}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        ))}

        {typing ? (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Ionicons name="restaurant" size={16} color="#fff" />
            </View>
            <View style={[styles.bubble, styles.bubbleBot]}>
              <Text style={[styles.text, { color: colors.muted }]}>
                En train d'écrire...
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.chip}
              onPress={() => send(q)}
            >
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Posez votre question..."
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.send, (!input.trim() || typing) && { opacity: 0.5 }]}
          disabled={!input.trim() || typing}
          onPress={() => send()}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bannerText: { flex: 1, marginLeft: 6, fontSize: 12, color: colors.muted },

  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  rowUser: { justifyContent: "flex-end" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  bubbleBot: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 4,
    ...shadow,
  },
  bubbleUser: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  text: { fontSize: 15, lineHeight: 21, color: colors.text },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 8,
    marginBottom: 6,
    ...shadow,
  },
  thumb: { width: 54, height: 54, borderRadius: radius.sm },
  thumbPh: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: 15, fontWeight: "800", color: colors.text },
  cardCat: { fontSize: 12, color: colors.muted },
  cardPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 1,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
  },
  chipText: { color: colors.primary, fontWeight: "700", fontSize: 13 },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    height: 44,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
