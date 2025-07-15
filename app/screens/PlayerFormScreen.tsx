import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PlayerFormScreenRouteProp = RouteProp<RootStackParamList, 'PlayerForm'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});


function PlayerFormScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<{
    tournamentId: string | undefined;
    teamId: string | undefined;
    playerId: string | undefined;
  }>({
    tournamentId: undefined,
    teamId: undefined,
    playerId: undefined
  });
  
  const route = useRoute<PlayerFormScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  useEffect(() => {
    console.log('PlayerFormScreen - Iniciando efecto con route.params:', route.params);
    
    const loadParams = async () => {
      try {
        // Verificar si los parámetros están disponibles
        console.log('PlayerFormScreen - Parámetros de ruta:', route.params);
        
        const routeParams = route.params || {};
        const tournamentId = routeParams.tournamentId || '';
        const teamId = routeParams.teamId || '';
        const playerId = routeParams.playerId;
        
        // Actualizar el estado con los parámetros
        setParams({
          tournamentId,
          teamId,
          playerId
        });
        
        // Configurar el título dinámico
        navigation.setOptions({
          title: playerId ? 'Editar Jugador' : 'Nuevo Jugador'
        });
        
        console.log('PlayerFormScreen - Parámetros establecidos:', { tournamentId, teamId, playerId });
      } catch (err) {
        console.error('Error al obtener parámetros:', err);
        setError('Error al cargar los datos del formulario');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadParams();
    
    return () => {
      console.log('PlayerFormScreen - Desmontando componente');
    };
  }, [route.params, navigation]);
  
  // Mostrar indicador de carga
  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }
  
  // Mostrar mensaje de error si existe
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error</Text>
        <Text style={styles.text}>{error}</Text>
        <Text style={styles.text}>Tournament ID: {params.tournamentId || 'No definido'}</Text>
        <Text style={styles.text}>Team ID: {params.teamId || 'No definido'}</Text>
      </View>
    );
  }
  
  // Verificar parámetros requeridos
  if (!params.tournamentId || !params.teamId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error</Text>
        <Text style={styles.text}>Faltan parámetros requeridos</Text>
        <Text style={styles.text}>Tournament ID: {params.tournamentId || 'No definido'}</Text>
        <Text style={styles.text}>Team ID: {params.teamId || 'No definido'}</Text>
      </View>
    );
  }
  
  // Extraer parámetros
  const { tournamentId, teamId, playerId } = params;
  
  // Renderizar el formulario
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {playerId ? 'Editar Jugador' : 'Nuevo Jugador'}
      </Text>
      <Text style={styles.text}>ID del Torneo: {tournamentId}</Text>
      <Text style={styles.text}>ID del Equipo: {teamId}</Text>
      {playerId && (
        <Text style={styles.text}>ID del Jugador: {playerId}</Text>
      )}
    </View>
  );
}

export default PlayerFormScreen;
