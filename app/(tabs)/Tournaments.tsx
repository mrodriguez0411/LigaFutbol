import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TournamentsScreen from '../screens/TournamentsScreen';

export default function Tournaments() {
  const navigation = useNavigation();
  
  return (
    <View style={styles.container}>
      <TournamentsScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
