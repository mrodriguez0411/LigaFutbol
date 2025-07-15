import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ThemedText, ThemedView } from '../components/Themed';
import { supabase } from '../config/supabase';

interface TournamentRoster {
  player: Player;
}

interface SupabaseResponse<T> {
  data: T[] | null;
  error: any;
}

interface TeamStatsResponse {
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  created_at: string;
  tournament_registration_id: string;
  tournament_id: string;
}

interface TeamDetailsScreenRouteParams {
  teamId: string;
  tournamentId: string;
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  category_id: string;
  created_at: string;
}

interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  created_at: string;
}

interface TeamStats {
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

interface TeamDetailsScreenProps {
  route: {
    params: TeamDetailsScreenRouteParams;
  };
  navigation: any;
}

export default function TeamDetailsScreen({ route, navigation }: TeamDetailsScreenProps) {
  const { teamId, tournamentId } = route.params as TeamDetailsScreenRouteParams;
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Obtener datos del equipo
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (teamError) throw teamError;
        setTeam(teamData);

        // Obtener jugadores del equipo en este torneo
        const { data: playersData, error: playersError } = await supabase
          .from('tournament_rosters')
          .select('player:player_id(*)')
          .eq('tournament_registration_id', teamId)
          .order('player.number', { ascending: true }) as SupabaseResponse<TournamentRoster>;

        if (playersError) throw playersError;
        const players = (playersData || []).map(r => r.player);
        setPlayers(players);

        // Obtener estadísticas del equipo en este torneo
        const { data: statsData, error: statsError } = await supabase
          .from('standings')
          .select('*')
          .eq('tournament_registration_id', teamId)
          .eq('tournament_id', tournamentId)
          .single() as { data: TeamStatsResponse | null; error: any; };

        if (statsError) throw statsError;
        if (statsData) {
          setStats({
            games_played: statsData.games_played,
            wins: statsData.wins,
            draws: statsData.draws,
            losses: statsData.losses,
            goals_for: statsData.goals_for,
            goals_against: statsData.goals_against,
            goal_difference: statsData.goal_difference,
            points: statsData.points
          });
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, tournamentId]);

  if (loading) {
    return (
      <ThemedView style={styles.container} light="#fff" dark="#000">
        <ThemedText light="#000" dark="#fff">Cargando...</ThemedText>
      </ThemedView>
    );
  }

  if (!team) {
    return (
      <ThemedView style={styles.container} light="#fff" dark="#000">
        <ThemedText light="#000" dark="#fff">Equipo no encontrado</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {team.logo_url && (
          <Image 
            source={{ uri: team.logo_url }} 
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <ThemedText light="#000" dark="#fff" style={styles.teamName}>{team.name}</ThemedText>
      </View>

      {/* Estadísticas del equipo */}
      {stats && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle} light="#000" dark="#fff">Estadísticas</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText light="#000" dark="#fff">PJ</ThemedText>
              <ThemedText light="#000" dark="#fff">{stats.games_played}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText light="#000" dark="#fff">PG</ThemedText>
              <ThemedText light="#000" dark="#fff">{stats.wins}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText light="#000" dark="#fff">PE</ThemedText>
              <ThemedText light="#000" dark="#fff">{stats.draws}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText light="#000" dark="#fff">PP</ThemedText>
              <ThemedText light="#000" dark="#fff">{stats.losses}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText light="#000" dark="#fff">GF</ThemedText>
              <ThemedText light="#000" dark="#fff">{stats.goals_for}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText light="#000" dark="#fff">GC</ThemedText>
              <ThemedText light="#000" dark="#fff">{stats.goals_against}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText light="#000" dark="#fff">GD</ThemedText>
              <ThemedText light="#000" dark="#fff">{stats.goal_difference}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText light="#000" dark="#fff">Pts</ThemedText>
              <ThemedText light="#000" dark="#fff">{stats.points}</ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Jugadores */}
      <View style={styles.teamStats}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PlayerForm', {
              tournamentId: route.params.tournamentId,
              teamId: route.params.teamId,
            })}
          >
            <Text style={styles.actionButtonText}>Nuevo Jugador</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.statLabel}>Jugadores:</Text>
        {players.map((player, index) => (
          <View key={index} style={styles.playerItem}>
            <Text style={styles.playerNumber}>{player.number}</Text>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerPosition}>{player.position}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('PlayerForm', {
                playerId: player.id,
                tournamentId: route.params.tournamentId,
                teamId: route.params.teamId,
              })}
            >
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 15,
  },
  teamStats: {
    padding: 15,
  },
  actionButtons: {
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  playerNumber: {
    width: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  playerName: {
    flex: 1,
  },
  playerPosition: {
    width: 80,
    textAlign: 'right',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
