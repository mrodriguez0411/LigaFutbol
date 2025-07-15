import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Button } from 'react-native';

export const ImageUploader = () => {
  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const { uri } = result.assets[0];
        const fileExtension = uri.split('.').pop()?.toLowerCase();

        if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension ?? '')) {
          Alert.alert('Formato de imagen inválido. Por favor, usa JPG, PNG o WebP.');
          return;
        }

        // Subir la imagen a Supabase
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: `image.${fileExtension}`,
          type: `image/${fileExtension}`,
        });

        const response = await fetch('https://tu-supabase-url/storage/v1/object/upload/tu-bucket', {
          method: 'POST',
          headers: {
            Authorization: `Bearer tu-token-de-supabase`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error al subir la imagen:', errorData);
          throw new Error(errorData.message || 'Error al subir la imagen. Por favor, inténtalo de nuevo.');
        }

        Alert.alert('Imagen subida exitosamente.');
      }
    } catch (error) {
      console.error('Error en handleImageUpload:', error);
      if (error instanceof Error) {
        Alert.alert(error.message || 'Error inesperado. Por favor, inténtalo de nuevo.');
      } else {
        Alert.alert('Error inesperado. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return <Button title="Subir Imagen" onPress={handleImageUpload} />;
};
