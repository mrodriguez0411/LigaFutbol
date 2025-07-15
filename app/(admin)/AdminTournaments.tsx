import { supabase } from '@/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  image_url: string | null;
}

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTournamentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTournaments();
    } catch (error) {
      console.error('Error updating tournament status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6D00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestionar Torneos</Text>
        <Link href="/(admin)/TournamentForm" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>
      
      <ScrollView style={styles.content}>
        {tournaments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No hay torneos registrados</Text>
            <Link href="/(admin)/TournamentForm" asChild>
              <TouchableOpacity style={styles.addButtonLarge}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Crear Torneo</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : (
          tournaments.map((tournament) => (
            <View key={tournament.id} style={styles.tournamentCard}>
              <View style={styles.tournamentInfo}>
                {tournament.image_url ? (
                  <Image 
                    source={{ uri: tournament.image_url }} 
                    style={styles.tournamentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.tournamentImagePlaceholder}>
                    <Ionicons name="trophy-outline" size={24} color="#999" />
                  </View>
                )}
                <View style={styles.tournamentDetails}>
                  <Text style={styles.tournamentName}>{tournament.name}</Text>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar" size={14} color="#666" />
                    <Text style={styles.dateText}>
                      {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.statusButton, tournament.is_active ? styles.activeButton : styles.inactiveButton]}
                  onPress={() => toggleTournamentStatus(tournament.id, tournament.is_active)}
                >
                  <Ionicons 
                    name={tournament.is_active ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={tournament.is_active ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={styles.statusText}>
                    {tournament.is_active ? 'Activo' : 'Inactivo'}
                  </Text>
                </TouchableOpacity>
                
                <Link href={`/(admin)/TournamentForm?id=${tournament.id}`} asChild>
                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="create-outline" size={20} color="#FF6D00" />
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#121212',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24, // Compensar el ancho del botón de volver
  },
  addButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 15,
    textAlign: 'center',
  },
  addButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6D00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  tournamentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tournamentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tournamentImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  tournamentImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentDetails: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 5,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  activeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  inactiveButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
});
