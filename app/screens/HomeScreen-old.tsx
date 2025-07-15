import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const HomeScreen = () => {
    // Declaración de la variable isAdmin
    //const isAdmin = true; // Cambia esto según tu lógica (puede venir de props, contexto, etc.)

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bienvenido a la Liga de Fútbol</Text>
           {/* {isAdmin && <Text style={styles.adminText}>Eres un administrador</Text>} */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    adminText: {
        marginTop: 10,
        fontSize: 18,
        color: 'green',
    },
});

export default HomeScreen;