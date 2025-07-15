import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { supabase } from '@/config/supabase';

interface CategoryFormScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  categoryId?: string;
}

export const CategoryFormScreen: React.FC<CategoryFormScreenProps> = ({ navigation, categoryId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (categoryId) {
      fetchCategoryDetails();
    }
  }, [categoryId]);

  const fetchCategoryDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name, description')
        .eq('id', categoryId)
        .single();

      if (error) throw error;

      setName(data.name);
      setDescription(data.description);
    } catch (error) {
      console.error('Error fetching category details:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles de la categoría');
    }
  };

  const handleSubmit = async () => {
    try {
      const categoryData = {
        name,
        description
      };

      const { data, error } = categoryId 
        ? await supabase
            .from('categories')
            .update(categoryData)
            .eq('id', categoryId)
            .select()
            .single()
        : await supabase
            .from('categories')
            .insert([categoryData])
            .select()
            .single();

      if (error) throw error;

      Alert.alert('Éxito', categoryId ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'No se pudo guardar la categoría');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{categoryId ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{categoryId ? 'Actualizar' : 'Crear'}</Text>
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
