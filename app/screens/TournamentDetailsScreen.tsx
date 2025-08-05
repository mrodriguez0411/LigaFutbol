// f:\Liga\LigaFutbol\app\screens\TournamentDetailsScreen.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Image, ImageBackground, ViewStyle, View, TextStyle, Dimensions, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../components/Loading';
import { ThemedText, ThemedView } from '../components/Themed';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, RootStackNavigationProp } from '../navigation';
import { supabase, Tournament, Team, Match, Standing, TournamentRegistrationWithTeam, RegistrationWithTeams } from '../config/supabase';
import fondo2 from '../../app/assets/images/fondo2.png';

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
  const theme = { light: '#fff', dark: '#000' };
  


  // Helper function to combine styles safely
  const combineStyles = (...styleArgs: (TextStyle | TextStyle[] | undefined)[]): TextStyle => {
    return styleArgs.reduce((combined: any, style) => {
      if (!style) return combined;
      if (Array.isArray(style)) {
        return [...combined, ...style];
      }
      return [...combined, style];
    }, []);
  };

  // Helper function to render text with theme
  const renderText = (
    text: React.ReactNode,
    style: TextStyle | TextStyle[] = {},
    type?: 'title' | 'subtitle' | 'body'
  ) => {
    const baseStyle = type === 'title' ? styles.title : {};
    const combinedStyle = Array.isArray(style) 
      ? [baseStyle, ...style] 
      : [baseStyle, style];
      
    return (
      <ThemedText 
        type={type || 'body'}
        light={theme.light} 
        dark={theme.dark}
        style={StyleSheet.flatten(combinedStyle)}
      >
        {text}
      </ThemedText>
    );
  };

  // Cargar datos del torneo
  useEffect(() => {
    let isMounted = true; // Para evitar actualizaciones en componentes desmontados
    
    const loadTournamentData = async () => {
      try {
        setLoading(true); // Asegurar que el loading esté activo al empezar
        
        // 1. Obtener detalles del torneo
        const { data: tournamentData, error: tournamentError } = await supabase
          .from('tournaments')
          .select('*, categories(*)')
          .eq('id', tournamentId)
          .single();
          
        if (tournamentError) throw tournamentError;
        if (!isMounted) return;
        setTournament(tournamentData);

        // 2. Obtener equipos inscritos
        const { data: registrations, error: teamsError } = await supabase
          .from('tournament_registrations')
          .select('teams(*)')
          .eq('tournament_id', tournamentId);
          
        if (teamsError) throw teamsError;
        if (!isMounted) return;
        
        const teamList = (registrations || []).map((reg: any) => reg.teams[0]);
        setTeams(teamList);

        // 3. Obtener partidos del torneo con información de equipos
        const { data: matchList, error: matchesError } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(id, name, logo_url),
            away_team:away_team_id(id, name, logo_url)
          `)
          .eq('tournament_id', tournamentId)
          .order('match_datetime', { ascending: true });
          
        if (matchesError) throw matchesError;
        if (!isMounted) return;
        setMatches(matchList || []);

        // 4. Obtener tabla de posiciones
        const { data: standingList, error: standingsError } = await supabase
          .from('standings')
          .select('*')
          .eq('tournament_id', tournamentId)
          .order('position', { ascending: true });
          
        if (standingsError) throw standingsError;
        if (!isMounted) return;
        setStandings(standingList || []);

      } catch (error) {
        console.error('Error loading tournament data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTournamentData();
    
    return () => {
      isMounted = false;
    };
  }, [tournamentId]);

  if (loading) {
    return <Loading text="Cargando torneo..." />;
  }

  // Render the repeating background pattern
  const renderPattern = () => (
    <ImageBackground
      source={fondo2}
      style={styles.backgroundImage}
      resizeMode="repeat"
      imageStyle={styles.backgroundImageStyle}
    />
  );

  return (
    <ThemedView style={styles.container} light={theme.light} dark={theme.dark}>
      {renderPattern()}
      <ScrollView style={styles.content}>
        {/* Botón de Atrás */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        {/* Header del Torneo */}
        <View style={styles.section}>
          {renderText(tournament?.name || tournamentName || 'Torneo', { ...styles.title, textAlign: 'center' }, 'title')}
          <View style={styles.tournamentInfo}>
            {renderText(
              `${tournament?.start_date ? new Date(tournament.start_date).toLocaleDateString() : ''} - 
               ${tournament?.end_date ? new Date(tournament.end_date).toLocaleDateString() : ''}`,
              styles.infoItem
            )}
            {renderText(`Estado: ${tournament?.status || 'Programado'}`, styles.infoItem)}
          </View>
        </View>

        {/* Equipos Inscritos */}
        <View style={styles.section}>
          {renderText('Equipos Inscritos', styles.subtitle, 'subtitle')}
          {renderText(`(${teams.length})`, styles.subtitle)}
          {teams.map((team) => (
            <View key={team.id} style={styles.teamItem}>
              <View style={styles.teamHeader}>
                {renderText(team.name, styles.teamTitle, 'title')}
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
                  {renderText('Goles', styles.statLabel)}
                  {renderText('0', styles.statValue)}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Partidos */}
        <View style={styles.section}>
          {renderText('Partidos', styles.subtitle, 'subtitle')}
          {matches.map((match) => (
            <View key={match.id} style={styles.matchItem}>
              <View style={styles.matchHeader}>
                {renderText(
                  `${match.round} - ${match.match_datetime ? new Date(match.match_datetime).toLocaleDateString() : 'Fecha por definir'}`,
                  styles.matchInfo
                )}
                <View style={styles.matchStatus}>
                  {renderText(
                    match.status,
                    styles.statusText
                  )}
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
                    <ThemedText 
                      style={styles.teamScore}
                      light={theme.light}
                      dark={theme.dark}
                    >
                      {match.home_team?.name} {match.home_score}
                    </ThemedText>
                    <View style={styles.eventStats}>
                      <View style={styles.statItem}>
                        {renderText('Goles', styles.statLabel)}
                        {renderText(String(match.home_goals || 0), styles.statValue)}
                      </View>
                      <View style={styles.statItem}>
                        {renderText('Tarjetas', styles.statLabel)}
                        <View style={styles.cardsContainer}>
                          <View style={styles.cardCount}>
                            {renderText(String(match.home_yellow_cards || 0), styles.cardValue)}
                            {renderText('Amarillas', styles.cardLabel)}
                          </View>
                          <View style={styles.cardCount}>
                            {renderText(String(match.home_red_cards || 0), [styles.cardValue, { color: '#f44336' }])}
                            {renderText('Rojas', styles.cardLabel)}
                          </View>
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
            {renderText('Pos', [styles.standingsHeaderItem, { width: 40 }])}
            {renderText('Equipo', [styles.standingsHeaderItem, { flex: 1 }])}
            {renderText('PJ', [styles.standingsHeaderItem, { width: 32 }])}
            {renderText('PG', [styles.standingsHeaderItem, { width: 32 }])}
            {renderText('PE', [styles.standingsHeaderItem, { width: 32 }])}
            {renderText('PP', [styles.standingsHeaderItem, { width: 32 }])}
            {renderText('GF', [styles.standingsHeaderItem, { width: 40 }])}
            {renderText('GC', [styles.standingsHeaderItem, { width: 40 }])}
            {renderText('GD', [styles.standingsHeaderItem, { width: 40 }])}
            {renderText('Pts', [styles.standingsHeaderItem, { width: 40, fontWeight: 'bold' }])}
          </View>
          {standings.map((standing, index) => (
            <View key={standing.id} style={styles.standingItem}>
              {renderText(String(index + 1), styles.standingPosition)}
              <View style={styles.standingTeamContainer}>
                {teams.find(t => t.id === standing.tournament_registration_id)?.logo_url && (
                  <Image 
                    source={{ uri: teams.find(t => t.id === standing.tournament_registration_id)?.logo_url }} 
                    style={styles.standingTeamLogo}
                    resizeMode="contain"
                  />
                )}
                {renderText(teams.find(t => t.id === standing.tournament_registration_id)?.name || 'Equipo', styles.standingTeamName, 'body')}
              </View>
              {renderText(String(standing.games_played), styles.standingStats)}
              {renderText(String(standing.wins), styles.standingStats)}
              {renderText(String(standing.draws), styles.standingStats)}
              {renderText(String(standing.losses), styles.standingStats)}
              {renderText(String(standing.goals_for), styles.standingStats)}
              {renderText(String(standing.goals_against), styles.standingStats)}
              {renderText(String(standing.goal_difference), styles.standingStats)}
              {renderText(String(standing.points), [styles.standingPoints, { fontWeight: 'bold' }])}
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

// Estilos
const styles = StyleSheet.create({

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 100,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  backgroundImageStyle: {
    width: 300,
    height: 300,
    opacity: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  } as TextStyle,
  teamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  } as TextStyle,
  eventStats: {
    marginTop: 16,
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  cardCount: {
    alignItems: 'center',
    padding: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  redCardDetails: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  redCardDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  suspensionDays: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  report: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    marginVertical: 4,
  } as TextStyle,
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
