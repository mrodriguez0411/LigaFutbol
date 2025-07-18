import React, { useState, useEffect, useCallback } from 'react';
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
  TouchableWithoutFeedback,
  BackHandler,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/config/supabase';
import TeamSelector from './components/TeamSelector';

type PlayerStatus = 'active' | 'suspended';
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

// Tipos de datos
interface Suspension {
  id?: string;
  player_id: string;
  start_date: string;
  days_count: number;
  reason: string;
  active: boolean;
  // For backward compatibility with existing data
  end_date?: string;
}

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
  status: 'active' | 'suspended';
  suspensions?: Suspension[];
}

// Formatear fecha para mostrar (DD/MM/AAAA)
const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function PlayerForm() {
  // Hooks de React Navigation y Routing
  const navigation = useNavigation();
  const router = useRouter();
  const { playerId, teamId } = useLocalSearchParams<{ playerId?: string; teamId?: string }>();
  
  // Función para navegar de regreso a la lista de jugadores
  const goBackToPlayers = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/(admin)/players');
    }
  }, [navigation, router]);
  
  // Estados del formulario
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  
  // Estados para el manejo de fechas
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState<Date>(new Date('2000-01-01'));
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  
  // Estado para la imagen temporal
  const [tempImage, setTempImage] = useState<string | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState<PlayerFormData>(() => ({
    first_name: '',
    last_name: '',
    dni: '',
    date_of_birth: null,
    email: null,
    address: null,
    photo_url: null,
    team_id: teamId || null,
    status: 'active',
    number: null,
    suspensions: [],
  }));
  
  // Estado para el modal de suspensión
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [newSuspension, setNewSuspension] = useState<Omit<Suspension, 'id' | 'player_id' | 'active'>>({
    start_date: new Date().toISOString().split('T')[0],
    days_count: 1,
    reason: ''
  });

  // Subir imagen a Supabase Storage
  const uploadImage = async (uri: string, path: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('players')
        .upload(filePath, blob);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('players')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Función para verificar si el jugador es menor de 18 años
  const isUnder18 = (): boolean => {
    if (!birthDate) return false;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age < 18;
  };

  // Función para manejar cambios en los inputs
  const handleInputChange = (field: keyof PlayerFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormTouched(true);
  };
  
  // Función para cargar las suspensiones de un jugador
  const loadPlayerSuspensions = async (playerId: string) => {
    try {
      const { data, error } = await supabase
        .from('player_suspensions')
        .select('*')
        .eq('player_id', playerId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error cargando suspensiones:', error);
      return [];
    }
  };

  // Función para guardar una suspensión en la base de datos
  const saveSuspension = async (suspension: Omit<Suspension, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('player_suspensions')
        .insert([suspension])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error guardando suspensión:', error);
      throw error;
    }
  };

  // Función para eliminar una suspensión de la base de datos
  const deleteSuspension = async (suspensionId: string) => {
    try {
      const { error } = await supabase
        .from('player_suspensions')
        .delete()
        .eq('id', suspensionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error eliminando suspensión:', error);
      throw error;
    }
  };

  // Función para agregar una nueva suspensión
  const handleAddSuspension = async () => {
    if (!newSuspension.start_date || !newSuspension.reason || !playerId) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }
    
    try {
      const suspensionData = {
        player_id: playerId,
        start_date: newSuspension.start_date,
        days_count: newSuspension.days_count,
        reason: newSuspension.reason,
        active: true
      };

      // Guardar en Supabase
      const savedSuspension = await saveSuspension(suspensionData);
      
      // Actualizar el estado local
      setFormData(prev => ({
        ...prev,
        suspensions: [savedSuspension, ...(prev.suspensions || [])],
        status: 'suspended'
      }));

      // Actualizar el estado del jugador a "suspended" en la tabla players
      await supabase
        .from('players')
        .update({ status: 'suspended' })
        .eq('id', playerId);

      // Resetear el formulario
      setNewSuspension({
        start_date: new Date().toISOString().split('T')[0],
        days_count: 1,
        reason: ''
      });
      
      setShowSuspensionModal(false);
      Alert.alert('Éxito', 'Suspensión agregada correctamente');
      setFormTouched(true);
    } catch (error) {
      console.error('Error al guardar la suspensión:', error);
      Alert.alert('Error', 'No se pudo guardar la suspensión');
    }
  };

  // Función para eliminar una suspensión
  const handleRemoveSuspension = async (suspensionId: string, index: number) => {
    try {
      // Eliminar de la base de datos
      await deleteSuspension(suspensionId);
      
      // Actualizar el estado local
      const updatedSuspensions = [...(formData.suspensions || [])];
      updatedSuspensions.splice(index, 1);
      
      const newStatus = updatedSuspensions.length > 0 ? 'suspended' : 'active';
      
      setFormData(prev => ({
        ...prev,
        suspensions: updatedSuspensions,
        status: newStatus
      }));
      
      // Si no hay más suspensiones, actualizar el estado del jugador
      if (updatedSuspensions.length === 0) {
        await supabase
          .from('players')
          .update({ status: 'active' })
          .eq('id', playerId);
      }
      
      Alert.alert('Éxito', 'Suspensión eliminada correctamente');
      setFormTouched(true);
    } catch (error) {
      console.error('Error eliminando suspensión:', error);
      Alert.alert('Error', 'No se pudo eliminar la suspensión');
    }
  };

  // Manejar cambio de fecha
  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    
    if (event.type !== 'dismissed') {
      setDate(currentDate);
      setBirthDate(currentDate);
      
      setFormData(prev => ({
        ...prev,
        date_of_birth: currentDate.toISOString().split('T')[0]
      }));
    }
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
          .select('*')
          .eq('id', playerId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          // Cargar suspensiones del jugador
          const suspensions = await loadPlayerSuspensions(playerId);
          
          setFormData({
            ...data,
            suspensions: suspensions || []
          });
          
          // Establecer la fecha de nacimiento si existe
          if (data.date_of_birth) {
            const birthDate = new Date(data.date_of_birth);
            setBirthDate(birthDate);
            setDate(birthDate);
          }
        }
      } catch (error) {
        console.error('Error al cargar los datos del jugador:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos del jugador');
      } finally {
        setLoading(false);
      }
    };
    
    loadPlayerData();
  }, [playerId]);

  // Guardar o actualizar jugador
  const handleSubmit = async () => {
    if (loading || saving) return;
    
    let result;
    try {
      setSaving(true);
      
      // Validaciones básicas
      if (!formData.first_name?.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      
      if (!formData.last_name?.trim()) {
        throw new Error('El apellido es obligatorio');
      }
      
      if (!formData.dni?.trim()) {
        throw new Error('El DNI es obligatorio');
      }
      
      // Validar formato de DNI (solo números, entre 7 y 8 dígitos)
      const dniRegex = /^\d{7,8}$/;
      if (!dniRegex.test(formData.dni)) {
        throw new Error('El DNI debe contener entre 7 y 8 dígitos numéricos');
      }
      
      // Determinar el estado del jugador basado en las suspensiones activas
      const hasActiveSuspensions = formData.suspensions?.some(s => s.active) || false;
      const status = hasActiveSuspensions ? 'suspended' : 'active';
      
      // Crear una copia de formData sin el campo suspensions
      const { suspensions, ...playerData } = formData;
      
      // Validar email si existe
      if (formData.email && formData.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          throw new Error('El formato del correo electrónico no es válido');
        }
        
        if (formData.email.length > 255) {
          throw new Error('El correo electrónico no puede tener más de 255 caracteres');
        }
      }
      
      // Si hay una imagen temporal, subirla primero
      let photoUrl = playerData.photo_url;
      if (tempImage) {
        photoUrl = await uploadImage(tempImage, 'players');
      }
      
      // Actualizar los datos del jugador con la URL de la foto y el estado
      const playerToSave = {
        ...playerData,
        photo_url: photoUrl,
        status // Actualizar el estado basado en las suspensiones
        // Nota: Se eliminó updated_at ya que no existe en la tabla
      };
      
      delete playerToSave.id; // No incluir el ID en los datos a guardar
      let error = null;
      
      if (playerId) {
        // Actualizar jugador existente
        const { data, error: updateError } = await supabase
          .from('players')
          .update(playerToSave)
          .eq('id', playerId)
          .select();
          
        if (updateError) {
          console.error('Error al actualizar el jugador:', updateError);
          throw updateError;
        }
        
        if (!data || data.length === 0) {
          throw new Error('No se recibieron datos al actualizar el jugador');
        }
        
        result = data[0];
      } else {
        // Crear nuevo jugador
        const { data, error: insertError } = await supabase
          .from('players')
          .insert([playerToSave])
          .select();
          
        if (insertError) {
          console.error('Error al crear el jugador:', insertError);
          throw insertError;
        }
        
        if (!data || data.length === 0) {
          throw new Error('No se recibieron datos al crear el jugador');
        }
        
        result = data[0];
      }
      
      // Mostrar mensaje de éxito y navegar de regreso
      Alert.alert(
        'Éxito',
        `Jugador ${playerId ? 'actualizado' : 'creado'} correctamente`,
        [
          {
            text: 'Aceptar',
            onPress: () => {
              goBackToPlayers();
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Error al guardar el jugador:', error);
      
      // Mostrar más detalles del error
      let errorMessage = 'Ocurrió un error al guardar el jugador';
      
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        console.error('Datos del error:', error.response.data);
        console.error('Estado del error:', error.response.status);
        console.error('Cabeceras del error:', error.response.headers);
        errorMessage = `Error del servidor: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        console.error('No se recibió respuesta del servidor:', error.request);
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
      } else if (error.message) {
        // Algo sucedió en la configuración de la solicitud que provocó un error
        console.error('Error en la configuración de la solicitud:', error.message);
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Función para seleccionar una imagen
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri } = result.assets[0];
        
        // Redimensionar la imagen si es necesario
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setTempImage(manipResult.uri);
      }
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Función para eliminar un jugador
  const handleDelete = async () => {
    if (!playerId) return;
    
    try {
      setSaving(true);
      
      // Mostrar confirmación
      Alert.alert(
        'Eliminar Jugador',
        '¿Estás seguro de que deseas eliminar este jugador?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => setSaving(false)
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', playerId);
              
              if (error) throw error;
              
              Alert.alert(
                'Eliminado',
                'El jugador ha sido eliminado correctamente',
                [
                  {
                    text: 'Aceptar',
                    onPress: () => {
                      if (formData.team_id) {
                        router.replace({
                          pathname: '/(admin)/TeamForm',
                          params: { teamId: formData.team_id }
                        });
                      } else {
                        router.back();
                      }
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al eliminar el jugador:', error);
      Alert.alert('Error', 'No se pudo eliminar el jugador');
    } finally {
      setSaving(false);
    }
  };

  // Función para navegar de regreso
  const handleGoBack = useCallback(() => {
    if (formData.team_id) {
      // Si hay un equipo asignado, navegar al formulario del equipo
      router.replace({
        pathname: '/(admin)/TeamForm',
        params: { 
          teamId: formData.team_id, 
          refresh: 'true',
          timestamp: Date.now().toString() 
        }
      });
    } else if (router.canGoBack()) {
      // Si hay una pantalla en la pila de navegación, volvemos a ella
      router.back();
    } else {
      // Si no hay pantalla a la que volver, navegamos a la pantalla de administración
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  }, [formData.team_id, router]);
  
  // Configurar el botón de volver en el header
  React.useLayoutEffect(() => {    
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={handleGoBack}
          style={{ marginLeft: 10, padding: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleGoBack]);

  // Manejar el botón físico de atrás en Android
  useEffect(() => {
    const backAction = () => {
      handleGoBack();
      return true; // Evitar que el comportamiento por defecto se ejecute
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [handleGoBack]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>
          {playerId ? 'Editar Jugador' : 'Nuevo Jugador'}
        </Text>

        {/* Foto de perfil */}
        <View style={styles.photoContainer}>
          <TouchableOpacity 
            style={styles.photoButton}
            onPress={handlePickImage}
            disabled={saving}
          >
            {tempImage || formData.photo_url ? (
              <Image 
                source={{ uri: tempImage || formData.photo_url || undefined }} 
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={40} color="#666" />
                <Text style={styles.photoText}>Agregar foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Campos del formulario */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={formData.first_name || ''}
            onChangeText={(text) => handleInputChange('first_name', text)}
            placeholder="Ingrese el nombre"
            editable={!saving}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={formData.last_name || ''}
            onChangeText={(text) => handleInputChange('last_name', text)}
            placeholder="Ingrese el apellido"
            editable={!saving}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>DNI</Text>
          <TextInput
            style={styles.input}
            value={formData.dni || ''}
            onChangeText={(text) => handleInputChange('dni', text.replace(/[^0-9]/g, ''))}
            placeholder="Ingrese el DNI"
            keyboardType="numeric"
            maxLength={8}
            editable={!saving}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fecha de Nacimiento</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={saving}
          >
            <Text style={styles.dateText}>
              {birthDate ? formatDate(birthDate) : 'Seleccionar fecha'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email || ''}
            onChangeText={(text) => handleInputChange('email', text)}
            placeholder="email@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!saving}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address || ''}
            onChangeText={(text) => handleInputChange('address', text)}
            placeholder="Ingrese la dirección"
            multiline
            numberOfLines={3}
            editable={!saving}
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.label}>Estado: {formData.status === 'active' ? 'Activo' : 'Suspendido'}</Text>
            <TouchableOpacity
              onPress={() => setShowSuspensionModal(true)}
              style={styles.addButton}
              disabled={saving}
            >
              <Text style={styles.addButtonText}>
                {formData.status === 'active' ? 'Agregar suspensión' : 'Ver suspensiones'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {formData.suspensions && formData.suspensions.length > 0 && (
            <View style={styles.suspensionsList}>
              {formData.suspensions.map((suspension, index) => (
                <View key={index} style={styles.suspensionItem}>
                  <Text style={styles.suspensionText}>
                    {new Date(suspension.start_date).toLocaleDateString()} - {suspension.days_count} fecha{suspension.days_count !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.suspensionReason}>{suspension.reason}</Text>
                  <TouchableOpacity 
                    onPress={() => suspension.id && handleRemoveSuspension(suspension.id, index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Botón de guardar */}
        <TouchableOpacity 
          style={[styles.saveButton, (saving || loading) && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={saving || loading}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {playerId ? 'Actualizar' : 'Guardar'}
            </Text>
          )}
        </TouchableOpacity>

        {playerId && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={saving}
          >
            <Text style={styles.deleteButtonText}>Eliminar Jugador</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal para agregar suspensión */}
      <Modal
        visible={showSuspensionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSuspensionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Suspensión</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fecha de inicio</Text>
              <TextInput
                style={styles.input}
                value={newSuspension.start_date}
                onChangeText={(text) => setNewSuspension(prev => ({ ...prev, start_date: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cantidad de fechas</Text>
              <TextInput
                style={styles.input}
                value={newSuspension.days_count?.toString()}
                onChangeText={(text) => {
                  const days = parseInt(text) || 1;
                  setNewSuspension(prev => ({ ...prev, days_count: Math.max(1, days) }));
                }}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Motivo</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newSuspension.reason}
                onChangeText={(text) => setNewSuspension(prev => ({ ...prev, reason: text }))}
                placeholder="Ingrese el motivo de la suspensión"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowSuspensionModal(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={handleAddSuspension}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
  },
  statusSuspended: {
    backgroundColor: '#ffebee',
    borderColor: '#ef9a9a',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusActiveText: {
    color: '#1976d2',
  },
  statusSuspendedText: {
    color: '#d32f2f',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  photoPlaceholderText: {
    marginTop: 5,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#1976d2',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d32f2f',
    marginBottom: 24,
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  suspensionsList: {
    marginTop: 10,
  },
  suspensionItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    position: 'relative',
  },
  suspensionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  suspensionReason: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Estilos para el modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#1976d2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para las suspensiones
  addButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  suspensionsList: {
    marginTop: 10,
  },
  suspensionItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    position: 'relative',
  },
  suspensionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  suspensionReason: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  // Estilos para el modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#1976d2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para las suspensiones
  addButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  suspensionsList: {
    marginTop: 10,
  },
  suspensionItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  suspensionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

});
