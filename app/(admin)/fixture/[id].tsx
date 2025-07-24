import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';

type Match = {
  id: string;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
  home_team_id: string | null;
  away_team_id: string | null;
  match_date: string;
  round: number;
  status: string;
};

type Tournament = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

export default function TournamentFixture() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matchesByDate, setMatchesByDate] = useState<Array<{date: string, matches: Match[], expanded: boolean}>>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const animations = useRef<{[key: string]: Animated.Value}>({});

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener información del torneo
        const { data: tournamentData } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', id)
          .single();
          
        if (tournamentData) {
          setTournament(tournamentData);
          
          // Primero obtenemos los partidos con los IDs de los equipos
          const { data: matchesData } = await supabase
            .from('matches')
            .select(`
              id,
              match_date,
              round,
              status,
              home_team_id,
              away_team_id
            `)
            .eq('tournament_id', id)
            .order('match_date', { ascending: true });
            
          console.log('Datos de partidos:', matchesData);
          
          if (!matchesData || matchesData.length === 0) {
            setMatchesByDate([]);
            return;
          }
          
          // Obtenemos todos los IDs únicos de equipos
          const teamIds = new Set<string>();
          matchesData.forEach(match => {
            if (match.home_team_id) teamIds.add(match.home_team_id);
            if (match.away_team_id) teamIds.add(match.away_team_id);
          });
          
          // Obtenemos los nombres de los equipos
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name')
            .in('id', Array.from(teamIds));
            
          const teamsMap = new Map(
            teamsData?.map(team => [team.id, { name: team.name }]) || []
          );
          
          // Mapeamos los partidos con los nombres de los equipos
          const matchesWithTeamNames: Match[] = matchesData.map(match => ({
            ...match,
            home_team: match.home_team_id ? teamsMap.get(match.home_team_id) || null : null,
            away_team: match.away_team_id ? teamsMap.get(match.away_team_id) || null : null
          }));
          
          console.log('Partidos con nombres de equipos:', matchesWithTeamNames);
          
          // Agrupar partidos por Fecha (Jornada)
          const groupedByRound: {[key: number]: Match[]} = {};
          
          matchesWithTeamNames.forEach(match => {
            const round = match.round;
            if (!groupedByRound[round]) {
              groupedByRound[round] = [];
            }
            groupedByRound[round].push(match);
          });
          
          // Ordenar por número de Fecha (Jornada)
          const sortedRounds = Object.keys(groupedByRound)
            .map(Number)
            .sort((a, b) => a - b);
          
          const matchesByDateArray = sortedRounds.map(round => ({
            date: `Fecha ${round}`,
            matches: groupedByRound[round],
            expanded: false // Inicialmente contraído
          }));
          
          console.log('Partidos agrupados:', matchesByDateArray);
          setMatchesByDate(matchesByDateArray);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const toggleDate = (index: number) => {
    const newMatchesByDate = [...matchesByDate];
    newMatchesByDate[index].expanded = !newMatchesByDate[index].expanded;
    setMatchesByDate(newMatchesByDate);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.container}>
        <Text>No se encontró el torneo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{tournament?.name || 'Fixture'}</Text>
      </View>

      <ScrollView style={styles.container}>
        {matchesByDate.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay partidos programados</Text>
          </View>
        ) : (
          <View style={styles.matchesContainer}>
            {matchesByDate.map((dateGroup, index) => (
              <View key={index} style={styles.dateGroup}>
                <TouchableOpacity 
                  style={styles.dateHeaderContainer}
                  onPress={() => toggleDate(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateHeader}>{dateGroup.date}</Text>
                  <Ionicons 
                    name={dateGroup.expanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {dateGroup.expanded && dateGroup.matches.map((match) => (
                  <View key={match.id} style={styles.matchCard}>
                    <View style={styles.matchHeader}>
                      <Text style={styles.timeText}>
                        {new Date(match.match_date).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })}
                        {' • '}
                        {new Date(match.match_date).toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                    <View style={styles.teamsContainer}>
                      <Text style={styles.teamName}>
                        {match.home_team?.name || 'Por definir'}
                      </Text>
                      <Text style={styles.vsText}>VS</Text>
                      <Text style={styles.teamName}>
                        {match.away_team?.name || 'Por definir'}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <View style={[
                        styles.statusBadge,
                        match.status === 'completed' ? styles.completedBadge : styles.pendingBadge
                      ]}>
                        <Text style={styles.statusText}>
                          {match.status === 'completed' ? 'Finalizado' : 'Pendiente'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
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
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchesContainer: {
    padding: 15,
  },
  dateGroup: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dateHeader: {
    fontWeight: '600',
    color: '#333',
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  roundText: {
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    color: '#666',
    fontSize: 12,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  teamsContainer: {
    marginVertical: 10,
  },
  teamName: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 4,
  },
  vsText: {
    textAlign: 'center',
    color: '#FF6D00',
    fontWeight: 'bold',
    marginVertical: 6,
  },
  statusContainer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});
