import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

type CategoryFormParams = {
  categoryId?: string;
};

export default function AdminCategories() {
  const router = useRouter();
  const params = useLocalSearchParams<CategoryFormParams>();
  const { state: { user, isAdmin } } = useAuth();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const isEdit = !!params.categoryId && params.categoryId !== 'new';
  const isCreating = params.categoryId === 'new';

  // Función para cargar categorías
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      setCategories(data || []);

      // Si estamos en modo edición, cargar los datos de la categoría específica
      if (params.categoryId && params.categoryId !== 'new') {
        const category = data?.find(cat => cat.id === params.categoryId);
        if (category) {
          setName(category.name || '');
        }
      } else if (params.categoryId === 'new') {
        setName('');
      }
    } catch (error) {
      console.error('Error al cargar las categorías:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar categorías al iniciar el componente o cuando cambia categoryId
  useEffect(() => {
    loadCategories();
    
    // Reset form when entering edit mode
    if (params.categoryId && params.categoryId !== 'new') {
      const category = categories.find(cat => cat.id === params.categoryId);
      if (category) {
        setName(category.name || '');
      }
    } else if (params.categoryId === 'new') {
      setName('');
    }
  }, [params.categoryId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es requerido');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Ensure user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No autenticado');
      }
      
      if (isEdit && params.categoryId) {
        const { data, error } = await supabase
          .from('categories')
          .update({ name })
          .eq('id', params.categoryId)
          .select();
          
        if (error) {
          console.error('Error al actualizar:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('No se pudo actualizar la categoría');
        }
        Alert.alert('Éxito', 'Categoría actualizada correctamente');
        await loadCategories(); // Recargar categorías después de la actualización
        router.replace('/(admin)/AdminCategories');
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert([{ 
            name,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (error) {
          console.error('Error al crear:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('No se pudo crear la categoría');
        }
        
        Alert.alert('Éxito', 'Categoría creada correctamente');
        router.replace('/(admin)/AdminCategories');
      }
    } catch (error) {
      console.error('Error al guardar la categoría:', error);
      Alert.alert(
        'Error', 
        'No se pudo guardar la categoría. Verifica que el nombre no esté duplicado y tu conexión a internet.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    // Limpiar el estado de edición
    setName('');
    // Si estamos en modo edición/creación, volver a la lista de categorías
    if (isEdit || isCreating) {
      router.replace('/(admin)/AdminCategories');
    } else {
      // Si estamos en la lista, volver al panel de administración
      router.replace('/(admin)/AdminPanelScreen');
    }
  };

  const handleDelete = async (categoryId: string) => {
    console.log('handleDelete called with categoryId:', categoryId);
    
    if (!categoryId) {
      const error = 'No se pudo identificar la categoría a eliminar.';
      console.error(error);
      Alert.alert('Error', error);
      return;
    }

    // Show confirmation dialog
    const confirmDelete = await new Promise<boolean>((resolve) => {
      // Using Alert.alert with buttons for better mobile compatibility
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar esta categoría?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => resolve(true)
          }
        ]
      );
    });

    if (!confirmDelete) {
      console.log('Delete operation cancelled by user');
      return;
    }

    console.log('Delete confirmed, starting deletion process...');
    
    try {
      // Ensure user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error(authError?.message || 'No autenticado');
      }

      console.log('User authenticated, deleting category...');
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        throw deleteError;
      }

      console.log('Category deleted successfully');
      Alert.alert('Éxito', 'Categoría eliminada correctamente');
      await loadCategories(); // Recargar categorías después de la eliminación
    } catch (error) {
      console.error('Error in delete operation:', error);
      Alert.alert(
        'Error', 
        'No se pudo eliminar la categoría. ' +
        'Asegúrate de que no esté siendo utilizada en ningún otro lugar y que tengas los permisos necesarios.'
      );
    }
  };

  if (isLoading) {
    return (
      <ImageBackground 
        source={require('../assets/images/fondo.jpg')} 
        style={styles.background}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e88e5" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </ImageBackground>
    );
  }

  // Mostrar el formulario si estamos creando o editando
  if (isEdit || isCreating) {
    return (
      <ImageBackground 
        source={require('../assets/images/fondo.jpg')} 
        style={styles.background}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleCancel}
              style={styles.backButton}
              disabled={isSubmitting}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
            </Text>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Nombre de la categoría</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej: Primera División"
              style={styles.input}
              placeholderTextColor="#999"
              editable={!isSubmitting}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleCancel}
                style={[styles.button, styles.cancelButton]}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSubmit}
                style={[
                  styles.button, 
                  styles.submitButton, 
                  isSubmitting && styles.disabledButton
                ]}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isEdit ? 'Actualizar' : 'Crear'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // Mostrar la lista de categorías
  return (
    <ImageBackground 
      source={require('../assets/images/fondo.jpg')} 
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleCancel}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categorías</Text>
          <TouchableOpacity 
            onPress={() => {
              setName('');
              router.push({ pathname: '/(admin)/AdminCategories', params: { categoryId: 'new' } });
            }}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {categories.length > 0 ? (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.categoryItem}>
                  <TouchableOpacity
                    style={styles.categoryInfo}
                    onPress={() => {
                      router.push({
                        pathname: '/(admin)/AdminCategories',
                        params: { categoryId: item.id }
                      });
                    }}
                  >
                    <Text style={styles.categoryName}>{item.name}</Text>
                  </TouchableOpacity>
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setName(item.name);
                        router.push(`/(admin)/AdminCategories?categoryId=${item.id}`);
                      }}
                    >
                      <MaterialIcons name="edit" size={20} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        console.log('Delete button pressed for category:', item.id);
                        handleDelete(item.id).catch(error => {
                          console.error('Error in handleDelete:', error);
                        });
                      }}
                      style={styles.deleteButton}
                    >
                      <MaterialIcons name="delete" size={20} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No hay categorías cargadas</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setName('');
                  router.push('/(admin)/AdminCategories?categoryId=new');
                }}
              >
                <Text style={styles.addButtonText}>Agregar Categoría</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ff6d00',
    paddingVertical: 15,
    paddingHorizontal: 15,
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e65100',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    flex: 1,
    padding: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6d00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#ff6d00',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#ff6d00',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffccbc',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#ff6d00',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff8f0',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
});
