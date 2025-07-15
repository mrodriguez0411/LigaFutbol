import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SelectedEntitiesProvider } from './contexts/SelectedEntitiesContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <SelectedEntitiesProvider>
        <AppNavigator />
      </SelectedEntitiesProvider>
    </AuthProvider>
  );
}
