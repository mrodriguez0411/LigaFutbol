import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '@/config/supabase';
import { useRouter } from 'expo-router';
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
};

export default function AdminPlayers() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar jugadores con información de equipos usando LEFT JOIN para incluir jugadores sin equipo
  const loadPlayers = async () => {
    try {
      setLoading(true);
      
      // Obtenemos los jugadores con la información del equipo (si existe)
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          teams!left (id, name)
        `)
        .order('last_name', { ascending: true });
        
      if (error) throw error;
      
      console.log('Jugadores cargados:', data); // Debug
      
      // Procesar datos para incluir la edad y el nombre del equipo
      const processedPlayers = data.map(player => {
        // Calcular edad si hay fecha de nacimiento
        const age = player.birth_date ? calculateAge(player.birth_date) : null;
        
        // Obtener el nombre del equipo o 'Sin equipo' si no tiene
        const teamName = Array.isArray(player.teams) && player.teams.length > 0 
          ? player.teams[0].name 
          : 'Sin equipo';
        
        const teamId = Array.isArray(player.teams) && player.teams.length > 0 
          ? player.teams[0].id 
          : null;
        
        console.log('Procesando jugador:', { 
          id: player.id, 
          name: `${player.first_name} ${player.last_name}`, 
          teamId,
          teamName 
        });
        
        return {
          ...player,
          age,
          team_id: teamId,
          team_name: teamName,
          // Asegurarse de que teams sea un objeto o null para evitar errores
          teams: Array.isArray(player.teams) && player.teams.length > 0 ? player.teams[0] : null
        };
      });
      
      console.log('Jugadores procesados:', processedPlayers); // Debug
      setPlayers(processedPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'No se pudieron cargar los jugadores');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jugadores</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push({ pathname: '/(admin)/PlayerForm', params: { playerId: undefined } })}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
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
        ) : players.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay jugadores registrados</Text>
          </View>
        ) : (
          players.map((player) => (
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
                    <Text style={styles.playerMeta}>
                      {player.team_name || 'Sin equipo'}
                      {player.age !== null && ` • ${player.age} años`}
                    </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
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
  scrollView: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
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
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  addFirstButton: {
    backgroundColor: '#FF6D00',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  suspendedPlayerCard: {
    opacity: 0.7,
    backgroundColor: '#f9f9f9',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
  },
  statusSuspended: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  playerInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginLeft: 10,
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
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playerMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  // Los estilos de actions, editButton y deleteButton ya están definidos arriba
});
