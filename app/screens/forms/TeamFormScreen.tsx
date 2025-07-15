import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';

interface TeamFormScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  teamId?: string;
}

const TeamFormScreen: React.FC<TeamFormScreenProps> = ({ navigation, teamId }) => {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    try {
      // Aquí iría la lógica para guardar el equipo en Supabase
      // Por ahora, solo navegamos de vuelta
      navigation.goBack();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{teamId ? 'Editar Equipo' : 'Nuevo Equipo'}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre del Equipo"
        value={name}
        onChangeText={setName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="URL del Logo"
        value={logo}
        onChangeText={setLogo}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{teamId ? 'Actualizar' : 'Crear'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TeamFormScreen;
