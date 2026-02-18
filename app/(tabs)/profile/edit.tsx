import { useState, useEffect } from 'react';
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
import { X, Plus, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';
import { HOBBY_SUGGESTIONS, POPULAR_COURSES } from '@/constants/university';
import { useAuth } from '@/contexts/AuthContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState('');
  const [courseInput, setCourseInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio);
      setHobbies(user.hobbies);
      setCourses(user.courses);
      setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

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
        'プロフィール写真を変更',
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

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        hobbies,
        courses,
        avatarUrl,
      });
      router.back();
    } catch (error) {
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarContainer}>
            <Image source={{ uri: avatarUrl || user.avatarUrl }} style={styles.avatar} />
            <View style={styles.cameraOverlay}>
              <Camera size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>写真を変更</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>表示名</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="表示名を入力"
            placeholderTextColor={colors.textMuted}
            maxLength={20}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>自己紹介</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="自己紹介を入力"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={150}
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>趣味</Text>
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
            <Text style={styles.suggestionsLabel}>おすすめ</Text>
            <View style={styles.suggestionList}>
              {HOBBY_SUGGESTIONS.filter((h) => !hobbies.includes(h))
                .slice(0, 8)
                .map((hobby) => (
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

        <View style={styles.section}>
          <Text style={styles.label}>履修中の授業</Text>
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
              {POPULAR_COURSES.filter((c) => !courses.includes(c))
                .slice(0, 6)
                .map((course) => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
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
    borderColor: colors.surface,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
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
  tagInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
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
    paddingVertical: 6,
    borderRadius: 14,
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
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  courseTagText: {
    fontSize: 14,
    color: colors.tagText,
    fontWeight: '500' as const,
  },
  suggestions: {
    marginTop: 16,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  suggestionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionTag: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  suggestionTagText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
