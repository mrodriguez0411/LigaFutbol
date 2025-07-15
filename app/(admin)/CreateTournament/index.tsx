import { Stack } from 'expo-router';
import TournamentWizard from './TournamentWizard';

export default function CreateTournament() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nuevo Torneo',
          headerBackTitle: 'Atrás',
        }}
      />
      <TournamentWizard />
    </>
  );
}
