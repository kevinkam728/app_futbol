import React, { useState } from 'react';

import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';



const MOCK_PLAYERS = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Jugador ${i + 1}` }));



const FORMATIONS = {

'4-3-3': [['GK'], ['DF', 'DF', 'DF', 'DF'], ['MF', 'MF', 'MF'], ['FW', 'FW', 'FW']],

'4-4-2': [['GK'], ['DF', 'DF', 'DF', 'DF'], ['MF', 'MF', 'MF', 'MF'], ['FW', 'FW']],

};



export default function FormationScreen() {

const [formation, setFormation] = useState('4-3-3');

const [lineup, setLineup] = useState({}); // { 'line-pos': player }

const [activeSpot, setActiveSpot] = useState(null); // 'line-pos'

const navigation = useNavigation();

const insets = useSafeAreaInsets();



const availablePlayers = MOCK_PLAYERS.filter(p => !Object.values(lineup).find(l => l.id === p.id));



const handlePositionPress = (key) => {

if (lineup[key]) {

// Remove player

const newLineup = { ...lineup };

delete newLineup[key];

setLineup(newLineup);

} else {

// Select spot

setActiveSpot(key);

}

};



const handlePlayerPress = (player) => {

if (activeSpot) {

setLineup(prev => ({ ...prev, [activeSpot]: player }));

setActiveSpot(null);

}

};



const confirmLineup = () => {

const totalPlayers = Object.keys(lineup).length;

if (totalPlayers < 11) {

Alert.alert('Faltan jugadores', `Has seleccionado ${totalPlayers} de 11.`);

} else {

navigation.navigate('Comparison', { fanLineup: lineup });

}

};



return (

<View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

<View style={styles.mobileContainer}>

<View style={styles.formationSelector}>

{Object.keys(FORMATIONS).map((f) => (

<TouchableOpacity key={f} onPress={() => { setFormation(f); setLineup({}); setActiveSpot(null); }} style={[styles.fButton, formation === f && styles.fButtonActive]}>

<Text>{f}</Text>

</TouchableOpacity>

))}

</View>



<View style={styles.pitch}>

{FORMATIONS[formation].map((line, lineIndex) => (

<View key={lineIndex} style={styles.line}>

{line.map((_, posIndex) => {

const key = `${lineIndex}-${posIndex}`;

return (

<TouchableOpacity

key={key}

style={[styles.positionMarker, activeSpot === key && styles.markerActive]}

onPress={() => handlePositionPress(key)}

>

<Text style={styles.markerText}>{lineup[key] ? lineup[key].name : '+'}</Text>

</TouchableOpacity>

);

})}

</View>

))}

</View>



<Text style={styles.subTitle}>Jugadores Disponibles:</Text>

<FlatList

data={availablePlayers}

keyExtractor={(item) => item.id.toString()}

style={styles.playerList}

renderItem={({ item }) => (

<TouchableOpacity

style={[styles.playerItem, activeSpot === null && { opacity: 0.5 }]}

onPress={() => handlePlayerPress(item)}

disabled={activeSpot === null}

>

<Text>{item.name}</Text>

</TouchableOpacity>

)}

/>



<TouchableOpacity style={styles.confirmButton} onPress={confirmLineup}>

<Text style={styles.confirmText}>Confirmar Formación</Text>

</TouchableOpacity>

</View>

</View>

);

}



const styles = StyleSheet.create({

container: { flex: 1, backgroundColor: '#e0e0e0' },

mobileContainer: { flex: 1, maxWidth: 450, alignSelf: 'center', width: '100%', backgroundColor: '#fff', padding: 10 },

formationSelector: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },

fButton: { padding: 10, margin: 5, backgroundColor: '#ddd', borderRadius: 5 },

fButtonActive: { backgroundColor: '#007AFF' },

pitch: { height: 350, backgroundColor: '#2d8b2d', borderRadius: 10, justifyContent: 'space-around', paddingVertical: 10, marginBottom: 10 },

line: { flexDirection: 'row', justifyContent: 'space-around' },

positionMarker: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 5 },

markerActive: { borderWidth: 3, borderColor: '#FFD700' },

markerText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },

subTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },

playerList: { flex: 1 },

playerItem: { padding: 12, backgroundColor: '#f9f9f9', marginVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#eee' },

confirmButton: { padding: 15, backgroundColor: '#007AFF', borderRadius: 10, alignItems: 'center', marginTop: 10 },

confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }

});