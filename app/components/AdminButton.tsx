import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '@/types/navigation';

const AdminButton = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePress = () => {
    navigation.navigate('AdminPanel');
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handlePress}
      testID="admin-button"
    >
      <Ionicons name="settings" size={24} color="#FF6D00" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#121212',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default AdminButton;
