import { ImageUploader } from '@/components/ImageUploader'; // Importar el componente ImageUploader
import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Modal } from 'react-native';

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
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [categoriesMap, setCategoriesMap] = useState<{[name: string]: string}>({});
  const router = useRouter();
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchTeams();
  }, []);
  
  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTeams();
    }, [])
  );

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // Primero obtenemos todas las categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
        
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
      
      // Crear un mapa de nombres de categoría a IDs
      if (categoriesData) {
        const map: {[name: string]: string} = {};
        categoriesData.forEach(cat => {
          map[cat.name] = cat.id;
        });
        setCategoriesMap(map);
      }
      
      // Luego obtenemos todos los equipos
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;
      
      // Mapear los datos para incluir el nombre de la categoría
      const formattedTeams = (teamsData || []).map(team => {
        // Encontrar la categoría del equipo
        const teamCategory = categoriesData?.find(cat => cat.id === team.category_id);
        
        return {
          id: team.id || '',
          name: team.name || 'Equipo sin nombre',
          logo_url: team.logo_url || null,
          logoUrl: team.logo_url || null,
          coach: team.coach || 'Sin entrenador',
          stadium: team.stadium || 'Sin estadio',
          colors: team.colors || '#000000',
          is_active: team.is_active !== undefined ? team.is_active : true,
          category_id: team.category_id || null,
          category_name: teamCategory?.name || 'Sin categoría',
          created_at: team.created_at || new Date().toISOString(),
          updated_at: team.updated_at || new Date().toISOString(),
          createdAt: team.created_at || new Date().toISOString(),
          updatedAt: team.updated_at || new Date().toISOString()
        };
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

  const handleAddTeam = (categoryName: string) => {
    const categoryId = categoriesMap[categoryName];
    if (!categoryId) return;
    
    // Navegar a TeamForm con el ID de la categoría como parámetro
    router.push({
      pathname: '/(admin)/TeamForm',
      params: { categoryId }
    });
  };

  // Función para agrupar equipos por categoría
  const groupTeamsByCategory = (teamsList: Team[]) => {
    const grouped: {[key: string]: Team[]} = {};
    
    // Primero agregamos todas las categorías, incluso si no tienen equipos
    categories.forEach(category => {
      grouped[category.name] = [];
    });
    
    // Agregamos 'Sin categoría' para equipos sin categoría
    if (!grouped['Sin categoría']) {
      grouped['Sin categoría'] = [];
    }
    
    // Agregamos los equipos a sus categorías
    teamsList.forEach(team => {
      const category = team.category_name || 'Sin categoría';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(team);
    });
    
    return grouped;
  };

  const groupedTeams = groupTeamsByCategory(teams);

  // Ordenar las categorías alfabéticamente
  const sortedCategories = Object.keys(groupedTeams).sort((a, b) => a.localeCompare(b));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Equipos</Text>
        <Link href="/(admin)/TeamForm" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sortedCategories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No hay categorías registradas</Text>
          </View>
        ) : (
          sortedCategories.map((category) => {
            const categoryTeams = groupedTeams[category] || [];
            const isExpanded = expandedCategories[category] !== false; // Default expanded
            
            return (
              <View key={category} style={styles.categorySection}>
                <TouchableOpacity 
                  style={styles.categoryHeader} 
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryHeaderContent}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <Text style={styles.teamCount}>
                      ({categoryTeams.length} {categoryTeams.length === 1 ? 'equipo' : 'equipos'})
                    </Text>
                  </View>
                  <Ionicons 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {isExpanded && (
                  <View style={styles.teamsContainer}>
                    <TouchableOpacity 
                      style={styles.addTeamButton}
                      onPress={() => handleAddTeam(category)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
                      <Text style={styles.addTeamButtonText}>Agregar Equipo</Text>
                    </TouchableOpacity>
                    
                    {categoryTeams.length === 0 ? (
                      <View style={styles.emptyCategory}>
                        <Ionicons name="alert-circle-outline" size={24} color="#999" />
                        <Text style={styles.emptyCategoryText}>Sin equipos en esta categoría</Text>
                      </View>
                    ) : (
                      categoryTeams.map((team) => (
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
                                <Ionicons name="shirt-outline" size={24} color="#999" />
                              </View>
                            )}
                            <View style={styles.teamDetails}>
                              <Text style={styles.teamName}>{team.name}</Text>
                              <Text style={styles.teamMeta}>
                                {team.coach} • {team.stadium}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.teamActions}>
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
                            <Link href={`/(admin)/TeamForm?id=${team.id}`} asChild>
                              <TouchableOpacity style={styles.editButton}>
                                <Ionicons name="create-outline" size={20} color="#FF6D00" />
                              </TouchableOpacity>
                            </Link>
                            <TouchableOpacity 
                              style={styles.deleteButton}
                              onPress={() => handleDeleteTeam(team.id)}
                            >
                              <Ionicons name="trash-outline" size={20} color="#F44336" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
      
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backToAdminText}>Volver al Panel</Text>
        </TouchableOpacity>
      </View>
      

    </View>
  );
}

const styles = StyleSheet.create({
  categorySection: {
    marginBottom: 20,
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'visible',
  },
  categoryHeader: {
    backgroundColor: '#121212',
    padding: 10,
    paddingLeft: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: 8,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6D00',
    padding: 12,
    borderRadius: 8,
    margin: 16,
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
  backToAdminText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  addTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  addTeamButtonText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 8,
    paddingTop: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6D00', // Changed to orange
  },
  teamCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  teamsContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  emptyCategory: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  emptyCategoryText: {
    color: '#888',
    fontStyle: 'italic',
  },
  teamActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
  },
  backButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6D00',
    padding: 12,
    borderRadius: 8,
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
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  teamLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: '#333',
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
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
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
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backToAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  backToAdminText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});
