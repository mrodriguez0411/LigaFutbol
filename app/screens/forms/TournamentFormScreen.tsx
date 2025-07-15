import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter, useLocalSearchParams } from 'expo-router';
import { RootStackParamList } from '@/types/navigation';
import { supabase } from '@/config/supabase';

interface TournamentFormScreenProps {
  navigation?: any; // Usaremos useNavigation hook en su lugar
  route?: {
    params?: {
      tournamentId?: string;
      categoryId?: string;
    };
  };
}

// Custom picker component since Picker is deprecated in newer React Native versions
const CustomPicker = ({ value, onChange, items }: {
  value: string;
  onChange: (value: string) => void;
  items: Array<{ id: string; name: string }>;
}) => {
  return (
    <View style={styles.pickerContainer}>
      <TextInput
        style={styles.picker}
        value={items.find(item => item.id === value)?.name || ''}
        editable={false}
        onPressIn={() => {
          Alert.alert(
            'Seleccionar Categoría',
            '',
            items.map(item => ({
              text: item.name,
              onPress: () => onChange(item.id)
            }))
          );
        }}
      />
    </View>
  );
};
const TournamentFormScreen: React.FC<TournamentFormScreenProps> = (props) => {
  const navigation = useNavigation<any>();
  const router = useRouter();
  const { tournamentId, categoryId } = props.route?.params || {};
  
  // Obtener parámetros de la URL si se usa con expo-router
  const urlParams = useLocalSearchParams();
  const urlTournamentId = urlParams?.tournamentId as string || '';
  const urlCategoryId = urlParams?.categoryId as string || '';
  
  // Usar los parámetros de la URL si no están en las props
  const finalTournamentId = tournamentId || urlTournamentId;
  const finalCategoryId = categoryId || urlCategoryId;
  // Estados del formulario
  const [name, setName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(finalCategoryId);
  const [completed, setCompleted] = useState<boolean>(false);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (finalTournamentId) {
      fetchTournamentDetails();
    } else {
      fetchCategories();
    }
  }, [finalTournamentId]);

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('name, start_date, description, category_id, completed, image_url')
        .eq('id', finalTournamentId)
        .single();

      if (error) throw error;

      setName(data.name);
      setStartDate(data.start_date);
      setDescription(data.description || '');
      setSelectedCategory(data.category_id);
      setCompleted(data.completed || false);
      // Establecer la URL de la imagen si existe
      if (data.image_url) {
        setImageUri(data.image_url);
      }
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles del torneo');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name');

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Pedir permisos
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso requerido', 
            'Necesitamos acceso a tu galería para subir imágenes',
            [
              {
                text: 'Cancelar',
                style: 'cancel',
              },
              {
                text: 'Abrir configuración',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Resultado del selector de imágenes:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      } else if (result.canceled) {
        console.log('Usuario canceló la selección de imagen');
      } else {
        console.log('No se seleccionó ninguna imagen');
      }
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      setUploading(true);
      
      // Obtener la extensión del archivo
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      
      // Obtener la respuesta de la imagen
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('No se pudo cargar la imagen');
      }
      
      const blob = await response.blob();
      
      // Subir la imagen a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tournament-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: `image/${fileExt}`
        });

      if (uploadError) {
        console.error('Error de Supabase:', uploadError);
        throw new Error('Error al subir la imagen a Supabase');
      }

      // Obtener la URL pública de la imagen
      const { data: { publicUrl } } = supabase.storage
        .from('tournament-images')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la imagen');
      }

      console.log('Imagen subida correctamente:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error en uploadImage:', error);
      Alert.alert('Error', 'No se pudo subir la imagen. Por favor, inténtalo de nuevo.');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validaciones
      if (!name.trim()) {
        Alert.alert('Error', 'El nombre del torneo es requerido');
        return;
      }

      if (!selectedCategory) {
        Alert.alert('Error', 'Debes seleccionar una categoría');
        return;
      }

      setLoading(true);
      
      // Subir la imagen si existe
      let imageUrl = null;
      if (imageUri) {
        try {
          // Verificar si es una URL ya existente o una nueva imagen
          if (!imageUri.startsWith('http')) {
            imageUrl = await uploadImage(imageUri);
          } else {
            imageUrl = imageUri; // Ya es una URL válida
          }
        } catch (error) {
          console.error('Error al procesar la imagen:', error);
          Alert.alert('Error', 'No se pudo procesar la imagen. Por favor, inténtalo de nuevo.');
          return;
        }
      }

      // Preparar datos del torneo
      const tournamentData = {
        name: name.trim(),
        start_date: startDate,
        description: description?.trim() || null,
        category_id: selectedCategory,
        completed: completed || false,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      // Determinar si es una actualización o creación
      const isUpdate = !!finalTournamentId;
      let query;

      if (isUpdate) {
        query = supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', finalTournamentId);
      } else {
        query = supabase
          .from('tournaments')
          .insert([{ ...tournamentData, created_at: new Date().toISOString() }]);
      }

      // Ejecutar la consulta
      const { data: savedTournament, error: queryError } = await query.select().single();

      if (queryError) {
        console.error('Error de Supabase:', queryError);
        throw new Error('Error al guardar en la base de datos');
      }

      // Mostrar mensaje de éxito
      Alert.alert(
        '¡Éxito!', 
        isUpdate ? 'Torneo actualizado correctamente' : 'Torneo creado correctamente',
        [
          {
            text: 'Aceptar',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                router.back();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      Alert.alert(
        'Error', 
        'No se pudo guardar el torneo. Por favor, verifica los datos e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Render category picker
  const renderCategoryPicker = () => {
    const categoryName = selectedCategory 
      ? categories.find(cat => cat.id === selectedCategory)?.name 
      : 'Seleccionar Categoría';
      
    return (
      <View style={styles.pickerContainer}>
        <TextInput
          style={styles.picker}
          value={categoryName}
          placeholder="Seleccionar Categoría"
          placeholderTextColor="#999"
          editable={false}
          onPressIn={() => {
            Alert.alert(
              'Seleccionar Categoría',
              '',
              [
                ...categories.map(item => ({
                  text: item.name,
                  onPress: () => setSelectedCategory(item.id)
                })),
                {
                  text: 'Cancelar',
                  style: 'cancel'
                }
              ]
            );
          }}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>
        {finalTournamentId ? 'Editar Torneo' : 'Nuevo Torneo'}
      </Text>
      
      {/* Sección de imagen */}
      <View style={styles.imageSection}>
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.imagePreview} 
              resizeMode="cover"
              onError={(e) => {
                console.log('Error al cargar la imagen:', e.nativeEvent.error);
                setImageUri(null);
              }}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image" size={50} color="#ccc" />
              <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.imageButton} 
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.imageButtonText}>
              {imageUri ? 'Cambiar imagen' : 'Seleccionar imagen'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre del torneo"
        value={name}
        onChangeText={setName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Fecha de inicio"
        value={startDate}
        onChangeText={setStartDate}
        keyboardType="numeric"
      />
      
      {renderCategoryPicker()}
      
      <TextInput
        style={styles.input}
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            completed && styles.checkboxChecked
          ]}
          onPress={() => setCompleted(!completed)}
        >
          {completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>Torneo completado</Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, {flex: 1, marginRight: 8}]}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              router.back();
            }
          }}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.submitButton, {flex: 1, marginLeft: 8}]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {finalTournamentId ? 'Actualizar' : 'Crear'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#888',
    marginTop: 8,
  },
  imageButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  imageButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  picker: {
    padding: 12,
    fontSize: 16,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    minHeight: 50,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
});

export default TournamentFormScreen;
