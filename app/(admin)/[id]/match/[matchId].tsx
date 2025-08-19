import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const [homeScore, setHomeScore] = useState<string>('0');
  const [awayScore, setAwayScore] = useState<string>('0');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  
  // Ensure matchId is always a string
  const safeMatchId = Array.isArray(matchId) ? matchId[0] : matchId || '';
  const safeTournamentId = Array.isArray(tournamentId) ? tournamentId[0] : tournamentId || '';

  // Load match and player data
  useEffect(() => {
    const fetchMatchAndPlayers = async () => {
      if (!safeMatchId) return;
      
      try {
        setLoading(true);
        
        // Fetch match data
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', safeMatchId)
          .single();
          
        if (matchError) throw matchError;
        if (!matchData) {
          Alert.alert('Error', 'Partido no encontrado');
          router.back();
          return;
        }
        
        setMatch(matchData);
        setHomeScore(matchData.home_team_score?.toString() || '0');
        setAwayScore(matchData.away_team_score?.toString() || '0');
        
        // Fetch players for both teams
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .in('team_id', [matchData.home_team_id, matchData.away_team_id]);
          
        if (playersError) throw playersError;
        
        // Separate players by team
        const homePlayersData = playersData.filter(p => p.team_id === matchData.home_team_id);
        const awayPlayersData = playersData.filter(p => p.team_id === matchData.away_team_id);
        
        setHomePlayers(homePlayersData);
        setAwayPlayers(awayPlayersData);
        
        // Fetch match events
        const { data: eventsData, error: eventsError } = await supabase
          .from('match_events')
          .select('*')
          .eq('matchId', safeMatchId)  // Changed from match_id to matchId to match the database schema
          .order('minute', { ascending: true });
          
        if (eventsError) throw eventsError;
        
        setMatchEvents(eventsData || []);
        
      } catch (error) {
        console.error('Error loading match data:', error);
        Alert.alert('Error', 'No se pudo cargar la información del partido');
      } finally {
        setLoading(false);
        setLoadingPlayers(false);
      }
    };
    
    fetchMatchAndPlayers();
  }, [safeMatchId, router]);

  // Define EventType if not already defined
  type EventType = 'goal' | 'yellow_card' | 'red_card';
  
  // Log a match event
  const logMatchEvent = useCallback((type: EventType, player: Player, teamId: string, eventId?: string) => {
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
  }, [match]);

  // Remove a match event by player and type
  const removeMatchEvent = useCallback((playerId: string, type: EventType) => {
    setMatchEvents(prev => {
      // Find the most recent event of the given type for this player
      // Also check for own goals by playerName since the ID might not match
      const eventIndex = prev.findIndex(e => 
        (e.playerId === playerId || 
         (playerId === 'own-goal' && e.playerName === 'Gol en Contra')) && 
        e.type === type
      );
      
      if (eventIndex === -1) return prev;
      
      // Get the event being removed
      const eventToRemove = prev[eventIndex];
      
      // Update the score if it's a goal being removed
      if (eventToRemove.type === 'goal') {
        const isHomeTeam = eventToRemove.teamId === match?.home_team_id;
        const isOwnGoal = eventToRemove.playerName === 'Gol en Contra';
        
        if (isOwnGoal) {
          // For own goals, the team that scored is the opposite team
          if (isHomeTeam) {
            // Own goal by home team means away team scored
            const newScore = Math.max(0, (parseInt(awayScore) || 0) - 1);
            setAwayScore(newScore.toString());
          } else {
            // Own goal by away team means home team scored
            const newScore = Math.max(0, (parseInt(homeScore) || 0) - 1);
            setHomeScore(newScore.toString());
          }
        } else {
          // Regular goal
          if (isHomeTeam) {
            const newScore = Math.max(0, (parseInt(homeScore) || 0) - 1);
            setHomeScore(newScore.toString());
          } else {
            const newScore = Math.max(0, (parseInt(awayScore) || 0) - 1);
            setAwayScore(newScore.toString());
          }
        }
      }
      
      // Create a new array without the event
      const newEvents = [...prev];
      newEvents.splice(eventIndex, 1);
      return newEvents;
    });
  }, [homeScore, awayScore, match?.home_team_id]);

  // Handle goal changes for players
  // Handle own goal (adds to the opposing team's score)
  const handleOwnGoal = useCallback((teamId: string) => {
    if (!match) return;
    
    // Determine which team scored the own goal and which team gets the goal
    const isHomeTeam = teamId === match.home_team_id;
    const scoringTeamId = isHomeTeam ? match.away_team_id : match.home_team_id;
    
    // Log the own goal event (using a special player ID for own goals)
    const ownGoalPlayer: Player = {
      id: 'own-goal',
      first_name: 'Gol en',
      last_name: 'Contra',
      team_id: teamId,  // Team that committed the own goal
      goals: 0,
      yellow_cards: 0,
      red_card: false
    };
    
    // Log the event with the team that committed the own goal
    // The scoringTeamId is passed as a separate parameter to update the score
    logMatchEvent('goal', ownGoalPlayer, teamId);
    
    // Update the score for the opposing team
    if (isHomeTeam) {
      const newAwayScore = (parseInt(awayScore) || 0) + 1;
      setAwayScore(newAwayScore.toString());
    } else {
      const newHomeScore = (parseInt(homeScore) || 0) + 1;
      setHomeScore(newHomeScore.toString());
    }
  }, [match, homeScore, awayScore, logMatchEvent]);

  const handleGoalChange = useCallback((player: Player, teamId: string, change: number) => {
    if (!match) return;
    
    const isHomeTeam = teamId === match.home_team_id;
    const updatedPlayers = isHomeTeam ? [...homePlayers] : [...awayPlayers];
    const setPlayers = isHomeTeam ? setHomePlayers : setAwayPlayers;
    
    const playerIndex = updatedPlayers.findIndex(p => p.id === player.id);
    if (playerIndex === -1) return;
    
    const currentGoals = updatedPlayers[playerIndex].goals || 0;
    const newGoals = Math.max(0, currentGoals + change);
    
    // Calculate the difference in goals
    const goalDiff = newGoals - currentGoals;
    
    // Update player's goals
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      goals: newGoals,
    };
    
    // Update the players state
    setPlayers(updatedPlayers);
    
    // Handle event logging/removal and update score
    if (goalDiff > 0) {
      // Goal added - log new event and update score
      logMatchEvent('goal', updatedPlayers[playerIndex], teamId);
      
      // Update the score based on which team scored
      if (isHomeTeam) {
        const newScore = (parseInt(homeScore) || 0) + goalDiff;
        setHomeScore(newScore.toString());
      } else {
        const newScore = (parseInt(awayScore) || 0) + goalDiff;
        setAwayScore(newScore.toString());
      }
    } else if (goalDiff < 0) {
      // Goal removed - remove the most recent goal event for this player and update score
      removeMatchEvent(player.id, 'goal');
      
      // Update the score based on which team had a goal removed
      if (isHomeTeam) {
        const newScore = Math.max(0, (parseInt(homeScore) || 0) + goalDiff);
        setHomeScore(newScore.toString());
      } else {
        const newScore = Math.max(0, (parseInt(awayScore) || 0) + goalDiff);
        setAwayScore(newScore.toString());
      }
    }
  }, [match, homePlayers, awayPlayers, homeScore, awayScore, logMatchEvent, removeMatchEvent, setHomePlayers, setAwayPlayers, setHomeScore, setAwayScore]);

  // Handle yellow card changes for players
  const handleYellowCardChange = useCallback((player: Player, teamId: string, change: number) => {
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
  }, [match, homePlayers, awayPlayers, logMatchEvent, removeMatchEvent, setHomePlayers, setAwayPlayers]);

  // Handle red card changes for players
  const handleRedCardChange = useCallback((player: Player, teamId: string, hasRedCard: boolean) => {
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
  }, [match, homePlayers, awayPlayers, logMatchEvent, removeMatchEvent, setHomePlayers, setAwayPlayers]);



  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setLoading(true);
      setLoadingPlayers(true);
      
      console.log(`Fetching match with ID: ${matchId}`);
      
      // Fetch match data with team relationships
      const [
        { data: matchData, error: matchError },
        { data: matchEvents, error: eventsError }
      ] = await Promise.all([
        supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(*),
            away_team:away_team_id(*),
            tournaments: tournament_id(id, name)
          `)
          .eq('id', matchId)
          .single(),
        
        // Cargar eventos existentes del partido
        supabase
          .from('match_events')
          .select('*')
          .eq('match_id', matchId)
      ]);

      if (matchError) {
        console.error('Match query error:', matchError);
        throw new Error(`Error al cargar el partido: ${matchError.message}`);
      }
      
      if (!matchData) {
        console.error('No match data returned for ID:', matchId);
        throw new Error('No se encontró el partido solicitado');
      }

      console.log('Match data loaded:', matchData);
      
      // Validar datos de equipos
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

      // Cargar jugadores de ambos equipos en paralelo
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

      // Inicializar jugadores con valores por defecto
      const initialHomePlayers = homePlayersRes.data?.map(p => ({
        id: p.id,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        team_id: p.team_id,
        goals: 0,
        yellow_cards: 0,
        red_card: false,
        name: p.first_name || ''
      })) || [];
      
      const initialAwayPlayers = awayPlayersRes.data?.map(p => ({
        id: p.id,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        team_id: p.team_id,
        goals: 0,
        yellow_cards: 0,
        red_card: false,
        name: p.first_name || ''
      })) || [];

      // Procesar eventos del partido si existen
      if (matchEvents && matchEvents.length > 0) {
        console.log(`Found ${matchEvents.length} existing match events`);
        setHomePlayers(initialHomePlayers);
        setAwayPlayers(initialAwayPlayers);
        setMatchEvents([]);
        console.log('No existing match events found');
      }
      
    } catch (error) {
      console.error('Error in fetchMatch:', error);
      Alert.alert(
        'Error al cargar el partido', 
        error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      );
    } finally {
      setLoading(false);
      setLoadingPlayers(false);
    }
  };

  // Save match result and events
  const handleSaveResult = useCallback(async () => {
    if (!match) return;
    
    try {
      setSaving(true);
      
      // Update match scores
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          home_team_score: parseInt(homeScore) || 0,
          away_team_score: parseInt(awayScore) || 0,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', match.id);
      
      if (matchError) throw matchError;
      
      // Prepare events for saving
      const eventsToSave = matchEvents.map(event => ({
        match_id: match.id,
        player_id: event.playerId,
        player_name: event.playerName,
        team_id: event.teamId,
        team_name: event.teamName,
        event_type: event.type,
        minute: event.minute,
        details: event.details,
        created_at: new Date().toISOString()
      }));
      
      // Save events in batches to avoid hitting payload limits
      const batchSize = 50;
      for (let i = 0; i < eventsToSave.length; i += batchSize) {
        const batch = eventsToSave.slice(i, i + batchSize);
        const { error: eventsError } = await supabase
          .from('match_events')
          .upsert(batch, { onConflict: 'id' });
        
        if (eventsError) throw eventsError;
      }
      
      Alert.alert(
        '¡Guardado exitoso!',
        'El resultado del partido y los eventos han sido guardados correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error('Error saving match result:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar el resultado del partido. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  }, [match, homeScore, awayScore, matchEvents, router]);

const renderPlayerItem = ({ item: player, teamId }: { item: Player; teamId: string }) => {
  return (
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
          <TouchableOpacity
            style={[styles.statButton, styles.ownGoalButton]}
            onPress={() => handleOwnGoal(teamId)}
            disabled={saving || player.red_card}
          >
            <Text style={styles.ownGoalButtonText}>GC</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statContainer}>
        <Text style={styles.statValue}>{player.yellow_cards}</Text>
        <View style={styles.buttonGroup}>
          <View style={styles.yellowCardsContainer}>
            {!player.red_card && (
              <>
                {player.yellow_cards === 1 && (
                  <View style={styles.yellowCardContainer}>
                    <TouchableOpacity
                      onPress={() => handleYellowCardChange(player, teamId, 1)}
                      disabled={saving}
                    >
                        <View style={[styles.cardBadge, styles.yellowCardBadge, styles.singleCard]}>
                      <Text style={[styles.cardText, { color: '#000000' }]}>AMARILLA</Text>
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
                
                {player.yellow_cards === 2 && (
                  <View style={styles.yellowCardsWrapper}>
                    <View style={[styles.cardBadge, styles.yellowCardBadge, styles.firstCard]}>
                      <Text style={[styles.cardText, { color: '#000000', fontSize: 10 }]}>AMARILLA</Text>
                    </View>
                    <View style={[styles.cardBadge, styles.yellowCardBadge, styles.secondCard]}>
                      <Text style={[styles.cardText, { color: '#000000', fontSize: 10 }]}>AMARILLA</Text>
                    </View>
                  </View>
                )}
                
                {player.yellow_cards === 0 && (
                  <TouchableOpacity
                    style={[styles.statButton, styles.yellowCardButton, { marginLeft: player.yellow_cards > 0 ? 15 : 0 }]}
                    onPress={() => handleYellowCardChange(player, teamId, 1)}
                    disabled={saving}
                  >
                    <View style={[styles.cardBadge, styles.yellowCardBadge]}>
                      <Text style={[styles.cardText, { color: '#000000', fontSize: 14, fontWeight: 'bold' }]}>+</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            )}
            
            {player.red_card && (
              <View style={[styles.cardBadge, styles.redCardBadge]}>
                <Text style={styles.redCardText}>ROJA</Text>
              </View>
            )}
          </View>
          
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
            { transform: [{ rotate: player.red_card ? '15deg' : '0deg' }] }
          ]}>
            <Text style={[
              styles.cardText,
              player.red_card ? styles.redCardText : styles.redCardInactiveText,
              { transform: [{ rotate: player.red_card ? '-15deg' : '0deg' }] }
            ]}>
              {player.red_card ? 'ROJA' : 'ROJA'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
                <Text style={styles.scoreDisplay}>
                  {homeScore}
                </Text>
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
                <Text style={styles.scoreDisplay}>
                  {awayScore}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Events Section */}
          <View style={[styles.eventsSection, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Eventos del Partido</Text>
            {matchEvents.length === 0 ? (
              <Text style={styles.noEventsText}>No hay eventos registrados</Text>
            ) : (
              <FlatList
                data={matchEvents}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={({ item, index }) => (
                  <View style={[
                    styles.eventItem,
                    item.type.toLowerCase() === 'goal' && styles.goalEvent,
                    item.type.toLowerCase() === 'yellow_card' && styles.yellowCardEvent,
                    item.type.toLowerCase() === 'red_card' && styles.redCardEvent
                  ]}>
                    <Text style={styles.eventMinute}>{item.minute}'</Text>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventPlayer}>
                        {item.playerName === 'Gol en Contra' ? 'Gol en Contra' : item.playerName}
                      </Text>
                      <Text style={styles.eventTeam}>{item.teamName}</Text>
                    </View>
                    <Text style={styles.eventType}>
                      {item.type === 'goal' ? '⚽ Gol' : 
                       item.type === 'yellow_card' ? '🟨 Amarilla' : '🟥 Roja'}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => removeMatchEvent(item.playerId, item.type)}
                      style={styles.removeEventButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </TouchableOpacity>
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
  // Layout
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
  
  // Teams & Score
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
    resizeMode: 'contain' as const,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 50,
    height: 50,
    lineHeight: 50,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
  scoreInput: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ef9a9a',
    marginLeft: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#666',
  },
  
  // Events Section
  eventsSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
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
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    borderBottomWidth: 0,
    paddingHorizontal: 10,
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
    color: '#333',
  },
  removeEventButton: {
    padding: 5,
  },
  
  // Buttons
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Cards
  cardText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  yellowCardContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  yellowCardsWrapper: {
    flexDirection: 'row',
    position: 'relative',
    width: 40,
    height: 40,
    marginRight: 10,
  },
  firstCard: {
    marginRight: -5,
    zIndex: 1,
  },
  secondCard: {
    transform: [{ rotate: '10deg' }],
  },
  removeCardButton: {
    marginLeft: 5,
  },
  
  // Own Goal
  ownGoalButton: {
    backgroundColor: '#ffeb3b',
    padding: 4,
    borderRadius: 4,
    marginLeft: 5,
  },
  ownGoalButtonText: {
    color: '#c62828',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Legend
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
  
  // Players
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
  ownGoalButton: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 4,
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
  // Card container
  yellowCardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    height: 40,
    position: 'relative',
  },
  singleCard: {
    marginRight: 4,
    position: 'relative',
  },
  // Base card badge style
  cardBadge: {
    width: 24,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#000',
    margin: 2,
  },
  // Yellow card style
  yellowCardBadge: {
    backgroundColor: '#FFD700',
    borderColor: '#000',
    borderWidth: 1.5,
  },
  // Red card style
  redCardBadge: {
    backgroundColor: '#FF0000',
    borderColor: '#000',
    borderWidth: 1.5,
  },
  // Inactive red card style
  redCardInactive: {
    backgroundColor: 'transparent',
    borderColor: '#FF0000',
    borderWidth: 1.5,
  },
  // Texto de tarjeta roja inactiva
  redCardInactiveText: {
    color: '#FF0000',
  },
  // Yellow card container with improved layout
  yellowCardContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  // Wrapper for multiple yellow cards
  yellowCardsWrapper: {
    flexDirection: 'row',
    position: 'relative',
    width: 40,
    height: 40,
    marginRight: 10,
  },
  // First card in a stack
  firstCard: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    width: 24,
    height: 36,
  },
  // Second card in a stack (slightly offset)
  secondCard: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    width: 24,
    height: 36,
    transform: [{ rotate: '10deg' }],
  },
  // Button to remove a card
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
    padding: 2,
  },
  // Red card text style
  redCardText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Card text style for all card types
  cardText: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Button container styles
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  // Team players section title
  teamPlayersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  // Player row styles
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // Suspended player style
  playerSuspended: {
    opacity: 0.5,
  },
  // Suspended text style
  suspendedText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 8,
  },
  // Player name style
  playerName: {
    flex: 1,
    fontSize: 16,
  },
  // Stat container
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Stat value
  statValue: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Yellow card text style
  yellowCardText: {
    color: '#000000',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Stat button
  statButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
  },
  // Goal button
  goalButton: {
    backgroundColor: '#4CAF50',
  },
  // Own goal button
  ownGoalButton: {
    backgroundColor: '#FF9800',
    marginLeft: 8,
  },
  // Yellow card button
  yellowCardButton: {
    backgroundColor: '#FFC107',
    marginLeft: 8,
  },
  // Red card button
  redCardButton: {
    backgroundColor: '#F44336',
    marginLeft: 8,
  },
  // Save button
  saveButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  // Save button text
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Cancel button
  cancelButton: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center',
  },
  // Cancel button text
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Own goal button text
  ownGoalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // Yellow card container
  yellowCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  // Yellow cards wrapper
  yellowCardsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // First yellow card
  firstCard: {
    width: 12,
    height: 16,
    backgroundColor: '#FFC107',
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Second yellow card
  secondCard: {
    width: 12,
    height: 16,
    backgroundColor: '#FFC107',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Remove card button
  removeCardButton: {
    marginLeft: 4,
    padding: 2,
  },
  // Red card container
  redCardContainer: {
    width: 12,
    height: 16,
    backgroundColor: '#F44336',
    borderWidth: 1,
    borderColor: '#000',
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Events container
  eventsContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  // Events title
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  // Event item
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  // Event time
  eventTime: {
    width: 40,
    fontWeight: 'bold',
  },
  // Event type
  eventType: {
    width: 30,
    marginLeft: 10,
  },
  // Event player name
  eventPlayer: {
    flex: 1,
    marginLeft: 10,
  },
  // Event remove button
  eventRemoveButton: {
    padding: 4,
  },
  // No events text
  noEventsText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
  },
  // Loading container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Error text
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 10,
  },
  // Success text
  successText: {
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 10,
  },
  // Modal container
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Modal content
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  // Modal title
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  // Modal text
  modalText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  // Modal buttons container
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  // Modal button
  modalButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
  },
  // Modal cancel button
  modalCancelButton: {
    backgroundColor: '#9E9E9E',
  },
  // Modal confirm button
  modalConfirmButton: {
    backgroundColor: '#2196F3',
  },
  // Modal button text
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Team players title
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
  ownGoalButton: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
    borderWidth: 1,
    borderRadius: 4,
  },
  yellowCardButton: {
    backgroundColor: '#fffde7',
  },
  redCardButton: {
    backgroundColor: '#F44336',
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
  ownGoalButtonText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 12,
  },
});