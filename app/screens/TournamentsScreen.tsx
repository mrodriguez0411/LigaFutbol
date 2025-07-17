import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  ImageBackground,
  ImageSourcePropType,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
  ImageStyle
} from 'react-native';
import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'expo-router';

type Category = {
  id: string;
  name: string;
};

type Tournament = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  image_url?: string; // URL de la imagen del torneo
  category_id: string;
  category?: Category | null;
  tournament_registrations: Array<{ team_id: string }>;
  teams_count?: number;
};

type TournamentsScreenProps = {
  onTournamentPress?: (tournament: Tournament) => void;
};

export default function TournamentsScreen({ onTournamentPress }: TournamentsScreenProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768; // Consideramos tablet a partir de 768px de ancho
  const numColumns = isTablet ? 2 : 1; // 2 columnas en tablet, 1 en móvil
  // Usamos numColumns en la key para forzar un nuevo renderizado cuando cambie
  const flatListKey = `flatlist-${numColumns}`;
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    
    // Si la URL ya es completa (http o https), la devolvemos tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Si es una ruta relativa, asumimos que está en la carpeta de imágenes estáticas
    // y la combinamos con la URL base de la API
    return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tournament-images/${url}`;
  };

  const renderTournamentCard = ({ item }: { item: Tournament }) => {
    const cardStyle: ViewStyle[] = [
      styles.card as ViewStyle,
      isTablet ? styles.tabletCard as ViewStyle : {}
    ];
    const startDate = item.start_date ? format(new Date(item.start_date), 'd MMM yyyy', { locale: es }) : 'Sin fecha';
    const endDate = item.end_date ? format(new Date(item.end_date), 'd MMM yyyy', { locale: es }) : 'Presente';
    const teamsCount = item.teams_count || item.tournament_registrations?.length || 0;
    const categoryName = item.category?.name || 'Sin categoría';
    const imageUrl = getImageUrl(item.image_url);

    return (
      
      <TouchableOpacity 
        style={cardStyle}
        onPress={() => {
          if (onTournamentPress) {
            onTournamentPress(item);
          }
        }}
      >
        {imageUrl ? (
          <ImageBackground 
            source={{ 
              uri: imageUrl,
              cache: 'force-cache'
            }} 
            style={styles.cardImage}
            imageStyle={styles.cardImageBackground}
            onError={(error) => {
              console.log('Error al cargar la imagen:', error);
            }}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <View style={styles.cardDetails}>
                <Text style={styles.cardText}><Ionicons name="calendar" size={14} color="#fff" /> {startDate} - {endDate}</Text>
                <Text style={styles.cardText}><Ionicons name="people" size={14} color="#fff" /> {teamsCount} equipos</Text>
                <Text style={styles.cardText}><Ionicons name="trophy" size={14} color="#fff" /> {categoryName}</Text>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.cardImage, { backgroundColor: '#e0e0e0' }]}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <View style={styles.cardDetails}>
                <Text style={styles.cardText}><Ionicons name="calendar" size={14} color="#333" /> {startDate} - {endDate}</Text>
                <Text style={styles.cardText}><Ionicons name="people" size={14} color="#333" /> {teamsCount} equipos</Text>
                <Text style={styles.cardText}><Ionicons name="trophy" size={14} color="#333" /> {categoryName}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      padding: 8,
    } as ViewStyle,
    gridContainer: {
      padding: 8,
      width: '100%',
      maxWidth: 1200, // Ancho máximo para el contenedor
      alignSelf: 'center', // Centrar en pantallas grandes
    },
    columnWrapper: {
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      overflow: 'hidden',
      width: '100%', // Ocupa todo el ancho en móvil
      maxWidth: 400, // Ancho máximo para mantener la legibilidad
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      alignSelf: 'center', // Centrar la tarjeta en móvil
    },
    tabletCard: {
      width: '48%', // Ancho para tablet
      maxWidth: '100%',
      alignSelf: 'flex-start', // Alinear al inicio en tablet
    } as ViewStyle,
    cardImage: {
      width: '100%',
      height: 350,
      justifyContent: 'flex-end',
    },
    cardImageBackground: {
      opacity: 0.9,
    },
    cardContent: {
      padding: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 6,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    cardDetails: {
      marginTop: 4,
    },
    cardText: {
      color: '#fff',
      fontSize: 10,
      marginLeft: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
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
      fontSize: 16,
      marginTop: 16,
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
    cardBackground: {
      flex: 1,
      justifyContent: 'center',
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
      
      // Primero obtenemos los torneos con los datos básicos
      const { data: tournamentsData, error: tournamentsError, count } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          start_date,
          end_date,
          is_active,
          image_url,
          category_id,
          tournament_registrations (team_id)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('start_date', { ascending: false });
      
      if (tournamentsError) {
        console.error('❌ Error al cargar torneos:', tournamentsError);
        const errorMessage = tournamentsError.message || 'Error desconocido';
        setError(`Error al cargar los torneos: ${errorMessage}`);
        return [];
      }
      
      // Obtenemos los IDs de categorías únicos
      const categoryIds = [...new Set(tournamentsData.map(t => t.category_id))];
      
      // Obtenemos las categorías correspondientes
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds);
        
      if (categoriesError) {
        console.error('❌ Error al cargar categorías:', categoriesError);
        // Continuamos sin las categorías en lugar de fallar
        console.log('Continuando sin información de categorías');
      }
        
      // Creamos un mapa de categorías para acceso rápido
      const categoriesMap = new Map(categoriesData?.map(cat => [cat.id, cat]) || []);
      
      // Combinamos los datos
      const data = tournamentsData.map(tournament => ({
        ...tournament,
        category: categoriesMap.get(tournament.category_id) || null
      }));

      console.log('=== RESULTADOS DE LA CONSULTA ===');
      console.log('Cantidad de torneos encontrados:', count);
      console.log('Datos crudos de Supabase:', data);
      
      if (error) {
        console.error('❌ Error en la consulta:', error);
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'Error desconocido';
        setError(`Error al cargar los torneos: ${errorMessage}`);
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



  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={[styles.emptyText, { color: '#ef4444' }]}>Error al cargar los torneos</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              fetchTournaments();
            }}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : tournaments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
          <Text style={[styles.emptyText, { color: '#333' }]}>No hay torneos disponibles</Text>
        </View>
      ) : (
        <FlatList
          key={flatListKey}
          data={tournaments}
          keyExtractor={(item) => item.id}
          renderItem={renderTournamentCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1976d2']}
              tintColor="#1976d2"
            />
          }
          contentContainerStyle={styles.gridContainer}
          numColumns={numColumns}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
        />
      )}
    </View>
  );
}