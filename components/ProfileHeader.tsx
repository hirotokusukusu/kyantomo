import { View, Text, StyleSheet, Image } from 'react-native';
import { BookOpen, GraduationCap, Sparkles } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { User } from '@/types';

interface ProfileHeaderProps {
  user: User;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatarSection}>
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        <View style={styles.nameSection}>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.department}>
            {user.department} · {user.year}年
          </Text>
        </View>
      </View>

      {user.bio ? (
        <Text style={styles.bio}>{user.bio}</Text>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Sparkles size={16} color={colors.accent} />
          <Text style={styles.sectionTitle}>趣味</Text>
        </View>
        {user.hobbies.length > 0 ? (
          <View style={styles.tagContainer}>
            {user.hobbies.map((hobby, index) => (
              <View key={index} style={styles.hobbyTag}>
                <Text style={styles.hobbyText}>{hobby}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>まだ設定されていません</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <BookOpen size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>履修中の授業</Text>
        </View>
        {user.courses.length > 0 ? (
          <View style={styles.tagContainer}>
            {user.courses.map((course, index) => (
              <View key={index} style={styles.courseTag}>
                <Text style={styles.courseText}>{course}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>まだ設定されていません</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: colors.borderLight,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: colors.borderLight,
  },
  nameSection: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  department: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hobbyTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hobbyText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500' as const,
  },
  courseTag: {
    backgroundColor: colors.tag,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  courseText: {
    fontSize: 14,
    color: colors.tagText,
    fontWeight: '500' as const,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
