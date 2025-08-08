import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Player {
  id: string;
  first_name: string | null;
  last_name: string | null;
  team_id: string;
  goals: number;
  yellow_cards: number;
  red_card: boolean;
  name?: string; // Campo opcional para el nombre completo
}

type EventType = 'goal' | 'yellow_card' | 'red_card';

interface MatchEvent {
  id: string;
  type: EventType;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  minute: number;
  timestamp: Date;
  details?: string;
};

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Match {
  id: string;
  home_team_id: string;
  start_time?: string; // Add optional start_time field
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_score: number | null;
  away_team_score: number | null;
  home_team_logo: string | null;
  away_team_logo: string | null;
  match_date: string;
  status: string;
  round: number;
  home_team: Team;
  away_team: Team;
  tournament_name?: string;
}

export default function MatchResultScreen() {
  const { id: tournamentId, matchId } = useLocalSearchParams<{ id: string; matchId: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isSaving = saving; // Alias for consistency with existing code
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);

  // Log a match event
  const logMatchEvent = (type: EventType, player: Player, teamId: string, eventId?: string) => {
    if (!match) return null;
    
    const isHomeTeam = teamId === match.home_team_id;
    const team = {
      id: isHomeTeam ? match.home_team_id : match.away_team_id,
      name: isHomeTeam ? match.home_team_name : match.away_team_name
    };
    
    const matchStartTime = match.start_time ? new Date(match.start_time).getTime() : Date.now();
    const currentMinute = Math.max(1, Math.floor((Date.now() - matchStartTime) / (1000 * 60)));
    
    const newEvent: MatchEvent = {
      id: eventId || Date.now().toString(),
      type,
      playerId: player.id,
      playerName: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
      teamId: team.id,
      teamName: team.name || 'Equipo desconocido',
      minute: currentMinute,
      timestamp: new Date(),
      details: type === 'goal' ? 'Gol' : type === 'yellow_card' ? 'Tarjeta amarilla' : 'Tarjeta roja'
    };
    
    setMatchEvents(prev => [newEvent, ...prev]);
    return newEvent.id;
  };

  // Remove a match event by player and type
  const removeMatchEvent = (playerId: string, type: EventType) => {
    setMatchEvents(prev => {
      // Find the most recent event of the given type for this player
      const eventIndex = prev.findIndex(e => e.playerId === playerId && e.type === type);
      if (eventIndex === -1) return prev;
      
      // Create a new array without the event
      const newEvents = [...prev];
      newEvents.splice(eventIndex, 1);
      return newEvents;
    });
  };

  // Handle goal changes for players
  const handleGoalChange = (player: Player, teamId: string, change: number) => {
    if (!match) return;
    
    const updatedPlayers = teamId === match.home_team_id ? [...homePlayers] : [...awayPlayers];
    const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
    if (playerIndex === -1) return;
    
    const currentGoals = updatedPlayers[playerIndex].goals || 0;
    const newGoals = Math.max(0, currentGoals + change);
    
    // Update player's goals
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      goals: newGoals,
    };
    
    // Handle event logging/removal
    if (newGoals > currentGoals) {
      // Goal added - log new event
      logMatchEvent('goal', updatedPlayers[playerIndex], teamId);
    } else if (newGoals < currentGoals) {
      // Goal removed - remove the most recent goal event for this player
      removeMatchEvent(player.id, 'goal');
    }
    
    // Update the appropriate team's players
    if (teamId === match.home_team_id) {
      setHomePlayers(updatedPlayers);
    } else {
      setAwayPlayers(updatedPlayers);
    }
  };

  // Handle yellow card changes for players
  const handleYellowCardChange = (player: Player, teamId: string, change: number) => {
    if (!match) return;
    
    const updatedPlayers = teamId === match.home_team_id ? [...homePlayers] : [...awayPlayers];
    const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
    if (playerIndex === -1) return;
    
    const currentPlayer = updatedPlayers[playerIndex];
    
    // Don't allow changes if player has a red card (except to remove it)
    if (currentPlayer.red_card && change >= 0) {
      return;
    }
    
    // Calculate new yellow cards count
    let newYellowCards = currentPlayer.yellow_cards + change;
    
    // Ensure it's not less than 0 or more than 2
    newYellowCards = Math.max(0, Math.min(2, newYellowCards));
    
    // If it's exactly 2, we'll give a red card
    const willGetRedCard = newYellowCards === 2;
    
    // Only proceed if there's an actual change
    if (newYellowCards !== currentPlayer.yellow_cards || (willGetRedCard && !currentPlayer.red_card)) {
      // Create a copy of the player with updated values
      const updatedPlayer = {
        ...currentPlayer,
        yellow_cards: newYellowCards,
        red_card: willGetRedCard || currentPlayer.red_card
      };
      
      // Handle event logging
      if (change > 0) {
        // Adding a yellow card
        logMatchEvent('yellow_card', updatedPlayer, teamId);
        
        // If this is the second yellow, also log a red card
        if (willGetRedCard) {
          logMatchEvent('red_card', updatedPlayer, teamId);
        }
      } else if (change < 0) {
        // Removing a yellow card - remove the most recent yellow card event
        removeMatchEvent(currentPlayer.id, 'yellow_card');
        
        // If we're removing the second yellow, also remove the red card
        if (currentPlayer.yellow_cards === 2 && newYellowCards === 1) {
          removeMatchEvent(currentPlayer.id, 'red_card');
        }
      }
      
      // Update the player in the array
      updatedPlayers[playerIndex] = updatedPlayer;
      
      // Update the appropriate team's players
      if (teamId === match.home_team_id) {
        setHomePlayers(updatedPlayers);
      } else {
        setAwayPlayers(updatedPlayers);
      }
      
      // Log the current state for debugging
      console.log(`Player ${player.first_name} ${player.last_name} - Yellow cards: ${newYellowCards}, Red card: ${willGetRedCard}`);
    }
  };

  // Handle red card changes for players
  const handleRedCardChange = (player: Player, teamId: string, hasRedCard: boolean) => {
    if (!match) return;
    
    const updatedPlayers = teamId === match.home_team_id ? [...homePlayers] : [...awayPlayers];
    const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
    if (playerIndex === -1) return;
    
    const currentPlayer = updatedPlayers[playerIndex];
    
    // If adding a red card (not removing)
    if (hasRedCard) {
      // Log red card event
      logMatchEvent('red_card', currentPlayer, teamId);
      
      // Update player state
      updatedPlayers[playerIndex] = {
        ...currentPlayer,
        red_card: true,
        yellow_cards: 0 // Reset any yellow cards
      };
    } else {
      // Removing a red card - remove the red card event
      removeMatchEvent(player.id, 'red_card');
      
      // Update player state
      updatedPlayers[playerIndex] = {
        ...currentPlayer,
        red_card: false
        // Keep existing yellow cards when removing red card
      };
    }
    
    // Update the appropriate team's players
    if (teamId === match.home_team_id) {
      setHomePlayers(updatedPlayers);
    } else {
      setAwayPlayers(updatedPlayers);
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
          away_team:away_team_id(*),
          tournaments: tournament_id(id, name)
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
        home_team_logo: matchData.home_team?.logo_url || null,
        away_team_logo: matchData.away_team?.logo_url || null,
        tournament_name: matchData.tournaments?.name || 'Torneo',
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
      };

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
          <View style={styles.yellowCardsContainer}>
            {/* Mostrar tarjeta(s) amarilla(s) solo si no tiene roja */}
            {!player.red_card && (
              <>
                {/* Mostrar 1 tarjeta amarilla con botón de eliminar */}
                {player.yellow_cards === 1 && (
                  <View style={styles.yellowCardContainer}>
                    <TouchableOpacity
                      onPress={() => handleYellowCardChange(player, teamId, 1)}
                      disabled={saving}
                    >
                      <View style={[styles.cardBadge, styles.yellowCardBadge, styles.singleCard]}>
                        {/* Tarjeta amarilla sin texto */}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleYellowCardChange(player, teamId, -1)}
                      style={styles.removeCardButton}
                      disabled={saving}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Mostrar 2 tarjetas amarillas (que se convierten en roja) */}
                {player.yellow_cards === 2 && (
                  <View style={styles.yellowCardsWrapper}>
                    <View style={[styles.cardBadge, styles.yellowCardBadge, styles.firstCard]} />
                    <View style={[styles.cardBadge, styles.yellowCardBadge, styles.secondCard]} />
                  </View>
                )}
                
                {/* Botón para primera tarjeta si no hay ninguna */}
                {player.yellow_cards === 0 && (
                  <TouchableOpacity
                    style={[styles.statButton, styles.yellowCardButton, { marginLeft: player.yellow_cards > 0 ? 15 : 0 }]}
                    onPress={() => handleYellowCardChange(player, teamId, 1)}
                    disabled={saving}
                  >
                    <View style={[styles.cardBadge, styles.yellowCardBadge]} />
                  </TouchableOpacity>
                )}
              </>
            )}
            
            {/* Mostrar tarjeta roja si corresponde */}
            {player.red_card && (
              <View style={[styles.cardBadge, styles.redCardBadge]}>
                <Text style={styles.redCardText}>ROJA</Text>
              </View>
            )}
          </View>
          
          {/* Botón para quitar tarjeta amarilla */}
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
          <View style={[
            styles.cardBadge,
            player.red_card ? styles.redCardBadge : styles.redCardInactive,
            { transform: [{ rotate: '0deg' }] }
          ]}>
            <Text style={[
              styles.cardText,
              player.red_card ? styles.redCardText : styles.redCardInactiveText
            ]}>
              {player.red_card ? 'ROJA' : 'ROJA'}
            </Text>
          </View>
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
          title: `Fecha ${match?.round || ''} • ${match?.tournament_name || 'Torneo'}`,
          headerTitleStyle: { 
            color: '#fff', 
            fontSize: 20,
            fontWeight: '500',
          },
          headerStyle: { 
            backgroundColor: '#FF6B00',
          },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.matchContainer}>
          <Text style={styles.title}>
            {match.home_team_name} vs {match.away_team_name}
          </Text>
          
          <View style={styles.teamsContainer}>
            <View style={styles.teamContainer}>
              <View style={styles.teamHeader}>
                {match.home_team?.logo_url && (
                  <Image 
                    source={{ uri: match.home_team.logo_url }} 
                    style={styles.teamLogo} 
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.teamName}>{match.home_team_name}</Text>
              </View>
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
              <View style={styles.teamHeader}>
                {match.away_team?.logo_url && (
                  <Image 
                    source={{ uri: match.away_team.logo_url }} 
                    style={styles.teamLogo} 
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.teamName}>{match.away_team_name}</Text>
              </View>
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
          
         {/* <View style={styles.legendContainer}>
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
            <View style={styles.legendItem}>ESTADISTICAS</View>
          </View>*/}
          {/* Match Events */}
          <View style={styles.eventsContainer}>
            <Text style={styles.sectionTitle}>Eventos del Partido</Text>
            {matchEvents.length === 0 ? (
              <Text style={styles.noEventsText}>No hay eventos registrados</Text>
            ) : (
              <FlatList
                data={matchEvents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[
                    styles.eventItem,
                    item.type === 'goal' && styles.goalEvent,
                    item.type === 'yellow_card' && styles.yellowCardEvent,
                    item.type === 'red_card' && styles.redCardEvent
                  ]}>
                    <Text style={styles.eventMinute}>{item.minute}'</Text>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventPlayer}>{item.playerName}</Text>
                      <Text style={styles.eventTeam}>{item.teamName}</Text>
                    </View>
                    <Text style={styles.eventType}>
                      {item.type === 'goal' ? '⚽ Gol' : 
                       item.type === 'yellow_card' ? '🟨 Amarilla' : '🟥 Roja'}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
          
          {/* Player list */}
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
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveResult}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FF6B00" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Resultado</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Event styles
  eventsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  noEventsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalEvent: {
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
  },
  yellowCardEvent: {
    backgroundColor: 'rgba(255, 235, 59, 0.1)',
  },
  redCardEvent: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  eventMinute: {
    fontWeight: 'bold',
    width: 30,
    color: '#666',
  },
  eventContent: {
    flex: 1,
  },
  eventPlayer: {
    fontWeight: '500',
  },
  eventTeam: {
    fontSize: 12,
    color: '#666',
  },
  eventType: {
    fontWeight: 'bold',
  },
  
  // Existing styles
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
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  teamLogo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInput: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    marginHorizontal: 5,
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
  // Estilos para las tarjetas
  yellowCardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    height: 40,
    position: 'relative',
  },
  singleCard: {
    position: 'relative',
    marginRight: 10,
  },
  cardBadge: {
    width: 24,  // Ancho reducido para el diseño de tarjeta
    height: 36, // Altura aumentada para mejor proporción
    borderRadius: 4,  // Bordes más redondeados
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,  // Borde ligeramente más grueso
    borderColor: '#000',
    margin: 2,
  },
  // Tarjeta amarilla
  yellowCardBadge: {
    backgroundColor: '#FFD700',
    borderColor: '#000',
    width: 24,
    height: 36,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  // Tarjeta roja
  redCardBadge: {
    backgroundColor: '#FF0000',
    borderColor: '#000',
    width: 24,
    height: 36,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  redCardInactive: {
    backgroundColor: 'transparent',
    borderColor: '#FF0000',
    width: 24,
    height: 36,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  // Texto de tarjeta roja inactiva
  redCardInactiveText: {
    color: '#FF0000',
  },
  // Texto de tarjeta roja activa
  redCardText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Contenedor de tarjetas amarillas
  yellowCardContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  // Botón para eliminar tarjeta
  removeCardButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  // Contenedor para mostrar múltiples tarjetas amarillas
  yellowCardsWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
    marginRight: 10,
  },
  // Primera tarjeta cuando hay dos
  firstCard: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    width: 24,
    height: 36,
  },
  // Segunda tarjeta superpuesta
  secondCard: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
    width: 24,
    height: 36,
  },
  // Estilo del texto en las tarjetas (oculto para tarjeta amarilla)
  cardText: {
    display: 'none',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonText: {
    color: '#A33400',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 50,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 20,
    fontWeight: 'bold',
  },
});