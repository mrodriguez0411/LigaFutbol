import { Redirect } from 'expo-router';

export default function Index() {
  // Redirigir a la pantalla de Inicio
  return <Redirect href="/(tabs)/Home" />;
}
