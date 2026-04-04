import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function MenuScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>
      <Text style={styles.subtitle}>Tropical Gyros menu coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cream,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.green,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 8,
  },
});