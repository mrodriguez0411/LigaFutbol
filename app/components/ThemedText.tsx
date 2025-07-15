import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ThemedTextProps {
  style?: any;
  children: React.ReactNode;
}

export const ThemedText = ({ style, children }: ThemedTextProps) => {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? Colors.light.text : Colors.dark.text;

  return (
    <Text style={[styles.text, { color: textColor }, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'System',
  },
});
