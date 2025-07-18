import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { supabase } from '@/config/supabase';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Función auxiliar para calcular la edad
const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

type Team = {
  id: string;
  name: string;
};

type PlayerStatus = 'active' | 'suspended';

interface Suspension {
  id: string;
  start_date: string;
  days_count: number;
  reason: string;
  active: boolean;
}

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  birth_date?: string;
  email?: string;
  photo_url?: string | null;
  team_id?: string | null;
  teams?: Team | null;
  position?: string;
  number?: string;
  age?: number | null;
  team_name?: string;
  status?: PlayerStatus;
  suspensions?: Suspension[];
};

export default function AdminPlayers() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Cargar jugadores con información de equipos
  const loadPlayers = async () => {
    try {
      setLoading(true);
      
      // Primero obtenemos todos los equipos
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name');
        
      if (teamsError) throw teamsError;
      
      // Luego obtenemos todos los jugadores
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('last_name', { ascending: true });
        
      if (playersError) throw playersError;
      
      // Obtenemos las suspensiones activas
      const { data: suspensionsData, error: suspensionsError } = await supabase
        .from('player_suspensions')
        .select('*')
        .eq('active', true);
        
      if (suspensionsError) throw suspensionsError;
        
      console.log('Jugadores cargados:', playersData); // Debug
      
      // Procesar datos para incluir la edad y el nombre del equipo
      const processedPlayers = (playersData || []).map((player) => {
        // Encontrar el equipo del jugador
        const playerTeam = teamsData?.find(team => team.id === player.team_id);
        
        console.log('Procesando jugador:', {
          id: player.id,
          nombre: `${player.first_name} ${player.last_name}`,
          team_id: player.team_id,
          team_name: playerTeam?.name || 'Sin equipo'
        });
        // Calcular edad si hay fecha de nacimiento
        const age = player.birth_date ? calculateAge(player.birth_date) : null;
        
        // Crear objeto de equipo si existe
        const team = playerTeam ? {
          id: playerTeam.id,
          name: playerTeam.name
        } : null;
        
        // Obtener suspensiones activas del jugador
        const playerSuspensions = (suspensionsData || []).filter((s: any) => s.player_id === player.id);
        
        console.log('Procesando jugador:', { 
          id: player.id, 
          name: `${player.first_name} ${player.last_name}`, 
          teamId: team?.id || null,
          teamName: team?.name || 'Sin equipo'
        });
        
        return {
          ...player,
          age,
          team_id: team?.id || null,
          team_name: team?.name || 'Sin equipo',
          teams: team,
          status: playerSuspensions.length > 0 ? 'suspended' : 'active',
          suspensions: playerSuspensions
        };
      });
      
      console.log('Jugadores procesados:', processedPlayers); // Debug
      setPlayers(processedPlayers);
      // Aplicar el filtro actual a los nuevos datos
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const filtered = processedPlayers.filter(player => {
          const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
          const dni = player.dni ? player.dni.toLowerCase() : '';
          return fullName.includes(searchTermLower) || dni.includes(searchTermLower);
        });
        setFilteredPlayers(filtered);
      } else {
        setFilteredPlayers(processedPlayers);
      }
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'No se pudieron cargar los jugadores');
      setPlayers([]);
      setFilteredPlayers([]);
      setLoading(false);
      setRefreshing(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPlayers();
  }, []);

  // Manejar el pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadPlayers();
  };

  // Eliminar un jugador
  const handleDeletePlayer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Actualizar la lista
      setPlayers(players.filter(player => player.id !== id));
      Alert.alert('Éxito', 'Jugador eliminado correctamente');
    } catch (error) {
      console.error('Error deleting player:', error);
      Alert.alert('Error', 'No se pudo eliminar el jugador');
    }
  };

  // Confirmar eliminación
  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Jugador',
      `¿Estás seguro de que deseas eliminar a ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => handleDeletePlayer(id), style: 'destructive' },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6D00" />
      </View>
    );
  }

  // Función para manejar la búsqueda
  const handleSearch = (text: string) => {
    setSearchTerm(text);
    if (text === '') {
      setFilteredPlayers(players);
    } else {
      const searchTermLower = text.toLowerCase();
      const filtered = players.filter(player => {
        const fullName = `${player.first_name} ${player.last_name}`.toLowerCase();
        const dni = player.dni ? player.dni.toLowerCase() : '';
        return fullName.includes(searchTermLower) || dni.includes(searchTermLower);
      });
      setFilteredPlayers(filtered);
    }
  };

  // Función para limpiar la búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    setFilteredPlayers(players);
    setIsSearchFocused(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Link href="/(admin)/AdminPanelScreen" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FF6D00" />
            </TouchableOpacity>
          </Link>
          <Text style={styles.title}>Jugadores</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(admin)/PlayerForm')}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
        <TouchableOpacity 
          onPress={() => setIsSearchFocused(true)}
          style={styles.searchIconContainer}
        >
          <Ionicons name="search" size={22} color="#FF6D00" />
        </TouchableOpacity>
        {isSearchFocused ? (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
              autoFocus
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity 
            style={styles.searchPlaceholder}
            onPress={() => setIsSearchFocused(true)}
          >
            <Text style={styles.searchPlaceholderText}>Buscar jugador...</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6D00" />
          </View>
        ) : filteredPlayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchTerm ? 'No se encontraron jugadores' : 'No hay jugadores registrados'}
            </Text>
          </View>
        ) : (
          filteredPlayers.map((player) => (
            <View 
              key={player.id} 
              style={[
                styles.playerCard,
                player.status === 'suspended' && styles.suspendedPlayerCard
              ]}
            >
              <View style={styles.playerInfo}>
                <TouchableOpacity 
                  style={styles.playerInfoContent}
                  onPress={() => router.push({ pathname: '/(admin)/PlayerForm', params: { playerId: player.id } })}
                >
                  {player.photo_url ? (
                    <Image 
                      source={{ uri: player.photo_url }} 
                      style={styles.playerImage} 
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#666" />
                    </View>
                  )}
                  <View style={styles.playerDetails}>
                    <View style={styles.playerHeader}>
                      <Text style={styles.playerName}>
                        {player.first_name} {player.last_name}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        player.status === 'suspended' ? styles.statusSuspended : styles.statusActive
                      ]}>
                        <Text style={styles.statusText}>
                          {player.status === 'suspended' ? 'Suspendido' : 'Activo'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.playerDni}>
                      {player.dni || 'Sin DNI'}
                    </Text>
                    <Text style={styles.playerMeta}>
                      {player.team_name || 'Sin equipo'}
                      {player.age !== null && ` • ${player.age} años`}
                    </Text>
                    {player.status === 'suspended' && player.suspensions && player.suspensions.length > 0 && (
                      <View style={styles.suspensionInfo}>
                        <Text style={styles.suspensionText}>
                          Suspendido por {player.suspensions[0].days_count} fecha{player.suspensions[0].days_count !== 1 ? 's' : ''} • {player.suspensions[0].reason}
                        </Text>
                        <Text style={styles.suspensionDate}>
                          Desde: {new Date(player.suspensions[0].start_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#999" />
                </TouchableOpacity>
                
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => router.push({ pathname: '/(admin)/PlayerForm', params: { playerId: player.id } })}
                  >
                    <Ionicons name="pencil" size={18} color="#fff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(player.id, `${player.first_name} ${player.last_name}`)}
                  >
                    <Ionicons name="trash" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Definir el tipo para los estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6D00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainerFocused: {
    borderWidth: 1,
    borderColor: '#FF6D00',
  },
  searchIconContainer: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
    paddingVertical: 0,
  },
  searchPlaceholder: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  searchPlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suspendedPlayerCard: {
    backgroundColor: '#fff8f8',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  playerInfoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerDetails: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playerDni: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  playerMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusActive: {
    backgroundColor: '#e6f7e6',
  },
  statusSuspended: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suspensionInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF8E1',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA000',
  },
  suspensionText: {
    fontSize: 13,
    color: '#5D4037',
    fontWeight: '500',
  },
  suspensionDate: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  // Los estilos de actions, editButton y deleteButton ya están definidos arriba
});
