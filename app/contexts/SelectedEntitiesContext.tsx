import React, { createContext, useContext, useState } from 'react';

interface SelectedEntitiesContextType {
  selectedTournamentId: string | null;
  selectedTeamId: string | null;
  setSelectedTournamentId: (id: string | null) => void;
  setSelectedTeamId: (id: string | null) => void;
}

const SelectedEntitiesContext = createContext<SelectedEntitiesContextType | undefined>(undefined);

export const SelectedEntitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  return (
    <SelectedEntitiesContext.Provider value={{
      selectedTournamentId,
      selectedTeamId,
      setSelectedTournamentId,
      setSelectedTeamId,
    }}>
      {children}
    </SelectedEntitiesContext.Provider>
  );
};

export const useSelectedEntities = () => {
  const context = useContext(SelectedEntitiesContext);
  if (!context) {
    throw new Error('useSelectedEntities must be used within a SelectedEntitiesProvider');
  }
  return context;
};
