import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Modal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: 16,
    color: colors.text,
  },
});
