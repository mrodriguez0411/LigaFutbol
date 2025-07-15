import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

const ContactScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contacto</Text>
      <Text style={styles.text}>¿Tienes dudas, sugerencias o quieres contactarnos?</Text>
      <TouchableOpacity onPress={() => Linking.openURL('mailto:info@ligaaltosdelparacao.ar')}>
        <Text style={styles.link}>info@ligaaltosdelparacao.ar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60, // deja espacio para el navbar

    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1976d2',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  link: {
    color: '#1976d2',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default ContactScreen;
