import React from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import AdminAvisScreen from "../screens/admin/AdminAvisScreen";
import AuthScreen from "../screens/auth/AuthScreen";
import AccueilScreen from "../screens/client/AccueilScreen";
import MenuScreen from "../screens/client/MenuScreen";
import CategoriesScreen from "../screens/client/CategoriesScreen";
import DetailPlatScreen from "../screens/client/DetailPlatScreen";
import PanierScreen from "../screens/client/PanierScreen";
import ReservationScreen from "../screens/client/ReservationScreen";
import HistoriqueScreen from "../screens/client/HistoriqueScreen";
import ChatbotScreen from "../screens/client/ChatbotScreen";
import ProfilScreen from "../screens/shared/ProfilScreen";
import EditProfileScreen from "../screens/shared/EditProfileScreen";
import ChangePasswordScreen from "../screens/shared/ChangePasswordScreen";
import GestionMenuScreen from "../screens/admin/GestionMenuScreen";
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminOrdersScreen from "../screens/admin/AdminOrdersScreen";
import AdminReservationsScreen from "../screens/admin/AdminReservationsScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICONS = {
  Accueil: "home",
  Menu: "restaurant",
  Catégories: "grid",
  Panier: "cart",
  Profil: "person",
  AdminDashboard: "stats-chart",
  AdminOrders: "receipt",
  AdminMeals: "fast-food",
  AdminReservations: "calendar",
  AdminAvis: "star",
};

const tabOptions = ({ route }) => ({
  headerTitleAlign: "center",
  headerStyle: { backgroundColor: colors.card },
  headerTitleStyle: { color: colors.text, fontWeight: "700" },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
  tabBarBadgeStyle: { backgroundColor: colors.primary, color: "#fff" },
  tabBarIcon: ({ focused, color, size }) => {
    const base = ICONS[route.name];
    return (
      <Ionicons
        name={focused ? base : `${base}-outline`}
        size={size}
        color={color}
      />
    );
  },
});

const stackOptions = {
  headerTitleAlign: "center",
  headerStyle: { backgroundColor: colors.card },
  headerTitleStyle: { color: colors.text, fontWeight: "700" },
  headerTintColor: colors.primary,
};

// ---------- CLIENT ----------
function ClientTabs() {
  const { count } = useCart();
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="Accueil"
        component={AccueilScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={({ navigation }) => ({
          title: "Notre menu",
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate("Chatbot")}
              hitSlop={8}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="Catégories" component={CategoriesScreen} />
      <Tab.Screen
        name="Panier"
        component={PanierScreen}
        options={{
          tabBarBadge: count > 0 ? count : undefined,
          title: "Mon panier",
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ title: "Mon profil" }}
      />
    </Tab.Navigator>
  );
}

function ClientApp() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen
        name="Tabs"
        component={ClientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DetailPlat"
        component={DetailPlatScreen}
        options={{ title: "Détail du plat" }}
      />
      <Stack.Screen
        name="Reservation"
        component={ReservationScreen}
        options={{ title: "Réservation" }}
      />
      <Stack.Screen
        name="Historique"
        component={HistoriqueScreen}
        options={{ title: "Mes commandes" }}
      />
      <Stack.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{ title: "Assistant" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Modifier mon profil" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Mot de passe" }}
      />
    </Stack.Navigator>
  );
}

// ---------- ADMIN ----------
function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: "Tableau de bord", tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{ title: "Commandes", tabBarLabel: "Commandes" }}
      />
      <Tab.Screen
        name="AdminMeals"
        component={GestionMenuScreen}
        options={{ title: "Gérer les plats", tabBarLabel: "Plats" }}
      />
      <Tab.Screen
        name="AdminReservations"
        component={AdminReservationsScreen}
        options={{ title: "Réservations", tabBarLabel: "Réserv." }}
      />
      <Tab.Screen
        name="AdminAvis"
        component={AdminAvisScreen}
        options={{ title: "Avis clients", tabBarLabel: "Avis" }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ title: "Mon profil" }}
      />
    </Tab.Navigator>
  );
}

function AdminApp() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen
        name="Tabs"
        component={AdminTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: "Utilisateurs" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Modifier mon profil" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Mot de passe" }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <Ionicons name="restaurant" size={48} color={colors.primary} />
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: colors.text,
            marginVertical: 10,
          }}
        >
          MyRestaurant
        </Text>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <NavigationContainer key={user.role}>
      {user.role === "admin" ? <AdminApp /> : <ClientApp />}
    </NavigationContainer>
  );
}
