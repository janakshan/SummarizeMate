import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Mock document data - replace with your actual data source
const MOCK_DOCUMENTS = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'pdf',
    size: '2.4 MB',
    dateCreated: new Date('2024-01-15'),
    lastModified: new Date('2024-01-20'),
    tags: ['work', 'proposal'],
    summary: 'A comprehensive project proposal for Q1 2024...',
  },
  {
    id: '2',
    name: 'Meeting Notes.docx',
    type: 'docx',
    size: '156 KB',
    dateCreated: new Date('2024-01-18'),
    lastModified: new Date('2024-01-18'),
    tags: ['meeting', 'notes'],
    summary: 'Weekly team meeting notes and action items...',
  },
  {
    id: '3',
    name: 'Research Report.pdf',
    type: 'pdf',
    size: '5.2 MB',
    dateCreated: new Date('2024-01-10'),
    lastModified: new Date('2024-01-22'),
    tags: ['research', 'analysis'],
    summary: 'Market research findings and recommendations...',
  },
  {
    id: '4',
    name: 'Budget Analysis.xlsx',
    type: 'xlsx',
    size: '892 KB',
    dateCreated: new Date('2024-01-12'),
    lastModified: new Date('2024-01-19'),
    tags: ['finance', 'budget'],
    summary: 'Q1 budget analysis with forecasting...',
  },
  {
    id: '5',
    name: 'User Manual.pdf',
    type: 'pdf',
    size: '3.1 MB',
    dateCreated: new Date('2024-01-08'),
    lastModified: new Date('2024-01-16'),
    tags: ['documentation', 'manual'],
    summary: 'Complete user manual for the platform...',
  },
];

const SORT_OPTIONS = [
  { key: 'name', label: 'Name A-Z', icon: 'text-outline' },
  { key: 'nameDesc', label: 'Name Z-A', icon: 'text-outline' },
  { key: 'dateCreated', label: 'Date Created', icon: 'calendar-outline' },
  { key: 'lastModified', label: 'Recently Modified', icon: 'time-outline' },
  { key: 'size', label: 'File Size', icon: 'document-outline' },
];

const DocumentsScreen = () => {
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastModified');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const slideAnim = useState(new Animated.Value(0))[0];

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'dateCreated':
          return b.dateCreated - a.dateCreated;
        case 'lastModified':
          return b.lastModified - a.lastModified;
        case 'size':
          return parseFloat(b.size) - parseFloat(a.size);
        default:
          return 0;
      }
    });
  }, [documents, searchQuery, sortBy]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real app, fetch documents from API
    setRefreshing(false);
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return { name: 'document-text', color: '#EF4444' };
      case 'docx':
      case 'doc':
        return { name: 'document', color: '#3B82F6' };
      case 'xlsx':
      case 'xls':
        return { name: 'grid', color: '#10B981' };
      case 'pptx':
      case 'ppt':
        return { name: 'easel', color: '#F59E0B' };
      default:
        return { name: 'document-outline', color: '#6B7280' };
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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

  const handleLongPress = (id) => {
    setIsSelectionMode(true);
    toggleSelection(id);
    
    // Haptic feedback would go here
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkAction = (action) => {
    Alert.alert(
      `${action} Documents`,
      `Are you sure you want to ${action.toLowerCase()} ${selectedItems.size} document(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action, 
          style: action === 'Delete' ? 'destructive' : 'default',
          onPress: () => {
            // Handle bulk action
            console.log(`${action} documents:`, Array.from(selectedItems));
            clearSelection();
          }
        },
      ]
    );
  };

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

  const renderDocument = ({ item, index }) => {
    const fileIcon = getFileIcon(item.type);
    const isSelected = selectedItems.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.documentCard, isSelected && styles.documentCardSelected]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            // Navigate to document detail or open document
            console.log('Open document:', item.name);
          }
        }}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.documentContent}>
          <View style={styles.documentLeft}>
            <View style={[styles.fileIconContainer, { backgroundColor: `${fileIcon.color}15` }]}>
              <Ionicons name={fileIcon.name} size={24} color={fileIcon.color} />
            </View>
            
            <View style={styles.documentInfo}>
              <Text style={styles.documentName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.documentSummary} numberOfLines={2}>
                {item.summary}
              </Text>
              <View style={styles.documentMeta}>
                <Text style={styles.documentDate}>
                  {formatDate(item.lastModified)}
                </Text>
                <Text style={styles.documentSize}>
                  • {item.size}
                </Text>
              </View>
              {item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {item.tags.length > 2 && (
                    <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.documentRight}>
            {isSelectionMode && (
              <View style={[styles.checkboxContainer, isSelected && styles.checkboxContainerSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
            )}
            {!isSelectionMode && (
              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Documents Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="cloud-upload-outline" size={20} color="#6366F1" />
          <Text style={styles.uploadButtonText}>Upload Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Documents</Text>
        <Text style={styles.headerSubtitle}>
          {filteredAndSortedDocuments.length} document{filteredAndSortedDocuments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents, tags, or content..."
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

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="funnel-outline" size={20} color="#6366F1" />
            <Text style={styles.sortButtonText}>
              Sort: {SORT_OPTIONS.find(opt => opt.key === sortBy)?.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRight}>
          <TouchableOpacity style={styles.viewButton}>
            <Ionicons name="grid-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selection Bar */}
      {isSelectionMode && (
        <Animated.View style={styles.selectionBar}>
          <View style={styles.selectionLeft}>
            <Text style={styles.selectionText}>
              {selectedItems.size} selected
            </Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={() => handleBulkAction('Share')}
            >
              <Ionicons name="share-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={() => handleBulkAction('Download')}
            >
              <Ionicons name="download-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={() => handleBulkAction('Delete')}
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
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <FlatList
        data={filteredAndSortedDocuments}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

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

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    marginBottom: 16,
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLeft: {
    flex: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    alignSelf: 'flex-start',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
    marginLeft: 6,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 8,
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
  documentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
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
  documentCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#F8FAFF',
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  documentSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  documentSize: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 2,
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
  },
  documentRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxContainerSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: 8,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DocumentsScreen;