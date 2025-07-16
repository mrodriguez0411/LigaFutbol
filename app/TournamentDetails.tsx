import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/config/supabase';

export default function TournamentDetails() {
  const [expandedRounds, setExpandedRounds] = useState<number[]>([]);

  const toggleRound = (round: number) => {
    setExpandedRounds(prev =>
      prev.includes(round)
        ? prev.filter(r => r !== round)
        : [...prev, round]
    );
  };

  // Obtener los parámetros de la URL (Expo Router)
  const { tournamentId, tournamentName } = useLocalSearchParams();

  const [fixture, setFixture] = useState<any[]>([]);
  const [rounds, setRounds] = useState<number[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [standingsError, setStandingsError] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) {
      loadData();
    }
  }, [tournamentId]);

  const loadData = async () => {
    setLoading(true);
    setStandingsError(null);
    // 1. Traer partidos (fixture)
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select(`
        id, round, match_date, home_team_id, away_team_id, home_team_score, away_team_score,
        home_team:home_team_id (name, logo_url),
        away_team:away_team_id (name, logo_url)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true });
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
    
    // Ordenamos los resultados manualmente después de obtenerlos
    const sortedTeams = [...(tournamentTeams || [])].sort((a, b) => {
      const aPoints = a.standings?.[0]?.points || 0;
      const bPoints = b.standings?.[0]?.points || 0;
      return bPoints - aPoints; // Orden descendente (mayor a menor)
    });

    // Procesar los datos para tener una estructura consistente
    const processedStandings = (sortedTeams || []).map((item: any) => ({
      id: item.team.id,
      team_id: item.team.id,
      team: {
        id: item.team.id,
        name: item.team.name,
        logo_url: item.team.logo_url
      },
      points: item.standings?.[0]?.points || 0,
      played: item.standings?.[0]?.played || 0,
      won: item.standings?.[0]?.won || 0,
      drawn: item.standings?.[0]?.drawn || 0,
      lost: item.standings?.[0]?.lost || 0,
      goals_for: item.standings?.[0]?.goals_for || 0,
      goals_against: item.standings?.[0]?.goals_against || 0,
      goal_difference: item.standings?.[0]?.goal_difference || 0
    }));

    if (standingsError) {
      console.error('Error al consultar standings:', standingsError);
      setStandingsError('Error al cargar la tabla de posiciones. (Ver consola)');
      standingsErrorObj = standingsError;
    }
    if (matches) {
      setFixture(matches);
      // Generar rondas únicas
      const uniqueRounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
      setRounds(uniqueRounds);
    }
    if (processedStandings.length > 0) {
      setStandings(processedStandings);
    } else {
      setStandingsError('No hay equipos registrados en este torneo.');
    }
    setLoading(false);
  };


  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{tournamentName || 'Detalle del Torneo'}</Text>
        
        {standingsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{standingsError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.section}>Tabla de Posiciones</Text>
            <View style={styles.tableContainer}>
              <FlatList
                data={standings.length > 0 ? standings : [{}]}
                keyExtractor={(item, index) => item.id ? item.id : `empty-${index}`}
                renderItem={({ item, index }) =>
                  standings.length === 0 ? (
                    <View style={[styles.tableRow, { backgroundColor: '#f9f9f9' }]}>
                      <Text style={[styles.cell, { flex: 3 }]}>Sin datos</Text>
                    </View>
                  ) : (
                    <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }]} key={item.id}>
                      <View style={[styles.cell, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
                        {item.team?.logo_url ? (
                          <Image 
                            source={{ uri: item.team.logo_url }} 
                            style={styles.teamLogoSmall} 
                            resizeMode="contain" 
                          />
                        ) : (
                          <View style={[styles.teamLogoSmall, { backgroundColor: '#f0f0f0' }]} />
                        )}
                        <Text style={{ marginLeft: 8 }} numberOfLines={1} ellipsizeMode="tail">
                          {item.team?.name}
                        </Text>
                      </View>
                      <Text style={[styles.cell, { textAlign: 'center' }]}>{item.points}</Text>
                      <Text style={[styles.cell, { textAlign: 'center' }]}>{item.played}</Text>
                      <Text style={[styles.cell, { textAlign: 'center' }]}>{item.won}</Text>
                      <Text style={[styles.cell, { textAlign: 'center' }]}>{item.drawn}</Text>
                      <Text style={[styles.cell, { textAlign: 'center' }]}>{item.lost}</Text>
                      <Text style={[styles.cell, { textAlign: 'center' }]}>{item.goals_for}</Text>
                      <Text style={[styles.cell, { textAlign: 'center' }]}>{item.goals_against}</Text>
                      <Text style={[styles.cell, { textAlign: 'center' }]}>{item.goal_difference}</Text>
                    </View>
                  )
                }
                ListHeaderComponent={() => (
                  <View style={[styles.tableRow, { backgroundColor: '#f5f5f5' }]}>
                    <Text style={[styles.cell, { flex: 3, fontWeight: 'bold' }]}>Equipo</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>Pts</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>PJ</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>G</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>E</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>P</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>GF</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>GC</Text>
                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>DG</Text>
                  </View>
                )}
              />
            </View>
          </>
        )}

        <Text style={styles.section}>Fixture</Text>
        {rounds.map(round => (
          <View key={round} style={styles.roundCard}>
            <TouchableOpacity onPress={() => toggleRound(round)}>
              <Text style={styles.roundTitle}>
                Fecha {round} {expandedRounds.includes(round) ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
            {expandedRounds.includes(round) && (
              fixture.filter(m => m.round === round).map(match => (
                <View key={match.id} style={styles.matchRow}>
                  <View style={[styles.teamContainer, styles.teamContainerWithScore]}>
                    {match.home_team?.logo_url && (
                      <Image 
                        source={{ uri: match.home_team.logo_url }} 
                        style={styles.teamLogo} 
                        resizeMode="contain" 
                      />
                    )}
                    <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                      {match.home_team?.name}
                    </Text>
                    <Text style={styles.teamScore}>
                      {match.home_team_score ?? '-'}
                    </Text>
                  </View>
                  <Text style={styles.vs}>vs</Text>
                  <View style={[styles.teamContainer, styles.teamContainerWithScore]}>
                    {match.away_team?.logo_url && (
                      <Image 
                        source={{ uri: match.away_team.logo_url }} 
                        style={styles.teamLogo} 
                        resizeMode="contain" 
                      />
                    )}
                    <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                      {match.away_team?.name}
                    </Text>
                    <Text style={styles.teamScore}>
                      {match.away_team_score ?? '-'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{tournamentName || 'Detalle del Torneo'}</Text>
      
      {standingsError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{standingsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.section}>Tabla de Posiciones</Text>
          <View style={styles.tableContainer}>
            <FlatList
              data={standings.length > 0 ? standings : [{}]}
              keyExtractor={(item, index) => item.id ? item.id : `empty-${index}`}
              renderItem={({ item, index }) =>
                standings.length === 0 ? (
                  <View style={[styles.tableRow, { backgroundColor: '#f9f9f9' }]}>
                    <Text style={[styles.cell, { flex: 3 }]}>Sin datos</Text>
                  </View>
                ) : (
                  <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }]} key={item.id}>
                    <View style={[styles.cell, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
                      {item.team?.logo_url ? (
                        <Image 
                          source={{ uri: item.team.logo_url }} 
                          style={styles.teamLogoSmall} 
                          resizeMode="contain" 
                        />
                      ) : (
                        <View style={[styles.teamLogoSmall, { backgroundColor: '#f0f0f0' }]} />
                      )}
                      <Text style={{ marginLeft: 8 }} numberOfLines={1} ellipsizeMode="tail">
                        {item.team?.name}
                      </Text>
                    </View>
                    <Text style={[styles.cell, { textAlign: 'center' }]}>{item.points}</Text>
                    <Text style={[styles.cell, { textAlign: 'center' }]}>{item.played}</Text>
                    <Text style={[styles.cell, { textAlign: 'center' }]}>{item.won}</Text>
                    <Text style={[styles.cell, { textAlign: 'center' }]}>{item.drawn}</Text>
                    <Text style={[styles.cell, { textAlign: 'center' }]}>{item.lost}</Text>
                    <Text style={[styles.cell, { textAlign: 'center' }]}>{item.goals_for}</Text>
                    <Text style={[styles.cell, { textAlign: 'center' }]}>{item.goals_against}</Text>
                    <Text style={[styles.cell, { textAlign: 'center' }]}>{item.goal_difference}</Text>
                  </View>
                )
              }
              ListHeaderComponent={() => (
                <View style={[styles.tableRow, { backgroundColor: '#FF6D00' }]}>
                  <Text style={[styles.cell, { flex: 3, fontWeight: 'bold', color: '#fff' }]}>Equipo</Text>
                  <Text style={[styles.cell, { fontWeight: 'bold', color: '#fff' }]}>Pts</Text>
                  <Text style={[styles.cell, { fontWeight: 'bold', color: '#fff' }]}>PJ</Text>
                  <Text style={[styles.cell, { fontWeight: 'bold', color: '#fff' }]}>G</Text>
                  <Text style={[styles.cell, { fontWeight: 'bold', color: '#fff' }]}>E</Text>
                  <Text style={[styles.cell, { fontWeight: 'bold', color: '#fff' }]}>P</Text>
                  <Text style={[styles.cell, { fontWeight: 'bold', color: '#fff' }]}>GF</Text>
                  <Text style={[styles.cell, { fontWeight: 'bold', color: '#fff' }]}>GC</Text>
                  <Text style={[styles.cell, { fontWeight: 'bold', color: '#fff' }]}>DG</Text>
                </View>
              )}
            />
          </View>
        </>
      )}

      <Text style={styles.section}>Fixture</Text>
      {rounds.map(round => (
        <View key={round} style={styles.roundCard}>
          <TouchableOpacity onPress={() => toggleRound(round)}>
            <Text style={styles.roundTitle}>
              Fecha {round} {expandedRounds.includes(round) ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          {expandedRounds.includes(round) && (
            fixture.filter(m => m.round === round).map(match => (
              <View key={match.id} style={styles.matchRow}>
                <View style={[styles.teamContainer, styles.teamContainerWithScore]}>
                  {match.home_team?.logo_url && (
                    <Image 
                      source={{ uri: match.home_team.logo_url }} 
                      style={styles.teamLogo} 
                      resizeMode="contain" 
                    />
                  )}
                  <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                    {match.home_team?.name}
                  </Text>
                  <Text style={styles.teamScore}>
                    {match.home_team_score ?? '-'}
                  </Text>
                </View>
                <Text style={styles.vs}>vs</Text>
                <View style={[styles.teamContainer, styles.teamContainerWithScore]}>
                  {match.away_team?.logo_url && (
                    <Image 
                      source={{ uri: match.away_team.logo_url }} 
                      style={styles.teamLogo} 
                      resizeMode="contain" 
                    />
                  )}
                  <Text style={styles.teamName} numberOfLines={1} ellipsizeMode="tail">
                    {match.away_team?.name}
                  </Text>
                  <Text style={styles.teamScore}>
                    {match.away_team_score ?? '-'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 16 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 18, 
    textAlign: 'center' 
  },
  section: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 24, 
    marginBottom: 12 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 2,
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 40 
  },
  emptyText: { 
    fontSize: 16, 
    color: '#888', 
    marginTop: 8 
  },
  retryButton: { 
    marginTop: 12, 
    padding: 10, 
    backgroundColor: '#1976d2', 
    borderRadius: 6 
  },
  retryButtonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  errorContainer: { 
    backgroundColor: '#ffebee', 
    padding: 12, 
    borderRadius: 6, 
    marginBottom: 16 
  },
  errorText: { 
    color: '#c62828', 
    marginBottom: 8 
  },
  roundCard: { 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    marginBottom: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roundTitle: { 
    backgroundColor: '#f5f5f5', 
    padding: 12, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  matchRow: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  teamContainerWithScore: { 
    justifyContent: 'space-between',
  },
  vs: { 
    marginHorizontal: 12, 
    fontWeight: 'bold', 
    color: '#666',
    minWidth: 30,
    textAlign: 'center',
  },
  teamLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  teamLogoSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  teamName: { 
    flex: 1, 
    marginLeft: 8,
    fontSize: 12,
  },
  teamScore: {
    fontWeight: 'bold',
    marginLeft: 8,
    minWidth: 20,
    textAlign: 'right',
  },
  score: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});
