import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { supabase } from '../config/supabase';

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string;
};

type Team = {
  id: string;
  name: string;
};

type SuspensionData = {
  id: string;
  start_date: string;
  days_count: number;
  player_id: Player;
};

type FormattedSuspension = {
  id: string;
  player_name: string;
  player_last_name: string;
  team_name: string;
  matches_remaining: number;
};

interface Suspension {
  id: string;
  player_name: string;
  player_last_name: string;
  team_name: string;
  start_date: string;
  end_date: string;
}

const SuspensionsScreen = () => {
  const theme = useTheme();
  const [suspensions, setSuspensions] = useState<FormattedSuspension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuspensions = async () => {
      try {
        setLoading(true);
        console.log('Fetching suspensions...');
        
        // First, fetch player suspensions with player data
        const { data: suspensionsData, error: suspensionsError } = await supabase
          .from('player_suspensions')
          .select(`
            id,
            start_date,
            days_count,
            player_id (
              first_name,
              last_name,
              team_id
            )
          `)
          .eq('active', true) as { data: SuspensionData[] | null; error: any };

        if (suspensionsError) {
          console.error('Error fetching suspensions:', suspensionsError);
          throw suspensionsError;
        }

        console.log('Suspensions data:', JSON.stringify(suspensionsData, null, 2));

        if (!suspensionsData || suspensionsData.length === 0) {
          console.log('No active suspensions found');
          setSuspensions([]);
          return;
        }

        // Extract unique team IDs
        const teamIds = Array.from(
          new Set(
            suspensionsData
              .filter(s => s.player_id?.team_id)
              .map(s => s.player_id.team_id)
          )
        );

        // Fetch team details
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds);

        if (teamsError) {
          console.error('Error fetching teams:', teamsError);
          throw teamsError;
        }

        console.log('Teams data:', JSON.stringify(teamsData, null, 2));

        // Create team name mapping
        const teamMap = (teamsData || []).reduce<Record<string, string>>((acc, team) => {
          acc[team.id] = team.name;
          return acc;
        }, {});

        // Format the data for display
        const formattedData = suspensionsData
          .filter(suspension => suspension.player_id)
          .map(suspension => {
            const player = suspension.player_id;
            
            return {
              id: suspension.id,
              player_name: player.first_name || 'Desconocido',
              player_last_name: player.last_name || '',
              team_name: player.team_id ? (teamMap[player.team_id] || 'Equipo desconocido') : 'Sin equipo',
              matches_remaining: suspension.days_count
            };
          });

        console.log('Formatted suspensions:', formattedData);
        setSuspensions(formattedData);
      } catch (err) {
        console.error('Error fetching suspensions:', err);
        setError('Error al cargar las suspensiones');
      } finally {
        setLoading(false);
      }
    };

    fetchSuspensions();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          JUGADORES SUSPENDIDOS
        </Text>
      </View>
      
      {suspensions.length === 0 ? (
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No hay jugadores suspendidos actualmente.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 5, textAlign: 'left', paddingLeft: 12 }]}>JUGADOR</Text>
            <Text style={[styles.headerText, { flex: 4, textAlign: 'left' }]}>EQUIPO</Text>
            <Text style={[styles.headerText, { flex: 2, textAlign: 'center' }]}>FECHAS RESTANTES</Text>
          </View>
          
          {suspensions.map((suspension) => (
            <View key={suspension.id} style={styles.tableRow}>
              <Text 
                style={[styles.cell, { 
                  flex: 5, 
                  textAlign: 'left', 
                  paddingLeft: 12,
                  fontWeight: '500' 
                }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {`${suspension.player_name.toUpperCase()} ${suspension.player_last_name.toUpperCase()}`}
              </Text>
              <Text 
                style={[styles.cell, { 
                  flex: 4,
                  textAlign: 'left',
                  paddingLeft: 0
                }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {suspension.team_name.toUpperCase()}
              </Text>
              <Text style={[styles.cell, { 
                flex: 2, 
                fontWeight: 'bold',
                color: '#FF6B35',
                fontSize: 16
              }]}>
                {suspension.matches_remaining}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  content: {
    margin: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 1,
  },
  tableContainer: {
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35', // Naranja similar al de torneos
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0a800',
  },
  headerText: {
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cell: {
    textAlign: 'center',
    color: '#333',
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default SuspensionsScreen;
