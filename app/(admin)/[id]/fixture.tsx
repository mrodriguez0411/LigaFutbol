import { Stack, useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';

const { width } = Dimensions.get('window');

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_score: number | null;
  away_team_score: number | null;
  match_date: string;
  status: string;
  round: number;
}

export default function TournamentFixture() {
  const { id: tournamentId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRounds, setExpandedRounds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(name),
          away_team:away_team_id(name)
        `)
        .eq('tournament_id', tournamentId)
        .order('round')
        .order('match_date');

      if (error) throw error;

      const formattedMatches = data.map(match => ({
        ...match,
        home_team_name: match.home_team?.name || 'Equipo desconocido',
        away_team_name: match.away_team?.name || 'Equipo desconocido',
      }));

      setMatches(formattedMatches);
      
      // Expand first round by default
      if (data.length > 0) {
        setExpandedRounds(prev => ({
          ...prev,
          [data[0].round]: true
        }));
      }
    } catch (error) {
      console.error('Error al cargar los partidos:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const toggleRound = (round: number) => {
    setExpandedRounds(prev => ({
      ...prev,
      [round]: !prev[round]
    }));
  };

  const navigateToMatch = (matchId: string) => {
    router.push({
      pathname: `/(admin)/${tournamentId}/match/${matchId}`,
      params: { id: tournamentId, matchId }
    } as any);
  };

    const renderMatchItem = ({ item }: { item: Match }) => {
    const matchDate = new Date(item.match_date);
    const isCompleted = item.status === 'completed';
    
    return (
      <TouchableOpacity 
        style={styles.matchItem}
        onPress={() => navigateToMatch(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.matchHeader}>
          <Text style={styles.matchRound}>Fecha {item.round}</Text>
          <View style={[
            styles.matchStatus,
            isCompleted ? styles.statusCompleted : styles.statusScheduled
          ]}>
            <Text style={styles.statusText}>
              {isCompleted ? 'Finalizado' : 'Pendiente'}
            </Text>
          </View>
        </View>
        
        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <Text style={styles.teamName} numberOfLines={1}>
              {item.home_team_name}
            </Text>
            <View style={styles.scoreContainer}>
              <Text style={[
                styles.score,
                isCompleted && styles.scoreCompleted
              ]}>
                {item.home_team_score !== null ? item.home_team_score : '-'}
              </Text>
            </View>
          </View>
          
          <View style={styles.teamRow}>
            <Text style={styles.teamName} numberOfLines={1}>
              {item.away_team_name}
            </Text>
            <View style={styles.scoreContainer}>
              <Text style={[
                styles.score,
                isCompleted && styles.scoreCompleted
              ]}>
                {item.away_team_score !== null ? item.away_team_score : '-'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.matchFooter}>
          <View style={styles.matchTime}>
            <Ionicons name="calendar-outline" size={14} color="#6b7280" />
            <Text style={styles.matchDate}>
              {matchDate.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.matchTime}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={styles.matchDate}>
              {matchDate.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRound = ({ item }: { item: { round: number; matches: Match[] } }) => (
    <View style={styles.roundContainer}>
      <TouchableOpacity 
        style={styles.roundHeader}
        onPress={() => toggleRound(item.round)}
      >
        <Text style={styles.roundTitle}>Fecha {item.round}</Text>
        <Ionicons 
          name={expandedRounds[item.round] ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#4a5568" 
        />
      </TouchableOpacity>
      
      {expandedRounds[item.round] && (
        <View style={styles.matchesContainer}>
          {item.matches.map((match) => (
            <View key={match.id}>
              {renderMatchItem({ item: match })}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Group matches by round
  const rounds = matches.reduce<Record<number, Match[]>>((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {});

  const roundData = Object.entries(rounds).map(([round, matches]) => ({
    round: parseInt(round, 10),
    matches,
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando partidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Fixture del Torneo',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ padding: 8, marginLeft: -8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#2d3748" />
            </TouchableOpacity>
          ),
        }}
      />

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#a0aec0" />
          <Text style={styles.emptyText}>No hay partidos programados</Text>
          <Text style={styles.emptySubtext}>Genera el fixture para ver los partidos</Text>
        </View>
      ) : (
        <FlatList
          data={roundData}
          renderItem={renderRound}
          keyExtractor={(item) => `round-${item.round}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a5568',
    fontFamily: 'Inter-Medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginTop: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  listContent: {
    paddingBottom: 20,
  },
  matchItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  matchRound: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusScheduled: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  teamsContainer: {
    marginVertical: 8,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  teamName: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Inter-Medium',
    marginRight: 12,
  },
  scoreContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  score: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9ca3af',
    fontFamily: 'Inter-Bold',
  },
  scoreCompleted: {
    color: '#1f2937',
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  matchTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchDate: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
    fontFamily: 'Inter-Regular',
  },
  roundContainer: {
    marginBottom: 24,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  matchesContainer: {
    marginTop: 8,
  },
});

// Font loading should be handled in your app's root component
// This is just a reference for the font families used
// Make sure to load the Inter font family in your app's root component
