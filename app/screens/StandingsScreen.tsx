import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from 'react-native-paper';

const StandingsScreen = () => {
  const teams = [
    {
      id: 1,
      name: 'Equipo A',
      played: 5,
      won: 4,
      drawn: 0,
      lost: 1,
      goalsFor: 15,
      goalsAgainst: 5,
      points: 12,
    },
  ];

  const renderTeam = ({ item, index }: { item: any; index: number }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.teamRow}>
          <Text style={styles.position}>{index + 1}</Text>
          <Text style={styles.teamName}>{item.name}</Text>
          <View style={styles.stats}>
            <Text style={styles.stat}>PJ: {item.played}</Text>
            <Text style={styles.stat}>PG: {item.won}</Text>
            <Text style={styles.stat}>PE: {item.drawn}</Text>
            <Text style={styles.stat}>PP: {item.lost}</Text>
            <Text style={styles.stat}>GF: {item.goalsFor}</Text>
            <Text style={styles.stat}>GC: {item.goalsAgainst}</Text>
            <Text style={styles.stat}>Pts: {item.points}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tabla de Posiciones</Text>
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
  teamRow: {
    flexDirection: 'row',
    padding: 15,
  },
  position: {
    width: 30,
    textAlign: 'right',
    marginRight: 20,
    fontWeight: 'bold',
  },
  teamName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 1,
  },
  stat: {
    marginLeft: 10,
    fontSize: 14,
  },
  list: {
    flexGrow: 1,
  },
});

export default StandingsScreen;
