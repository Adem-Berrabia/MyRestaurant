import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  setMealAvailability,
} from "../../services/api";
import { imageUrl } from "../../utils/image";
import { ALLERGENS } from "../../utils/allergens";
import { colors, radius } from "../../theme";

// Convert a picker result into { uri, base64, ext }
const toImage = (asset) => {
  let ext = (asset.mimeType || "image/jpeg").split("/")[1] || "jpg";
  if (ext === "jpeg") ext = "jpg";
  return { uri: asset.uri, base64: asset.base64, ext };
};

export default function GestionMenuScreen() {
  const [meals, setMeals] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState("");
  const [prix, setPrix] = useState("");
  const [allergenes, setAllergenes] = useState(null); // null = non renseigné, [] = aucun
  const [vegetarien, setVegetarien] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [saving, setSaving] = useState(false);

  const loadMeals = async () => {
    try {
      setMeals(await getMeals());
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger les plats.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, []),
  );

  const resetForm = () => {
    setEditingId(null);
    setNom("");
    setDescription("");
    setCategorie("");
    setPrix("");
    setAllergenes(null);
    setVegetarien(false);
    setLocalImage(null);
    setCurrentImage("");
  };

  const toggleAllergen = (key) =>
    setAllergenes((prev) => {
      const a = prev || [];
      return a.includes(key) ? a.filter((x) => x !== key) : [...a, key];
    });

  // ---- Native feature: camera / gallery ----
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à la caméra.",
      );
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled) setLocalImage(toImage(result.assets[0]));
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert(
        "Permission refusée",
        "Autorisez l'accès à la galerie.",
      );
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled) setLocalImage(toImage(result.assets[0]));
  };

  const chooseImage = () =>
    Alert.alert("Image du plat", "Choisir la source", [
      { text: "Caméra", onPress: takePhoto },
      { text: "Galerie", onPress: pickFromGallery },
      { text: "Annuler", style: "cancel" },
    ]);

  const save = async () => {
    const price = parseFloat(String(prix).replace(",", "."));
    if (!nom.trim() || !categorie.trim() || isNaN(price) || price <= 0) {
      return Alert.alert(
        "Champs invalides",
        "Nom, catégorie et prix (> 0) sont obligatoires.",
      );
    }
    const meal = {
      nom: nom.trim(),
      description: description.trim(),
      categorie: categorie.trim(),
      prix: price,
      vegetarien,
    };
    if (allergenes !== null) meal.allergenes = allergenes; // only sent when filled in
    try {
      setSaving(true);
      if (editingId) {
        await updateMeal(editingId, meal, localImage);
      } else {
        await createMeal(meal, localImage);
      }
      Alert.alert("Succès ✅", editingId ? "Plat modifié." : "Plat ajouté.");
      resetForm();
      loadMeals();
    } catch (e) {
      Alert.alert("Erreur", String(e.message || e));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m._id);
    setNom(m.nom);
    setDescription(m.description || "");
    setCategorie(m.categorie);
    setPrix(String(m.prix));
    setAllergenes(Array.isArray(m.allergenes) ? m.allergenes : null);
    setVegetarien(m.vegetarien === true);
    setLocalImage(null);
    setCurrentImage(m.image || "");
  };

  const toggleAvailability = async (m) => {
    const next = m.disponible === false;
    try {
      const updated = await setMealAvailability(m._id, next);
      setMeals((prev) =>
        prev.map((x) => (x._id === updated._id ? updated : x)),
      );
    } catch (e) {
      Alert.alert("Erreur", e.message);
    }
  };

  const confirmDelete = (m) =>
    Alert.alert("Supprimer", `Supprimer ${m.nom} du menu ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMeal(m._id);
            if (editingId === m._id) resetForm();
            loadMeals();
          } catch (e) {
            Alert.alert("Erreur", "Suppression impossible.");
          }
        },
      },
    ]);

  const previewUri = localImage
    ? localImage.uri
    : currentImage
      ? imageUrl(currentImage)
      : null;

  const Chip = ({ label, active, onPress, color }) => (
    <TouchableOpacity
      style={[
        styles.chip,
        active && {
          backgroundColor: color || colors.primary,
          borderColor: color || colors.primary,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && { color: "#fff" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {editingId ? "Modifier un plat" : "Ajouter un plat"}
      </Text>

      <TouchableOpacity style={styles.imageBox} onPress={chooseImage}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.preview} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={34} color={colors.muted} />
            <Text style={styles.imageHint}>
              Ajouter une image{"\n"}(caméra ou galerie)
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Nom du plat"
        value={nom}
        onChangeText={setNom}
      />
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Catégorie (ex : Pizza)"
        value={categorie}
        onChangeText={setCategorie}
      />
      <TextInput
        style={styles.input}
        placeholder="Prix en DT (ex : 12.5)"
        value={prix}
        onChangeText={setPrix}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Allergènes</Text>
      <Text style={styles.hint}>
        {allergenes === null
          ? "Non renseigné : l'assistant dira de demander au personnel."
          : allergenes.length === 0
            ? "Aucun allergène déclaré pour ce plat."
            : `${allergenes.length} allergène(s) déclaré(s).`}
      </Text>
      <View style={styles.chips}>
        <Chip
          label="Non renseigné"
          active={allergenes === null}
          color={colors.muted}
          onPress={() => setAllergenes(null)}
        />
        <Chip
          label="Aucun"
          active={Array.isArray(allergenes) && allergenes.length === 0}
          color={colors.success}
          onPress={() => setAllergenes([])}
        />
        {ALLERGENS.map((a) => (
          <Chip
            key={a.key}
            label={a.label}
            active={Array.isArray(allergenes) && allergenes.includes(a.key)}
            color={colors.danger}
            onPress={() => toggleAllergen(a.key)}
          />
        ))}
      </View>

      <Text style={styles.label}>Régime</Text>
      <View style={styles.chips}>
        <Chip
          label="🌱 Végétarien"
          active={vegetarien}
          color={colors.success}
          onPress={() => setVegetarien((v) => !v)}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, saving && { opacity: 0.6 }]}
        disabled={saving}
        onPress={save}
      >
        <Text style={styles.buttonText}>
          {saving
            ? "Enregistrement..."
            : editingId
              ? "Enregistrer les modifications"
              : "Ajouter le plat"}
        </Text>
      </TouchableOpacity>

      {editingId ? (
        <TouchableOpacity style={styles.cancel} onPress={resetForm}>
          <Text style={styles.cancelText}>Annuler la modification</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.section}>Plats du menu ({meals.length})</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un plat..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {meals
        .filter((m) =>
          m.nom.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .map((m) => {
          const soldOut = m.disponible === false;
          return (
            <View key={m._id} style={styles.row}>
              {m.image ? (
                <Image
                  source={{ uri: imageUrl(m.image) }}
                  style={[styles.thumb, soldOut && { opacity: 0.4 }]}
                />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons
                    name="restaurant-outline"
                    size={22}
                    color={colors.muted}
                  />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.rowName}>{m.nom}</Text>
                <Text style={styles.rowSub}>
                  {m.categorie} · {Number(m.prix).toFixed(2)} DT
                </Text>
                {!Array.isArray(m.allergenes) ? (
                  <Text style={styles.warn}>⚠ Allergènes non renseignés</Text>
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.stock,
                    soldOut ? styles.stockOff : styles.stockOn,
                  ]}
                  onPress={() => toggleAvailability(m)}
                >
                  <Ionicons
                    name={soldOut ? "close-circle" : "checkmark-circle"}
                    size={14}
                    color={soldOut ? colors.danger : colors.success}
                  />
                  <Text
                    style={[
                      styles.stockText,
                      { color: soldOut ? colors.danger : colors.success },
                    ]}
                  >
                    {soldOut ? "Épuisé" : "Disponible"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => startEdit(m)} hitSlop={6}>
                <Ionicons
                  name="create-outline"
                  size={23}
                  color={colors.primary}
                  style={styles.icon}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(m)} hitSlop={6}>
                <Ionicons
                  name="trash-outline"
                  size={23}
                  color={colors.danger}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  imageBox: {
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  preview: { width: "100%", height: "100%" },
  imageHint: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 15,
    marginTop: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    color: colors.text,
  },
  label: { fontSize: 15, fontWeight: "800", color: colors.text, marginTop: 8 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 2, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontWeight: "600", color: colors.text, fontSize: 13 },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.pill,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  cancel: { alignItems: "center", padding: 12 },
  cancelText: { color: colors.primary, fontWeight: "700" },
  section: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 28,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 10,
    marginBottom: 8,
  },
  thumb: { width: 58, height: 58, borderRadius: radius.md },
  thumbPlaceholder: {
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontSize: 16, fontWeight: "800", color: colors.text },
  rowSub: { color: colors.muted, marginTop: 2 },
  warn: { color: "#B7791F", fontSize: 12, marginTop: 3, fontWeight: "600" },
  stock: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  stockOn: { backgroundColor: "#DDF5E3" },
  stockOff: { backgroundColor: "#FDE2E2" },
  stockText: { marginLeft: 4, fontWeight: "700", fontSize: 12 },
  icon: { padding: 6 },
});
