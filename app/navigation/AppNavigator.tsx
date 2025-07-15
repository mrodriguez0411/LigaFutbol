import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import CalendarScreen from '../screens/CalendarScreen';
import ContactScreen from '../screens/ContactScreen';
import HomeScreen from '../screens/HomeScreen-old';
import { LoginScreen } from '../screens/LoginScreen';
import NewsScreen from '../screens/NewsScreen';
import StandingsScreen from '../screens/StandingsScreen';
import TeamProfileScreen from '../screens/TeamProfileScreen';
import TeamsScreen from '../screens/TeamsScreen';
import TournamentDetailsScreen from '../screens/TournamentDetailsScreen';
import TournamentsScreen from '../screens/TournamentsScreen';

// Importar componentes de administración
import PlayerForm from '../(admin)/PlayerForm';
import AdminPlayers from '../(admin)/AdminPlayers';
import AdminPanel from '../(admin)/AdminPanel';

// Tipos
export type RootStackParamList = {
  // Rutas públicas
  Home: undefined;
  Calendar: undefined;
  Standings: undefined;
  News: undefined;
  Teams: undefined;
  TeamProfile: { teamId: string };
  Tournaments: undefined;
  TournamentDetails: { tournamentId: string };
  PlayerForm: { playerId?: string; tournamentId?: string; teamId?: string };
  Players: undefined;
  Contact: undefined;
  Login: undefined;
  
  // Rutas de administración
  AdminPanel: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1976d2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Inicio' }}
        />
        <Stack.Screen 
          name="Calendar" 
          component={CalendarScreen} 
          options={{ title: 'Calendario' }}
        />
        <Stack.Screen 
          name="Standings" 
          component={StandingsScreen} 
          options={{ title: 'Tabla de Posiciones' }}
        />
        <Stack.Screen 
          name="News" 
          component={NewsScreen} 
          options={{ title: 'Noticias' }}
        />
        <Stack.Screen 
          name="Teams" 
          component={TeamsScreen} 
          options={{ title: 'Equipos' }}
        />
        <Stack.Screen 
          name="TeamProfile" 
          component={TeamProfileScreen} 
          options={{ title: 'Perfil del Equipo' }}
        />
        <Stack.Screen 
          name="Tournaments" 
          component={TournamentsScreen} 
          options={{ title: 'Torneos' }}
        />
        <Stack.Screen 
          name="TournamentDetails" 
          component={TournamentDetailsScreen} 
          options={{ title: 'Detalles del Torneo' }}
        />
        <Stack.Screen 
          name="PlayerForm" 
          component={PlayerForm} 
          options={({ route }) => ({
            title: route.params?.playerId ? 'Editar Jugador' : 'Nuevo Jugador'
          })} 
        />
        <Stack.Screen 
          name="Players" 
          component={AdminPlayers} 
          options={({ navigation }) => ({
            title: 'Jugadores',
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('PlayerForm', {})}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            )
          })}
        />
        <Stack.Screen 
          name="Contact" 
          component={ContactScreen} 
          options={{ title: 'Contacto' }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ 
            title: 'Iniciar Sesión',
            headerShown: false
          }} 
        />
        
        {/* Rutas de administración */}
        <Stack.Screen 
          name="AdminPanel" 
          component={AdminPanel} 
          options={{ 
            title: 'Panel de Administración',
            headerShown: true
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
