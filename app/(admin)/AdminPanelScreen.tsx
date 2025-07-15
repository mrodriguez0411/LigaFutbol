import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MenuItem = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
};

const AdminPanelScreen = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      title: 'Gestionar Torneos',
      icon: 'trophy',
      route: '/(admin)/AdminTournaments',
    },
    {
      title: 'Gestionar Equipos',
      icon: 'people',
      route: '/(admin)/AdminTeams',
    },
    {
      title: 'Gestionar Jugadores',
      icon: 'person',
      route: '/(admin)/AdminPlayers',
    },
    {
      title: 'Gestionar Partidos',
      icon: 'calendar',
      route: '/(admin)/AdminMatches',
    },
    {
      title: 'Categorias',
      icon: 'folder-open',
      route: '/(admin)/AdminCategories',
    },
    {
      title: 'Configuración',
      icon: 'settings',
      route: '/(admin)/AdminSettings',
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)/Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel de Administración</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <Link key={index} href={item.route as any} asChild>
              <TouchableOpacity style={styles.card}>
                <View style={styles.cardIcon}>
                  <Ionicons name={item.icon} size={32} color="#FF6D00" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={24} color="#fff" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default AdminPanelScreen;
