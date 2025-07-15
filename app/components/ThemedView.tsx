import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ThemedViewProps {
  style?: ViewStyle;
  children: React.ReactNode;
  backgroundColor?: keyof typeof Colors.light;
}

export const ThemedView = ({ style, children, backgroundColor }: ThemedViewProps) => {
  const colorScheme = useColorScheme();
  const colorMap = Colors[colorScheme as 'light' | 'dark'];
  const defaultBackgroundColor = colorMap.background;

  const bgColor = backgroundColor ? colorMap[backgroundColor] : defaultBackgroundColor;

  return (
    <View style={[styles.container, style, { backgroundColor: bgColor }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
