import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavbarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Navbar = () => {
  const navigation = useNavigation<NavbarNavigationProp>();

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={() => navigation.navigate('Tournaments')} style={styles.navButton}>
        <Text style={styles.navText}>Torneos</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={styles.navButton}>
        <Text style={styles.navText}>Calendario</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Standings')} style={styles.navButton}>
        <Text style={styles.navText}>Tabla</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('News')} style={styles.navButton}>
        <Text style={styles.navText}>Noticias</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Teams')} style={styles.navButton}>
        <Text style={styles.navText}>Equipos</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Contact')} style={styles.navButton}>
        <Text style={styles.navText}>Contacto</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.navButton}>
        <Text style={styles.navText}>Ingresar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#1976d2',
    paddingTop: 10,
    paddingBottom: 10,
    elevation: 4,
    zIndex: 10,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Navbar;
