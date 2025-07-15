// Importaciones necesarias
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { SelectedEntitiesProvider } from './contexts/SelectedEntitiesContext';

// Componente principal de diseño de la aplicación
export default function RootLayout() {
  // Obtener el tema del dispositivo (claro/oscuro)
  const colorScheme = useColorScheme();
  
  return (
    // Proveedor de temas de React Native Paper
    <PaperProvider>
      {/* Proveedor de autenticación */}
      <AuthProvider>
        {/* Proveedor de entidades seleccionadas */}
        <SelectedEntitiesProvider>
          {/* Navegador de pila principal */}
          <Stack>
            {/* Pantalla de pestañas (navegación principal) */}
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false  // Oculta la barra superior
              }} 
            />
            
            {/* Las rutas de administración están en (admin)/_layout.tsx */}
          </Stack>
        </SelectedEntitiesProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
