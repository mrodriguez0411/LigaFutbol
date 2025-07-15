import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';

interface Team {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
}

export default function TeamSelector({ selectedTeamId, onSelectTeam }: TeamSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === 'web';

  // Cargar equipos
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, name')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        setTeams(data || []);
      } catch (error) {
        console.error('Error cargando equipos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTeams();
  }, []);

  const selectedTeamName = selectedTeamId 
    ? teams.find(t => t.id === selectedTeamId)?.name 
    : 'Seleccionar equipo';

  if (loading) {
    return <Text>Cargando equipos...</Text>;
  }

  if (isWeb) {
    return (
      <select
        value={selectedTeamId || ''}
        onChange={(e) => onSelectTeam(e.target.value)}
        style={styles.webSelect}
      >
        <option value="">Seleccionar equipo</option>
        {teams.map(team => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <View>
      <TouchableOpacity 
        style={styles.select}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.selectText}>{selectedTeamName}</Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Equipo</Text>
            <View style={styles.scrollContainer}>
              <TouchableOpacity 
                style={styles.teamItem}
                onPress={() => {
                  onSelectTeam('');
                  setShowPicker(false);
                }}
              >
                <Text style={styles.teamText}>Sin equipo</Text>
              </TouchableOpacity>
              {teams.map(team => (
                <TouchableOpacity 
                  key={team.id} 
                  style={styles.teamItem}
                  onPress={() => {
                    onSelectTeam(team.id);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.teamText}>{team.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  webSelect: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  scrollContainer: {
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  teamItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  teamText: {
    fontSize: 16,
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
