import { View, Text, StyleSheet } from 'react-native';
import { ThemedText } from '../components/ThemedText';

export default function Standings() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Tabla de Posiciones</ThemedText>
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
