import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import TournamentsScreen from '../../screens/TournamentsScreen';

export default function TournamentsIndex() {
  const router = useRouter();
  
  // Función para manejar la navegación a los detalles
  const handleTournamentPress = (tournament) => {
    router.push({
      pathname: `/(tabs)/tournaments/${tournament.id}`,
      params: { 
        tournamentId: tournament.id,
        tournamentName: tournament.name 
      }
    });
  };
  
  return (
    <View style={styles.container}>
      <TournamentsScreen onTournamentPress={handleTournamentPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
