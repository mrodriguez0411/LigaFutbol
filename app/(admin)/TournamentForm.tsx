import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator, Platform, Modal, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { supabase } from '@/config/supabase';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Solo importamos DateTimePicker para móviles
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (error) {
    console.warn('DateTimePicker no está disponible:', error);
  }
}

const isWeb = Platform.OS === 'web';

type Team = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type Tournament = {
  id?: string;
  name: string;
  category_id: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  image_url?: string | null;
};

export default function TournamentForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  
  const [loading, setLoading] = useState(false);
  const [isEditing] = useState(!!id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<Tournament>({
    name: '',
    category_id: '',
    start_date: new Date(),
    end_date: new Date(),
    is_active: true,
    image_url: null
  });
  
  const [uploading, setUploading] = useState(false);
  const [isGeneratingFixture, setIsGeneratingFixture] = useState(false);
  const [hasGeneratedFixture, setHasGeneratedFixture] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Solicitar permisos de la galería
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Se necesitan permisos para acceder a la galería');
        }
      }
    })();
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar categorías
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Si es edición, cargar datos del torneo
        if (isEditing && id) {
          const { data: tournamentData, error: tournamentError } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', id)
            .single();
          
          if (tournamentError) throw tournamentError;
          
          if (tournamentData) {
            setFormData({
              ...tournamentData,
              start_date: new Date(tournamentData.start_date),
              end_date: new Date(tournamentData.end_date)
            });

            // Cargar equipos del torneo
            const { data: tournamentTeams, error: teamsError } = await supabase
              .from('tournament_registrations')
              .select('team_id')
              .eq('tournament_id', id);
            
            if (teamsError) throw teamsError;
            
            if (tournamentTeams) {
              setSelectedTeams(tournamentTeams.map(t => t.team_id));
              // Cargar equipos de la categoría
              await loadTeams(tournamentData.category_id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditing]);

  // Cargar equipos cuando cambia la categoría
  const loadTeams = async (categoryId: string) => {
    if (!categoryId) return;
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('category_id', categoryId)
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'No se pudieron cargar los equipos');
    }
  };

  const handleInputChange = (field: keyof Tournament, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si cambia la categoría, cargar equipos
    if (field === 'category_id') {
      loadTeams(value);
      setSelectedTeams([]); // Limpiar selección de equipos
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
      
      // En iOS, actualizamos la fecha en tiempo real
      if (Platform.OS === 'ios') {
        if (datePickerMode === 'start') {
          handleInputChange('start_date', selectedDate);
          // Asegurarse de que la fecha de fin no sea anterior a la de inicio
          if (selectedDate > formData.end_date) {
            handleInputChange('end_date', selectedDate);
          }
        } else if (datePickerMode === 'end') {
          handleInputChange('end_date', selectedDate);
        }
      }
    }
  };

  const confirmDate = () => {
    if (datePickerMode === 'start') {
      handleInputChange('start_date', tempDate);
      // Asegurarse de que la fecha de fin no sea anterior a la de inicio
      if (tempDate > formData.end_date) {
        handleInputChange('end_date', tempDate);
      }
    } else if (datePickerMode === 'end') {
      handleInputChange('end_date', tempDate);
    }
    setShowDatePicker(false);
  };

  const openDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setTempDate(mode === 'start' ? formData.start_date : formData.end_date);
    setShowDatePicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const checkExistingFixture = async (tournamentId: string) => {
    const { count, error } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    if (error) {
      console.error('Error verificando fixture existente:', error);
      return false;
    }
    
    const hasFixture = (count || 0) > 0;
    setHasGeneratedFixture(hasFixture);
    return hasFixture;
  };



  const generateNewFixture = async (tournamentId: string) => {
    // Primero, eliminar partidos existentes para este torneo
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId);

    if (deleteError) throw deleteError;

    // Generar nuevos partidos (todos contra todos)
    const matches = [];
    const numTeams = selectedTeams.length;
    
    // Crear partidos de ida
    for (let i = 0; i < numTeams - 1; i++) {
      for (let j = i + 1; j < numTeams; j++) {
        matches.push({
          tournament_id: tournamentId,
          home_team_id: selectedTeams[i],
          away_team_id: selectedTeams[j],
          match_date: new Date(formData.start_date),
          status: 'scheduled',
          round: 1,
          home_team_score: null,
          away_team_score: null
        });
      }
    }

    // Insertar los partidos en la base de datos
    const { error: insertError } = await supabase
      .from('matches')
      .insert(matches);

    if (insertError) throw insertError;
    
    setHasGeneratedFixture(true);
    Alert.alert('Éxito', 'Fixture generado correctamente');
  };

  const pickImage = async () => {
    try {
      // Verificar permisos primero
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'Se necesita acceso a la galería para seleccionar imágenes.'
          );
          return;
        }
      }
      
      // Limpiar la URL actual antes de seleccionar una nueva imagen
      setFormData(prev => ({
        ...prev,
        image_url: null
      }));

      // Configuración del selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
        base64: false,
      });

      // Verificar si el usuario canceló
      if (result.canceled) {
        console.log('Usuario canceló la selección de imagen');
        return;
      }

      // Verificar si hay imágenes seleccionadas
      if (!result.assets || result.assets.length === 0) {
        console.log('No se seleccionó ninguna imagen');
        return;
      }

      const imageAsset = result.assets[0];
      console.log('Imagen seleccionada:', {
        uri: imageAsset.uri,
        type: imageAsset.type,
        fileSize: imageAsset.fileSize,
        width: imageAsset.width,
        height: imageAsset.height,
      });

      // Validar tamaño de la imagen (5MB máximo)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (imageAsset.fileSize && imageAsset.fileSize > MAX_FILE_SIZE) {
        Alert.alert(
          'Archivo demasiado grande',
          'La imagen no puede pesar más de 5MB. Por favor, selecciona una imagen más pequeña.'
        );
        return;
      }

      // Proceder con la subida
      await uploadImage(imageAsset.uri);
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      Alert.alert(
        'Error',
        'No se pudo seleccionar la imagen. Por favor, inténtalo de nuevo.'
      );
    }
  };

  const uploadImage = async (uri: string) => {
    if (!uri) {
      console.error('URI de imagen no válida');
      return;
    }

    setUploading(true);
    
    try {
      // 1. Definir el nombre del bucket (debe coincidir exactamente con el de Supabase)
      const BUCKET_NAME = 'tournament-images';
      
      // 2. Obtener el tipo MIME y la extensión del archivo
      let fileType = 'image/jpeg'; // Valor por defecto
      let fileExt = 'jpg';
      
      if (uri.startsWith('data:image/')) {
        // Si es una imagen en base64
        const matches = uri.match(/^data:(image\/[a-z]+);base64,/);
        if (matches && matches[1]) {
          fileType = matches[1];
          fileExt = fileType.split('/')[1] || 'jpg';
        }
      } else {
        // Si es una URI de archivo
        fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        fileType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      }
      
      // 3. Generar un nombre de archivo único
      const fileName = `tournament_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      
      // 4. Convertir la imagen a blob
      let blob;
      if (uri.startsWith('data:')) {
        // Para imágenes en base64
        const response = await fetch(uri);
        blob = await response.blob();
      } else {
        // Para URIs de archivo
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error('No se pudo cargar la imagen');
        }
        blob = await response.blob();
      }
      
      // 5. Validar el tamaño del archivo (máximo 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (blob.size > MAX_FILE_SIZE) {
        throw new Error('La imagen es demasiado grande. El tamaño máximo permitido es 5MB');
      }
      
      // 6. Subir a Supabase Storage
      console.log('Subiendo a Supabase Storage...', {
        bucket: BUCKET_NAME,
        path: filePath,
        type: fileType,
        size: blob.size
      });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: fileType
        });
      
      if (uploadError) {
        console.error('Error al subir la imagen a Supabase:', uploadError);
        throw new Error(`Error al subir la imagen: ${uploadError.message}`);
      }
      
      console.log('Imagen subida exitosamente:', uploadData);
      
      // 7. Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      
      if (!publicUrl) {
        throw new Error('No se pudo generar la URL pública de la imagen');
      }
      
      console.log('URL de la imagen generada:', publicUrl);
      
      // 8. Actualizar el estado del formulario
      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }));
      
      Alert.alert('Éxito', 'La imagen se cargó correctamente');
      return publicUrl;
      
    } catch (error) {
      console.error('Error en el proceso de carga de imagen:', error);
      
      let errorMessage = 'No se pudo subir la imagen';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category_id || selectedTeams.length < 2) {
      Alert.alert('Error', 'Complete todos los campos y seleccione al menos 2 equipos');
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing && id) {
        // Actualizar torneo existente
        const { error: updateError } = await supabase
          .from('tournaments')
          .update({
            name: formData.name,
            category_id: formData.category_id,
            start_date: formData.start_date.toISOString(),
            end_date: formData.end_date.toISOString(),
            is_active: formData.is_active,
            image_url: formData.image_url
          })
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        // Actualizar equipos del torneo
        await updateTournamentTeams(id);
        
        Alert.alert('Éxito', 'Torneo actualizado correctamente');
      } else {
        // Crear nuevo torneo
        const { data: newTournament, error: insertError } = await supabase
          .from('tournaments')
          .insert([{
            name: formData.name,
            category_id: formData.category_id,
            start_date: formData.start_date.toISOString(),
            end_date: formData.end_date.toISOString(),
            is_active: formData.is_active,
            image_url: formData.image_url
          }])
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        if (newTournament) {
          // Asignar equipos al torneo
          await updateTournamentTeams(newTournament.id);
          
          // Generar fixture automáticamente solo si hay suficientes equipos
          if (selectedTeams.length >= 2) {
            await generateFixture(newTournament.id);
            Alert.alert('Éxito', 'Torneo creado y fixture generado correctamente');
          } else {
            Alert.alert('Éxito', 'Torneo creado. Agrega al menos 2 equipos y genera el fixture manualmente.');
          }
        }
      }
      
      // Navigate back to the tournaments list
      router.replace('..');
    } catch (error) {
      console.error('Error saving tournament:', error);
      Alert.alert('Error', 'No se pudo guardar el torneo');
    } finally {
      setLoading(false);
    }
  };

  const updateTournamentTeams = async (tournamentId: string) => {
    try {
      // Eliminar registros existentes
      const { error: deleteError } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', tournamentId);
      
      if (deleteError) throw deleteError;
      
      // Insertar nuevos registros
      if (selectedTeams.length > 0) {
        const registrations = selectedTeams.map(teamId => ({
          tournament_id: tournamentId,
          team_id: teamId,
          status: 'confirmed'
        }));
        
        const { error: insertError } = await supabase
          .from('tournament_registrations')
          .insert(registrations);
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error updating tournament teams:', error);
      throw error;
    }
  };

  // Verificar si ya existe un fixture para este torneo
  useEffect(() => {
    const checkExistingFixture = async () => {
      if (!id) return;
      
      try {
        const { count, error } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', id);
          
        if (error) throw error;
        
        setHasGeneratedFixture(!!count && count > 0);
      } catch (error) {
        console.error('Error verificando fixture existente:', error);
      }
    };
    
    if (isEditing) {
      checkExistingFixture();
    }
  }, [id, isEditing]);

  const generateFixture = async (tournamentId: string, isManual = false) => {
    if (selectedTeams.length < 2) {
      Alert.alert('Error', 'Se necesitan al menos 2 equipos para generar un fixture');
      return;
    }

    try {
      setIsGeneratingFixture(true);
      
      // Verificar si ya existe un fixture para este torneo
      const hasExistingFixture = await checkExistingFixture(tournamentId);
      
      if (hasExistingFixture) {
        if (!isManual) return; // No hacer nada si es generación automática y ya existe
        
        // Preguntar si desea regenerar el fixture
        const confirm = await new Promise(resolve => {
          Alert.alert(
            'Fixture existente',
            'Ya existe un fixture para este torneo. ¿Desea regenerarlo?',
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Regenerar', onPress: () => resolve(true) }
            ]
          );
        });
        
        if (!confirm) return;
        
        // Eliminar partidos existentes
        const { error: deleteError } = await supabase
          .from('matches')
          .delete()
          .eq('tournament_id', tournamentId);
          
        if (deleteError) throw deleteError;
      }
      
      // Generar nuevos partidos (todos contra todos)
      const matches = [];
      const numTeams = selectedTeams.length;
      
      // Crear partidos de ida
      for (let i = 0; i < numTeams - 1; i++) {
        for (let j = i + 1; j < numTeams; j++) {
          matches.push({
            tournament_id: tournamentId,
            home_team_id: selectedTeams[i],
            away_team_id: selectedTeams[j],
            match_date: new Date(formData.start_date),
            status: 'scheduled',
            round: 1,
            home_team_score: null,
            away_team_score: null
          });
        }
      }

      // Insertar los partidos en la base de datos
      const { error } = await supabase
        .from('matches')
        .insert(matches);

      if (error) throw error;
      
      setHasGeneratedFixture(true);
      
      if (isManual) {
        Alert.alert('Éxito', 'Fixture generado correctamente');
      }
      
      return true;
      
    } catch (error) {
      console.error('Error al generar el fixture:', error);
      
      if (isManual) {
        Alert.alert(
          'Error', 
          error instanceof Error ? error.message : 'No se pudo generar el fixture'
        );
      }
      
      throw error;
    } finally {
      setIsGeneratingFixture(false);
    }
  };

  if (loading && isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Cargando datos del torneo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: isEditing ? 'Editar Torneo' : 'Nuevo Torneo',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#1a202c',
            fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'System',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => {
                // Navigate back to the admin panel
                router.replace('..');
              }}
              style={{ padding: 8, marginLeft: -8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#2d3748" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView 
        style={styles.form}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de imagen */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Imagen del Torneo</Text>
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {formData.image_url ? (
                <Image 
                  source={{ 
                    uri: formData.image_url,
                    cache: 'reload' 
                  }} 
                  style={styles.imagePreview} 
                  resizeMode="cover"
                  onError={(e) => {
                    console.error('Error al cargar la imagen:', e.nativeEvent.error);
                    setFormData(prev => ({ ...prev, image_url: null }));
                  }}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="image" size={48} color="#a0aec0" />
                  <Text style={styles.imagePlaceholderText}>
                    {uploading ? 'Subiendo imagen...' : 'No hay imagen seleccionada'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.imageButton, uploading && { opacity: 0.7 }]} 
              onPress={pickImage}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={styles.imageButtonText}>
                    {formData.image_url ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre del Torneo</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Ej: Torneo Apertura 2025"
            placeholderTextColor="#a0aec0"
          />
        </View>

        {/* Selector de Categoría */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoría</Text>
          <View style={[styles.input, { padding: 0 }]}>
            <Picker
              selectedValue={formData.category_id}
              onValueChange={(itemValue) => handleInputChange('category_id', itemValue)}
              style={styles.picker}
              dropdownIconColor="#4a5568"
              mode="dropdown"
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
        </View>

        <View style={styles.formGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.label}>Equipos</Text>
            {isEditing && id && selectedTeams.length >= 2 && (
              <TouchableOpacity 
                style={[
                  styles.generateButton, 
                  isGeneratingFixture && styles.generateButtonDisabled,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 6
                  }
                ]}
                onPress={() => generateFixture(id, true)}
                disabled={isGeneratingFixture}
              >
                {isGeneratingFixture ? (
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                ) : null}
                <Text style={styles.generateButtonText}>
                  {hasGeneratedFixture ? 'Regenerar Fixture' : 'Generar Fixture'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subLabel}>Seleccione al menos 2 equipos</Text>
            
          <ScrollView style={styles.teamsContainer}>
            {teams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.teamItem,
                  selectedTeams.includes(team.id) && styles.teamItemSelected
                ]}
                onPress={() => toggleTeamSelection(team.id)}
              >
                <Text style={styles.teamNameText}>{team.name}</Text>
                {selectedTeams.includes(team.id) && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selector de Fechas */}
        <View style={styles.datesContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>Fecha de Inicio</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('start')}
            >
              <Text>{formatDate(formData.start_date)}</Text>
              <Ionicons name="calendar" size={20} color="#4a5568" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>Fecha de Fin</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => openDatePicker('end')}
            >
              <Text>{formatDate(formData.end_date)}</Text>
              <Ionicons name="calendar" size={20} color="#4a5568" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Estado Activo/Inactivo */}
        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={[styles.label, { marginBottom: 0 }]}>Estado del Torneo:</Text>
            <TouchableOpacity
              style={[
                styles.switch,
                formData.is_active ? styles.switchActive : styles.switchInactive
              ]}
              onPress={() => handleInputChange('is_active', !formData.is_active)}
            >
              <Text style={styles.switchText}>
                {formData.is_active ? 'Activo' : 'Inactivo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de Guardar/Actualizar */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.submitButtonContent}>
              <Ionicons 
                name={isEditing ? 'save-outline' : 'add-circle-outline'} 
                size={22} 
                color="#fff" 
                style={styles.submitButtonIcon} 
              />
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Actualizar Torneo' : 'Crear Torneo'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerContent}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                style={styles.dateTimePicker}
              />
              <View style={styles.datePickerButtons}>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.datePickerButton, styles.datePickerButtonConfirm]}
                  onPress={confirmDate}
                >
                  <Text style={[styles.datePickerButtonText, { color: '#fff' }]}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d3748',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: 200,
    height: 150,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#a0aec0',
    textAlign: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4299e1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  imageButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  teamsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  teamItemSelected: {
    backgroundColor: '#f0fff4',
  },
  teamNameText: {
    fontSize: 16,
    color: '#2d3748',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#2d3748',
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#4CAF50',
  },
  switchInactive: {
    backgroundColor: '#e53e3e',
  },
  switchText: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#ed8936',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#f6ad55',
    opacity: 0.8,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonIcon: {
    marginRight: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  dateTimePicker: {
    width: '100%',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  datePickerButton: {
    padding: 10,
    marginLeft: 10,
    borderRadius: 6,
  },
  datePickerButtonConfirm: {
    backgroundColor: '#4299e1',
  },
  datePickerButtonText: {
    color: '#4a5568',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'System',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    padding: 20,
  },
  imagePlaceholderText: {
    marginTop: 12,
    color: '#718096',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'System',
    textAlign: 'center',
  },
  imageButton: {
    backgroundColor: '#FF6D00',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'System',
  },
  pickerItem: {
    fontSize: 15,
    color: '#333',
  },
});
