import { useColorScheme } from 'react-native';

interface ThemeColors {
  [key: string]: string;
  light: string;
  dark: string;
}

export function useThemeColor(colors: ThemeColors, colorName: string = 'text') {
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  
  return colors[colorName] || (isDark ? colors.dark : colors.light);
}
