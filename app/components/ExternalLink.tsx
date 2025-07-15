import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  style?: any;
}

export function ExternalLink({ href, children, style }: ExternalLinkProps) {
  const colorScheme = useColorScheme();
  const textColor = Colors[colorScheme as 'light' | 'dark'].text;

  return (
    <TouchableOpacity
      style={[styles.linkContainer, style]}
      onPress={() => {
        // Aquí puedes implementar la lógica para abrir el enlace externo
        // Por ejemplo, usando Linking.openURL(href)
      }}
    >
      <ThemedText style={[styles.linkText, { color: textColor }]}>{children}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  linkContainer: {
    padding: 8,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});
