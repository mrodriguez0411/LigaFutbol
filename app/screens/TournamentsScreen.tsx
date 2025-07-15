import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  ImageBackground
} from 'react-native';
import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'expo-router';

type Tournament = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  image_url?: string; // URL de la imagen del torneo
  category: Array<{
    name: string;
  }> | null;
  tournament_registrations: Array<{ team_id: string }>;
  teams_count?: number;
};

export default function TournamentsScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
      padding: 16,
    },
    headerContainer: {
      padding: 16,
      backgroundColor: '#f8f9fa',
    },
    titleBox: {
      backgroundColor: '#1976d2',
      borderRadius: 8,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#1a1a1a',
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: 'white',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 20,
      backgroundColor: '#3b82f6',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      color: 'white',
      fontWeight: '600',
      textAlign: 'center',
    },
    gridContainer: {
      padding: 8,
    },
    row: {
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    tournamentCard: {
      width: '48%',
      height: 400, // Altura reducida para mejor visualización
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: 12,
    },
    cardBackground: {
      flex: 1,
      justifyContent: 'center',
    },
    cardContent: {
      flex: 1,
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Sobreposición oscura para mejor legibilidad
    },
    tournamentName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      flex: 1,
      marginRight: 8,
    },
    statusBadge: {
      backgroundColor: '#D1FAE5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#065F46',
      fontSize: 12,
      fontWeight: '600',
    },
    cardBody: {
      marginTop: 8,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoText: {
      marginLeft: 8,
      color: '#4B5563',
      fontSize: 14,
    },
  });

  const fetchTournaments = useCallback(async () => {
    try {
      console.log('=== INICIANDO CONSULTA A SUPABASE ===');
      console.log('Tabla: tournaments');
      console.log('Filtro: is_active = true');
      
      const { data, error, count } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          start_date,
          end_date,
          is_active,
          image_url,
          category:category_id (name),
          tournament_registrations (team_id)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      console.log('=== RESULTADOS DE LA CONSULTA ===');
      console.log('Cantidad de torneos encontrados:', count);
      console.log('Datos crudos de Supabase:', data);
      
      if (error) {
        console.error('❌ Error en la consulta:', error);
        setError(`Error al cargar los torneos: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('ℹ️ No se encontraron torneos activos');
        setTournaments([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No active tournaments found');
        setTournaments([]);
        return;
      }

      // Process data to count teams per tournament
      const processedData = data.map(tournament => {
        console.log('Processing tournament:', tournament.id, tournament.name);
        
        const processedTournament = {
          ...tournament,
          teams_count: tournament.tournament_registrations?.length || 0,
        };
        
        console.log('Processed tournament:', processedTournament);
        return processedTournament;
      });

      console.log('Setting tournaments state with:', processedData);
      setTournaments(processedData);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTournaments();
  };

  const renderTournament = ({ item }: { item: Tournament }) => {
    // Generar un color de fondo basado en el nombre del torneo para consistencia
    const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0'];
    const colorIndex = Math.abs(item.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
    const backgroundColor = colors[colorIndex];

    return (
      <TouchableOpacity
        style={styles.tournamentCard}
        onPress={() => router.push({
          pathname: '/TournamentDetails',
          params: { tournamentId: item.id, tournamentName: item.name }
        })}
      >
        {item.image_url ? (
          <ImageBackground 
            source={{ uri: item.image_url }}
            style={styles.cardBackground}
            resizeMode="cover"
          >
            <View style={styles.cardContent}>
              <Text style={styles.tournamentName} numberOfLines={2} ellipsizeMode="tail">
                {item.name || 'Torneo sin nombre'}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.cardBackground, { backgroundColor }]}>
            <View style={styles.cardContent}>
              <Text style={styles.tournamentName} numberOfLines={2} ellipsizeMode="tail">
                {item.name || 'Torneo sin nombre'}
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6D00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Torneos Activos</Text>
      
      {error ? (
        <View style={[styles.emptyContainer, { padding: 20 }]}>
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <Text style={[styles.emptyText, { color: '#ef4444' }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchTournaments();
            }}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : tournaments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={48} color="#888" />
          <Text style={styles.emptyText}>No hay torneos activos</Text>
          <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
            Crea un nuevo torneo o activa uno existente en el panel de administración.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Espacio para el encabezado */}
          <View style={{ height: 20 }} />
          <FlatList
            data={tournaments}
            renderItem={renderTournament}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={48} color="#888" />
                <Text style={styles.emptyText}>No hay torneos activos</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}