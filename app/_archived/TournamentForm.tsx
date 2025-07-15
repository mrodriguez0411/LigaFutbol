import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '../components/ui/ThemedComponents';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RootStackParamList } from '../types/navigation';

export default function TournamentForm() {
  const router = useRouter();
  const params = useLocalSearchParams() as RootStackParamList['/(tabs)/TournamentForm'];
  const { state: { user, isAdmin } } = useAuth();
  const colorScheme = useColorScheme();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!user || !isAdmin) {
    router.push('/(tabs)/Home');
    return null;
  }

  const handleSubmit = () => {
    // TODO: Implement tournament creation logic
    router.push('/(tabs)/Tournaments');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>
        {params.tournamentId ? 'Editar Torneo' : 'Crear Nuevo Torneo'}
      </ThemedText>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nombre del torneo"
        style={[
          styles.input,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}
      />

      <TextInput
        value={startDate}
        onChangeText={setStartDate}
        placeholder="Fecha de inicio (YYYY-MM-DD)"
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        value={endDate}
        onChangeText={setEndDate}
        placeholder="Fecha de fin (YYYY-MM-DD)"
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
      >
        <ThemedText style={styles.submitButtonText}>
          {params.tournamentId ? 'Guardar Cambios' : 'Crear Torneo'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/Tournaments')}
        style={styles.cancelButton}
      >
        <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    // El color de fondo se aplica dinámicamente usando colorScheme
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
