import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image, Alert, ScrollView, SafeAreaView } from "react-native";
import { logout, getCurrentUser } from "../auth";
import { useNavigation } from "@react-navigation/native";

const mockSettings = [
  { key: "notifications", label: "Enable Notifications", value: true },
  { key: "darkMode", label: "Dark Mode", value: false },
];

const mockFaqs = [
  { q: "How do I use SummarizeMate?", a: "Paste or type your text, then tap 'Generate Summary'." },
  { q: "Is my data private?", a: "Yes, your summaries are stored only on your device." },
  { q: "How do I contact support?", a: "Email us at support@summarizemate.com." },
];

const AVATAR_URL = "https://ui-avatars.com/api/?name=User&background=6366F1&color=fff&size=128";

const SettingsScreen = ({ onLogout }) => {
  const navigation = useNavigation();
  const user = getCurrentUser();
  const [settings, setSettings] = React.useState(mockSettings);

  const handleToggle = (key) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: !s.value } : s))
    );
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image source={{ uri: AVATAR_URL }} style={styles.avatar} />
          <Text style={styles.profileName}>{user?.name || "User"}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        {/* Common Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Common Settings</Text>
          {settings.map((s) => (
            <View key={s.key} style={styles.settingRow}>
              <Text style={styles.settingLabel}>{s.label}</Text>
              <Switch
                value={s.value}
                onValueChange={() => handleToggle(s.key)}
                trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                thumbColor={s.value ? "#6366F1" : "#F3F4F6"}
              />
            </View>
          ))}
        </View>
        {/* FAQ Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>FAQ</Text>
          {mockFaqs.map((faq, idx) => (
            <View key={idx} style={styles.faqItem}>
              <Text style={styles.faqQ}>{faq.q}</Text>
              <Text style={styles.faqA}>{faq.a}</Text>
            </View>
          ))}
        </View>
        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 0,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: "#EEF2FF",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 20,
    marginHorizontal: 24,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#374151",
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQ: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#6366F1",
    marginBottom: 2,
  },
  faqA: {
    fontSize: 15,
    color: "#374151",
    marginLeft: 4,
  },
  logoutButton: {
    marginTop: 32,
    marginHorizontal: 24,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SettingsScreen;
