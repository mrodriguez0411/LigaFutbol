import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="AdminPanelScreen" 
        options={{ 
          title: 'Panel de Administración',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="AdminTournaments" 
        options={{ 
          title: 'Gestionar Torneos',
          headerShown: true,
          headerBackTitle: 'Atrás'
        }} 
      />
      <Stack.Screen 
        name="AdminTeams" 
        options={{ 
          title: 'Gestionar Equipos',
          headerShown: true,
          headerBackTitle: 'Atrás'
        }} 
      />
      <Stack.Screen 
        name="AdminPlayers" 
        options={{ 
          title: 'Gestionar Jugadores',
          headerShown: true,
          headerBackTitle: 'Atrás'
        }} 
      />
      <Stack.Screen 
        name="AdminMatches" 
        options={{ 
          title: 'Gestionar Partidos',
          headerShown: true,
          headerBackTitle: 'Atrás'
        }} 
      />
      <Stack.Screen 
        name="AdminSettings" 
        options={{ 
          title: 'Configuración',
          headerShown: true,
          headerBackTitle: 'Atrás'
        }} 
      />
      <Stack.Screen 
        name="AdminCategories" 
        options={{ 
          title: 'Categorías',
          headerShown: true,
          headerBackTitle: 'Atrás'
        }} 
      />
    </Stack>
  );
}
