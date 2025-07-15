import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
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
        home_team:home_team_id (name),
        away_team:away_team_id (name)
      `)
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true });
    // 2. Traer tabla de posiciones
    let standingsData = null;
    let standingsErrorObj = null;
    try {
      const { data, error } = await supabase
        .from('standings')
        .select(`
          id, team_id, points, played, won, drawn, lost, goals_for, goals_against, goal_difference,
          team:team_id (name)
        `)
        .eq('tournament_id', tournamentId)
        .order('points', { ascending: false });
      if (error) {
        console.error('Error al consultar standings:', error);
        setStandingsError('Error al cargar la tabla de posiciones. (Ver consola)');
        standingsErrorObj = error;
      }
      standingsData = data;
    } catch (err: any) {
      console.error('Excepción inesperada al consultar standings:', err);
      setStandingsError('Error inesperado al cargar la tabla de posiciones.');
      standingsErrorObj = err;
    }
    if (matches) {
      setFixture(matches);
      // Generar rondas únicas
      const uniqueRounds = Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b);
      setRounds(uniqueRounds);
    }
    if (standingsData && Array.isArray(standingsData)) {
      setStandings(standingsData);
      if (standingsData.length === 0) {
        setStandingsError('No hay datos de posiciones para este torneo.');
      }
    } else if (!standingsErrorObj) {
      setStandingsError('No fue posible cargar la tabla de posiciones.');
    }
    setLoading(false);
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6D00" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{tournamentName || 'Detalle del Torneo'}</Text>
      <Text style={styles.section}>Tabla de Posiciones</Text>
      <FlatList
        data={standings.length > 0 ? standings : [{}]}
        keyExtractor={(item, index) => item.id ? item.id : `empty-${index}`}
        renderItem={({ item, index }) =>
          standings.length === 0 ? (
            <View style={[styles.tableRow, styles.tableRowEven]}>
              <Text style={[styles.cell, styles.cellTeam]}>Sin datos</Text>
            </View>
          ) : (
            <View style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
              <Text style={[styles.cell, styles.cellTeam]}>{item.team?.name || '-'}</Text>
              <Text style={styles.cell}>{item.points}</Text>
              <Text style={styles.cell}>{item.played}</Text>
              <Text style={styles.cell}>{item.won}</Text>
              <Text style={styles.cell}>{item.drawn}</Text>
              <Text style={styles.cell}>{item.lost}</Text>
              <Text style={styles.cell}>{item.goals_for}</Text>
              <Text style={styles.cell}>{item.goals_against}</Text>
              <Text style={styles.cell}>{item.goal_difference}</Text>
            </View>
          )
        }
        ListHeaderComponent={() => (
          <View style={[styles.tableRow, styles.tableRowHeaderNaranja]}>
            <Text style={[styles.cell, styles.cellTeamHeader]}>Equipo</Text>
            <Text style={styles.cellHeader}>Pts</Text>
            <Text style={styles.cellHeader}>PJ</Text>
            <Text style={styles.cellHeader}>G</Text>
            <Text style={styles.cellHeader}>E</Text>
            <Text style={styles.cellHeader}>P</Text>
            <Text style={styles.cellHeader}>GF</Text>
            <Text style={styles.cellHeader}>GC</Text>
            <Text style={styles.cellHeader}>DG</Text>
          </View>
        )}
      />

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
          <Text style={styles.teamName}>{match.home_team?.name}</Text>
          <Text style={styles.vs}>vs</Text>
          <Text style={styles.teamName}>{match.away_team?.name}</Text>
          <Text style={styles.score}>{match.home_team_score ?? '-'} : {match.away_team_score ?? '-'}</Text>
        </View>
      ))
    )}
  </View>
))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  section: { fontSize: 18, fontWeight: 'bold', marginTop: 18, marginBottom: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  tableRowHeaderNaranja: { backgroundColor: '#FF6D00', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  tableRowEven: { backgroundColor: '#fff' },
  tableRowOdd: { backgroundColor: '#fafafa' },
  cell: { flex: 1, textAlign: 'center', fontSize: 14, color: '#222', paddingVertical: 4 },
  cellTeam: { flex: 2, fontWeight: 'bold', textAlign: 'left', color: '#222' },
  cellHeader: { flex: 1, textAlign: 'center', fontSize: 14, color: '#fff', fontWeight: 'bold' },
  cellTeamHeader: { flex: 2, fontWeight: 'bold', textAlign: 'left', color: '#fff' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 8 },
  retryButton: { marginTop: 12, padding: 10, backgroundColor: '#1976d2', borderRadius: 6 },
  roundCard: { backgroundColor: '#f9f9f9', marginVertical: 10, borderRadius: 8, padding: 12, elevation: 2 },
  roundTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#FF6D00' },
  matchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  teamName: { flex: 2, fontSize: 14 },
  vs: { flex: 1, textAlign: 'center', color: '#888' },
  score: { flex: 1, textAlign: 'center', fontWeight: 'bold' },
});
