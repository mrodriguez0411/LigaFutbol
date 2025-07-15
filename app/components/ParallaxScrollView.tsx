import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ParallaxScrollViewProps {
  children: React.ReactNode;
  headerHeight?: number;
  style?: any;
  headerBackgroundColor?: { light: string; dark: string };
  headerImage?: React.ReactNode;
}

export default function ParallaxScrollView({
  children,
  headerHeight = 200,
  style,
  headerBackgroundColor,
  headerImage,
}: ParallaxScrollViewProps) {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.header,
        {
          height: headerHeight,
          backgroundColor: headerBackgroundColor?.[colorScheme as 'light' | 'dark'] || Colors[colorScheme].background,
        },
      ]}>
        {headerImage}
      </View>
      <ScrollView
        style={styles.scrollView}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
});
