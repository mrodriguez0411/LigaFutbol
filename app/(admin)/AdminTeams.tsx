import { ImageUploader } from '@/components/ImageUploader'; // Importar el componente ImageUploader
import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  logoUrl?: string;
  coach: string;
  stadium: string;
  colors: string;
  is_active: boolean;
  category_id: string | null;
  category_name: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      // Primero obtenemos los equipos con solo los campos básicos
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;
      
      // Obtenemos los IDs únicos de categorías (si existen)
      const categoryIds = teamsData && teamsData.length > 0 
        ? [...new Set(teamsData.map(team => team.category_id).filter(Boolean))]
        : [];
      
      // Obtenemos los nombres de las categorías si hay categorías
      let categoriesMap = new Map();
      if (categoryIds.length > 0) {
        try {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('id, name')
            .in('id', categoryIds);
            
          if (categoriesError) {
            console.warn('Error al cargar categorías:', categoriesError);
          } else if (categoriesData) {
            // Creamos un mapa de ID de categoría a nombre
            categoriesMap = new Map(categoriesData.map(cat => [cat.id, cat.name]));
          }
        } catch (error) {
          console.error('Error al cargar categorías:', error);
        }
      }

      // Mapear los datos para incluir el nombre de la categoría
      const formattedTeams = (teamsData || []).map(team => {
        // Aseguramos que todos los campos requeridos tengan un valor por defecto
        const formattedTeam = {
          id: team.id || '',
          name: team.name || 'Equipo sin nombre',
          logo_url: team.logo_url || null,
          logoUrl: team.logo_url || null,
          coach: team.coach || 'Sin entrenador',
          stadium: team.stadium || 'Sin estadio',
          colors: team.colors || '#000000',
          is_active: team.is_active !== undefined ? team.is_active : true,
          category_id: team.category_id || null,
          category_name: 'Sin categoría',
          created_at: team.created_at || new Date().toISOString(),
          updated_at: team.updated_at || new Date().toISOString(),
          createdAt: team.created_at || new Date().toISOString(),
          updatedAt: team.updated_at || new Date().toISOString()
        };

        // Si hay un category_id válido, intentamos obtener el nombre de la categoría
        if (team.category_id && categoriesMap.has(team.category_id)) {
          formattedTeam.category_name = categoriesMap.get(team.category_id);
        }

        return formattedTeam;
      });

      setTeams(formattedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      Alert.alert('Error', 'No se pudieron cargar los equipos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleTeamStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar el estado local
      setTeams(teams.map(team => 
        team.id === id ? { ...team, is_active: !currentStatus } : team
      ));
    } catch (error) {
      console.error('Error updating team status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del equipo');
    }
  };

  const handleDeleteTeam = (id: string) => {
    Alert.alert(
      'Eliminar Equipo',
      '¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteTeam(id),
        },
      ]
    );
  };

  const deleteTeam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar el estado local eliminando el equipo
      setTeams(teams.filter(team => team.id !== id));
      Alert.alert('Éxito', 'Equipo eliminado correctamente');
    } catch (error) {
      console.error('Error deleting team:', error);
      Alert.alert('Error', 'No se pudo eliminar el equipo. Asegúrate de que no tenga partidos o jugadores asociados.');
    }
  };

  const handleImageUpload = async (teamId: string, imageUrl: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ logo_url: imageUrl })
        .eq('id', teamId);

      if (error) throw error;

      // Actualizar el estado local con la nueva URL de la imagen
      setTeams(teams.map(team => 
        team.id === teamId ? { ...team, logo_url: imageUrl, logoUrl: imageUrl } : team
      ));
      Alert.alert('Éxito', 'Logo actualizado correctamente');
    } catch (error) {
      console.error('Error updating team logo:', error);
      Alert.alert('Error', 'No se pudo actualizar el logo del equipo');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeams();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6D00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Equipos</Text>
        <Link href="/(admin)/TeamForm" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FF6D00']}
                tintColor="#FF6D00"
              />
            }
          />
        }
      >
        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No hay equipos registrados</Text>
            <Link href="/(admin)/TeamForm" asChild>
              <TouchableOpacity style={styles.addButtonLarge}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Agregar Equipo</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          teams.map((team) => (
            <View key={team.id} style={styles.teamCard}>
              <View style={styles.teamInfo}>
                {team.logo_url ? (
                  <Image 
                    source={{ uri: team.logo_url }} 
                    style={styles.teamLogo} 
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.teamLogoPlaceholder}>
                    <Ionicons name="shield" size={24} color="#999" />
                  </View>
                )}
                <View style={styles.teamDetails}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <View style={styles.teamMeta}>
                    <Text style={styles.teamCategory}>{team.category_name}</Text>
                    <Text style={styles.teamCoach}>Entrenador: {team.coach}</Text>
                  </View>
                </View>
              </View>
              <ImageUploader 
                onUpload={(imageUrl: string) => handleImageUpload(team.id, imageUrl)} 
                style={styles.imageUploader} 
              />
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.statusButton, team.is_active ? styles.activeButton : styles.inactiveButton]}
                  onPress={() => toggleTeamStatus(team.id, team.is_active)}
                >
                  <Ionicons 
                    name={team.is_active ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={team.is_active ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={styles.statusText}>
                    {team.is_active ? 'Activo' : 'Inactivo'}
                  </Text>
                </TouchableOpacity>
                <Link href={`/TeamForm?teamId=${team.id}`} asChild>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="create-outline" size={20} color="#FF6D00" />
                  </TouchableOpacity>
                </Link>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteTeam(team.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24,
  },
  addButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 15,
    textAlign: 'center',
  },
  addButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6D00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  teamInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  teamLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  teamStadium: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  teamCategory: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  teamCoach: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  activeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  inactiveButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  statusText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    padding: 5,
    marginLeft: 5,
  },
  deleteButton: {
    marginRight: 0,
  },
  imageUploader: {
    marginTop: 10,
  },
});
