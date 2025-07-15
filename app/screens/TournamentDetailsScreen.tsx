// f:\Liga\LigaFutbol\app\screens\TournamentDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { supabase, Tournament, Team, Match, Standing, TournamentRegistrationWithTeam, RegistrationWithTeams } from '../config/supabase';
import { ThemedText, ThemedView } from '../components/Themed';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation';

// Tipos para las props de navegación y ruta
type TournamentDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TournamentDetails'>;
type TournamentDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TournamentDetails'>;

type Props = {
  route: TournamentDetailsScreenRouteProp;
  navigation: TournamentDetailsScreenNavigationProp;
};

const TournamentDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { tournamentId, tournamentName } = route.params;
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);

  // Cargar datos del torneo
  useEffect(() => {
    const loadTournamentData = async () => {
      try {
        // 1. Obtener detalles del torneo
        const { data: tournamentData, error: tournamentError } = await supabase
          .from('tournaments')
          .select('*, categories(*)')
          .eq('id', tournamentId)
          .single();

        if (tournamentError) throw tournamentError;
        setTournament(tournamentData);

        // 2. Obtener equipos inscritos (a través de tournament_registrations)
        const { data: registrationsData, error: teamsError } = await supabase
          .from('tournament_registrations')
          .select('teams(*)')
          .eq('tournament_id', tournamentId);

        if (teamsError) throw teamsError;
        // Extraer los equipos de las inscripciones
        const teams = (registrationsData as RegistrationWithTeams[]).map(reg => reg.teams[0]);
        setTeams(teams);

        // 3. Obtener partidos del torneo con datos de equipos y estadísticas
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(
              name,
              logo_url
            ),
            away_team:away_team_id(
              name,
              logo_url
            ),
            home_goals:match_events(
              count(*) FILTER (WHERE event_type = 'goal' AND team_id = home_team_id)
            ),
            home_yellow_cards:match_events(
              count(*) FILTER (WHERE event_type = 'yellow_card' AND team_id = home_team_id)
            ),
            home_red_cards:match_events(
              count(*) FILTER (WHERE event_type = 'red_card' AND team_id = home_team_id)
            ),
            home_red_card_details:match_events(
              player:player_id(
                name as player_name,
                dni as player_dni
              ),
              suspension_days,
              report
            ) FILTER (WHERE event_type = 'red_card' AND team_id = home_team_id),
            away_goals:match_events(
              count(*) FILTER (WHERE event_type = 'goal' AND team_id = away_team_id)
            ),
            away_yellow_cards:match_events(
              count(*) FILTER (WHERE event_type = 'yellow_card' AND team_id = away_team_id)
            ),
            away_red_cards:match_events(
              count(*) FILTER (WHERE event_type = 'red_card' AND team_id = away_team_id)
            ),
            away_red_card_details:match_events(
              player:player_id(
                name as player_name,
                dni as player_dni
              ),
              suspension_days,
              report
            ) FILTER (WHERE event_type = 'red_card' AND team_id = away_team_id)
          `)
          .eq('tournament_id', tournamentId)
          .order('match_datetime', { ascending: true });

        if (matchesError) throw matchesError;
        setMatches(matchesData);

        // 4. Obtener tabla de posiciones
        const { data: standingsData, error: standingsError } = await supabase
          .from('standings')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('position', { ascending: true });

        if (standingsError) throw standingsError;
        setStandings(standingsData);

      } catch (error) {
        console.error('Error loading tournament data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTournamentData();
  }, [tournamentId]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#1976d2" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView>
        {/* Header del Torneo */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.title}>
            {tournament?.name || tournamentName || 'Torneo'}
          </ThemedText>
          <View style={styles.tournamentInfo}>
            <ThemedText style={styles.infoItem}>
              Categoría: {tournament?.categories?.name || 'Categoría'}
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              Estado: {tournament?.status || 'Programado'}
            </ThemedText>
          </View>
        </View>

        {/* Equipos Inscritos */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Equipos Inscritos ({teams.length})</ThemedText>
          {teams.map((team) => (
            <View key={team.id} style={styles.teamItem}>
              <View style={styles.teamHeader}>
                <ThemedText style={styles.teamName}>{team.name}</ThemedText>
                {team.logo_url && (
                  <Image 
                    source={{ uri: team.logo_url }} 
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                )}
              </View>
              <View style={styles.teamStats}>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Goles</ThemedText>
                  <ThemedText style={styles.statValue}>0</ThemedText>
                </View>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statLabel}>Tarjetas</ThemedText>
                  <ThemedText style={styles.statValue}>0</ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Partidos */}
        <View style={styles.section}>
          <ThemedText type="subtitle">Partidos</ThemedText>
          {matches.map((match) => (
            <View key={match.id} style={styles.matchItem}>
              <View style={styles.matchHeader}>
                <ThemedText style={styles.matchInfo}>
                  {match.round} - {match.match_datetime ? new Date(match.match_datetime).toLocaleDateString() : 'Fecha por definir'}
                </ThemedText>
                <View style={styles.matchStatus}>
                  <ThemedText style={styles.statusText}>
                    {match.status}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.matchTeams}>
                <View style={styles.teamContainer}>
                  {match.home_team?.logo_url && (
                    <Image 
                      source={{ uri: match.home_team.logo_url }} 
                      style={styles.teamLogo}
                      resizeMode="contain"
                    />
                  )}
                  <View style={styles.teamStats}>
                    <ThemedText style={styles.teamScore}>
                      {match.home_team?.name} {match.home_score}
                    </ThemedText>
                    <View style={styles.eventStats}>
                      <View style={styles.statItem}>
                        <ThemedText style={styles.statLabel}>Goles</ThemedText>
                        <ThemedText style={styles.statValue}>{match.home_goals || 0}</ThemedText>
                      </View>
                      <View style={styles.statItem}>
                        <ThemedText style={styles.statLabel}>Tarjetas</ThemedText>
                        <View style={styles.cardsContainer}>
                          <View style={styles.cardCount}>
                            <ThemedText style={styles.cardLabel}>Amarillas:</ThemedText>
                            <ThemedText style={styles.cardValue}>{match.home_yellow_cards || 0}</ThemedText>
                          </View>
                          <View style={styles.cardCount}>
                            <ThemedText style={styles.cardLabel}>Rojas:</ThemedText>
                            <ThemedText style={styles.cardValue}>{match.home_red_cards || 0}</ThemedText>
                          </View>
                          {match.home_red_cards > 0 && (
                            <View style={styles.redCardDetails}>
                              {match.home_red_card_details.map((detail, index) => (
                                <View key={index} style={styles.redCardDetail}>
                                  <ThemedText style={styles.playerName}>{detail.player_name}</ThemedText>
                                  <ThemedText style={styles.suspensionDays}>
                                    Suspendido {detail.suspension_days} días
                                  </ThemedText>
                                  {detail.report && (
                                    <ThemedText style={styles.report}>
                                      Informe: {detail.report}
                                    </ThemedText>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.teamContainer}>
                  {match.away_team?.logo_url && (
                    <Image 
                      source={{ uri: match.away_team.logo_url }} 
                      style={styles.teamLogo}
                      resizeMode="contain"
                    />
                  )}
                  <View style={styles.teamStats}>
                    <ThemedText style={styles.teamScore}>
                      {match.away_team?.name} {match.away_score}
                    </ThemedText>
                    <View style={styles.eventStats}>
                      <View style={styles.statItem}>
                        <ThemedText style={styles.statLabel}>Goles</ThemedText>
                        <ThemedText style={styles.statValue}>{match.away_goals || 0}</ThemedText>
                      </View>
                      <View style={styles.statItem}>
                        <ThemedText style={styles.statLabel}>Tarjetas</ThemedText>
                        <View style={styles.cardsContainer}>
                          <View style={styles.cardCount}>
                            <ThemedText style={styles.cardLabel}>Amarillas:</ThemedText>
                            <ThemedText style={styles.cardValue}>{match.away_yellow_cards || 0}</ThemedText>
                          </View>
                          <View style={styles.cardCount}>
                            <ThemedText style={styles.cardLabel}>Rojas:</ThemedText>
                            <ThemedText style={styles.cardValue}>{match.away_red_cards || 0}</ThemedText>
                          </View>
                          {match.away_red_cards > 0 && (
                            <View style={styles.redCardDetails}>
                              {match.away_red_card_details.map((detail, index) => (
                                <View key={index} style={styles.redCardDetail}>
                                  <ThemedText style={styles.playerName}>{detail.player_name}</ThemedText>
                                  <ThemedText style={styles.suspensionDays}>
                                    Suspendido {detail.suspension_days} días
                                  </ThemedText>
                                  {detail.report && (
                                    <ThemedText style={styles.report}>
                                      Informe: {detail.report}
                                    </ThemedText>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Tabla de Posiciones */}
        <View style={styles.section}>
          <View style={styles.standingsHeader}>
            <ThemedText style={styles.standingsHeaderItem}>Pos</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>Equipo</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>PJ</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>PG</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>PE</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>PP</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>GF</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>GC</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>GD</ThemedText>
            <ThemedText style={styles.standingsHeaderItem}>Pts</ThemedText>
          </View>
          {standings.map((standing, index) => (
            <View key={standing.id} style={styles.standingItem}>
              <ThemedText style={styles.standingPosition}>
                {index + 1}
              </ThemedText>
              <View style={styles.standingTeamContainer}>
                {teams.find(t => t.id === standing.tournament_registration_id)?.logo_url && (
                  <Image 
                    source={{ uri: teams.find(t => t.id === standing.tournament_registration_id)?.logo_url }} 
                    style={styles.standingTeamLogo}
                    resizeMode="contain"
                  />
                )}
                <ThemedText 
                  style={styles.standingTeamName}
                  onPress={() => navigation.navigate('TeamDetails', {
                    teamId: standing.tournament_registration_id,
                    tournamentId: tournamentId
                  })}
                >
                  {teams.find(t => t.id === standing.tournament_registration_id)?.name || 'Equipo'}
                </ThemedText>
              </View>
              <ThemedText style={styles.standingStats}>
                {standing.games_played}
              </ThemedText>
              <ThemedText style={styles.standingStats}>
                {standing.wins}
              </ThemedText>
              <ThemedText style={styles.standingStats}>
                {standing.draws}
              </ThemedText>
              <ThemedText style={styles.standingStats}>
                {standing.losses}
              </ThemedText>
              <ThemedText style={styles.standingStats}>
                {standing.goals_for}
              </ThemedText>
              <ThemedText style={styles.standingStats}>
                {standing.goals_against}
              </ThemedText>
              <ThemedText style={styles.standingStats}>
                {standing.goal_difference}
              </ThemedText>
              <ThemedText style={styles.standingPoints}>
                {standing.points}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  tournamentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#444',
  },
  teamItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  teamLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 8,
  },
  teamStats: {
    marginLeft: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  matchItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matchInfo: {
    fontSize: 14,
    color: '#444',
  },
  matchStatus: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  matchTeams: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  teamContainer: {
    alignItems: 'center',
  },
  teamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4,
  },
  teamScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    backgroundColor: '#f0f0f0',
  },
  standingsHeaderItem: {
    width: 32,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  standingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  standingPosition: {
    width: 32,
    textAlign: 'center',
    marginRight: 8,
    fontWeight: 'bold',
  },
  standingTeamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  standingTeamLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  standingTeamName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  standingPoints: {
    width: 32,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  standingStats: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
  },
});

export default TournamentDetailsScreen;
