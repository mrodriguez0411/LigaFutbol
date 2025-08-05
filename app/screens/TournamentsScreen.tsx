import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import fondo2 from '../../app/assets/images/fondo2.png';

type Category = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  logo_url?: string;
};

type Match = {
  id: string;
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  home_team: Team[] | null;
  away_team: Team[] | null;
  home_score?: number | null;
  away_score?: number | null;
  match_datetime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';
  venue?: string | null;
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
  next_matches?: Match[];
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

  const renderMatchItem = (match: Match, isDark: boolean) => {
    const matchDate = match.match_datetime ? format(new Date(match.match_datetime), 'EEE d MMM, HH:mm', { locale: es }) : 'Fecha por definir';
    const textColor = isDark ? '#fff' : '#333';
    const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)';
    
    // Handle team data which comes as an array from Supabase
    const homeTeam = Array.isArray(match.home_team) ? match.home_team[0] : match.home_team;
    const awayTeam = Array.isArray(match.away_team) ? match.away_team[0] : match.away_team;

    return (
      <View key={match.id} style={styles.matchItem}>
        <View style={styles.matchTeamsRow}>
          <View style={styles.teamContainer}>
            {homeTeam?.logo_url ? (
              <Image 
                source={{ uri: homeTeam.logo_url }} 
                style={styles.teamLogoSmall}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.teamLogoSmall, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            )}
            <Text style={[styles.teamName, { color: textColor }]} numberOfLines={1}>
              {homeTeam?.name || 'Equipo local'}
            </Text>
          </View>
          
          <View style={styles.matchScoreContainer}>
            {match.status === 'completed' ? (
              <Text style={[styles.matchScore, { color: textColor }]}>
                {match.home_score ?? '-'} - {match.away_score ?? '-'}
              </Text>
            ) : (
              <Text style={[styles.matchTime, { color: secondaryTextColor }]}>
                {matchDate}
              </Text>
            )}
          </View>
          
          <View style={[styles.teamContainer, { alignItems: 'flex-end' }]}>
            {awayTeam?.logo_url ? (
              <Image 
                source={{ uri: awayTeam.logo_url }} 
                style={styles.teamLogoSmall}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.teamLogoSmall, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            )}
            <Text style={[styles.teamName, { color: textColor }]} numberOfLines={1}>
              {awayTeam?.name || 'Equipo visitante'}
            </Text>
          </View>
        </View>
        {match.venue && (
          <Text style={[styles.matchVenue, { color: secondaryTextColor }]} numberOfLines={1}>
            <Ionicons name="location" size={12} color={secondaryTextColor} /> {match.venue}
          </Text>
        )}
      </View>
    );
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
    const hasMatches = item.next_matches && item.next_matches.length > 0;
    const isDark = !!imageUrl; // Use dark text if there's no background image
    const textColor = isDark ? '#fff' : '#333';
    const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)';

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
              <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
              <View style={styles.cardDetails}>
                <Text style={[styles.cardText, { color: secondaryTextColor }]}>
                  <Ionicons name="calendar" size={14} color={secondaryTextColor} /> {startDate} - {endDate}
                </Text>
                <Text style={[styles.cardText, { color: secondaryTextColor }]}>
                  <Ionicons name="people" size={14} color={secondaryTextColor} /> {teamsCount} equipos
                </Text>
                <Text style={[styles.cardText, { color: secondaryTextColor }]}>
                  <Ionicons name="trophy" size={14} color={secondaryTextColor} /> {categoryName}
                </Text>
              </View>
              
              {hasMatches && (
                <View style={styles.matchesContainer}>
                  <Text style={[styles.upcomingMatchesTitle, { color: textColor }]}>Próximos partidos:</Text>
                  {item.next_matches?.map((match) => renderMatchItem(match, !!imageUrl))}
                </View>
              )}
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.cardImage, { backgroundColor: '#f5f5f5' }]}>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
              <View style={styles.cardDetails}>
                <Text style={[styles.cardText, { color: secondaryTextColor }]}>
                  <Ionicons name="calendar" size={14} color={secondaryTextColor} /> {startDate} - {endDate}
                </Text>
                <Text style={[styles.cardText, { color: secondaryTextColor }]}>
                  <Ionicons name="people" size={14} color={secondaryTextColor} /> {teamsCount} equipos
                </Text>
                <Text style={[styles.cardText, { color: secondaryTextColor }]}>
                  <Ionicons name="trophy" size={14} color={secondaryTextColor} /> {categoryName}
                </Text>
              </View>
              
              {hasMatches && (
                <View style={styles.matchesContainer}>
                  <Text style={[styles.upcomingMatchesTitle, { color: textColor }]}>Próximos partidos:</Text>
                  {item.next_matches?.map((match) => renderMatchItem(match, !!imageUrl))}
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
  // ... existing styles ...
  
  matchesContainer: {
    marginTop: 12,
    width: '100%',
  },
  upcomingMatchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  matchItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  matchTeamsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamLogoSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamName: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 80,
  },
  matchScoreContainer: {
    minWidth: 60,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  matchScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  matchTime: {
    fontSize: 12,
    textAlign: 'center',
  },
  matchVenue: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '1%',
      height: '1%',
      backgroundColor: '#000',
    },
    repeatingBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
    },
    container: {
      flex: 1,
      backgroundColor: '#000',
      position: 'relative',
      overflow: 'hidden',
    } as ViewStyle,
    contentContainer: {
      flex: 1,
      padding: 8,
      position: 'relative',
      zIndex: 1,
    },
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
      width: '100%',
      maxWidth: 400,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      alignSelf: 'center',
    },
    tabletCard: {
      width: '48%', // Ancho para tablet
      maxWidth: '100%',
      alignSelf: 'flex-start', // Alinear al inicio en tablet
    } as ViewStyle,
    cardImage: {
      width: '100%',
      height: 400,
      justifyContent: 'flex-end',
    },
    cardImageBackground: {
      opacity: 0.9,
    },
    cardContent: {
      padding: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 10,
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
      fontSize: 12,
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

      // Fetch next 3 matches for each tournament
      const tournamentsWithMatches = await Promise.all(
        data.map(async (tournament) => {
          // Get next 3 upcoming matches for this tournament
          const { data: matchesData, error: matchesError } = await supabase
            .from('matches')
            .select(`
              id,
              tournament_id,
              home_team_id,
              away_team_id,
              home_team:home_team_id (id, name, logo_url),
              away_team:away_team_id (id, name, logo_url),
              home_score,
              away_score,
              match_datetime,
              status,
              venue
            `)
            .eq('tournament_id', tournament.id)
            .gte('match_datetime', new Date().toISOString())
            .order('match_datetime', { ascending: true })
            .limit(3);

          if (matchesError) {
            console.error(`Error fetching matches for tournament ${tournament.id}:`, matchesError);
          }

          return {
            ...tournament,
            teams_count: tournament.tournament_registrations?.length || 0,
            next_matches: matchesData || []
          };
        })
      );

      console.log('Setting tournaments state with:', tournamentsWithMatches);
      setTournaments(tournamentsWithMatches);
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



  // Usar un único ImageBackground con resizeMode="repeat"
  const renderPattern = () => {
    return (
      <ImageBackground
        source={fondo2}
        style={styles.repeatingBackground}
        resizeMode="repeat"
        imageStyle={{
          width: '100%', // Tamaño de la imagen aumentado
          height: '100%', // Tamaño de la imagen aumentado
          opacity: 0.5, // Opacidad reducida para mejor legibilidad
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.repeatingBackground}>
        {renderPattern()}
      </View>
      <View style={styles.contentContainer}>
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
    </View>
  );
}