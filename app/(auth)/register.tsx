import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { ThemedText, ThemedView } from '../components/ui/ThemedComponents';
import { TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await register(email, password);
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <ThemedText style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>
        Registrarse
      </ThemedText>

      {error && (
        <ThemedText style={{ color: 'red', marginBottom: 10 }}>
          {error}
        </ThemedText>
      )}

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 8,
          marginBottom: 15,
        }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 8,
          marginBottom: 15,
        }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>
          Registrarse
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace('/(auth)/login')}
        style={{ marginTop: 15 }}
      >
        <ThemedText style={{ color: '#007AFF' }}>
          ¿Ya tienes cuenta? Inicia sesión
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}
