import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useRoute } from "@react-navigation/native";
import { FileText, Sparkles, Clock } from "lucide-react-native";

const getTypeInfo = (type) => {
  switch (type) {
    case "brief":
      return { label: "Brief Summary", color: "#10B981", bgColor: "#ECFDF5" };
    case "detailed":
      return { label: "Detailed Analysis", color: "#F59E0B", bgColor: "#FFFBEB" };
    case "bullet":
      return { label: "Key Points", color: "#8B5CF6", bgColor: "#F3E8FF" };
    default:
      return { label: "Summary", color: "#6B7280", bgColor: "#F9FAFB" };
  }
};

const HistoryDetailScreen = () => {
  const route = useRoute();
  const { item } = route.params;

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text>No details found.</Text>
      </View>
    );
  }

  const typeInfo = getTypeInfo(item.type);
  const originalWordCount = item.originalText ? item.originalText.split(/\s+/).filter(Boolean).length : 0;
  const summaryWordCount = item.summary ? item.summary.split(/\s+/).filter(Boolean).length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{item.name}</Text>
        </View>
        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <FileText size={20} color="#6366F1" strokeWidth={2} />
            <Text style={styles.statValue}>{originalWordCount}</Text>
            <Text style={styles.statLabel}>Original Words</Text>
          </View>
          <View style={styles.statItem}>
            <Sparkles size={20} color="#10B981" strokeWidth={2} />
            <Text style={styles.statValue}>{summaryWordCount}</Text>
            <Text style={styles.statLabel}>Summary Words</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={20} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.statValue}>{new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.statLabel}>Created</Text>
          </View>
        </View>
        {/* Type Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.bgColor }]}> 
            <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
          </View>
        </View>
        {/* Original Text Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Original Text</Text>
          <Text style={styles.sectionText}>{item.originalText || "(Not available in mock data)"}</Text>
        </View>
        {/* Summary Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.sectionText}>{item.summary}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 0,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HistoryDetailScreen; 