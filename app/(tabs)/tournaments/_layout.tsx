import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function TournamentsLayout() {
  return (
    <Stack 
      screenOptions={{ 
        // Configuración base del header
        headerShown: true,
        headerTransparent: false,
        headerTintColor: '#FF6D00',
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          // Ocultar header en la lista de torneos
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Detalles del Torneo',
          headerBackTitle: 'Atrás',
          // Mostrar header en los detalles
          headerShown: true,
          // Mantener la barra de pestañas visible
          headerTransparent: false,
        }} 
      />
    </Stack>
  );
}
