import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

export interface RootStackParamList extends ParamListBase {
  'auth/Login': undefined;
  '(tabs)/Home': undefined;
  '(tabs)/Calendar': undefined;
  '(tabs)/Standings': undefined;
  '(tabs)/News': undefined;
  '(tabs)/Teams': undefined;
  '(tabs)/TeamProfile': { teamId: string };
  '(tabs)/Players': undefined;
  '(tabs)/AdminPanel': undefined;
  '(tabs)/TeamDetails': undefined;
  '(tabs)/Tournaments': undefined;
  '(tabs)/TournamentDetails': {
    tournamentId: string;
    tournamentName?: string;
  };
  '(tabs)/PlayerForm': {
    playerId?: string;
  };
  '(tabs)/CategoryForm': {
    categoryId?: string;
  };
  '(tabs)/TournamentForm': {
    tournamentId?: string;
    categoryId?: string;
  };
  '(tabs)/TeamForm': {
    teamId?: string;
  };
}

export type TournamentDetailsScreenProps = NativeStackScreenProps<RootStackParamList, '(tabs)/TournamentDetails'>;
export type CategoryFormScreenProps = NativeStackScreenProps<RootStackParamList, '(tabs)/CategoryForm'>;
export type TournamentFormScreenProps = NativeStackScreenProps<RootStackParamList, '(tabs)/TournamentForm'>;
export type TeamFormScreenProps = NativeStackScreenProps<RootStackParamList, '(tabs)/TeamForm'>;

export interface Player {
  id: string;
  name: string;
  teamId: string;
  dni: string;
  dateOfBirth: string;
  position?: string;
  number?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  coach: string;
  stadium: string;
  colors: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
}
