import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '../components/ui/ThemedComponents';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RootStackParamList } from '../types/navigation';

export default function TeamForm() {
  const router = useRouter();
  const params = useLocalSearchParams() as RootStackParamList['/(tabs)/TeamForm'];
  const { state: { user, isAdmin } } = useAuth();
  const colorScheme = useColorScheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [logo, setLogo] = useState('');

  if (!user || !isAdmin) {
    router.push('/(tabs)/Home');
    return null;
  }

  const handleSubmit = () => {
    // TODO: Implement team creation logic
    router.push('/(tabs)/Teams');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>
        {params.teamId ? 'Editar Equipo' : 'Crear Nuevo Equipo'}
      </ThemedText>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nombre del equipo"
        style={[
          styles.input,
          { backgroundColor: Colors[colorScheme as 'light' | 'dark'].background }
        ]}
      />

      <TextInput
        value={category}
        onChangeText={setCategory}
        placeholder="Categoría"
        style={[
          styles.input,
          { backgroundColor: Colors[colorScheme as 'light' | 'dark'].background }
        ]}
      />

      <TextInput
        value={logo}
        onChangeText={setLogo}
        placeholder="URL del logo"
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
          {params.teamId ? 'Guardar Cambios' : 'Crear Equipo'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/Teams')}
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
