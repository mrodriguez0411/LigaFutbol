import AdminButton from '@/components/AdminButton';
import AuthContext from '@/contexts/AuthContext';
import React, { useContext } from 'react';
import { Dimensions, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#f0f0f0',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
    marginLeft: 5,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tournamentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    margin: 8,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tournamentCategory: {
    color: '#4a4a4a',
    marginBottom: 5,
    fontWeight: '500',
  },
  standingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    margin: 8,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  standingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  standingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  standingsTeam: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    color: '#333',
  },
  standingsPoints: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a73e8',
    minWidth: 30,
    textAlign: 'right',
  },
  authContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#1a73e8',
    padding: 15,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    padding: 15,
    borderRadius: 10,
    width: '85%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Imagen de fondo local
const BACKGROUND_IMAGE = require('../assets/images/img1.jpg');

const HomeScreen = () => {
  const state = useContext(AuthContext);
  const isAdmin = state?.isAdmin || false;
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Bienvenido a Liga Futbol</Text>
              <Text style={styles.headerSubtitle}>Sigue los torneos y resultados en tiempo real</Text>
            </View>
            
            <View style={styles.content}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Próximos Partidos
              </Text>
              <View style={[styles.tournamentCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.tournamentName, { color: theme.colors.onSurface }]}>
                  Torneo Apertura 2023
                </Text>
                <Text style={[styles.tournamentCategory, { color: theme.colors.onSurfaceVariant }]}>
                  Categoría Primera
                </Text>
                {/* Aquí iría la lista de partidos */}
              </View>
              
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Tabla de Posiciones
              </Text>
              <View style={[styles.standingsCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={{ color: theme.colors.onSurface }}>
                  Tabla de posiciones en construcción...
                </Text>
              </View>
              
              <View style={styles.authContainer}>
                {isAdmin && <AdminButton />}
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
};

export default HomeScreen;
