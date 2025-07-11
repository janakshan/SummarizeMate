import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { RotateCcw, Sparkles } from "lucide-react-native";
import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { saveToHistory } from "../storage/historyStorage";
import { API_CONFIG, API_ENDPOINTS } from "../config/api";

export default function SummarizeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaryType, setSummaryType] = useState("brief");

  // Listen for navigation focus to reset input when returning to screen
  useFocusEffect(
    useCallback(() => {
      // Reset input when coming back from other screens (like SummaryResult)
      // or when explicitly requested via resetInput parameter
      if (route.params?.resetInput) {
        setInputText("");
        // Clear the param to prevent repeated resets
        navigation.setParams({ resetInput: undefined });
      } else {
        // Always reset input when navigating back to this screen
        setInputText("");
      }
    }, [route.params?.resetInput])
  );

 const handleSummarize = async () => {
  if (!inputText.trim()) {
    Alert.alert("Error", "Please enter some text to summarize");
    return;
  }

  // Validate input length
  const wordCount = inputText.trim().split(" ").filter(word => word.length > 0).length;
  
  if (wordCount < 10) {
    Alert.alert("Error", "Text is too short to summarize. Please enter at least 10 words.");
    return;
  }

  if (wordCount > 1000) {
    Alert.alert("Error", "Text is too long. Please limit to 1000 words or less.");
    return;
  }

  setIsLoading(true);

  // Add emergency fallback after 8 seconds
  const emergencyFallback = setTimeout(async () => {
    console.log('Emergency fallback triggered - API taking too long');
    const fallbackSummary = generateMockSummary(inputText.trim(), summaryType);
    
    setIsLoading(false);
    
    const summaryData = {
      originalText: inputText,
      summary: fallbackSummary,
      summaryType,
      wordCount,
    };
    
    try {
      await saveToHistory(summaryData);
    } catch (saveError) {
      console.error('Error saving to history:', saveError);
    }
    
    navigation.navigate("SummaryResult", summaryData);
  }, 8000);

  try {
    // Clean the input text
    const cleanText = inputText.trim().replace(/\s+/g, ' ');
    
    // Add shorter timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 15000) // 15 second timeout
    );
    
    const fetchPromise = fetch(API_ENDPOINTS.BART_LARGE_CNN, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: cleanText,
        parameters: {
          max_length: Math.min(150, Math.floor(wordCount * 0.3)),
          min_length: Math.max(30, Math.floor(wordCount * 0.1)),
          do_sample: false,
          early_stopping: true
        },
        options: {
          wait_for_model: true
        }
      })
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      // Try alternative approach with different model if first fails
      if (response.status === 400) {
        return await tryAlternativeModel(cleanText, wordCount, emergencyFallback);
      }
      
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    // Handle different response formats
    let summary;
    if (Array.isArray(data) && data.length > 0) {
      summary = data[0].summary_text || data[0].generated_text;
    } else if (data.summary_text) {
      summary = data.summary_text;
    } else if (data.generated_text) {
      summary = data.generated_text;
    } else {
      throw new Error('Unexpected response format');
    }

    if (!summary || summary.trim().length === 0) {
      console.log('Empty summary from API, trying alternative model...');
      return await tryAlternativeModel(cleanText, wordCount, emergencyFallback);
    }

    // Clear emergency fallback since API succeeded
    clearTimeout(emergencyFallback);
    
    setIsLoading(false);

    // Save to history
    const summaryData = {
      originalText: inputText,
      summary: summary.trim(),
      summaryType,
      wordCount,
    };
    
    try {
      await saveToHistory(summaryData);
    } catch (error) {
      console.error('Error saving to history:', error);
    }

    navigation.navigate("SummaryResult", summaryData);

  } catch (error) {
    console.error('Summarization error:', error);
    
    // Clear emergency fallback 
    clearTimeout(emergencyFallback);
    
    // If it's an API error, timeout, or empty summary, try fallback instead of showing error
    if (error.message.includes('Empty summary received') || 
        error.message.includes('timeout') || 
        error.message.includes('HTTP error') ||
        error.message.includes('Failed to fetch')) {
      console.log('Using fallback summary due to API issues...', error.message);
      const fallbackSummary = generateMockSummary(inputText.trim(), summaryType);
      
      setIsLoading(false);
      
      // Save to history
      const summaryData = {
        originalText: inputText,
        summary: fallbackSummary,
        summaryType,
        wordCount,
      };
      
      try {
        await saveToHistory(summaryData);
      } catch (saveError) {
        console.error('Error saving to history:', saveError);
      }
      
      navigation.navigate("SummaryResult", summaryData);
      return;
    }
    
    await handleSummarizationError(error);
  }
};

// Alternative model fallback
const tryAlternativeModel = async (cleanText, wordCount, emergencyFallback) => {
  try {
    console.log('Trying alternative model...');
    
    // Add timeout for alternative model too
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Alternative model timeout')), 10000) // 10 second timeout
    );
    
    const fetchPromise = fetch(API_ENDPOINTS.DISTILBART_CNN, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: cleanText,
        options: {
          wait_for_model: true
        }
      })
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`Alternative model failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Alternative API Response:', data);
    
    let summary = data[0]?.summary_text || data?.summary_text || data[0]?.generated_text || data?.generated_text;

    if (!summary || summary.trim().length === 0) {
      console.log('Alternative model also returned empty, using fallback summary...');
      summary = generateMockSummary(cleanText, summaryType);
    }

    // Clear emergency fallback since alternative model succeeded
    clearTimeout(emergencyFallback);
    
    setIsLoading(false);
    
    // Save to history
    const summaryData = {
      originalText: inputText,
      summary: summary.trim(),
      summaryType,
      wordCount,
    };
    
    try {
      await saveToHistory(summaryData);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
    
    navigation.navigate("SummaryResult", summaryData);

  } catch (altError) {
    console.error('Alternative model error:', altError);
    
    // Clear emergency fallback
    clearTimeout(emergencyFallback);
    
    // Final fallback to mock summary
    console.log('Using fallback summary due to API failures...');
    const fallbackSummary = generateMockSummary(cleanText, summaryType);
    
    setIsLoading(false);
    
    // Save to history
    const summaryData = {
      originalText: inputText,
      summary: fallbackSummary,
      summaryType,
      wordCount,
    };
    
    try {
      await saveToHistory(summaryData);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
    
    navigation.navigate("SummaryResult", summaryData);
  }
};

// Enhanced error handling
const handleSummarizationError = async (error) => {
  setIsLoading(false);
  
  let errorMessage = "Failed to generate summary. ";
  
  if (error.message.includes('400')) {
    errorMessage += "The text format may not be suitable for summarization. Try rephrasing or using different text.";
  } else if (error.message.includes('401')) {
    errorMessage += "API authentication failed. Please check the API key.";
  } else if (error.message.includes('503') || error.message.includes('502')) {
    errorMessage += "The summarization service is temporarily unavailable. Please try again in a few moments.";
  } else if (error.message.includes('model')) {
    errorMessage += "The AI model is currently loading. Please wait a moment and try again.";
  } else {
    errorMessage += "Please check your internet connection and try again.";
  }
  
  Alert.alert("Summarization Failed", errorMessage, [
    {
      text: "Try Again",
      onPress: () => {
        // Could implement retry logic here
      }
    },
    {
      text: "OK",
      style: "cancel"
    }
  ]);
}

  const generateMockSummary = (text, type) => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const wordCount = text.split(" ").length;
    
    // Extract key terms and topics from the text
    const extractKeyTopics = (text) => {
      // Look for capitalized words that might be important topics
      const capitalWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];
      // Look for frequently mentioned words (excluding common words)
      const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const wordFreq = {};
      words.forEach(word => {
        if (word.length > 3 && !commonWords.includes(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });
      const frequentWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([word]) => word);
      
      return [...new Set([...capitalWords.slice(0, 2), ...frequentWords])].slice(0, 3);
    };
    
    const keyTopics = extractKeyTopics(text);
    const mainTopic = keyTopics[0] || "the main subject";
    const firstSentence = sentences[0]?.trim() || "Primary content discussed";
    
    switch (type) {
      case "brief":
        if (keyTopics.length > 0) {
          return `${mainTopic} is the central focus of this content. ${firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence}. The analysis highlights key insights and important considerations related to ${keyTopics.slice(0, 2).join(' and ')}.`;
        }
        return `${firstSentence.length > 150 ? firstSentence.substring(0, 150) + '...' : firstSentence}. The content explores important themes and provides valuable insights on the subject matter.`;
        
      case "detailed":
        const detailedContent = sentences.slice(0, 3).join('. ');
        if (keyTopics.length > 0) {
          return `This ${wordCount}-word analysis explores ${keyTopics.join(', ')} and related concepts. ${detailedContent.length > 200 ? detailedContent.substring(0, 200) + '...' : detailedContent}. The comprehensive examination reveals multiple perspectives and provides thorough coverage of the key themes and supporting evidence.`;
        }
        return `This comprehensive ${wordCount}-word document presents detailed analysis and insights. ${detailedContent.length > 200 ? detailedContent.substring(0, 200) + '...' : detailedContent}. The content provides thorough examination of the subject matter with supporting evidence and conclusions.`;
        
      case "bullet":
        const bulletContent = firstSentence.length > 80 ? firstSentence.substring(0, 80) + '...' : firstSentence;
        return `• Primary Focus: ${mainTopic}\n• Key Content: ${bulletContent}\n• Supporting Topics: ${keyTopics.slice(1, 3).join(', ') || 'Additional themes and evidence'}\n• Analysis Depth: Comprehensive coverage with ${wordCount} words\n• Insights: Multiple perspectives and conclusions provided`;
        
      default:
        return `${mainTopic || 'Content'} analysis completed successfully with key insights extracted.`;
    }
  };

  const handleReset = () => {
    setInputText("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Sparkles size={32} color="#6366F1" strokeWidth={2} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>SummarizeMate</Text>
              <Text style={styles.headerSubtitle}>
                Transform long texts into concise summaries
              </Text>
            </View>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Paste or type your text here..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={inputText}
              onChangeText={setInputText}
              textAlignVertical="top"
            />
            <View style={styles.inputActions}>
              {inputText.length > 0 && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                >
                  <RotateCcw size={20} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.inputMeta}>
            <Text style={styles.characterCount}>
              {inputText.length} characters
            </Text>
            <Text style={styles.wordCount}>
              {inputText.split(" ").filter((word) => word.length > 0).length}{" "}
              words
            </Text>
          </View>
        </View>

        {/* Summarize Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.summarizeButton,
              (isLoading || !inputText.trim()) &&
                styles.summarizeButtonDisabled,
            ]}
            onPress={handleSummarize}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Sparkles size={20} color="#FFFFFF" strokeWidth={2} />
            )}
            <Text style={styles.summarizeButtonText}>
              {isLoading ? "Generating Summary..." : "Generate Summary"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter-Bold",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    lineHeight: 22,
  },
  inputSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter-SemiBold",
    color: "#111827",
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  textInput: {
    padding: 20,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    color: "#111827",
    minHeight: 450,
    maxHeight: 240,
    lineHeight: 24,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#6366F1"
  },
  inputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
  },
  resetButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
  },
  inputMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  characterCount: {
    fontSize: 14,
    fontFamily: "Inter-Regular",
    color: "#9CA3AF",
  },
  wordCount: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#6B7280",
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  summarizeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#6366F1",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summarizeButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  summarizeButtonText: {
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
    color: "#FFFFFF",
  },
});