import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../config/supabase';

interface Team {
  id: string;
  name: string;
}

interface RosterData {
  player_id: string;
  teams: Team[];
}

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  status: 'active' | 'suspended';
  team_name?: string;
  team_id?: string | null;
  suspensions?: Array<{
    start_date: string;
    days_count: number;
    reason: string;
  }>;
}

export default function PlayersList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      // Primero obtenemos los jugadores
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('last_name', { ascending: true });

      if (playersError) throw playersError;
      if (!playersData) {
        setPlayers([]);
        return;
      }

      // Luego obtenemos los equipos de cada jugador a través de tournament_rosters
      const { data: rostersData, error: rostersError } = await supabase
        .from('tournament_rosters')
        .select(`
          player_id,
          teams!inner (id, name)
        `)
        .in('player_id', playersData.map(p => p.id)) as { data: RosterData[] | null, error: any };

      if (rostersError) throw rostersError;

      // Luego obtenemos las suspensiones activas
      const { data: suspensionsData, error: suspensionsError } = await supabase
        .from('player_suspensions')
        .select('*')
        .eq('active', true);

      if (suspensionsError) throw suspensionsError;

      // Procesar los datos para incluir las suspensiones y el equipo
      const processedPlayers = playersData.map((player: any) => {
        const playerSuspensions = suspensionsData?.filter(s => s.player_id === player.id) || [];
        const playerRosters = rostersData?.filter(r => r.player_id === player.id) || [];
        const team = playerRosters.length > 0 ? playerRosters[0].teams[0] : null;
        
        return {
          ...player,
          status: playerSuspensions.length > 0 ? 'suspended' : 'active',
          suspensions: playerSuspensions,
          team_name: team?.name || 'Sin equipo',
          team_id: team?.id || null
        };
      });

      setPlayers(processedPlayers);
    } catch (error) {
      console.error('Error al cargar jugadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerItem = ({ item }: { item: Player }) => (
    <TouchableOpacity 
      style={[
        styles.playerItem,
        item.status === 'suspended' && styles.suspendedPlayer
      ]}
      onPress={() => router.push(`/(admin)/players/${item.id}`)}
    >
      <View style={styles.playerInfo}>
        <View>
          <Text style={styles.playerName}>
            {item.last_name}, {item.first_name}
          </Text>
          <Text style={styles.teamName}>
            {item.team_name || 'Sin equipo'}
          </Text>
        </View>
        {item.status === 'suspended' && item.suspensions && item.suspensions.length > 0 && (
          <View style={styles.suspensionBadge}>
            <Text style={styles.suspensionText}>
              SUSPENDIDO - {item.suspensions[0].reason}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={players}
        renderItem={renderPlayerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text>No hay jugadores registrados</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/(admin)/players/new')}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  playerItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suspendedPlayer: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30',
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  teamName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  suspensionBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  suspensionText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 30,
    lineHeight: 32,
    marginTop: -2,
  },
});
