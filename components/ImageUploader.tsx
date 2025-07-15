import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImageUploaderProps {
  onUpload: (imageUrl: string) => void;
  style?: object;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, style }) => {
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];

        // Validar formato de imagen
        const validFormats = ['jpg', 'jpeg', 'png', 'webp'];
        const fileExtension = uri.split('.').pop()?.toLowerCase();
        if (!validFormats.includes(fileExtension || '')) {
          Alert.alert('Error', 'Formato de imagen inválido. Por favor, usa JPG, PNG o WebP.');
          return;
        }

        setUploading(true);

        // Simular subida de imagen (reemplazar con lógica real)
        setTimeout(() => {
          setUploading(false);
          onUpload(uri); // Llamar al callback con la URL de la imagen
        }, 1000);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo cargar la imagen.');
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={handleImagePick} style={styles.button} disabled={uploading}>
        <Text style={styles.buttonText}>{uploading ? 'Subiendo...' : 'Subir Imagen'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#FF6D00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
