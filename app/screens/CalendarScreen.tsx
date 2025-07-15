import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from 'react-native-paper';

const CalendarScreen = () => {
  const matches = [
    {
      id: 1,
      date: '2025-05-30',
      time: '15:00',
      homeTeam: 'Equipo A',
      awayTeam: 'Equipo B',
      venue: 'Campo 1',
      homeScore: 0,
      awayScore: 0,
    },
  ];

  const renderMatch = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.matchInfo}>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
          <Text style={styles.time}>{item.time}</Text>
          <View style={styles.teams}>
            <Text style={styles.team}>{item.homeTeam} {item.homeScore}</Text>
            <Text style={styles.team}>{item.awayTeam} {item.awayScore}</Text>
          </View>
          <Text style={styles.venue}>{item.venue}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendario de Partidos</Text>
      <FlatList
        data={matches}
        renderItem={renderMatch}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 10,
    elevation: 4,
  },
  matchInfo: {
    padding: 15,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  time: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  teams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  team: {
    fontSize: 16,
  },
  venue: {
    fontSize: 12,
    color: '#666',
  },
  list: {
    flexGrow: 1,
  },
});

export default CalendarScreen;
