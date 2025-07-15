import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function Calendar() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Calendario</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
