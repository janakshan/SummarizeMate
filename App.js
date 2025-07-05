import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { History, Settings, Sparkles } from "lucide-react-native";
import { View } from "react-native";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import { getCurrentUser, logout, checkRememberMe } from "./src/auth";
import React, { useState, useEffect } from "react";

// Import your screens
import HistoryScreen from "./src/screens/HistoryScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import SummarizeScreen from "./src/screens/SummarizeScreen";
import SummaryResultScreen from "./src/screens/SummaryResultScreen";
import HistoryDetailScreen from "./src/screens/HistoryDetailScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Summarize Stack Navigator
function SummarizeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#F9FAFB" },
      }}
    >
      <Stack.Screen name="SummarizeMain" component={SummarizeScreen} />
      <Stack.Screen
        name="SummaryResult"
        component={SummaryResultScreen}
        options={{
          headerShown: true,
          headerTitle: "Summary Result",
          headerBackTitle: " ",
          headerStyle: {
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          },
          headerTitleStyle: {
            fontSize: 18,
            fontFamily: "Inter-SemiBold",
            color: "#111827",
          },
          headerTintColor: "#6366F1",
          presentation: "card",
        }}
      />
    </Stack.Navigator>
  );
}

// History Stack Navigator
function HistoryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#F9FAFB" },
      }}
    >
      <Stack.Screen name="HistoryMain" component={HistoryScreen} />
      <Stack.Screen 
        name="HistoryDetail" 
        component={HistoryDetailScreen} 
        options={{ 
          headerTitle: "History Details", 
          headerBackTitle: " ",
          headerShown: true,
          headerStyle: {
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          },
          headerTitleStyle: {
            fontSize: 18,
            fontFamily: "Inter-SemiBold",
            color: "#111827",
          },
          headerTintColor: "#6366F1",
        }} 
      />
    </Stack.Navigator>
  );
}

// Tab Navigator Component
function TabNavigator({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          switch (route.name) {
            case "Summarize":
              IconComponent = Sparkles;
              break;
            case "History":
              IconComponent = History;
              break;
            case "Settings":
              IconComponent = Settings;
              break;
            default:
              IconComponent = Sparkles;
          }

          return (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 4,
              }}
            >
              <IconComponent
                size={size}
                color={color}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          );
        },
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Summarize"
        component={SummarizeStack}
        options={{
          tabBarLabel: "Summarize",
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={{
          tabBarLabel: "History",
        }}
      />
      <Tab.Screen
        name="Settings"
        children={props => <SettingsScreen {...props} onLogout={onLogout} />}
        options={{
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function RootNavigator({ onLogout }) {
  return <TabNavigator onLogout={onLogout} />;
}

// Main App Component
export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [isCheckingRememberMe, setIsCheckingRememberMe] = useState(true);

  // Check for remembered user on app startup
  useEffect(() => {
    checkRememberedUser();
  }, []);

  const checkRememberedUser = async () => {
    try {
      const rememberedUser = await checkRememberMe();
      if (rememberedUser) {
        setUser(rememberedUser);
      }
    } catch (error) {
      console.error('Error checking remembered user:', error);
    } finally {
      setIsCheckingRememberMe(false);
    }
  };

  const handleAuthChange = () => {
    setUser(getCurrentUser());
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  // Show loading screen while checking remember me
  if (isCheckingRememberMe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <Sparkles size={48} color="#6366F1" strokeWidth={2} />
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} initialParams={{ onLogin: handleAuthChange }} />
          <Stack.Screen name="Signup" component={SignupScreen} initialParams={{ onSignup: handleAuthChange }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <RootNavigator onLogout={handleLogout} />
    </NavigationContainer>
  );
}
