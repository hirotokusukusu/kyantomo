import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Camera, X, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';
import { HOBBY_SUGGESTIONS, POPULAR_COURSES, DEPARTMENTS } from '@/constants/university';
import { useAuth } from '@/contexts/AuthContext';

export default function SetupProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [department, setDepartment] = useState(user?.department || '');
  const [year, setYear] = useState(user?.year || 1);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState('');
  const [courseInput, setCourseInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face');

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('エラー', 'カメラへのアクセス許可が必要です');
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('エラー', '写真ライブラリへのアクセス許可が必要です');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setAvatarUrl(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Image picker error:', e);
      Alert.alert('エラー', '画像の選択に失敗しました');
    }
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['キャンセル', 'カメラで撮影', 'ライブラリから選択'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage(true);
          } else if (buttonIndex === 2) {
            pickImage(false);
          }
        }
      );
    } else {
      Alert.alert(
        'プロフィール写真を設定',
        '写真の選択方法を選んでください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'カメラで撮影', onPress: () => pickImage(true) },
          { text: 'ライブラリから選択', onPress: () => pickImage(false) },
        ]
      );
    }
  };

  const handleAddHobby = (hobby: string) => {
    const normalizedHobby = hobby.trim();
    if (normalizedHobby && !hobbies.includes(normalizedHobby) && hobbies.length < 10) {
      setHobbies([...hobbies, normalizedHobby]);
      setHobbyInput('');
    }
  };

  const handleRemoveHobby = (hobby: string) => {
    setHobbies(hobbies.filter((h) => h !== hobby));
  };

  const handleAddCourse = (course: string) => {
    const normalizedCourse = course.trim();
    if (normalizedCourse && !courses.includes(normalizedCourse) && courses.length < 10) {
      setCourses([...courses, normalizedCourse]);
      setCourseInput('');
    }
  };

  const handleRemoveCourse = (course: string) => {
    setCourses(courses.filter((c) => c !== course));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!displayName.trim()) {
        Alert.alert('エラー', '表示名を入力してください');
        return;
      }
      if (!department) {
        Alert.alert('エラー', '学部を選択してください');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (hobbies.length === 0) {
        Alert.alert('エラー', '少なくとも1つの趣味を追加してください');
        return;
      }
      setStep(3);
    }
  };

  const handleComplete = async () => {
    if (courses.length === 0) {
      Alert.alert('エラー', '少なくとも1つの授業を追加してください');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        department,
        year,
        hobbies,
        courses,
        avatarUrl,
        profileCompleted: true,
      });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.cameraOverlay}>
            <Camera size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleChangePhoto} style={styles.changePhotoButton}>
          <Text style={styles.changePhotoText}>写真を設定</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>表示名 <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="ニックネームを入力"
          placeholderTextColor={colors.textMuted}
          maxLength={20}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>学部 <Text style={styles.required}>*</Text></Text>
        <View style={styles.departmentGrid}>
          {DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[styles.departmentChip, department === dept && styles.departmentChipSelected]}
              onPress={() => setDepartment(dept)}
            >
              <Text style={[styles.departmentChipText, department === dept && styles.departmentChipTextSelected]}>
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>学年 <Text style={styles.required}>*</Text></Text>
        <View style={styles.yearRow}>
          {[1, 2, 3, 4].map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.yearButton, year === y && styles.yearButtonSelected]}
              onPress={() => setYear(y)}
            >
              <Text style={[styles.yearButtonText, year === y && styles.yearButtonTextSelected]}>
                {y}年
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>自己紹介</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="自己紹介を入力（任意）"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={150}
        />
        <Text style={styles.charCount}>{bio.length}/150</Text>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} keyboardShouldPersistTaps="handled">
      <View style={styles.stepHeader}>
        <Text style={styles.stepDescription}>
          趣味を登録すると、同じ趣味を持つ仲間を見つけやすくなります
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>趣味 <Text style={styles.required}>* 最低1つ</Text></Text>
        <View style={styles.tagInputRow}>
          <TextInput
            style={styles.tagInput}
            value={hobbyInput}
            onChangeText={setHobbyInput}
            placeholder="趣味を追加"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => handleAddHobby(hobbyInput)}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddHobby(hobbyInput)}
          >
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {hobbies.length > 0 && (
          <View style={styles.selectedTags}>
            {hobbies.map((hobby) => (
              <TouchableOpacity
                key={hobby}
                style={styles.selectedTag}
                onPress={() => handleRemoveHobby(hobby)}
              >
                <Text style={styles.selectedTagText}>{hobby}</Text>
                <X size={14} color="#D97706" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>タップして追加</Text>
          <View style={styles.suggestionList}>
            {HOBBY_SUGGESTIONS.filter((h) => !hobbies.includes(h)).map((hobby) => (
              <TouchableOpacity
                key={hobby}
                style={styles.suggestionTag}
                onPress={() => handleAddHobby(hobby)}
              >
                <Text style={styles.suggestionTagText}>{hobby}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} keyboardShouldPersistTaps="handled">
      <View style={styles.stepHeader}>
        <Text style={styles.stepDescription}>
          履修中の授業を登録すると、同じ授業を取っている仲間を見つけやすくなります
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>履修中の授業 <Text style={styles.required}>* 最低1つ</Text></Text>
        <View style={styles.tagInputRow}>
          <TextInput
            style={styles.tagInput}
            value={courseInput}
            onChangeText={setCourseInput}
            placeholder="授業名を追加"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => handleAddCourse(courseInput)}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddCourse(courseInput)}
          >
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {courses.length > 0 && (
          <View style={styles.selectedTags}>
            {courses.map((course) => (
              <TouchableOpacity
                key={course}
                style={styles.courseTag}
                onPress={() => handleRemoveCourse(course)}
              >
                <Text style={styles.courseTagText}>{course}</Text>
                <X size={14} color={colors.tagText} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>人気の授業</Text>
          <View style={styles.suggestionList}>
            {POPULAR_COURSES.filter((c) => !courses.includes(c)).map((course) => (
              <TouchableOpacity
                key={course}
                style={styles.suggestionTag}
                onPress={() => handleAddCourse(course)}
              >
                <Text style={styles.suggestionTagText}>{course}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>プロフィール設定</Text>
        <Text style={styles.headerSubtitle}>ステップ {step} / 3</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <Text style={styles.stepTitle}>
        {step === 1 && '基本情報'}
        {step === 2 && '趣味を登録'}
        {step === 3 && '履修中の授業'}
      </Text>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
          onPress={step === 3 ? handleComplete : handleNextStep}
          disabled={isSaving}
        >
          <Text style={styles.nextButtonText}>
            {isSaving ? '保存中...' : step === 3 ? '完了' : '次へ'}
          </Text>
          {step < 3 && <ChevronRight size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  stepDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.borderLight,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  changePhotoButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  departmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  departmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  departmentChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  departmentChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
  },
  departmentChipTextSelected: {
    color: '#fff',
  },
  yearRow: {
    flexDirection: 'row',
    gap: 12,
  },
  yearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  yearButtonTextSelected: {
    color: '#fff',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tag,
    borderRadius: 12,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500' as const,
  },
  courseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tag,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  courseTagText: {
    fontSize: 14,
    color: colors.tagText,
    fontWeight: '500' as const,
  },
  suggestions: {
    marginTop: 20,
  },
  suggestionsLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  suggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionTagText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceHover,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
