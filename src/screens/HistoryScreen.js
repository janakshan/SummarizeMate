import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Animated,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getHistory, updateHistoryItem, deleteHistoryItems } from '../storage/historyStorage';



const FILTER_OPTIONS = [
  { key: 'all', label: 'All', icon: 'list-outline' },
  { key: 'brief', label: 'Brief', icon: 'newspaper-outline' },
  { key: 'detailed', label: 'Detailed', icon: 'document-text-outline' },
  { key: 'bullet', label: 'Bullet Points', icon: 'list-circle-outline' },
];

const SORT_OPTIONS = [
  { key: 'date', label: 'Recent First', icon: 'time-outline' },
  { key: 'dateAsc', label: 'Oldest First', icon: 'hourglass-outline' },
  { key: 'title', label: 'Title A-Z', icon: 'text-outline' },
  { key: 'titleDesc', label: 'Title Z-A', icon: 'text-outline' },
  { key: 'readTime', label: 'Reading Time', icon: 'timer-outline' },
];

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  
  const navigation = useNavigation();
  const filterAnim = useRef(new Animated.Value(0)).current;

  // Load history data when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      const historyData = await getHistory();
      setHistory(historyData);
      
      // Extract favorites from loaded data
      const favoriteIds = new Set(
        historyData.filter(item => item.isFavorite).map(item => item.id)
      );
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showFilters) {
      Animated.spring(filterAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(filterAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [showFilters]);

  // Filter and sort logic with optimizations
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = history.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
      
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'dateAsc':
          return new Date(a.date) - new Date(b.date);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'titleDesc':
          return b.title.localeCompare(a.title);
        case 'readTime':
          return parseInt(a.readTime) - parseInt(b.readTime);
        default:
          return 0;
      }
    });
  }, [history, searchQuery, activeFilter, sortBy]);

  // Group by date for timeline view
  const groupedHistory = useMemo(() => {
    const groups = {};
    filteredAndSortedHistory.forEach(item => {
      const dateKey = item.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredAndSortedHistory]);

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'brief': return { name: 'newspaper-outline', color: '#10B981' };
      case 'detailed': return { name: 'document-text-outline', color: '#3B82F6' };
      case 'bullet': return { name: 'list-circle-outline', color: '#F59E0B' };
      default: return { name: 'document-outline', color: '#6B7280' };
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'document': return 'document-attach-outline';
      case 'url': return 'link-outline';
      case 'text': return 'text-outline';
      default: return 'document-outline';
    }
  };

  const toggleFavorite = async (id) => {
    try {
      const item = history.find(h => h.id === id);
      const newIsFavorite = !item.isFavorite;
      
      // Update in storage
      await updateHistoryItem(id, { isFavorite: newIsFavorite });
      
      // Update local state
      const newFavorites = new Set(favorites);
      if (newIsFavorite) {
        newFavorites.add(id);
      } else {
        newFavorites.delete(id);
      }
      setFavorites(newFavorites);
      
      // Update history data
      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, isFavorite: newIsFavorite } : item
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleLongPress = (id) => {
    setIsSelectionMode(true);
    setSelectedItems(new Set([id]));
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
    
    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkAction = async (action) => {
    const selectedData = history.filter(item => selectedItems.has(item.id));
    
    switch (action) {
      case 'share':
        const shareText = selectedData.map(item => 
          `${item.title}\n${item.summary}\n`
        ).join('\n---\n');
        
        try {
          await Share.share({
            message: shareText,
            title: 'Summary History'
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
        break;
        
      case 'delete':
        Alert.alert(
          'Delete Summaries',
          `Are you sure you want to delete ${selectedItems.size} summary(s)?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  const idsToDelete = Array.from(selectedItems);
                  await deleteHistoryItems(idsToDelete);
                  setHistory(prev => prev.filter(item => !selectedItems.has(item.id)));
                  clearSelection();
                } catch (error) {
                  console.error('Error deleting items:', error);
                }
              }
            }
          ]
        );
        break;
        
      case 'favorite':
        try {
          // Update all selected items to be favorites
          for (const item of selectedData) {
            await updateHistoryItem(item.id, { isFavorite: true });
          }
          
          const newFavorites = new Set(favorites);
          selectedData.forEach(item => {
            newFavorites.add(item.id);
          });
          setFavorites(newFavorites);
          setHistory(prev => prev.map(item => 
            selectedItems.has(item.id) ? { ...item, isFavorite: true } : item
          ));
        } catch (error) {
          console.error('Error updating favorites:', error);
        }
        break;
    }
    
    clearSelection();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const renderFilterPill = (filter) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterPill,
        activeFilter === filter.key && styles.filterPillActive
      ]}
      onPress={() => setActiveFilter(filter.key)}
    >
      <Ionicons 
        name={filter.icon} 
        size={16} 
        color={activeFilter === filter.key ? '#6366F1' : '#6B7280'} 
      />
      <Text style={[
        styles.filterPillText,
        activeFilter === filter.key && styles.filterPillTextActive
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const renderSortOption = ({ item }) => (
    <TouchableOpacity
      style={[styles.sortOption, sortBy === item.key && styles.sortOptionActive]}
      onPress={() => {
        setSortBy(item.key);
        setShowSortModal(false);
      }}
    >
      <Ionicons 
        name={item.icon} 
        size={20} 
        color={sortBy === item.key ? '#6366F1' : '#6B7280'} 
      />
      <Text style={[styles.sortOptionText, sortBy === item.key && styles.sortOptionTextActive]}>
        {item.label}
      </Text>
      {sortBy === item.key && (
        <Ionicons name="checkmark" size={20} color="#6366F1" />
      )}
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => {
    const typeIcon = getTypeIcon(item.type);
    const isSelected = selectedItems.has(item.id);
    const isFavorite = favorites.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.historyCard, isSelected && styles.historyCardSelected]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            navigation.navigate('HistoryDetail', { item });
          }
        }}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <View style={[styles.typeIconContainer, { backgroundColor: `${typeIcon.color}15` }]}>
              <Ionicons name={typeIcon.name} size={20} color={typeIcon.color} />
            </View>
            
            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.cardMeta}>
                  <Ionicons name={getSourceIcon(item.source)} size={12} color="#9CA3AF" />
                  <Text style={styles.cardTime}>{formatTime(item.date)}</Text>
                </View>
              </View>
              
              <Text style={styles.cardSummary} numberOfLines={2}>
                {item.summary}
              </Text>
              
              <View style={styles.cardFooter}>
                <View style={styles.cardStats}>
                  <Text style={styles.statText}>{item.wordCount} words</Text>
                  <Text style={styles.statDivider}>•</Text>
                  <Text style={styles.statText}>{item.readTime}</Text>
                </View>
                
                <View style={styles.cardTags}>
                  {item.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {item.tags.length > 2 && (
                    <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardRight}>
            {isSelectionMode ? (
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
            ) : (
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(item.id)}
                >
                  <Ionicons 
                    name={isFavorite ? 'heart' : 'heart-outline'} 
                    size={20} 
                    color={isFavorite ? '#EF4444' : '#9CA3AF'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuButton}>
                  <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (dateKey) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{formatDate(new Date(dateKey))}</Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );

  const renderTimelineView = () => {
    const sections = Object.entries(groupedHistory);
    
    return (
      <FlatList
        data={sections}
        keyExtractor={([dateKey]) => dateKey}
        renderItem={({ item: [dateKey, items] }) => (
          <View>
            {renderSectionHeader(dateKey)}
            {items.map((item) => (
              <View key={item.id}>
                {renderHistoryItem({ item })}
              </View>
            ))}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No History Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search terms or filters' : 'Your summary history will appear here'}
      </Text>
      {searchQuery && (
        <TouchableOpacity 
          style={styles.clearSearchButton}
          onPress={() => {
            setSearchQuery('');
            setActiveFilter('all');
          }}
        >
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? 'close' : 'options-outline'} 
            size={24} 
            color="#6366F1" 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.headerSubtitle}>
        {filteredAndSortedHistory.length} summary{filteredAndSortedHistory.length !== 1 ? 's' : ''}
        {activeFilter !== 'all' && ` • ${FILTER_OPTIONS.find(f => f.key === activeFilter)?.label}`}
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search summaries, titles, or tags..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Pills */}
      <Animated.View 
        style={[
          styles.filtersContainer,
          {
            opacity: filterAnim,
            transform: [{
              translateY: filterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            }],
          }
        ]}
      >
        {showFilters && (
          <>
            <View style={styles.filterRow}>
              {FILTER_OPTIONS.map(renderFilterPill)}
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setShowSortModal(true)}
              >
                <Ionicons name="swap-vertical-outline" size={18} color="#6366F1" />
                <Text style={styles.sortButtonText}>
                  {SORT_OPTIONS.find(opt => opt.key === sortBy)?.label}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>

      {/* Selection Bar */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionLeft}>
            <Text style={styles.selectionText}>
              {selectedItems.size} selected
            </Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={() => handleBulkAction('favorite')}
            >
              <Ionicons name="heart-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={() => handleBulkAction('share')}
            >
              <Ionicons name="share-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={() => handleBulkAction('delete')}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={clearSelection}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {filteredAndSortedHistory.length === 0 ? 
        renderEmptyState() : 
        renderTimelineView()
      }

      {/* Sort Modal */}
      {showSortModal && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModal}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sort by</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={SORT_OPTIONS}
              renderItem={renderSortOption}
              keyExtractor={(item) => item.key}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterToggle: {
    padding: 8,
    borderRadius: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterPillActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  filterPillText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    marginLeft: 6,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 12,
  },
  selectionLeft: {},
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionAction: {
    padding: 8,
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F8FAFF',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  cardSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statDivider: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  cardTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginLeft: 4,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  cardActions: {
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
    marginBottom: 8,
  },
  menuButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '50%',
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sortOptionActive: {
    backgroundColor: '#F8FAFF',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  sortOptionTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default HistoryScreen;