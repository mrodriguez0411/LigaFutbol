import { User } from './auth';
import { NavigatorScreenParams } from '@react-navigation/native';

// Tipos para las rutas de la aplicación
export type RootStackParamList = {
  // Pestañas principales
  '(tabs)': NavigatorScreenParams<TabParamList>;
  
  // Rutas de autenticación
  Login: undefined;
  Register: undefined;
  
  // Rutas de administración
  '(admin)/AdminPanelScreen': undefined;
  '(admin)/AdminTournaments': undefined;
  '(admin)/AdminTeams': undefined;
  '(admin)/AdminPlayers': undefined;
  '(admin)/AdminMatches': undefined;
  '(admin)/AdminSettings': undefined;
  '(admin)/AdminCategories': { categoryId?: string };
  
  // Otras rutas
  TeamProfile: { teamId: string };
  TournamentDetails: { tournamentId: string };
  TournamentForm: { tournamentId?: string; categoryId?: string };
  TeamForm: { teamId?: string };
  PlayerForm: { playerId?: string; tournamentId: string; teamId: string };
  CategoryForm: { categoryId?: string };
};

// Tipos para las pestañas
export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Standings: undefined;
  News: undefined;
  Teams: undefined;
  Tournaments: { categoryId?: string };
  Categories: undefined;
  Players: undefined;
  Contact: undefined;
  Login: undefined;
};

// Tipos para las rutas de administración
export type AdminStackParamList = {
  'AdminPanelScreen': undefined;
  'AdminTournaments': undefined;
  'AdminTeams': undefined;
  'AdminPlayers': undefined;
  'AdminMatches': undefined;
  'AdminSettings': undefined;
  'AdminCategories': { categoryId?: string };
};

export interface PlayerFormProps {
  playerId?: string;
  tournamentId: string;
  teamId: string;
}

// Tipos para autenticación
export type AuthStackParamList = {
  login: undefined;
  register: undefined;
};

export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  error: string | null;
}
