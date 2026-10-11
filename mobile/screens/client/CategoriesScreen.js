import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { getCategories } from "../../services/api";

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 30 }} />;

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={categories}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("Menu", { categorie: item })}
        >
          <Text style={styles.text}>{item}</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: "center" }}>Aucune catégorie.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  text: { fontSize: 18, fontWeight: "600" },
  arrow: { fontSize: 24, color: "#999" },
});
