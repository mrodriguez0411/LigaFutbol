import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Player } from '../types';
import { useSelectedEntities } from '../contexts/SelectedEntitiesContext';

interface PlayersScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const PlayersScreen: React.FC<PlayersScreenProps> = ({ navigation }) => {
  const dummyPlayers: Player[] = [
    { 
      id: '1', 
      name: 'Jugador 1', 
      teamId: 'team-1',
      dni: '12345678',
      dateOfBirth: '1990-01-01',
      position: 'Delantero',
      number: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: '2', 
      name: 'Jugador 2', 
      teamId: 'team-2',
      dni: '23456789',
      dateOfBirth: '1991-02-02',
      position: 'Mediocampista',
      number: 8,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: '3', 
      name: 'Jugador 3', 
      teamId: 'team-3',
      dni: '34567890',
      dateOfBirth: '1992-03-03',
      position: 'Defensor',
      number: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
  ];

  const { selectedTournamentId, selectedTeamId } = useSelectedEntities();

  const handleCreatePlayer = () => {
    console.log('=== handleCreatePlayer iniciado ===');
    console.log('selectedTournamentId:', selectedTournamentId);
    console.log('selectedTeamId:', selectedTeamId);
    
    if (!selectedTournamentId || !selectedTeamId) {
      console.warn('No se ha seleccionado torneo o equipo');
      alert('Por favor selecciona un torneo y un equipo primero');
      return;
    }
    
    const params = { 
      playerId: undefined,
      tournamentId: selectedTournamentId,
      teamId: selectedTeamId 
    };
    
    console.log('Navegando a PlayerForm con parámetros:', params);
    console.log('Tipo de navigation.navigate:', typeof navigation.navigate);
    
    try {
      navigation.navigate('PlayerForm', params);
      console.log('Navegación exitosa');
    } catch (error) {
      console.error('Error durante la navegación:', error);
    }
  };

  const handleEditPlayer = (playerId: string) => {
    console.log('=== handleEditPlayer iniciado ===');
    console.log('playerId:', playerId);
    console.log('selectedTournamentId:', selectedTournamentId);
    console.log('selectedTeamId:', selectedTeamId);
    
    if (!selectedTournamentId || !selectedTeamId) {
      console.warn('No se ha seleccionado torneo o equipo');
      alert('Por favor selecciona un torneo y un equipo primero');
      return;
    }
    
    const params = { 
      playerId,
      tournamentId: selectedTournamentId,
      teamId: selectedTeamId 
    };
    
    console.log('Editando jugador con parámetros:', params);
    console.log('Tipo de navigation.navigate:', typeof navigation.navigate);
    
    try {
      navigation.navigate('PlayerForm', params);
      console.log('Navegación exitosa');
    } catch (error) {
      console.error('Error durante la navegación:', error);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    // TODO: Implement confirmation dialog and deletion logic
    console.log('Deleting player:', playerId);
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={styles.playerItem}>
      <View style={styles.playerContent}>
        <Text style={styles.playerName}>{item.name}</Text>
        <Text style={styles.playerDni}>DNI: {item.dni}</Text>
        <Text style={styles.playerDateOfBirth}>Nacimiento: {item.dateOfBirth}</Text>
        <Text style={styles.playerInfo}>Equipo ID: {item.teamId}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => handleEditPlayer(item.id)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDeletePlayer(item.id)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jugadores</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreatePlayer}>
          <Text style={styles.addButtonText}>Nuevo Jugador</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={dummyPlayers}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        style={styles.list}
      />
    </View>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  list: {
    flex: 1
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3
  },
  playerContent: {
    flex: 1
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  playerDni: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  playerDateOfBirth: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  playerInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  teamName: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    padding: 8,
    borderRadius: 4
  },
  editButton: {
    backgroundColor: '#2196F3'
  },
  deleteButton: {
    backgroundColor: '#f44336'
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

// Remove any trailing code after the styles declaration
// This ensures we don't have any duplicate styles declarations or syntax errors

// Remove any trailing code after the styles declaration
// This ensures we don't have any duplicate styles declarations or syntax errors
