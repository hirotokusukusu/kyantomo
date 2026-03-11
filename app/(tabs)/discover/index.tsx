import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Heart, BookOpen, Sparkles, ChevronRight } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useMatchingUsers, MatchedUser } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";

type FilterType = "all" | "hobby" | "course";

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { matchedUsers, hobbyMatches, courseMatches } = useMatchingUsers();
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getFilteredUsers = () => {
    switch (filter) {
      case "hobby":
        return hobbyMatches;
      case "course":
        return courseMatches;
      default:
        return matchedUsers;
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}` as any);
  };

  const renderMatchCard = ({ item }: { item: MatchedUser }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        <View style={styles.cardInfo}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          <Text style={styles.department}>
            {item.department} {item.year}年
          </Text>
        </View>
        <View
          style={[
            styles.matchBadge,
            item.matchType === "both" && styles.matchBadgeBoth,
            item.matchType === "course" && styles.matchBadgeCourse,
          ]}
        >
          {item.matchType === "both" && <Sparkles size={12} color="#fff" />}
          {item.matchType === "hobby" && <Heart size={12} color="#fff" />}
          {item.matchType === "course" && <BookOpen size={12} color="#fff" />}
          <Text style={styles.matchBadgeText}>
            {item.matchType === "both" && "趣味&授業"}
            {item.matchType === "hobby" && "趣味"}
            {item.matchType === "course" && "授業"}
          </Text>
        </View>
      </View>

      {item.matchedHobbies.length > 0 && (
        <View style={styles.matchSection}>
          <View style={styles.matchLabelRow}>
            <Heart size={14} color="#F59E0B" />
            <Text style={styles.matchLabel}>共通の趣味</Text>
          </View>
          <View style={styles.tagList}>
            {item.matchedHobbies.map((hobby) => (
              <View key={hobby} style={styles.hobbyTag}>
                <Text style={styles.hobbyTagText}>{hobby}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {item.matchedCourses.length > 0 && (
        <View style={styles.matchSection}>
          <View style={styles.matchLabelRow}>
            <BookOpen size={14} color={colors.primary} />
            <Text style={styles.matchLabel}>同じ授業</Text>
          </View>
          <View style={styles.tagList}>
            {item.matchedCourses.map((course) => (
              <View key={course} style={styles.courseTag}>
                <Text style={styles.courseTagText}>{course}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.bioPreview} numberOfLines={2}>
          {item.bio || "プロフィールを見る"}
        </Text>
        <ChevronRight size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Sparkles size={48} color={colors.borderLight} />
      <Text style={styles.emptyTitle}>マッチするユーザーがいません</Text>
      <Text style={styles.emptySubtitle}>
        プロフィールで趣味や授業を追加すると{"\n"}
        同じ興味を持つ仲間を見つけやすくなります
      </Text>
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => router.push("/(tabs)/profile/edit" as any)}
      >
        <Text style={styles.editProfileButtonText}>プロフィールを編集</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{hobbyMatches.length}</Text>
          <Text style={styles.statLabel}>趣味が同じ</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{courseMatches.length}</Text>
          <Text style={styles.statLabel}>授業が同じ</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("all")}
        >
          <Sparkles
            size={16}
            color={filter === "all" ? "#fff" : colors.textMuted}
          />
          <Text
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            すべて
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "hobby" && styles.filterButtonHobby,
          ]}
          onPress={() => setFilter("hobby")}
        >
          <Heart
            size={16}
            color={filter === "hobby" ? "#fff" : colors.textMuted}
          />
          <Text
            style={[
              styles.filterText,
              filter === "hobby" && styles.filterTextActive,
            ]}
          >
            趣味
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "course" && styles.filterButtonCourse,
          ]}
          onPress={() => setFilter("course")}
        >
          <BookOpen
            size={16}
            color={filter === "course" ? "#fff" : colors.textMuted}
          />
          <Text
            style={[
              styles.filterText,
              filter === "course" && styles.filterTextActive,
            ]}
          >
            授業
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>ログインが必要です</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={getFilteredUsers()}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          getFilteredUsers().length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: colors.surface,
    paddingBottom: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  supabaseButton: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: colors.surfaceHover,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  supabaseButtonText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 24,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surfaceHover,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonHobby: {
    backgroundColor: "#F59E0B",
  },
  filterButtonCourse: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.textMuted,
  },
  filterTextActive: {
    color: "#fff",
  },
  matchCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.borderLight,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
  },
  department: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  matchBadgeBoth: {
    backgroundColor: "#10B981",
  },
  matchBadgeCourse: {
    backgroundColor: colors.primary,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#fff",
  },
  matchSection: {
    marginBottom: 12,
  },
  matchLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  matchLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.textSecondary,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  hobbyTag: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  hobbyTagText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "500" as const,
  },
  courseTag: {
    backgroundColor: colors.tag,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  courseTagText: {
    fontSize: 12,
    color: colors.tagText,
    fontWeight: "500" as const,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bioPreview: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  editProfileButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  editProfileButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#fff",
  },
});
