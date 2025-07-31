import React from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';

interface LoadingProps {
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({ text = 'Cargando...' }) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    animation.start();
    
    return () => {
      animation.stop();
    };
  }, [spinValue]);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ballContainer, { transform: [{ rotate: spin }] }]}>
        <Text style={styles.ball}>⚽</Text>
      </Animated.View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  ballContainer: {
    marginBottom: 20,
  },
  ball: {
    fontSize: 80,
    textAlign: 'center',
    color: '#000',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
});

export default Loading;
