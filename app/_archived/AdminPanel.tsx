import { View, StyleSheet } from 'react-native';
import { ThemedText } from '../components/ThemedText';

export default function AdminPanel() {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Panel de Administrador</ThemedText>
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
