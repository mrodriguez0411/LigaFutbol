import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  const colorScheme = useColorScheme();
  const defaultColor = color || Colors[colorScheme as 'light' | 'dark'].text;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.symbol, { fontSize: size, color: defaultColor }]}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontWeight: 'bold',
  },
});
