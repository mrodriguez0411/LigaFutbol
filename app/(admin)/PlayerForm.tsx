import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Alert, 
  Platform,
  StyleProp,
  TextStyle,
  ViewStyle,
  ImageStyle,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import TeamSelector from './components/TeamSelector';

type PlayerStatus = 'active' | 'suspended';
// Usaremos el input nativo de fecha en web
const isWeb = Platform.OS === 'web';

// Solo importamos DateTimePicker para móviles
let DateTimePicker: any = null;
if (!isWeb) {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (error) {
    console.warn('DateTimePicker no está disponible:', error);
  }
}
import { supabase } from '@/config/supabase';

// Define web-specific style properties
interface WebStyleProps {
  cursor?: 'pointer' | 'default' | 'not-allowed' | 'text' | 'move' | 'grab' | 'grabbing' | 'zoom-in' | 'zoom-out';
  userSelect?: 'none' | 'auto' | 'text' | 'contain' | 'all';
  boxSizing?: 'border-box' | 'content-box' | 'initial' | 'inherit';
  WebkitOverflowScrolling?: 'auto' | 'touch';
  WebkitAppearance?: string;
  WebkitTapHighlightColor?: string;
  WebkitTextFillColor?: string;
  WebkitUserSelect?: string;
  WebkitTouchCallout?: string;
}

// Create a type that combines React Native styles with web-specific props
type WebViewStyle = ViewStyle & WebStyleProps;
type WebTextStyle = TextStyle & WebStyleProps;
type WebImageStyle = ImageStyle & WebStyleProps;

type StyleType = StyleProp<ViewStyle> | StyleProp<TextStyle> | StyleProp<ImageStyle> | WebViewStyle | WebTextStyle | WebImageStyle;

// Tipos de datos
interface PlayerFormData {
  id?: string;
  first_name: string;
  last_name: string;
  dni: string;
  date_of_birth: string | null;
  email: string | null;
  address: string | null;
  photo_url?: string | null;
  team_id?: string | null;
  number?: string | null;
  status?: 'active' | 'suspended';
};

export default function PlayerForm() {
  const { playerId, teamId } = useLocalSearchParams<{ playerId?: string; teamId?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date('2000-01-01'));
  const [birthDate, setBirthDate] = useState<Date>(new Date('2000-01-01'));
  
  // Estado para rastrear si el formulario ha sido tocado
  const [formTouched, setFormTouched] = useState(false);
  
  // Inicializar formulario con valores por defecto
  const [formData, setFormData] = useState<PlayerFormData>({
    first_name: '',
    last_name: '',
    dni: '',
    date_of_birth: null,
    email: '',
    address: '',
    team_id: teamId || null,
    status: 'active',
  });
  
  // Función para manejar cambios en los inputs
  const handleInputChange = (field: keyof PlayerFormData, value: string | null) => {
    setFormTouched(true);
    console.log(`Campo ${field} cambiado a:`, value);
    
    // Manejar campos que deben ser null cuando están vacíos
    const processedValue = (value === '' || value === undefined) ? null : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  // Cargar datos del jugador si estamos editando
  useEffect(() => {
    const loadPlayerData = async () => {
      if (!playerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Cargando datos del jugador con ID:', playerId);
        
        // Obtener datos del jugador con información del equipo si tiene
        const { data, error } = await supabase
          .from('players')
          .select(`
            *,
            teams (
              id,
              name
            )
          `)
          .eq('id', playerId)
          .single();

        if (error) {
          console.error('Error cargando jugador:', error);
          Alert.alert('Error', 'No se pudo cargar la información del jugador');
          return;
        }

        if (!data) {
          setLoading(false);
          return;
        }

        // Mapear los datos del jugador al formulario
        const playerData: PlayerFormData = {
          id: data.id,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          dni: data.dni || '',
          email: data.email || null,
          address: data.address || null,
          team_id: data.team_id || teamId || null,
          status: data.status || 'active',
          date_of_birth: data.date_of_birth || null,
          photo_url: data.photo_url || null
        };

        // Actualizar el estado del formulario
        setFormData(playerData);

        // Configurar la fecha de nacimiento si existe
        if (data.date_of_birth) {
          try {
            const parsedDate = new Date(data.date_of_birth);
            if (!isNaN(parsedDate.getTime())) {
              setBirthDate(parsedDate);
              setDate(parsedDate);
            } else {
              console.warn('Fecha de nacimiento inválida:', data.date_of_birth);
            }
          } catch (dateError) {
            console.error('Error al procesar la fecha de nacimiento:', dateError);
          }
        }

        // Cargar la imagen si existe
        if (data.photo_url) {
          setTempImage(data.photo_url);
        }
      } catch (error) {
        console.error('Error cargando datos del jugador:', error);
        Alert.alert('Error', 'No se pudo cargar la información del jugador');
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [playerId, teamId]);

  // Redimensionar imagen para reducir su tamaño
  const resizeImage = async (uri: string, maxWidth: number, maxHeight: number, quality = 0.8) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth, height: maxHeight } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.error('Error al redimensionar la imagen:', error);
      return uri; // Si falla, devolver la imagen original
    }
  };

  // Seleccionar imagen de la galería
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos permiso para acceder a tus fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Redimensionar la imagen a un máximo de 1200x1200 píxeles
        const resizedImage = await resizeImage(result.assets[0].uri, 1200, 1200);
        setTempImage(resizedImage);
      }
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Por favor, intenta con otra imagen.');
    }
  };

  // Subir imagen a Supabase Storage con reintentos
  const uploadImage = async (uri: string, retries = 3): Promise<string> => {
    try {
      console.log('[Upload] Iniciando subida de imagen...');
      
      // Validar URI
      if (!uri) {
        throw new Error('No se proporcionó una URI de imagen válida');
      }
      
      // Obtener el blob de la imagen
      console.log('[Upload] Obteniendo imagen...');
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Error al obtener la imagen: ${response.statusText} (${response.status})`);
      }
      
      const blob = await response.blob();
      console.log(`[Upload] Tamaño de la imagen: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Validar tipo de archivo
      if (!blob.type.startsWith('image/')) {
        throw new Error('El archivo seleccionado no es una imagen válida');
      }
      
      // Validar tamaño máximo (10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (blob.size > MAX_FILE_SIZE) {
        throw new Error(
          `La imagen es demasiado grande (${(blob.size / (1024 * 1024)).toFixed(2)} MB). ` +
          'El tamaño máximo permitido es 10MB. Por favor, selecciona una imagen más pequeña.'
        );
      }
      
      // Generar un nombre único para el archivo
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${fileName}`; // Guardar en la raíz del bucket
      
      console.log('[Upload] Subiendo a Supabase Storage...', {
        bucket: 'jugadores',
        filePath,
        size: blob.size,
        type: blob.type
      });
      
      // Subir el archivo con opciones de reintento
      const uploadWithRetry = async (attempt = 1): Promise<any> => {
        try {
          console.log(`[Upload] Intento ${attempt} de ${retries}...`);
          
          const { data, error } = await supabase.storage
            .from('jugadores')
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: false,
              contentType: blob.type || 'image/jpeg',
              duplex: 'half' // Importante para algunas implementaciones de fetch
            });
            
          if (error) {
            console.error(`[Upload] Error en el intento ${attempt}:`, error);
            throw error;
          }
          
          console.log(`[Upload] Subida exitosa en el intento ${attempt}`, data);
          return data;
        } catch (error: any) {
          console.error(`[Upload] Intento ${attempt} fallido:`, error);
          if (attempt >= retries) {
            console.error('[Upload] Se agotaron los intentos de subida');
            throw error;
          }
          
          // Esperar antes de reintentar (backoff exponencial)
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`[Upload] Reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return uploadWithRetry(attempt + 1);
        }
      };
      
      // Ejecutar la subida con reintentos
      const uploadResult = await uploadWithRetry();
      
      if (!uploadResult) {
        throw new Error('La subida de la imagen no devolvió ningún resultado');
      }
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('jugadores')
        .getPublicUrl(filePath);
      
      if (!publicUrl) {
        throw new Error('No se pudo generar la URL pública de la imagen');
      }
      
      console.log('[Upload] Imagen subida correctamente:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('[Upload] Error en uploadImage:', error);
      throw new Error('Error al subir la imagen: ' + (error as Error).message);
      throw new Error('Error al subir la imagen');
    }
  };

  // Manejar cambio de fecha
  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log('handleDateChange called', { event, selectedDate });
    
    // Cerrar el picker en ambas plataformas
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      // Formatear fecha como YYYY-MM-DD para la base de datos
      const formattedDate = selectedDate.toISOString().split('T')[0];
      console.log('Fecha seleccionada:', formattedDate);
      
      setFormData(prev => ({
        ...prev,
        date_of_birth: formattedDate
      }));
      
      // Actualizar fecha de nacimiento para mostrar en el input
      setBirthDate(selectedDate);
    }
  };

  // Formatear fecha para mostrar (DD/MM/AAAA)
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Verificar si el jugador es menor de 18 años
  const isUnder18 = () => {
    if (!birthDate) return false;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    return age < 18;
  };

  // Guardar o actualizar jugador
  const handleSubmit = async () => {
    if (loading) return;
    
    try {
      setSaving(true);
      
      // Validaciones básicas
      if (!formData.first_name.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      
      if (!formData.last_name.trim()) {
        throw new Error('El apellido es obligatorio');
      }
      
      if (!formData.dni.trim()) {
        throw new Error('El DNI es obligatorio');
      }
      
      // Validar formato de DNI (solo números, entre 7 y 8 dígitos)
      const dniRegex = /^\d{7,8}$/;
      if (!dniRegex.test(formData.dni)) {
        throw new Error('El DNI debe contener entre 7 y 8 dígitos numéricos');
      }
      
      // Validar y limpiar el email según la restricción de la base de datos
      if (formData.email) {
        const originalEmail = formData.email;
        const email = formData.email.trim().toLowerCase();
        
        console.log('Email original:', originalEmail);
        console.log('Email después de trim y lowercase:', email);
        
        // Validación estricta que coincide con la restricción de la base de datos
        if (!email) {
          console.log('Correo electrónico vacío después de trim, estableciendo a null');
          formData.email = null;
        } else {
          // Validación que coincide con la restricción CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
          // - Debe empezar con caracteres alfanuméricos, puntos, guiones bajos, porcentajes, signos más o guiones
          // - Seguido de un símbolo @
          // - Luego más caracteres alfanuméricos, puntos o guiones
          // - Un punto
          // - Y al menos dos caracteres alfabéticos (dominio de nivel superior)
          const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
          
          if (!emailRegex.test(email)) {
            const errorMsg = 'El formato del correo electrónico no es válido. Debe ser como: usuario@ejemplo.com';
            console.error(errorMsg, 'Email proporcionado:', email);
            throw new Error(errorMsg);
          }
          
          // Validar longitud máxima (255 es el estándar para emails en PostgreSQL)
          if (email.length > 255) {
            const errorMsg = 'El correo electrónico no puede tener más de 255 caracteres';
            console.error(errorMsg);
            throw new Error(errorMsg);
          }
          
          console.log('Correo electrónico válido:', email);
        }
        
        formData.email = email;
      } else {
        console.log('No se proporcionó email, se establecerá como null');
        formData.email = null;
      }
      
      // Si se está asignando un equipo, verificar que el jugador no esté ya en otro equipo
      if (formData.team_id) {
        // Primero construimos la consulta base
        let query = supabase
          .from('players')
          .select('id, teams (id, name)')
          .eq('dni', formData.dni.trim())
          .not('team_id', 'is', null);
          
        // Solo añadimos la condición neq si hay un playerId
        if (playerId) {
          query = query.neq('id', playerId);
        }
        
        // Definimos el tipo para la respuesta de la consulta
        type PlayerWithTeam = {
          id: string;
          teams: {
            id: string;
            name: string;
          } | null;
        };
        
        // Ejecutamos la consulta
        const { data: existingPlayers, error: playerCheckError } = await query as 
          { data: PlayerWithTeam[] | null; error: any };

        if (playerCheckError) {
          console.error('Error al verificar jugador en equipos:', playerCheckError);
          throw new Error('Error al verificar el jugador en otros equipos');
        }

        // Verificamos si encontramos algún jugador que cumpla los criterios
        if (existingPlayers && existingPlayers.length > 0) {
          const existingPlayer = existingPlayers[0];
          const teamName = existingPlayer.teams?.name || 'otro equipo';
          
          throw new Error(`Este jugador ya pertenece al equipo: ${teamName}. Un jugador no puede estar en más de un equipo a la vez.`);
        }
      }
      
      // Si hay una imagen temporal, subirla primero
      let photoUrl = formData.photo_url;
      if (tempImage && tempImage !== formData.photo_url) {
        photoUrl = await uploadImage(tempImage);
      }
      
      // Validar el correo electrónico según la restricción de la base de datos
      let processedEmail = null;
      if (formData.email && formData.email.trim() !== '') {
        processedEmail = formData.email.trim().toLowerCase();
        
        // Validación que coincide con la restricción CHECK de PostgreSQL
        // Esta expresión es menos restrictiva que la anterior
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(processedEmail)) {
          throw new Error('El formato del correo electrónico no es válido. Debe ser como: usuario@ejemplo.com');
        }
        
        // Validar longitud máxima
        if (processedEmail.length > 255) {
          throw new Error('El correo electrónico no puede tener más de 255 caracteres');
        }
        
        // Asegurarse de que el correo no tenga espacios
        if (/\s/.test(processedEmail)) {
          throw new Error('El correo electrónico no puede contener espacios');
        }
      }
      
      // Preparar datos para guardar
      const playerData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        dni: formData.dni.trim(),
        email: processedEmail, // Será null si está vacío o el email procesado
        address: formData.address?.trim() || null,
        team_id: formData.team_id || null,
        photo_url: photoUrl || null,
        status: formData.status || 'active',
        date_of_birth: birthDate ? birthDate.toISOString().split('T')[0] : null,
      };
      
      console.log('=== DATOS A GUARDAR ===');
      console.log(JSON.stringify(playerData, null, 2));
      
      console.log('=== DATOS A GUARDAR ===');
      console.log(JSON.stringify(playerData, null, 2));
      console.log('--- Tipos de datos ---');
      console.log('email:', typeof playerData.email, '=>', `"${playerData.email}"`);
      console.log('email length:', playerData.email?.length);
      console.log('email chars:', playerData.email ? Array.from(playerData.email).map(c => `${c}(${c.charCodeAt(0)})`).join(' ') : 'null');
      console.log('status:', typeof playerData.status, '=>', playerData.status);
      console.log('date_of_birth:', typeof playerData.date_of_birth, '=>', playerData.date_of_birth);
      console.log('team_id:', typeof playerData.team_id, '=>', playerData.team_id);
      console.log('======================');
      
      let result;
      
      // Determinar si es creación o actualización
      if (playerId) {
        // Actualizar jugador existente
        console.log('=== ACTUALIZANDO JUGADOR ===');
        console.log('ID del jugador:', playerId);
        console.log('Datos a actualizar:', JSON.stringify(playerData, null, 2));
        
        const { data: updateData, error: updateError } = await supabase
          .from('players')
          .update(playerData)
          .eq('id', playerId)
          .select()
          .single();
        
        if (updateError) {
          console.error('Error al actualizar jugador:', updateError);
          if (updateError.code === '23514' && updateError.message.includes('valid_email')) {
            throw new Error('El correo electrónico no cumple con el formato requerido. Por favor, usa un formato como: usuario@ejemplo.com');
          }
          throw updateError;
        }
        
        result = updateData;
        console.log('Jugador actualizado exitosamente:', result);
      } else {
        // Crear nuevo jugador
        console.log('=== CREANDO NUEVO JUGADOR ===');
        console.log('Datos a insertar:', JSON.stringify(playerData, null, 2));
        
        const { data: insertData, error: insertError } = await supabase
          .from('players')
          .insert([playerData])
          .select()
          .single();
        
        if (insertError) {
          console.error('Error al crear jugador:', insertError);
          if (insertError.code === '23514' && insertError.message.includes('valid_email')) {
            throw new Error('El correo electrónico no cumple con el formato requerido. Por favor, usa un formato como: usuario@ejemplo.com');
          }
          throw insertError;
        }
        
        result = insertData;
        console.log('Jugador creado exitosamente:', result);
      }

      console.log('Jugador guardado exitosamente:', result);
      
      // Navegar de regreso al formulario del equipo
      if (formData.team_id) {
        // Usamos replace para evitar que el usuario pueda volver al formulario de jugador con el botón atrás
        router.replace({
          pathname: '/(admin)/TeamForm',
          params: {
            teamId: formData.team_id,
            refresh: 'true',
            timestamp: Date.now().toString()
          }
        } as any);
      } else {
        // Si por alguna razón no hay team_id, volvemos atrás
        router.back();
      }
      
      // Mostrar mensaje de éxito después de la navegación
      setTimeout(() => {
        Alert.alert(
          '¡Éxito!', 
          `Jugador ${playerId ? 'actualizado' : 'creado'} correctamente`
        );
      }, 300);
    } catch (error) {
      console.error('Error al guardar el jugador:', error);
      Alert.alert(
        'Error al guardar',
        error instanceof Error ? error.message : 'Ocurrió un error al guardar el jugador. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Definición de estilos
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      padding: 15,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
      color: '#374151',
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 15,
      backgroundColor: '#fff',
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    imagePicker: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      overflow: 'hidden',
    },
    playerImage: {
      width: '100%',
      height: '100%',
      borderRadius: 75,
    },
    imageContainer: {
      alignItems: 'center',
      marginVertical: 20,
      width: '100%',
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    },
    imagePlaceholderText: {
      marginTop: 8,
      color: '#666',
      textAlign: 'center',
    },
    dateInputContainer: {
      position: 'relative',
      width: '100%',
    },
    dateInput: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: '#F9FAFB',
      ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
      marginTop: 4,
      height: 44,
    },
    webDateInput: Platform.select({
      web: {
        width: '100%',
        height: '100%',
        borderWidth: 0,
        outlineWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 12,
        paddingVertical: 10,
      },
      default: {
        // Empty object for native platforms
      },
    }),
    dateText: {
      fontSize: 16,
      color: '#111827',
      fontFamily: 'System',
    },
    modalBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
    },
    modalContent: {
      width: '100%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    teamItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      width: '100%',
    },
    teamText: {
      fontSize: 16,
    },
    closeButton: {
      padding: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#eee',
      width: '100%',
    },
    closeButtonText: {
      color: '#007AFF',
      fontSize: 16,
      fontWeight: '600',
    },
    warningText: {
      color: '#FF3B30',
      fontSize: 14,
      marginTop: 5,
    },
    calendarButton: {
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
      borderWidth: 1,
      borderLeftWidth: 0,
      borderColor: '#ddd',
      backgroundColor: '#f9f9f9',
      height: 50,
      width: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioGroup: {
      flexDirection: 'row',
      marginTop: 8,
    },
    radioButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
      padding: 8,
      borderRadius: 8,
    },
    radioButtonSelected: {
      backgroundColor: 'rgba(255, 109, 0, 0.1)',
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#666',
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioCircleSelected: {
      borderColor: '#FF6D00',
    },
    radioInnerCircle: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FF6D00',
    },
    radioLabel: {
      fontSize: 16,
      color: '#333',
    },
    saveButton: {
      backgroundColor: '#FF6D00',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
      maxWidth: 300,
      alignSelf: 'center',
      width: '100%',
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    confirmButton: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 15,
    },
    confirmButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Foto del jugador</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {tempImage ? (
              <Image 
                source={{ uri: tempImage }} 
                style={styles.playerImage} 
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
                <Text style={styles.imagePlaceholderText}>Seleccionar foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={formData.first_name}
            onChangeText={(text) => handleInputChange('first_name', text)}
            placeholder="Ingresa el nombre"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={formData.last_name}
            onChangeText={(text) => handleInputChange('last_name', text)}
            placeholder="Ingresa el apellido"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>DNI</Text>
          <TextInput
            style={styles.input}
            value={formData.dni}
            onChangeText={(text) => handleInputChange('dni', text)}
            placeholder="Ingresa el DNI"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Equipo</Text>
          <TeamSelector
            selectedTeamId={formData.team_id || null}
            onSelectTeam={(teamId) => handleInputChange('team_id', teamId)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={[styles.radioButton, formData.status === 'active' && styles.radioButtonSelected]}
              onPress={() => handleInputChange('status', 'active')}
            >
              <View style={[styles.radioCircle, formData.status === 'active' && styles.radioCircleSelected]}>
                {formData.status === 'active' && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={styles.radioLabel}>Activo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.radioButton, formData.status === 'suspended' && styles.radioButtonSelected]}
              onPress={() => handleInputChange('status', 'suspended')}
            >
              <View style={[styles.radioCircle, formData.status === 'suspended' && styles.radioCircleSelected]}>
                {formData.status === 'suspended' && <View style={styles.radioInnerCircle} />}
              </View>
              <Text style={styles.radioLabel}>Suspendido</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            value={formData.email || ''}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="Ingresa el correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fecha de Nacimiento</Text>
          {isWeb ? (
            <View style={styles.dateInputContainer}>
              <input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => {
                  const selectedDate = e.target.value ? new Date(e.target.value) : null;
                  if (selectedDate) {
                    setBirthDate(selectedDate);
                    setFormData(prev => ({
                      ...prev,
                      date_of_birth: e.target.value,
                    }));
                  }
                }}
                style={styles.webDateInput}
                max={new Date().toISOString().split('T')[0]}
              />
            </View>
          ) : (
            <>
              <View style={styles.dateInputContainer}>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {birthDate ? formatDate(birthDate) : 'Seleccionar fecha'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              {showDatePicker && (
                <View style={Platform.OS === 'ios' ? styles.modalBackground : {}}>
                  {Platform.OS === 'ios' ? (
                    <Modal
                      transparent={true}
                      animationType="slide"
                      visible={showDatePicker}
                      onRequestClose={() => setShowDatePicker(false)}
                    >
                      <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                          <DateTimePicker
                            value={date}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            locale="es-AR"
                            themeVariant="light"
                            style={{ width: '100%' }}
                          />
                          <TouchableOpacity 
                            style={styles.confirmButton}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.confirmButtonText}>Aceptar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Modal>
                  ) : (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      locale="es-AR"
                      themeVariant="light"
                    />
                  )}
                </View>
              )}
            </>
          )}
          
          {isUnder18() && (
            <Text style={styles.warningText}>
              El jugador es menor de 18 años
            </Text>
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address || ''}
            onChangeText={(text) => handleInputChange('address', text)}
            placeholder="Ingresa la dirección"
            multiline
            numberOfLines={3}
          />
        </View>
        

        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar Jugador'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}