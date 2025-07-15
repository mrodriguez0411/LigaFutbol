import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminMatches() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestionar Partidos</Text>
      <Text>Aquí podrás gestionar los partidos de los torneos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
