import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  Globe, 
  Search, 
  Filter, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  Grid3X3,
  TrendingUp,
  Clock,
  Heart,
  BarChart3,
  AlertCircle
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import PublicFileItem from "@/components/PublicFileItem";
import { 
  usePublicFileStore, 
  getFilteredAndSortedFiles,
  SortOption,
  FilterOption,
  PublicBlockchainFile
} from "@/store/publicFileStore";

export default function PublicScreen() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const {
    files,
    loading,
    error,
    searchQuery,
    sortBy,
    filterBy,
    setSearchQuery,
    setSortBy,
    setFilterBy,
    fetchPublicFiles,
    incrementViews,
  } = usePublicFileStore();

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    return getFilteredAndSortedFiles(files, searchQuery, filterBy, sortBy);
  }, [files, searchQuery, filterBy, sortBy]);

  useEffect(() => {
    fetchPublicFiles();
  }, [fetchPublicFiles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPublicFiles();
    setRefreshing(false);
  };

  const handleFilePress = async (file: PublicBlockchainFile) => {
    // Increment views when user actually opens/views the file
    await incrementViews(file.file_id);
    console.log("Opening file:", file.file_name);
    
    // Here you could open a modal or navigate to a detailed view
    // For now, we'll just log the action
  };

  const handleFileExpand = async (file: PublicBlockchainFile) => {
    console.log("Expanding file details:", file.file_name);
  };

  const renderFilterButton = (
    filter: FilterOption,
    label: string,
    icon: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterBy === filter && styles.filterButtonActive,
      ]}
      onPress={() => setFilterBy(filter)}
    >
      {icon}
      <Text
        style={[
          styles.filterButtonText,
          filterBy === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSortButton = (
    sort: SortOption,
    label: string,
    icon: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === sort && styles.sortButtonActive,
      ]}
      onPress={() => setSortBy(sort)}
    >
      {icon}
      <Text
        style={[
          styles.sortButtonText,
          sortBy === sort && styles.sortButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search with Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search files, signatures, or owners..."
          />
        </View>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter 
            size={20} 
            color={showFilters ? Colors.primary : Colors.gray} 
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>File Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
            >
              {renderFilterButton("all", "All", <Grid3X3 size={16} color={filterBy === "all" ? Colors.white : Colors.gray} />)}
              {renderFilterButton("images", "Images", <ImageIcon size={16} color={filterBy === "images" ? Colors.white : Colors.gray} />)}
              {renderFilterButton("videos", "Videos", <Video size={16} color={filterBy === "videos" ? Colors.white : Colors.gray} />)}
              {renderFilterButton("docs", "Documents", <FileText size={16} color={filterBy === "docs" ? Colors.white : Colors.gray} />)}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
            >
              {renderSortButton("recent", "Recent", <Clock size={16} color={sortBy === "recent" ? Colors.white : Colors.gray} />)}
              {renderSortButton("popular", "Popular", <TrendingUp size={16} color={sortBy === "popular" ? Colors.white : Colors.gray} />)}
              {renderSortButton("likes", "Most Liked", <Heart size={16} color={sortBy === "likes" ? Colors.white : Colors.gray} />)}
              {renderSortButton("size", "File Size", <BarChart3 size={16} color={sortBy === "size" ? Colors.white : Colors.gray} />)}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{files.length}</Text>
          <Text style={styles.statLabel}>Total Files</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredFiles.length}</Text>
          <Text style={styles.statLabel}>Filtered</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {files.reduce((sum, file) => sum + file.views, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading public files...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <EmptyState
          title="Failed to Load Files"
          description={error}
          icon={<AlertCircle size={64} color={Colors.error} />}
          actionLabel="Retry"
          onAction={fetchPublicFiles}
        />
      );
    }

    if (filteredFiles.length === 0 && !loading) {
      if (searchQuery.trim() || filterBy !== "all") {
        return (
          <EmptyState
            title="No Files Found"
            description="Try adjusting your search or filters"
            icon={<Search size={64} color={Colors.gray} />}
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery("");
              setFilterBy("all");
              setSortBy("recent");
            }}
          />
        );
      }

      return (
        <EmptyState
          title="No Public Files"
          description="The public registry is empty. Be the first to share a file publicly!"
          icon={<Globe size={64} color={Colors.gray} />}
        />
      );
    }

    return (
      <View style={styles.filesContainer}>
        {filteredFiles.map((file) => (
          <PublicFileItem
            key={file.id}
            file={file}
            onPress={() => handleFilePress(file)}
            onExpand={() => handleFileExpand(file)}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {renderHeader()}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing.md,
  },
  filtersContainer: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  filterSection: {
    marginBottom: theme.spacing.md,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: theme.spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginRight: theme.spacing.sm,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.gray,
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginRight: theme.spacing.sm,
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.gray,
  },
  sortButtonTextActive: {
    color: Colors.white,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    minHeight: 300,
  },
  loadingText: {
    color: Colors.gray,
    fontSize: 14,
    marginTop: theme.spacing.md,
  },
  filesContainer: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: 120, // Account for tab bar
  },
});