import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText, ThemedView } from '../components/ui/ThemedComponents';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { state, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await login(email, password);
      // La navegación se manejará en el efecto cuando el estado de autenticación cambie
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  // Efecto para manejar la navegación después del login exitoso
  useEffect(() => {
    if (state.user) {
      if (state.isAdmin) {
        router.replace('/(admin)/AdminPanelScreen');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [state.user, state.isAdmin]);

  return (
    <ThemedView style={{ 
      flex: 1, 
      backgroundColor: '#000000',
      padding: 20,
      justifyContent: 'center'
    }}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Ionicons name="football" size={60} color="#FF6B00" />
        <ThemedText style={{ 
          fontSize: 28,
          color: '#FF6B00',
          marginBottom: 10,
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Liga Futbol
        </ThemedText>
      </View>

      {error && (
        <ThemedText style={{ 
          color: '#FF6B00',
          marginBottom: 20,
          textAlign: 'center'
        }}>
          {error}
        </ThemedText>
      )}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        style={{
          borderWidth: 2,
          borderColor: '#FF6B00',
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
          color: '#FF6B00',
          backgroundColor: '#1a1a1a',
          fontSize: 16
        }}
        placeholderTextColor="#666"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        style={{
          borderWidth: 2,
          borderColor: '#FF6B00',
          padding: 15,
          borderRadius: 10,
          marginBottom: 30,
          color: '#FF6B00',
          backgroundColor: '#1a1a1a',
          fontSize: 16
        }}
        placeholderTextColor="#666"
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: '#FF6B00',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 20
        }}
      >
        <ThemedText style={{ 
          color: '#000000',
          fontWeight: 'bold',
          fontSize: 18
        }}>
          Iniciar Sesión
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace('/(auth)/register')}
        style={{ marginTop: 10 }}
      >
        <ThemedText style={{ 
          color: '#FF6B00',
          fontSize: 16
        }}>
          ¿No tienes cuenta? Regístrate
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}
