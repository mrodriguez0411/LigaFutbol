import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Animated, ImageBackground, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../app/config/supabase';

// Imagen de fondo local
const BACKGROUND_IMAGE = require('../assets/images/img5.jpg');

// Obtener las dimensiones de la pantalla
//const { width } = Dimensions.get('window');
// Eliminado isMobile, usaremos porcentajes en los estilos

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('Error al iniciar sesión:', error.message);
        alert('Correo o contraseña incorrectos.');
        return;
      }

      const userId = data?.user?.id;
      if (!userId) {
        console.error('No se pudo obtener el ID del usuario.');
        alert('Error inesperado. Intenta nuevamente.');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Error al obtener el rol del usuario:', userError?.message);
        alert('Error al obtener información del usuario. Por favor, verifica tu conexión e intenta nuevamente.');
        return;
      }

      if (userData.is_admin) {
        // Usar la ruta completa del panel de administración
 router.push('/(admin)/AdminPanelScreen');
      } else {
 router.push('/(tabs)');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Ocurrió un error inesperado. Intenta nuevamente.');
    }
  };

  const handleRegister = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        console.error('Error al registrarse:', error.message);
        return;
      }

      const { error: profileError } = await supabase
        .from('users')
        .insert([{ id: data?.user?.id ?? '', role: 'user' }]);

      if (profileError) {
        console.error('Error al crear el perfil del usuario:', profileError.message);
        return;
      }

      router.push('/(tabs)');
    } catch (error) {
      console.error('Error inesperado:', error);
    }
  };

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.backgroundImage}>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={mode === 'login' ? handleLogin : handleRegister}>
          <Text style={styles.buttonText}>{mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={{ color: '#F52E0F' }}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
        <TouchableOpacity style={styles.toggleMode} onPress={() => setMode(prev => (prev === 'login' ? 'register' : 'login'))}>
          <Text style={styles.toggleModeText}>
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </Text>
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: '#ccc' }]} />
          <Text style={[styles.dividerText, { color: '#888' }]}>
            O inicia con
          </Text>
          <View style={[styles.line, { backgroundColor: '#ccc' }]} />
        </View>
        
        <View style={styles.socialButtons}>
          <TouchableOpacity style={[styles.socialButton, { borderColor: '#ccc' }]}>
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { borderColor: '#ccc' }]}>
            <Ionicons name="logo-facebook" size={24} color="#4267B2" />
          </TouchableOpacity>
        </View>
      </View>
        
    </ImageBackground>
  );
};

// AnimatedButton component con animación de escala al hacer hover (web) o press (mobile)
const AnimatedButton = ({ onPress, children, style }: any) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  const handlePressIn = () => animateTo(0.96);
  const handlePressOut = () => animateTo(1);
  const handleHoverIn = () => animateTo(0.96);
  const handleHoverOut = () => animateTo(1);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={({ pressed, hovered }) => [
        style,
        {
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    width: '90%',
    maxWidth: 400,
  },
  button: {
    backgroundColor: '#050305',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '90%',
    maxWidth: 400,
    // Web hover effect only (no press effect)
    transitionProperty: 'transform',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-in-out',
  },
  buttonText: {
    color: '#F52E0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    marginTop: 10,
    alignItems: 'flex-end',
    width: '90%',
    maxWidth: 400,
  },
  toggleMode: {
    marginTop: 15,
    alignItems: 'center',
  },
  toggleModeText: {
    color: '#050305',
    fontWeight: 'bold',
    fontSize: 20,
  },
  // Add a style for hover state
  buttonHover: {
    transform: [{ scale: 0.96 }],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '90%',
    maxWidth: 400,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
    marginHorizontal: 8,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 16,
  },
  socialButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 8,
    backgroundColor: '#050305',
  },
  dividerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
});

export { AnimatedButton, styles };

function alert(message: string) {
  Alert.alert('Aviso', message);
}
