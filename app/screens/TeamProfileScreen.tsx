import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Card } from 'react-native-paper';

const TeamProfileScreen = ({ route }: { route: any }) => {
  // Parseamos el objeto team que viene como string
  const team = route.params?.team ? JSON.parse(route.params.team) : {
    name: 'Equipo no encontrado',
    logoUrl: 'https://via.placeholder.com/150',
    coach: 'No disponible',
    stadium: 'No disponible',
    colors: 'No disponible'
  };

  const players = [
    {
      id: 1,
      name: 'Juan Pérez',
      position: 'Delantero',
      number: 9,
      imageUrl: 'https://picsum.photos/200/200',
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      position: 'Mediocampista',
      number: 10,
      imageUrl: 'https://picsum.photos/200/200',
    },
    {
      id: 3,
      name: 'María García',
      position: 'Defensa',
      number: 4,
      imageUrl: 'https://picsum.photos/200/200',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: team.logoUrl }}
        style={styles.headerImage}
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>{team.name}</Text>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Información del Equipo</Text>
            <Text style={styles.info}>Director Técnico: {team.coach}</Text>
            <Text style={styles.info}>Estadio: {team.stadium}</Text>
            <Text style={styles.info}>Colores: {team.colors}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Plantel</Text>
            {players.map((player: any) => (
              <View key={player.id} style={styles.player}>
                <Image
                  source={{ uri: player.imageUrl }}
                  style={styles.playerImage}
                />
                <Text style={styles.playerNumber}>{player.number}</Text>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerPosition}>{player.position}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 15,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  playerNumber: {
    width: 30,
    textAlign: 'right',
    marginRight: 10,
    fontWeight: 'bold',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerPosition: {
    fontSize: 14,
    color: '#666',
  },
});

export default TeamProfileScreen;
