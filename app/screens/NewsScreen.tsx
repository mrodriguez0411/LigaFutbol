import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { Card } from 'react-native-paper';

const NewsScreen = () => {
  const news = [
    {
      id: 1,
      title: 'Inicia la Temporada 2025',
      date: '2025-05-30',
      content: 'Comienza una nueva temporada de la Liga Amateur con 12 equipos participantes...',
      imageUrl: 'https://picsum.photos/800/400',
    },
    {
      id: 2,
      title: 'Nuevos Refuerzos',
      date: '2025-05-28',
      content: 'Los equipos han anunciado nuevos fichajes para la temporada...',
      imageUrl: 'https://picsum.photos/800/400',
    },
  ];

  const renderNews = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
        />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.content}>{item.content}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Noticias</Text>
      <FlatList
        data={news}
        renderItem={renderNews}
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
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  content: {
    fontSize: 14,
    color: '#333',
  },
  list: {
    flexGrow: 1,
  },
});

export default NewsScreen;
