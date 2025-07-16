import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Team {
  id: string;
  name: string;
  logo_url?: string;
}

interface Match {
  id: string;
  round: number;
  home_team: Team;
  away_team: Team;
  home_team_score?: number;
  away_team_score?: number;
}

interface Standing {
  id: string;
  team: Team;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

const TournamentDetails = () => {
  const [expandedRounds, setExpandedRounds] = useState<number[]>([]);
  const [fixture, setFixture] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [standingsError, setStandingsError] = useState<string | null>(null);
  const router = useRouter();
  const { tournamentId, tournamentName } = useLocalSearchParams<{ 
    tournamentId: string; 
    tournamentName?: string 
  }>();

  const toggleRound = (round: number) => {
    setExpandedRounds(prev => 
      prev.includes(round) 
        ? prev.filter(r => r !== round)
        : [...prev, round]
    );
  };

  // Get unique and sorted rounds from fixture
  const rounds = useMemo(() => {
    return [...new Set(fixture.map(match => match.round))].sort((a, b) => a - b);
  }, [fixture]);

  useEffect(() => {
    if (tournamentId) {
      loadData();
    }
  }, [tournamentId]);

  const loadData = async () => {
    setLoading(true);
    setStandingsError(null);
    // 1. Traer partidos (fixture)
    const { data: matchesData, error: matchError } = await supabase
      .from('matches')
      .select(`
        id, round, match_date, home_team_id, away_team_id, home_team_score, away_team_score,
        home_team:home_team_id (id, name, logo_url),
        away_team:away_team_id (id, name, logo_url)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true });

    // Procesar los partidos para asegurar que tengan la estructura correcta
    const matches = (matchesData || []).map((match: any) => {
      const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
      const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;
      
      return {
        id: match.id,
        round: match.round,
        match_date: match.match_date,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        home_team_score: match.home_team_score,
        away_team_score: match.away_team_score,
        home_team: {
          id: homeTeam?.id || match.home_team_id,
          name: homeTeam?.name || 'Equipo Local',
          logo_url: homeTeam?.logo_url
        },
        away_team: {
          id: awayTeam?.id || match.away_team_id,
          name: awayTeam?.name || 'Equipo Visitante',
          logo_url: awayTeam?.logo_url
        }
      } as Match;
    });
    
    setFixture(matches);
    // 2. Traer tabla de posiciones con todos los equipos del torneo
    let standingsErrorObj = null;
    // Primero obtenemos los equipos del torneo
    const { data: tournamentTeams, error: standingsError } = await supabase
      .from('tournament_registrations')
      .select(`
        team:teams!inner(id, name, logo_url),
        standings!left(
          points, played, won, drawn, lost, goals_for, goals_against, goal_difference
        )
      `)
      .eq('tournament_id', tournamentId);
      
    if (standingsError) {
      console.error('Error al cargar la tabla de posiciones:', standingsError);
      setStandingsError('Error al cargar la tabla de posiciones');
      setLoading(false);
      return;
    }
    
    // Ordenamos los resultados manualmente después de obtenerlos
    const sortedTeams = [...(tournamentTeams || [])].sort((a, b) => {
      const aPoints = a.standings?.[0]?.points || 0;
      const bPoints = b.standings?.[0]?.points || 0;
      return bPoints - aPoints; // Orden descendente (mayor a menor)
    });

    // Procesar los datos para tener una estructura consistente
    const processedStandings = (sortedTeams || []).map((item: any) => {
      const teamStats = item.standings?.[0] || {};
      return {
        id: item.team.id,
        team_id: item.team.id,
        team: {
          id: item.team.id,
          name: item.team.name,
          logo_url: item.team.logo_url
        },
        points: teamStats.points || 0,
        played: teamStats.played || 0,
        won: teamStats.won || 0,
        drawn: teamStats.drawn || 0,
        lost: teamStats.lost || 0,
        goals_for: teamStats.goals_for || 0,
        goals_against: teamStats.goals_against || 0,
        goal_difference: teamStats.goal_difference || 0
      } as Standing;
    });

    if (standingsError) {
      console.error('Error al consultar standings:', standingsError);
      setStandingsError('Error al cargar la tabla de posiciones. (Ver consola)');
      standingsErrorObj = standingsError;
    }
    // Rounds are now handled by the useMemo hook
    if (processedStandings.length > 0) {
      setStandings(processedStandings);
    } else {
      setStandingsError('No hay equipos registrados en este torneo.');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FF6D00" />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {tournamentName || 'Detalles'}
            </Text>
            <View style={styles.headerRight} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6D00" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FF6D00" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {tournamentName || 'Detalles'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {/* Sección de Tabla de Posiciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tabla de Posiciones</Text>
            {standingsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{standingsError}</Text>
                <TouchableOpacity onPress={loadData} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                <FlatList
                  data={standings}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item, index }) => (
                    <View style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                      <Text style={[styles.cell, styles.positionCell]}>{index + 1}</Text>
                      <View style={styles.teamCell}>
                        {item.team?.logo_url ? (
                          <Image 
                            source={{ uri: item.team.logo_url }} 
                            style={styles.teamLogoSmall} 
                            resizeMode="contain" 
                          />
                        ) : (
                          <View style={[styles.teamLogoSmall, { backgroundColor: '#f0f0f0' }]} />
                        )}
                        <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                          {item.team?.name}
                        </Text>
                      </View>
                      <Text style={[styles.cell, styles.statsCell]}>{item.points}</Text>
                      <Text style={[styles.cell, styles.statsCell]}>{item.played}</Text>
                      <Text style={[styles.cell, styles.statsCell]}>{item.won}</Text>
                      <Text style={[styles.cell, styles.statsCell]}>{item.drawn}</Text>
                      <Text style={[styles.cell, styles.statsCell]}>{item.lost}</Text>
                      <Text style={[styles.cell, styles.statsCell]}>{item.goals_for}</Text>
                      <Text style={[styles.cell, styles.statsCell]}>{item.goals_against}</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.lastCell]}>{item.goal_difference}</Text>
                    </View>
                  )}
                  ListHeaderComponent={() => (
                    <View style={[styles.tableRow, styles.headerRow]}>
                      <Text style={[styles.cell, styles.positionCell, styles.headerCell]}>#</Text>
                      <Text style={[styles.cell, styles.teamHeaderCell, styles.headerCell]}>Equipo</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.headerCell]}>Pts</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.headerCell]}>PJ</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.headerCell]}>G</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.headerCell]}>E</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.headerCell]}>P</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.headerCell]}>GF</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.headerCell]}>GC</Text>
                      <Text style={[styles.cell, styles.statsCell, styles.headerCell, styles.lastCell]}>DG</Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>

          {/* Sección de Fixture */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fixture</Text>
            {fixture.length === 0 ? (
              <Text style={styles.noMatches}>No hay partidos programados</Text>
            ) : (
              rounds.map((round) => (
                <View key={round} style={styles.roundCard}>
                  <TouchableOpacity 
                    style={styles.roundHeader}
                    onPress={() => toggleRound(round)}
                  >
                    <Text style={styles.roundTitle}>Fecha {round}</Text>
                    <Ionicons 
                      name={expandedRounds.includes(round) ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                  
                  {expandedRounds.includes(round) && (
                    <View style={styles.matchesContainer}>
                      {fixture
                        .filter(match => match.round === round)
                        .map((match) => (
                          <View key={match.id} style={styles.matchRow}>
                            <View style={styles.teamContainer}>
                              <Text style={styles.teamName} numberOfLines={1}>
                                {match.home_team?.name}
                              </Text>
                              {match.home_team?.logo_url && (
                                <Image 
                                  source={{ uri: match.home_team.logo_url }} 
                                  style={styles.teamLogo} 
                                  resizeMode="contain" 
                                />
                              )}
                            </View>
                            
                            <View style={styles.scoreContainer}>
                              <Text style={styles.scoreText}>
                                {match.home_team_score !== null ? match.home_team_score : '-'}
                              </Text>
                              <Text style={styles.vsText}>vs</Text>
                              <Text style={styles.scoreText}>
                                {match.away_team_score !== null ? match.away_team_score : '-'}
                              </Text>
                            </View>
                            
                            <View style={[styles.teamContainer, styles.awayTeam]}>
                              {match.away_team?.logo_url && (
                                <Image 
                                  source={{ uri: match.away_team.logo_url }} 
                                  style={styles.teamLogo} 
                                  resizeMode="contain" 
                                />
                              )}
                              <Text style={styles.teamName} numberOfLines={1}>
                                {match.away_team?.name}
                              </Text>
                            </View>
                          </View>
                        ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    zIndex: 1,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 40, // Asegura espacio para los botones laterales
    zIndex: 0,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    paddingLeft: 4,
  },
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerRow: {
    backgroundColor: '#FF6D00',
    paddingVertical: 10,
  },
  evenRow: {
    backgroundColor: '#fff',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  cell: {
    textAlign: 'center',
    fontSize: 12,
    color: '#333',
  },
  positionCell: {
    width: 30,
    fontWeight: 'bold',
    paddingLeft: 8,
  },
  teamCell: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 4,
  },
  teamHeaderCell: {
    flex: 3,
    textAlign: 'left',
    paddingLeft: 16,
  },
  statsCell: {
    width: 30,
    fontVariant: ['tabular-nums'],
  },
  lastCell: {
    paddingRight: 8,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  teamLogoSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 12,
    marginRight: 4,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#FF6D00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  roundCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  roundTitle: {
    fontWeight: '600',
    color: '#333',
    fontSize: 15,
  },
  matchesContainer: {
    paddingHorizontal: 12,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  teamContainer: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  awayTeam: {
    justifyContent: 'flex-end',
  },
  teamLogo: {
    width: 30,
    height: 30,
    marginHorizontal: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  scoreText: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  vsText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  noMatches: {
    textAlign: 'center',
    color: '#666',
    padding: 16,
    fontSize: 14,
  },
});

export default TournamentDetails;
