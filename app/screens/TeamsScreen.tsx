import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Card } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';

interface Team {
  id: string;
  name: string;
  logoUrl: string;
  coach: string;
  stadium: string;
  colors: string;
}

interface TeamsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export const TeamsScreen: React.FC<TeamsScreenProps> = ({ navigation }) => {
  const teams: Team[] = [
    {
      id: '1',
      name: 'Equipo A',
      logoUrl: 'https://picsum.photos/200/200',
      coach: 'Juan Pérez',
      stadium: 'Campo 1',
      colors: 'Rojo y Blanco',
    },
    {
      id: '2',
      name: 'Equipo B',
      logoUrl: 'https://picsum.photos/200/200',
      coach: 'Carlos Rodríguez',
      stadium: 'Campo 2',
      colors: 'Azul y Negro',
    },
    {
      id: '3',
      name: 'Equipo C',
      logoUrl: 'https://picsum.photos/200/200',
      coach: 'María García',
      stadium: 'Campo 3',
      colors: 'Verde y Blanco',
    },
  ];

  const handleCreateTeam = () => {
    navigation.navigate('TeamForm', { teamId: undefined });
  };

  const handleEditTeam = (teamId: string) => {
    navigation.navigate('TeamForm', { teamId });
  };

  const handleDeleteTeam = (teamId: string) => {
    // Aquí iría la lógica para eliminar el equipo
    console.log('Deleting team:', teamId);
  };

  const renderTeam = ({ item }: { item: Team }) => (
    <View style={styles.card}>
      <Card.Content>
        <View style={styles.teamInfo}>
          <Image
            source={{ uri: item.logoUrl }}
            style={styles.logo}
          />
          <View style={styles.teamDetails}>
            <Text style={styles.teamName}>{item.name}</Text>
            <Text style={styles.coach}>DT: {item.coach}</Text>
            <Text style={styles.stadium}>Estadio: {item.stadium}</Text>
            <Text style={styles.colors}>Colores: {item.colors}</Text>
          </View>
        </View>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditTeam(item.id)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTeam(item.id)}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </Card.Actions>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Equipos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateTeam}>
          <Text style={styles.addButtonText}>Nuevo Equipo</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 10,
    elevation: 4,
  },
  teamInfo: {
    flexDirection: 'row',
    padding: 15,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  coach: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  stadium: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  colors: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    flexGrow: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TeamsScreen;
