import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Image,
  Switch,
  Platform,
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/config/supabase';
import { StackActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { HoverTooltip } from '../../components/HoverTooltip';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

// Types
type Category = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  position?: string | null;
  number?: string | null;
  team_id?: string | null;
  photo_url?: string | null;
};

type TeamFormData = {
  id?: string;
  name: string;
  category_id: string | null;
  logo_url?: string | null;
};

export default function TeamForm() {
  const params = useLocalSearchParams<{ id?: string; teamId?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  
  // Obtener el ID del equipo de cualquiera de los dos parámetros
  const teamId = params.id || params.teamId;
  
  // State
  const [loading, setLoading] = useState(!!teamId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    category_id: null,
    logo_url: null
  });

  // Handle input changes
  const handleInputChange = (field: keyof TeamFormData, value: any) => {
    console.log(`Updating ${field} with value:`, value);
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [field]: value
      };
      console.log('Updated form data:', updatedData);
      return updatedData;
    });
  };

  // Fetch categories from Supabase
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      console.log('Categorías obtenidas de la base de datos:', data);
      setCategories(data || []);
      
      // If there's only one category, select it automatically
      if (data?.length === 1) {
        setFormData(prev => ({
          ...prev,
          category_id: data[0].id
        }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch team data if in edit mode
  const fetchTeam = useCallback(async () => {
    if (!teamId) {
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      if (data) {
        console.log('Datos del equipo cargados:', data);
        setFormData(prev => ({
          ...prev,
          id: data.id,
          name: data.name,
          category_id: data.category_id,
          logo_url: data.logo_url
        }));
        setImageUrl(data.logo_url);
      }
    } catch (error) {
      console.error('Error loading team:', error);
      Alert.alert('Error', 'No se pudo cargar el equipo');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Save team
  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      
      // Upload image if there's a new one
      let logoUrl = formData.logo_url;
      if (tempImage) {
        logoUrl = await uploadImage(tempImage);
      }

      // Prepare team data
      const teamData = {
        name: formData.name,
        category_id: formData.category_id,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      };

      let result;
      if (teamId) {
        // Update existing team
        const { data, error } = await supabase
          .from('teams')
          .update(teamData)
          .eq('id', teamId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new team
        const { data, error } = await supabase
          .from('teams')
          .insert([{ ...teamData, created_at: new Date().toISOString() }])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }

      Alert.alert(
        'Éxito', 
        teamId ? 'Equipo actualizado correctamente' : 'Equipo creado correctamente',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // @ts-ignore
              navigation.dispatch(
                StackActions.replace('(admin)/teams')
              );
            } 
          }
        ]
      );
    } catch (error) {
      console.error('Error saving team:', error);
      Alert.alert('Error', 'No se pudo guardar el equipo');
    } finally {
      setSaving(false);
    }
  };

  // Subir imagen a Supabase Storage
  const uploadImage = useCallback(async (imageUri: string): Promise<string> => {
    console.log('Starting image upload...');
    try {
      setUploading(true);
      
      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('No active session:', sessionError);
        throw new Error('Sesión expirada. Inicia sesión de nuevo.');
      }

      console.log('Processing image...');
      let base64: string;
      
      if (Platform.OS === 'web') {
        console.log('Web platform detected, processing image...');
        try {
          const response = await fetch(imageUri);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          const blob = await response.blob();
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result?.toString();
              if (!result) {
                return reject(new Error('Failed to read image data'));
              }
              // Remove data URL prefix if present
              const base64Data = result.includes(',') ? result.split(',')[1] : result;
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error processing image in web:', error);
          throw new Error('Error al procesar la imagen: ' + (error instanceof Error ? error.message : String(error)));
        }
      } else {
        console.log('Mobile platform detected, reading file...');
        try {
          base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (error) {
          console.error('Error reading file on mobile:', error);
          throw new Error('Error al leer el archivo de imagen');
        }
      }

      if (!base64) {
        throw new Error('No se pudo procesar la imagen');
      }

      const fileName = `team_${Date.now()}.jpg`;
      const filePath = `team-logos/${fileName}`;
      
      console.log('Uploading image to Supabase Storage...');
      
      try {
        // Convert base64 to ArrayBuffer
        const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('team-logos')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading to Supabase Storage:', uploadError);
          throw new Error('Error al subir la imagen a Supabase: ' + uploadError.message);
        }

        console.log('Image uploaded successfully:', uploadData);
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('team-logos')
          .getPublicUrl(filePath);
        
        console.log('Generated public URL:', publicUrl);
        return publicUrl;
        
      } catch (uploadError) {
        console.error('Error in upload process:', uploadError);
        throw new Error('Error en el proceso de carga: ' + (uploadError instanceof Error ? uploadError.message : String(uploadError)));
      }
      
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw new Error('Error al subir la imagen: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setUploading(false);
    }
  }, []);

  // Check internet connection
  const checkInternetConnection = useCallback(async (): Promise<boolean> => {
    // En React Native, no podemos confiar en window.navigator
    // Intentamos directamente con Supabase
    try {
      console.log('Verificando conexión a Internet...');
      
      // Hacemos una petición simple a Supabase
      const { data, error } = await supabase
        .from('categories')  // Usamos una tabla que sabemos que existe
        .select('*')
        .limit(1);
      
      // Si no hay error, asumimos que hay conexión
      if (!error) {
        console.log('Conexión a Internet confirmada');
        return true;
      }
      
      console.error('Error al verificar conexión con Supabase:', error);
      return false;
      
    } catch (error) {
      console.error('Error al verificar conexión a Internet:', error);
      return false;
    }
  }, []);

  // Comprimir imagen
  const compressImage = async (uri: string): Promise<string> => {
    try {
      console.log('Comprimiendo imagen...');
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { 
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );
      
      if (!manipResult.base64) {
        throw new Error('No se pudo procesar la imagen correctamente');
      }
      return manipResult.base64;
    } catch (error) {
      console.error('Error en compressImage:', error);
      throw error;
    }
  };

  // Pick image from gallery
  const pickImage = useCallback(async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu galería para seleccionar una imagen.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false
      });

      if (result.canceled || !result.assets?.[0]) {
        return; // Usuario canceló la selección
      }

      const selectedAsset = result.assets[0];
      setTempImage(selectedAsset.uri);
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      Alert.alert(
        'Error', 
        'No se pudo seleccionar la imagen. Por favor, inténtalo de nuevo.'
      );
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (): Promise<boolean> => {
    console.log('=== Form Submission Started ===');
    console.log('Form Data:', JSON.stringify(formData, null, 2));
    console.log('Team ID:', teamId);
    console.log('Has temp image:', !!tempImage);
    
    try {
      // Validate required fields
      console.log('Validating form data...');
      
      if (!formData.name?.trim()) {
        const error = 'Por favor ingresa el nombre del equipo';
        console.error('Validation failed:', error);
        Alert.alert('Error', error);
        return false;
      }
      
      if (!formData.category_id) {
        const error = 'Por favor selecciona una categoría';
        console.error('Validation failed:', error);
        Alert.alert('Error', error);
        return false;
      }
      
      console.log('Form validation passed');
      
      // Check internet connection
      console.log('Checking internet connection...');
      const hasInternet = await checkInternetConnection();
      if (!hasInternet) {
        const error = 'No hay conexión a internet. Por favor verifica tu conexión e inténtalo de nuevo.';
        console.error('Internet check failed:', error);
        Alert.alert('Sin conexión', error);
        return false;
      }
      
      console.log('Internet connection verified');
      
      setSaving(true);
      
      // Handle image upload if a new image was selected
      let finalLogoUrl = formData.logo_url || null;
      if (tempImage) {
        try {
          console.log('Starting image upload...');
          console.log('Image URI:', tempImage);
          
          // Verify image exists and is accessible
          if (Platform.OS !== 'web') {
            const fileInfo = await FileSystem.getInfoAsync(tempImage);
            console.log('Image file info:', fileInfo);
            if (!fileInfo.exists) {
              throw new Error('La imagen seleccionada no existe o no es accesible');
            }
          }
          
          const uploadedUrl = await uploadImage(tempImage);
          console.log('Image uploaded successfully. URL:', uploadedUrl);
          
          // Verify the URL is accessible
          if (Platform.OS === 'web') {
            try {
              const response = await fetch(uploadedUrl);
              if (!response.ok) {
                console.warn('Warning: Uploaded image URL is not accessible:', response.status);
              }
            } catch (e) {
              console.warn('Warning: Could not verify image URL accessibility:', e);
            }
          }
          
          finalLogoUrl = uploadedUrl;
          setImageUrl(uploadedUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          throw new Error(
            'Error al subir la imagen: ' + 
            (uploadError instanceof Error ? uploadError.message : 'Error desconocido')
          );
        }
      } else {
        console.log('No new image to upload');
      }
      
      // Obtener el ID del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No se pudo obtener la información del usuario autenticado');
      }

      // Solo incluir los campos que existen en la base de datos
      const teamToSave: Record<string, any> = {
        name: formData.name.trim(),
        category_id: formData.category_id,
        user_id: user.id  // Asegurarse de que el equipo esté asociado al usuario
      };

      // Solo incluir logo_url si tiene un valor
      if (finalLogoUrl) {
        teamToSave.logo_url = finalLogoUrl;
      }
      
      console.log('=== DATOS A GUARDAR ===');
      console.log('Tabla: teams');
      console.log('Datos:', JSON.stringify(teamToSave, null, 2));
      console.log('URL de la imagen:', finalLogoUrl);
      console.log('========================');
      
      // Save or update team
      if (teamId) {
        console.log('Updating existing team with ID:', teamId);
        
        // Para actualización, usamos .update() con .eq()
        const { data, error } = await supabase
          .from('teams')
          .update(teamToSave)
          .eq('id', teamId)
          .select()
          .single();
          
        console.log('Update response:', { data, error });
        
        if (error) {
          console.error('Failed to update team:', error);
          throw new Error(
            'No se pudo actualizar el equipo: ' + 
            (error.message || 'Error desconocido')
          );
        }
        
        console.log('Team updated successfully:', data);
        Alert.alert('¡Éxito!', 'El equipo se actualizó correctamente');
      } else {
        console.log('Creating new team');
        
        // Para creación, usamos .insert() con un array de objetos
        console.log('=== INTENTANDO CREAR EQUIPO ===');
        console.log('Tabla: teams');
        console.log('Usuario autenticado ID:', user?.id);
        console.log('Datos a insertar:', JSON.stringify([{
          ...teamToSave,
          user_id: user?.id  // Asegurar que user_id esté incluido
        }], null, 2));
        
        const { data, error } = await supabase
          .from('teams')
          .insert([{
            ...teamToSave,
            user_id: user.id  // Incluir el ID del usuario autenticado
          }])
          .select()
          .single();
          
        console.log('=== RESPUESTA DE SUPABASE ===');
        console.log('Data:', data);
        console.log('Error:', error);
        console.log('=============================');
        
        if (error) {
          console.error('Failed to create team:', error);
          // Mostrar más detalles del error
          console.error('Error details:', {
            code: error.code,
            details: error.details,
            hint: error.hint,
            message: error.message
          });
          
          throw new Error(
            'No se pudo crear el equipo: ' + 
            (error.details || error.message || 'Error desconocido')
          );
        }
        
        console.log('Team created successfully:', data);
        Alert.alert('¡Éxito!', 'El equipo se creó correctamente');
      }
      
      // Navigate back
      console.log('Form submission successful. Navigating back...');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.dispatch(StackActions.pop());
      }
      
      return true;
      
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        formData: { ...formData, logo_url: formData.logo_url ? '***URL***' : null }
      };
      
      console.error('Form submission failed:', errorDetails);
      
      // Show user-friendly error message
      const userMessage = error instanceof Error 
        ? error.message 
        : 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
      
      Alert.alert('Error', userMessage);
      return false;
      
    } finally {
      console.log('Form submission process completed');
      setSaving(false);
    }
  }, [formData, tempImage, teamId, navigation, checkInternetConnection, uploadImage]);

  // Cargar categorías al iniciar
  useEffect(() => {
    const loadCategories = async () => {
      console.log('Iniciando carga de categorías...');
      try {
        await fetchCategories();
        console.log('Categorías cargadas correctamente');
      } catch (error) {
        console.error('Error cargando categorías:', error);
        Alert.alert('Error', 'No se pudieron cargar las categorías');
      }
    };

    loadCategories();
  }, [fetchCategories]);

  // Función para cargar los jugadores del equipo
  const fetchTeamPlayers = useCallback(async (teamId: string) => {
    if (!teamId) return;
    
    try {
      setLoadingPlayers(true);
      console.log('Fetching players for team:', teamId);
      
      // Obtenemos los jugadores con los campos necesarios
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('last_name', { ascending: true });
        
      if (error) throw error;
      
      console.log('Players loaded:', data?.length || 0);
      setPlayers(data || []);
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'No se pudieron cargar los jugadores del equipo');
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

  // Cargar datos del equipo si está en modo edición
  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const loadTeam = async () => {
      try {
        console.log('Fetching team data for ID:', teamId);
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (error) throw error;
        
        if (data) {
          const formDataUpdate: Partial<TeamFormData> = {
            name: data.name,
            category_id: data.category_id,
            logo_url: data.logo_url || null
          };
          

          
          setFormData(prev => ({
            ...prev,
            ...formDataUpdate
          }));
          
          if (data.logo_url) {
            setImageUrl(data.logo_url);
          }
          
          // Cargar jugadores del equipo
          await fetchTeamPlayers(teamId);
        }
      } catch (error) {
        console.error('Error loading team:', error);
        Alert.alert('Error', 'No se pudo cargar el equipo');
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [teamId, fetchTeamPlayers]);
  
  // Manejar la actualización cuando se navega de vuelta desde PlayerForm
  useEffect(() => {
    if (teamId) {
      // Forzar una recarga de los jugadores cuando el componente se monta o se actualiza
      // Esto asegura que los datos estén actualizados después de volver de PlayerForm
      console.log('Cargando jugadores del equipo...');
      fetchTeamPlayers(teamId);
    }
  }, [teamId, fetchTeamPlayers]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6D00" />
      </View>
    );
  }

  // Función para navegar a la pantalla de edición/creación de jugador

  // Función para manejar la eliminación de un jugador
  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    // Mostrar confirmación antes de eliminar
    Alert.alert(
      'Eliminar Jugador',
      `¿Estás seguro de que deseas eliminar a ${playerName}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingPlayers(true);
              const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', playerId);

              if (error) throw error;
              
              // Actualizar la lista de jugadores
              if (teamId) {
                await fetchTeamPlayers(teamId);
              }
              
              Alert.alert('Éxito', 'Jugador eliminado correctamente');
            } catch (error) {
              console.error('Error al eliminar el jugador:', error);
              Alert.alert('Error', 'No se pudo eliminar el jugador');
            } finally {
              setLoadingPlayers(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Función para manejar la suspensión de un jugador
  const handleSuspendPlayer = (playerId: string) => {
    // TODO: Implementar lógica de suspensión
    Alert.alert(
      'Suspender Jugador',
      'Funcionalidad de suspensión en desarrollo',
      [
        {
          text: 'Aceptar',
          style: 'default',
        },
      ]
    );
  };

  const navigateToPlayerForm = (playerId?: string) => {
    if (!teamId) return;
    
    if (playerId) {
      // Navegar a la edición de jugador existente
      router.push({
        pathname: '/(admin)/PlayerForm',
        params: { 
          playerId: playerId,
          teamId: teamId 
        }
      });
    } else {
      // Navegar a la creación de nuevo jugador
      router.push({
        pathname: '/(admin)/PlayerForm',
        params: { 
          teamId: teamId 
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {teamId ? 'Editar Equipo' : 'Nuevo Equipo'}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Logo del Equipo</Text>
          <TouchableOpacity 
            style={styles.imagePicker}
            onPress={pickImage}
            disabled={uploading}
          >
            {tempImage || imageUrl ? (
              <Image 
                source={{ uri: tempImage || imageUrl || '' }} 
                style={styles.teamImage} 
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color="#999" />
                <Text style={styles.imagePlaceholderText}>Seleccione Logo</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre del Equipo *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Ingrese el nombre del Equipo"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category_id || ''}
              onValueChange={(itemValue: string) => {
                handleInputChange('category_id', itemValue || null);
              }}
              style={styles.picker}
              dropdownIconColor="#666"
            >
              <Picker.Item label="Seleccione una categoría" value="" />
              {categories.map((category) => (
                <Picker.Item 
                  key={category.id} 
                  label={category.name} 
                  value={category.id}
                />
              ))}
            </Picker>
          </View>
          {!formData.category_id && (
            <Text style={styles.errorText}>Por favor selecciona una categoría</Text>
          )}
        </View>

        {teamId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jugadores del Equipo</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigateToPlayerForm()}
                disabled={!teamId}
              >
                <Ionicons name="add-circle" size={24} color="#FF6D00" />
                <Text style={styles.addButtonText}>Agregar Jugador</Text>
              </TouchableOpacity>
            </View>
            
            {loadingPlayers ? (
              <ActivityIndicator size="small" color="#FF6D00" style={styles.loadingIndicator} />
            ) : players.length === 0 ? (
              <Text style={styles.emptyText}>No hay jugadores en este equipo</Text>
            ) : (
              <View style={styles.playersList}>
                {players.map((player, index) => (
                  <TouchableOpacity 
                    key={player.id} 
                    style={styles.playerItem}
                    onPress={() => navigateToPlayerForm(player.id)}
                  >
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.playerInfoContainer}>
                      {player.photo_url ? (
                        <Image 
                          source={{ uri: player.photo_url }} 
                          style={styles.playerImage}
                        />
                      ) : (
                        <View style={styles.playerImagePlaceholder}>
                          <Ionicons name="person" size={20} color="#fff" />
                        </View>
                      )}
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>
                          {player.last_name}, {player.first_name}
                        </Text>
                        {player.dni && (
                          <Text style={styles.playerDni}>DNI: {player.dni}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.actionsContainer}>
                      <HoverTooltip content="Editar jugador">
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => navigateToPlayerForm(player.id)}
                        >
                          <Ionicons name="create-outline" size={18} color="white" />
                        </TouchableOpacity>
                      </HoverTooltip>
                      
                      <HoverTooltip content="Gestionar suspensiones">
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.suspendButton]}
                          onPress={() => handleSuspendPlayer(player.id)}
                        >
                          <Ionicons name="alert-circle-outline" size={18} color="white" />
                        </TouchableOpacity>
                      </HoverTooltip>
                      
                      <HoverTooltip content="Eliminar jugador">
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeletePlayer(player.id, `${player.first_name} ${player.last_name}`)}
                        >
                          <Ionicons name="trash-outline" size={18} color="white" />
                        </TouchableOpacity>
                      </HoverTooltip>
                    </View>
                  </TouchableOpacity>
                ))}
                <Text style={styles.totalPlayers}>
                  Total de jugadores: {players.length}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton, (saving || uploading) && styles.saveButtonDisabled]}
          onPress={async () => {
            console.log('Botón presionado - Iniciando submit...');
            console.log('Datos del formulario:', formData);
            console.log('Imagen seleccionada:', tempImage);
            
            try {
              const success = await handleSubmit();
              console.log('handleSubmit completed with success:', success);
            } catch (error) {
              console.error('Error in handleSubmit:', error);
              // El error ya se maneja dentro de handleSubmit
            }
          }}
          disabled={saving || uploading}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {teamId ? 'Actualizar Equipo' : 'Crear Equipo'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para la sección de jugadores
  section: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    color: '#FF6D00',
    marginLeft: 8,
    fontWeight: '500',
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  playersList: {
    marginTop: 12,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  playerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  playerImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  suspendButton: {
    backgroundColor: '#FF9800',
  },
  tooltipContentContainer: {
    padding: 8,
    borderRadius: 4,
  },
  tooltipContent: {
    color: 'white',
    fontSize: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  playerDni: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  header: {
    backgroundColor: '#121212',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24,
  },
  content: {
    flex: 1,
    padding: 15,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePicker: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  teamImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#999',
    textAlign: 'center',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonSelected: {
    backgroundColor: '#FF6D00',
    borderColor: '#FF6D00',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FF6D00',
  },
  saveButtonDisabled: {
    backgroundColor: '#FFB07F',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  picker: {
    width: '100%',
    backgroundColor: '#fff',
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Player management
  inputGroup: {
    marginBottom: 16,
  },
  playerForm: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 12,
  },
  emptyStateText: {
    marginTop: 12,
    color: '#999',
    textAlign: 'center',
  },
  addButtonSmall: {
    padding: 8,
    marginLeft: 8,
  },
  playerNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6D00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  totalPlayers: {
    textAlign: 'right',
    marginTop: 10,
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});