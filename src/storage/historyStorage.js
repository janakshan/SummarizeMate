import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_STORAGE_KEY = '@SummarizeMate:history';

// Fallback in-memory storage for when AsyncStorage is not ready
let memoryStorage = [];
let isAsyncStorageReady = true;

// Test if AsyncStorage is available
const testAsyncStorage = async () => {
  try {
    await AsyncStorage.getItem('test');
    return true;
  } catch (error) {
    console.warn('AsyncStorage not available, using memory storage');
    return false;
  }
};

// Initialize storage readiness
testAsyncStorage().then(ready => {
  isAsyncStorageReady = ready;
});

export const saveToHistory = async (summaryData) => {
  try {
    const existingHistory = await getHistory();
    
    const newHistoryItem = {
      id: Date.now().toString(),
      title: generateTitle(summaryData.summary),
      summary: summaryData.summary,
      originalText: summaryData.originalText,
      date: new Date(),
      type: summaryData.summaryType || 'brief',
      wordCount: summaryData.wordCount || 0,
      readTime: calculateReadTime(summaryData.summary),
      source: 'text',
      tags: generateTags(summaryData.originalText, summaryData.summary),
      isFavorite: false,
    };
    
    const updatedHistory = [newHistoryItem, ...existingHistory];
    
    if (isAsyncStorageReady) {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } else {
      memoryStorage = updatedHistory;
    }
    
    return newHistoryItem;
  } catch (error) {
    console.error('Error saving to history:', error);
    // Fallback to memory storage
    const existingHistory = memoryStorage;
    const newHistoryItem = {
      id: Date.now().toString(),
      title: generateTitle(summaryData.summary),
      summary: summaryData.summary,
      originalText: summaryData.originalText,
      date: new Date(),
      type: summaryData.summaryType || 'brief',
      wordCount: summaryData.wordCount || 0,
      readTime: calculateReadTime(summaryData.summary),
      source: 'text',
      tags: generateTags(summaryData.originalText, summaryData.summary),
      isFavorite: false,
    };
    memoryStorage = [newHistoryItem, ...existingHistory];
    return newHistoryItem;
  }
};

export const getHistory = async () => {
  try {
    if (isAsyncStorageReady) {
      const historyData = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (historyData) {
        const parsedHistory = JSON.parse(historyData);
        // Convert date strings back to Date objects
        return parsedHistory.map(item => ({
          ...item,
          date: new Date(item.date)
        }));
      }
      return [];
    } else {
      // Use memory storage
      return memoryStorage.map(item => ({
        ...item,
        date: item.date instanceof Date ? item.date : new Date(item.date)
      }));
    }
  } catch (error) {
    console.error('Error getting history:', error);
    // Fallback to memory storage
    return memoryStorage.map(item => ({
      ...item,
      date: item.date instanceof Date ? item.date : new Date(item.date)
    }));
  }
};

export const updateHistoryItem = async (id, updates) => {
  try {
    const history = await getHistory();
    const updatedHistory = history.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    
    if (isAsyncStorageReady) {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } else {
      memoryStorage = updatedHistory;
    }
    
    return updatedHistory;
  } catch (error) {
    console.error('Error updating history item:', error);
    // Fallback to memory storage
    memoryStorage = memoryStorage.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    return memoryStorage;
  }
};

export const deleteHistoryItems = async (idsToDelete) => {
  try {
    const history = await getHistory();
    const updatedHistory = history.filter(item => !idsToDelete.includes(item.id));
    
    if (isAsyncStorageReady) {
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } else {
      memoryStorage = updatedHistory;
    }
    
    return updatedHistory;
  } catch (error) {
    console.error('Error deleting history items:', error);
    // Fallback to memory storage
    memoryStorage = memoryStorage.filter(item => !idsToDelete.includes(item.id));
    return memoryStorage;
  }
};

export const clearHistory = async () => {
  try {
    if (isAsyncStorageReady) {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
    }
    memoryStorage = [];
  } catch (error) {
    console.error('Error clearing history:', error);
    memoryStorage = [];
  }
};

// Helper functions
const generateTitle = (summary) => {
  // Remove common prefixes from mock summaries
  let cleanSummary = summary
    .replace(/^This text discusses\s*/i, '')
    .replace(/^This comprehensive text\s*/i, '')
    .replace(/^•\s*Main Topic:\s*/i, '')
    .replace(/^The key insight is that\s*/i, '')
    .replace(/^Overall,\s*/i, '');
  
  // Look for meaningful content after common sentence starters
  const meaningfulStart = cleanSummary.match(/(?:discusses|about|focuses on|examines|explores|analyzes)\s+(.+?)(?:\.|,|$)/i);
  if (meaningfulStart) {
    const words = meaningfulStart[1].split(' ').slice(0, 4);
    return words.join(' ') + (meaningfulStart[1].split(' ').length > 4 ? '...' : '');
  }
  
  // Extract key phrases or capitalize first meaningful words
  const words = cleanSummary.split(' ').slice(0, 6);
  let title = words.join(' ');
  
  // If still generic, try to extract topic from the text
  if (title.toLowerCase().includes('important information') || title.toLowerCase().includes('valuable perspective')) {
    // Look for capitalized words that might be topics
    const capitalWords = summary.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalWords && capitalWords.length > 0) {
      title = capitalWords.slice(0, 3).join(' ');
    }
  }
  
  return title + (summary.split(' ').length > 6 ? '...' : '');
};

const calculateReadTime = (text) => {
  const wordsPerMinute = 200;
  const wordCount = text.split(' ').length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min`;
};

const generateTags = (originalText, summary) => {
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an'];
  
  const text = (originalText + ' ' + summary).toLowerCase();
  const words = text.match(/\b\w+\b/g) || [];
  const wordCount = {};
  
  words.forEach(word => {
    if (word.length > 3 && !commonWords.includes(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  const sortedWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);
    
  return sortedWords.length > 0 ? sortedWords : ['summary'];
};