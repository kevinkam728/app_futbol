import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTeam } from '../services/TeamContext';

export default function OnboardingScreen() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const navigation = useNavigation();
  const { setSelectedTeam: setGlobalTeam } = useTeam();

  const teams = [
    { id: 'river', name: 'River Plate' },
    { id: 'boca', name: 'Boca Juniors' },
    { id: 'racing', name: 'Racing Club' },
  ];

  const handleContinue = () => {
    setGlobalTeam(teams.find(t => t.id === selectedTeam).name);
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Selecciona tu club</Text>
      
      <View style={styles.teamContainer}>
        {teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={[
              styles.teamButton,
              selectedTeam === team.id && styles.selectedButton
            ]}
            onPress={() => setSelectedTeam(team.id)}
          >
            <Text style={styles.teamText}>{team.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedTeam && styles.disabledButton
        ]}
        disabled={!selectedTeam}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Continuar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  teamContainer: { width: '100%', marginBottom: 40 },
  teamButton: { padding: 15, borderRadius: 10, backgroundColor: '#f0f0f0', marginBottom: 10, alignItems: 'center' },
  selectedButton: { backgroundColor: '#007AFF' },
  teamText: { fontSize: 18 },
  continueButton: { padding: 15, borderRadius: 10, backgroundColor: '#007AFF', width: '100%', alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  continueButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
