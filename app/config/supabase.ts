import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './config';

console.log('Configurando cliente Supabase con:');
console.log('URL:', supabaseUrl);
console.log('Clave anónima:', supabaseAnonKey ? '*** (presente)' : 'NO CONFIGURADA');

// Create Supabase client using the configuration from config.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Verificar conexión
const checkConnection = async () => {
  try {
    const { count, error } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Error al conectar con Supabase:', error);
    } else {
      console.log(`Conexión exitosa con Supabase. Tabla 'tournaments' contiene ${count} registros.`);
    }
  } catch (error: any) {
    console.error('Error en la verificación de conexión a Supabase:', error.message);
  }
};

// Ejecutar verificación de conexión
checkConnection();

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      },
      standings: {
        Row: {
          id: string;
          team_id: string;
          tournament_id: string;
          points: number;
          games_played: number;
          wins: number;
          draws: number;
          losses: number;
          goals_for: number;
          goals_against: number;
          goal_difference: number;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          tournament_id: string;
          points: number;
          games_played: number;
          wins: number;
          draws: number;
          losses: number;
          goals_for: number;
          goals_against: number;
          goal_difference: number;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          tournament_id?: string;
          points?: number;
          games_played?: number;
          wins?: number;
          draws?: number;
          losses?: number;
          goals_for?: number;
          goals_against?: number;
          goal_difference?: number;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "standings_team_id_fkey",
            columns: ["team_id"],
            isOneToOne: false,
            referencedRelation: "teams",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_tournament_id_fkey",
            columns: ["tournament_id"],
            isOneToOne: false,
            referencedRelation: "tournaments",
            referencedColumns: ["id"]
          }
        ];
      };
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
