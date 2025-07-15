import { View, Text, StyleSheet } from 'react-native';
import { ThemedText } from '../components/ThemedText';

export default function Teams() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Equipos</ThemedText>
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
