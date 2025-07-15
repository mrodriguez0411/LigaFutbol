import { View, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const AuthNavigation = () => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Iniciar Sesión</Text>
      </View>
    );
  }

  if (isAdmin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Panel de Administrador</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Inicio</Text>
    </View>
  );
};
