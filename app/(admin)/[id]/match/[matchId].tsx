import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Player = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  team_id: string;
  goals: number;
  yellow_cards: number;
  red_card: boolean;
  name?: string; // For backward compatibility
};

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

export default function MatchResultScreen() {
  const { id: tournamentId, matchId } = useLocalSearchParams<{ id: string; matchId: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  // Handle goal changes for players
  const handleGoalChange = (player: Player, teamId: string, change: number) => {
    const updatedPlayers = teamId === match?.home_team_id ? [...homePlayers] : [...awayPlayers];
    const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
    if (playerIndex !== -1) {
      const newGoals = Math.max(0, (updatedPlayers[playerIndex].goals || 0) + change);
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        goals: newGoals,
      };
      
      if (teamId === match?.home_team_id) {
        setHomePlayers(updatedPlayers);
      } else {
        setAwayPlayers(updatedPlayers);
      }
    }
  };

  // Handle yellow card changes for players
  const handleYellowCardChange = (player: Player, teamId: string, change: number) => {
    const updatedPlayers = teamId === match?.home_team_id ? [...homePlayers] : [...awayPlayers];
    const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
    if (playerIndex !== -1) {
      const newYellowCards = Math.max(0, (updatedPlayers[playerIndex].yellow_cards || 0) + change);
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        yellow_cards: newYellowCards,
        // Second yellow is a red card
        red_card: newYellowCards >= 2,
      };
      
      if (teamId === match?.home_team_id) {
        setHomePlayers(updatedPlayers);
      } else {
        setAwayPlayers(updatedPlayers);
      }
    }
  };

  // Handle red card changes for players
  const handleRedCardChange = (player: Player, teamId: string, hasRedCard: boolean) => {
    const updatedPlayers = teamId === match?.home_team_id ? [...homePlayers] : [...awayPlayers];
    const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
    if (playerIndex !== -1) {
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        red_card: hasRedCard,
        // Reset yellow cards if red card is removed
        yellow_cards: hasRedCard ? 2 : 0, // Assuming 2 yellow cards = red card
      };
      
      if (teamId === match?.home_team_id) {
        setHomePlayers(updatedPlayers);
      } else {
        setAwayPlayers(updatedPlayers);
      }
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setLoading(true);
      setLoadingPlayers(true);
      
      console.log(`Fetching match with ID: ${matchId}`);
      
      // Fetch match data with team relationships
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:home_team_id(*),
          away_team:away_team_id(*)
        `)
        .eq('id', matchId)
        .single();

      if (matchError) {
        console.error('Match query error:', matchError);
        throw new Error(`Error al cargar el partido: ${matchError.message}`);
      }
      
      if (!matchData) {
        console.error('No match data returned for ID:', matchId);
        throw new Error('No se encontró el partido solicitado');
      }

      console.log('Match data loaded:', matchData);
      
      // Validate team data
      if (!matchData.home_team || !matchData.away_team) {
        console.error('Missing team data:', {
          hasHomeTeam: !!matchData.home_team,
          hasAwayTeam: !!matchData.away_team,
          matchData
        });
        throw new Error('No se encontró la información completa de los equipos');
      }

      setMatch({
        ...matchData,
        home_team_name: matchData.home_team?.name || 'Equipo Local',
        away_team_name: matchData.away_team?.name || 'Equipo Visitante',
      });
      
      setHomeScore(matchData.home_team_score?.toString() || '0');
      setAwayScore(matchData.away_team_score?.toString() || '0');

      console.log('Fetching players for teams:', {
        homeTeamId: matchData.home_team_id,
        awayTeamId: matchData.away_team_id
      });

      // Fetch players for both teams in parallel
      const [homePlayersRes, awayPlayersRes] = await Promise.all([
        supabase
          .from('players')
          .select('id, first_name, last_name, team_id')
          .eq('team_id', matchData.home_team_id)
          .order('first_name'),
        
        supabase
          .from('players')
          .select('id, first_name, last_name, team_id')
          .eq('team_id', matchData.away_team_id)
          .order('first_name')
      ]);

      if (homePlayersRes.error) {
        console.error('Error loading home team players:', homePlayersRes.error);
        throw new Error('Error al cargar los jugadores del equipo local');
      }
      
      if (awayPlayersRes.error) {
        console.error('Error loading away team players:', awayPlayersRes.error);
        throw new Error('Error al cargar los jugadores del equipo visitante');
      }

      console.log('Players loaded:', {
        homePlayers: homePlayersRes.data?.length || 0,
        awayPlayers: awayPlayersRes.data?.length || 0
      });

      // Initialize players with default values and ensure all fields are present
      setHomePlayers(homePlayersRes.data?.map(p => ({
        id: p.id,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        team_id: p.team_id,
        goals: 0,
        yellow_cards: 0,
        red_card: false,
        name: p.first_name || '' // For backward compatibility
      })) || []);
      
      setAwayPlayers(awayPlayersRes.data?.map(p => ({
        id: p.id,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        team_id: p.team_id,
        goals: 0,
        yellow_cards: 0,
        red_card: false,
        name: p.first_name || '' // For backward compatibility
      })) || []);
      
      // Load existing goals if any
      console.log('Loading existing goals for match:', matchId);
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('match_id', matchId);

      if (goalsError) {
        console.error('Error loading goals:', goalsError);
        throw new Error('Error al cargar los goles del partido');
      }

      if (goals && goals.length > 0) {
        console.log(`Found ${goals.length} existing goals`);
        // Update goals count for each player
        setHomePlayers(prev => 
          prev.map(p => {
            const playerGoals = goals.filter(g => g.player_id === p.id && g.team_id === matchData.home_team_id).length;
            return {
              ...p,
              goals: playerGoals
            };
          })
        );
        
        setAwayPlayers(prev =>
          prev.map(p => {
            const playerGoals = goals.filter(g => g.player_id === p.id && g.team_id === matchData.away_team_id).length;
            return {
              ...p,
              goals: playerGoals
            };
          })
        );
      } else {
        console.log('No existing goals found for this match');
      }
      
    } catch (error) {
      console.error('Error in fetchMatch:', error);
      Alert.alert(
        'Error al cargar el partido', 
        error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      );
      // Optionally navigate back on error
      // setTimeout(() => router.back(), 2000);
    } finally {
      setLoading(false);
      setLoadingPlayers(false);
    }
  };

  const handleSaveResult = async () => {
    if (!homeScore || !awayScore) {
      Alert.alert('Error', 'Por favor ingrese el resultado completo');
      return;
    }

    try {
      setSaving(true);
      
      // Save match result
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          home_team_score: parseInt(homeScore, 10),
          away_team_score: parseInt(awayScore, 10),
          status: 'completed'
        })
        .eq('id', matchId);

      if (matchError) throw matchError;
      
      // Prepare match events data
      const matchEvents = [];
      
      // Process home team events
      for (const player of homePlayers) {
        // Add goals
        if (player.goals > 0) {
          matchEvents.push(
            ...Array(player.goals).fill(0).map(() => ({
              player_id: player.id,
              match_id: matchId,
              team_id: match?.home_team_id,
              event_type: 'goal',
              created_at: new Date().toISOString()
            }))
          );
        }
        
        // Add yellow cards
        if (player.yellow_cards > 0) {
          matchEvents.push(
            ...Array(player.yellow_cards).fill(0).map(() => ({
              player_id: player.id,
              match_id: matchId,
              team_id: match?.home_team_id,
              event_type: 'yellow_card',
              created_at: new Date().toISOString()
            }))
          );
        }
        
        // Add red card if any
        if (player.red_card) {
          matchEvents.push({
            player_id: player.id,
            match_id: matchId,
            team_id: match?.home_team_id,
            event_type: 'red_card',
            created_at: new Date().toISOString()
          });
        }
      }
      
      // Process away team events
      for (const player of awayPlayers) {
        // Add goals
        if (player.goals > 0) {
          matchEvents.push(
            ...Array(player.goals).fill(0).map(() => ({
              player_id: player.id,
              match_id: matchId,
              team_id: match?.away_team_id,
              event_type: 'goal',
              created_at: new Date().toISOString()
            }))
          );
        }
        
        // Add yellow cards
        if (player.yellow_cards > 0) {
          matchEvents.push(
            ...Array(player.yellow_cards).fill(0).map(() => ({
              player_id: player.id,
              match_id: matchId,
              team_id: match?.away_team_id,
              event_type: 'yellow_card',
              created_at: new Date().toISOString()
            }))
          );
        }
        
        // Add red card if any
        if (player.red_card) {
          matchEvents.push({
            player_id: player.id,
            match_id: matchId,
            team_id: match?.away_team_id,
            event_type: 'red_card',
          });
        }
      }

      // Save all events
      if (matchEvents.length > 0) {
        const { error: eventError } = await supabase
          .from('match_events')
          .upsert(matchEvents, { onConflict: 'player_id,match_id,event_type' });

        if (eventError) {
          console.error('Error saving match events:', eventError);
          throw eventError;
        }
      }

      // Update match status to 'completed' if not already
      if (match?.status !== 'completed') {
        const { error: matchError } = await supabase
          .from('matches')
          .update({ status: 'completed' })
          .eq('id', matchId);

        if (matchError) {
          console.error('Error updating match status:', matchError);
          throw matchError;
        }
      }

      setSaving(false);
      Alert.alert('Éxito', 'El resultado del partido ha sido guardado correctamente');
      router.back();
    } catch (error) {
      console.error('Error saving match result:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar el resultado del partido');
      setSaving(false);
    }
  };

  // Render player item
  const renderPlayerItem = ({ item: player, teamId }: { item: Player; teamId: string }) => (
    <View style={[
      styles.playerRow,
      player.red_card && styles.playerSuspended
    ]}>
      <Text style={[
        styles.playerName,
        player.red_card && styles.suspendedText
      ]}>
        {player.first_name} {player.last_name}
      </Text>
      
      <View style={styles.statContainer}>
        <Text style={styles.statValue}>{player.goals}</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.statButton, styles.goalButton]}
            onPress={() => handleGoalChange(player, teamId, 1)}
            disabled={saving || player.red_card}
          >
            <Ionicons name="football" size={16} color="#2e7d32" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statButton, styles.goalButton]}
            onPress={() => handleGoalChange(player, teamId, -1)}
            disabled={saving || player.goals <= 0 || player.red_card}
          >
            <Text style={{ color: '#2e7d32', fontWeight: 'bold' }}>-</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statContainer}>
        <Text style={styles.statValue}>{player.yellow_cards}</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.statButton, styles.yellowCardButton]}
            onPress={() => handleYellowCardChange(player, teamId, 1)}
            disabled={saving || player.red_card}
          >
            <Ionicons name="warning" size={16} color="#f9a825" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statButton, styles.yellowCardButton]}
            onPress={() => handleYellowCardChange(player, teamId, -1)}
            disabled={saving || player.yellow_cards <= 0 || player.red_card}
          >
            <Text style={{ color: '#f9a825', fontWeight: 'bold' }}>-</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statContainer}>
        <Text style={styles.statValue}>{player.red_card ? '1' : '0'}</Text>
        <TouchableOpacity
          style={[
            styles.statButton,
            styles.redCardButton,
            player.red_card && styles.activeRedCard
          ]}
          onPress={() => handleRedCardChange(player, teamId, !player.red_card)}
          disabled={saving}
        >
          <Ionicons 
            name={player.red_card ? 'close-circle' : 'close-circle-outline'} 
            size={16} 
            color={player.red_card ? '#fff' : '#f44336'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Cargando datos del partido...</Text>
      </View>
    );
  }

  if (loadingPlayers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Cargando jugadores...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.container}>
        <Text>No se encontró el partido</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Editar Partido',
          headerTitleStyle: { color: '#fff' },
          headerStyle: { backgroundColor: '#1976D2' },
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.matchContainer}>
          <Text style={styles.title}>
            {match.home_team_name} vs {match.away_team_name}
          </Text>
          
          <View style={styles.teamsContainer}>
            <View style={styles.teamContainer}>
              <Text style={styles.teamName}>{match.home_team_name}</Text>
              <View style={styles.scoreContainer}>
                <TextInput
                  style={styles.scoreInput}
                  value={homeScore}
                  onChangeText={setHomeScore}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
            
            <Text style={styles.vsText}>VS</Text>
            
            <View style={styles.teamContainer}>
              <Text style={styles.teamName}>{match.away_team_name}</Text>
              <View style={styles.scoreContainer}>
                <TextInput
                  style={styles.scoreInput}
                  value={awayScore}
                  onChangeText={setAwayScore}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <Ionicons name="football" size={16} color="#2e7d32" />
              <Text style={styles.legendText}>Goles</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="warning" size={16} color="#f9a825" />
              <Text style={styles.legendText}>Amarillas</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="close-circle" size={16} color="#f44336" />
              <Text style={styles.legendText}>Rojas</Text>
            </View>
          </View>
          
          <View style={styles.playersContainer}>
            {/* Home Team Players */}
            <View style={styles.teamPlayers}>
              <Text style={styles.teamPlayersTitle}>Jugadores {match.home_team_name}</Text>
              <FlatList
                data={homePlayers}
                renderItem={({ item }) => renderPlayerItem({ item, teamId: match.home_team_id })}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
            
            {/* Away Team Players */}
            <View style={styles.teamPlayers}>
              <Text style={styles.teamPlayersTitle}>Jugadores {match.away_team_name}</Text>
              <FlatList
                data={awayPlayers}
                renderItem={({ item }) => renderPlayerItem({ item, teamId: match.away_team_id })}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled
            ]}
            onPress={handleSaveResult}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Resultado</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  matchContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    minWidth: 60,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#666',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  teamPlayers: {
    flex: 1,
    marginHorizontal: 5,
  },
  teamPlayersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  playerSuspended: {
    opacity: 0.6,
    backgroundColor: '#ffebee',
  },
  suspendedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  playerName: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  statContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 50,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    minWidth: 30,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 2,
  },
  statButton: {
    padding: 4,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 28,
    height: 28,
  },
  goalButton: {
    backgroundColor: '#e8f5e9',
  },
  yellowCardButton: {
    backgroundColor: '#fffde7',
  },
  redCardButton: {
    backgroundColor: '#ffebee',
  },
  activeRedCard: {
    backgroundColor: '#f44336',
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamPlayersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    textAlign: 'center',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  playerSuspended: {
    opacity: 0.6,
    backgroundColor: '#ffebee',
  },
  suspendedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  playerName: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    marginRight: 10,
  },
  statContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 50,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    minWidth: 30,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 2,
  },
  statButton: {
    padding: 4,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 28,
    height: 28,
  },
  goalButton: {
    backgroundColor: '#e8f5e9',
  },
  yellowCardButton: {
    backgroundColor: '#fffde7',
  },
  redCardButton: {
    backgroundColor: '#ffebee',
  },
  activeRedCard: {
    backgroundColor: '#f44336',
  },
  // Save Button
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
