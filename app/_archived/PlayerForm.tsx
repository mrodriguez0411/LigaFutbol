import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '../components/ui/ThemedComponents';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RootStackParamList } from '../types/navigation';

export default function PlayerForm() {
  const router = useRouter();
  const params = useLocalSearchParams() as RootStackParamList['/(tabs)/PlayerForm'];
  const { state: { user, isAdmin } } = useAuth();
  const colorScheme = useColorScheme();
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [team, setTeam] = useState('');
  const [number, setNumber] = useState('');

  if (!user || !isAdmin) {
    router.push('/(tabs)/Home');
    return null;
  }

  const handleSubmit = () => {
    // TODO: Implement player creation logic
    router.push('/(tabs)/Players');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>
        {params.playerId ? 'Editar Jugador' : 'Crear Nuevo Jugador'}
      </ThemedText>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nombre del jugador"
        style={[
          styles.input,
          { backgroundColor: Colors[colorScheme as 'light' | 'dark'].background }
        ]}
      />

      <TextInput
        value={position}
        onChangeText={setPosition}
        placeholder="Posición"
        style={[
          styles.input,
          { backgroundColor: Colors[colorScheme as 'light' | 'dark'].background }
        ]}
      />

      <TextInput
        value={team}
        onChangeText={setTeam}
        placeholder="Equipo"
        style={[
          styles.input,
          { backgroundColor: Colors[colorScheme as 'light' | 'dark'].background }
        ]}
      />

      <TextInput
        value={number}
        onChangeText={setNumber}
        placeholder="Número"
        keyboardType="numeric"
        style={[
          styles.input,
          { backgroundColor: Colors[colorScheme as 'light' | 'dark'].background }
        ]}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
      >
        <ThemedText style={styles.submitButtonText}>
          {params.playerId ? 'Guardar Cambios' : 'Crear Jugador'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/Players')}
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
    // backgroundColor dinámico en el componente
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
