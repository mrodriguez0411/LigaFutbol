import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Dimensions, 
  FlatList, 
  ImageBackground, 
  Keyboard, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  TouchableWithoutFeedback, 
  View, 
  ViewStyle, 
  TextStyle,
  ImageStyle,
  StyleProp,
  RegisteredStyle
} from 'react-native';

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

// Helper function to combine styles with proper typing
function combineStyles<T extends ViewStyle | TextStyle | ImageStyle>(
  ...styleArgs: (StyleProp<T> | false | undefined)[]
): StyleProp<T>[] {
  return styleArgs.filter(Boolean) as StyleProp<T>[];
}

// Define style types for better type safety
type MatchResultStyles = {
  // Layout
  container: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  contentContainer: ViewStyle;
  keyboardAvoidingView: ViewStyle;
  innerContainer: ViewStyle;
  scrollView: ViewStyle;
  scrollViewContent: ViewStyle;
  landscapeContainer: ViewStyle;
  landscapeContent: ViewStyle;
  
  // Match container
  matchContainer: ViewStyle;
  matchContainerSmall: ViewStyle;
  matchContainerTablet: ViewStyle;
  
  // Typography
  title: TextStyle;
  titleSmall: TextStyle;
  teamName: TextStyle;
  teamNameSmall: TextStyle;
  teamNameTablet: TextStyle;
  vsText: TextStyle;
  
  // Player related
  playerRow: ViewStyle;
  playerName: TextStyle;
  playerSuspended: ViewStyle;
  suspendedText: TextStyle;
  
  // Stats and buttons
  statContainer: ViewStyle;
  statValue: TextStyle;
  buttonGroup: ViewStyle;
  statButton: ViewStyle;
  goalButton: ViewStyle;
  yellowCardButton: ViewStyle;
  redCardButton: ViewStyle;
  activeRedCard: ViewStyle;
  
  // Teams and scores
  teamsContainer: ViewStyle;
  teamContainer: ViewStyle;
  teamPlayers: ViewStyle;
  teamPlayersLandscape: ViewStyle;
  teamPlayersTitle: TextStyle;
  scoreContainer: ViewStyle;
  scoreInput: TextStyle;
  scoreInputSmall: TextStyle;
  scoreInputTablet: TextStyle;
  
  // Buttons
  saveButton: ViewStyle;
  saveButtonDisabled: ViewStyle;
  saveButtonText: TextStyle;
  
  // Utility
  spacer: ViewStyle;
  playersContainer?: ViewStyle;
  playersContainerLandscape?: ViewStyle;
}

// Create a clean, consolidated styles object with proper typing
const styles = StyleSheet.create<MatchResultStyles>({
  // Layout
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    padding: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeContent: {
    paddingHorizontal: 10,
  },
  playersContainer: {
    flex: 1,
  },
  playersContainerLandscape: {
    flex: 1,
    flexDirection: 'row',
  },
  
  // Match container
  matchContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  matchContainerSmall: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  matchContainerTablet: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  
  // Typography
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  teamNameSmall: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  teamNameTablet: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  
  // Player related
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
  },
  playerSuspended: {
    opacity: 0.5,
  },
  suspendedText: {
    color: '#888',
    fontStyle: 'italic',
  },
  
  // Stats and buttons
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    minWidth: 20,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statButton: {
    padding: 6,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  goalButton: {
    backgroundColor: '#4CAF50',
  },
  yellowCardButton: {
    backgroundColor: '#FFC107',
  },
  redCardButton: {
    backgroundColor: '#F44336',
  },
  activeRedCard: {
    backgroundColor: '#D32F2F',
  },
  
  // Teams and scores
  teamsContainer: {
    marginBottom: 20,
  },
  teamContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  teamPlayers: {
    width: '100%',
    marginTop: 10,
  },
  teamPlayersLandscape: {
    flex: 1,
    marginHorizontal: 5,
  },
  teamPlayersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  scoreInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    marginHorizontal: 10,
  },
  scoreInputSmall: {
    width: 40,
    height: 40,
    fontSize: 20,
  },
  scoreInputTablet: {
    width: 60,
    height: 60,
    fontSize: 28,
  },
  
  // Buttons
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#BBDEFB',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Utility
  spacer: {
    height: 20,
  },
  shadowContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  playerSuspended: {
    opacity: 0.6,
  },
  suspendedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  
  // Stats and buttons
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  statValue: {
    minWidth: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  statButton: {
    padding: 5,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButton: {
    backgroundColor: '#e3f2fd',
  },
  yellowCardButton: {
    backgroundColor: '#fff9c4',
  },
  redCardButton: {
    backgroundColor: '#ffebee',
  },
  activeRedCard: {
    backgroundColor: '#ffcdd2',
  },
  
  // Teams and scores
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamPlayers: {
    flex: 1,
    minWidth: '100%',
    marginHorizontal: 5,
  },
  teamPlayersLandscape: {
    minWidth: '48%',
    marginBottom: 20,
  },
  teamPlayersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  
  // Score styles
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  scoreInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    marginHorizontal: 5,
  },
  scoreInputSmall: {
    width: 40,
    height: 40,
    fontSize: 20,
  },
  scoreInputTablet: {
    width: 60,
    height: 60,
    fontSize: 28,
  },
  
  // Match details
  matchDetails: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 12,
  },
  matchVenue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Save button
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
  
  // Spacer
  spacer: {
    height: 20,
  },
  
  // Players container
  playersContainer: {
    marginTop: 16,
  },
  playersContainerLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    padding: 16,
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeContent: {
    paddingHorizontal: 10,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
  },
  matchContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchContainerSmall: {
    padding: 12,
  },
  matchContainerTablet: {
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 16,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  teamNameSmall: {
    fontSize: 14,
  },
  teamNameTablet: {
    fontSize: 18,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#666',
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
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  playerSuspended: {
    opacity: 0.6,
  },
  suspendedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  statValue: {
    minWidth: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  statButton: {
    padding: 5,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButton: {
    backgroundColor: '#e3f2fd',
  },
  yellowCardButton: {
    backgroundColor: '#fff9c4',
  },
  redCardButton: {
    backgroundColor: '#ffebee',
  },
  activeRedCard: {
    backgroundColor: '#ffcdd2',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  scoreInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    marginHorizontal: 5,
  },
  scoreInputSmall: {
    width: 40,
    height: 40,
    fontSize: 20,
  },
  scoreInputTablet: {
    width: 60,
    height: 60,
    fontSize: 28,
  },
  matchDetails: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 12,
  },
  matchVenue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
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
  spacer: {
    height: 20,
  },
  playersContainer: {
    marginTop: 16,
  },
  playersContainerLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matchContainerSmall: {
    padding: 12,
  },
  matchContainerTablet: {
    padding: 24,
  },

  // Titles and text
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 16,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#666',
  },

  // Players container
  playersContainer: {
    marginTop: 16,
  },
  playersContainerLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Player row and info
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
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  playerSuspended: {
    opacity: 0.6,
  },
  suspendedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },

  // Stats
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  statValue: {
    minWidth: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  } as TextStyle,
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Layout
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeContent: {
    paddingHorizontal: 10,
  },
  playersContainer: {
    flex: 1,
  },
  playersContainerLandscape: {
    flex: 1,
    flexDirection: 'row',
  },
  
  // Match container
  matchContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  matchContainerSmall: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  matchContainerTablet: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  
  // Typography
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 20,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#666',
  },
  
  // Player related
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  playerSuspended: {
    backgroundColor: '#ffebee',
  },
  suspendedText: {
    color: '#d32f2f',
    fontSize: 12,
    marginLeft: 8,
  },
  
  // Stats and buttons
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  statValue: {
    minWidth: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  statButton: {
    padding: 5,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButton: {
    backgroundColor: '#e3f2fd',
  },
  yellowCardButton: {
    backgroundColor: '#fff9c4',
  },
  redCardButton: {
    backgroundColor: '#ffebee',
  },
  activeRedCard: {
    backgroundColor: '#ffcdd2',
  },
  
  // Teams and scores
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  teamNameSmall: {
    fontSize: 16,
  },
  teamNameTablet: {
    fontSize: 20,
  },
  teamPlayers: {
    flex: 1,
    minWidth: '100%',
    marginHorizontal: 5,
  },
  teamPlayersLandscape: {
    minWidth: '48%',
    marginBottom: 20,
  },
  teamPlayersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  scoreInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    marginHorizontal: 5,
  },
  scoreInputSmall: {
    width: 40,
    height: 40,
    fontSize: 20,
  },
  scoreInputTablet: {
    width: 60,
    height: 60,
    fontSize: 28,
  },
  
  // Save button
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Utility
  spacer: {
    height: 20,
  },
});

const MatchDetail = () => {
  const { matchId, id: tournamentId } = useLocalSearchParams<{ 
    matchId: string; 
    id: string 
  }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(*),
            away_team:away_team_id(*)
          `)
          .eq('id', matchId)
          .single();

        if (error) throw error;
        setMatch(data);
      } catch (error) {
        console.error('Error fetching match:', error);
        Alert.alert('Error', 'No se pudo cargar el partido');
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Cargando partido...</Text>
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
          title: 'Detalle del Partido',
          headerBackTitle: 'Atrás',
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.matchContainer}>
          <View style={styles.teamsContainer}>
            <View style={styles.teamContainer}>
              <Text style={styles.teamName}>
                {match.home_team?.name || 'Equipo Local'}
              </Text>
              <Text style={styles.score}>
                {match.home_team_score !== null ? match.home_team_score : '-'}
              </Text>
            </View>
            
            <Text style={styles.vsText}>VS</Text>
            
            <View style={styles.teamContainer}>
              <Text style={styles.teamName}>
                {match.away_team?.name || 'Equipo Visitante'}
              </Text>
              <Text style={styles.score}>
                {match.away_team_score !== null ? match.away_team_score : '-'}
              </Text>
            </View>
          </View>
          
          <View style={styles.matchInfo}>
            <Text style={styles.matchDate}>
              {new Date(match.match_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.matchTime}>
              {new Date(match.match_date).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.matchStatus}>
              Estado: {match.status === 'completed' ? 'Finalizado' : 'Pendiente'}
            </Text>
            <Text style={styles.matchRound}>Fecha {match.round}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MatchDetail;
