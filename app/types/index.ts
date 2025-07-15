// Exportar tipos específicos para evitar duplicados
export type { User, UserAppMetadata, UserMetadata } from './auth';
export type { LoginCredentials, RegisterCredentials } from './auth';

// Exportar tipos de navegación
export type { RootStackParamList, TabParamList, AdminStackParamList, AuthStackParamList } from './navigation';

// Tipos globales
declare global {
  // Extender las tipificaciones globales para el navegador
  interface Window {
    // Propiedades globales si son necesarias
  }
}
