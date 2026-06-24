import React from 'react';

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation, useRoute } from '@react-navigation/native';



// Mock oficial del DT

const MOCK_OFFICIAL_LINEUP = Array.from({ length: 11 }, (_, i) => ({ id: i + 100, name: `DT-J${i + 1}` }));



export default function ComparisonScreen() {

const navigation = useNavigation();

const route = useRoute();

const { fanLineup } = route.params || { fanLineup: {} };

const insets = useSafeAreaInsets();



// Pequeña cancha para renderizar

const renderPitch = (lineup, title) => (

<View style={styles.miniPitch}>

<Text style={styles.pitchTitle}>{title}</Text>

<View style={styles.pitchGrid}>

{Array.from({ length: 11 }).map((_, i) => (

<View key={i} style={styles.miniPosition}>

<Text style={styles.miniText}>{lineup[i]?.name.substring(0, 3) || '-'}</Text>

</View>

))}

</View>

</View>

);



return (

<View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

<ScrollView style={styles.mobileContainer}>

<Text style={styles.title}>Comparativa</Text>

{renderPitch(Object.values(fanLineup), "El Once del Hincha")}

<Text style={styles.matchStats}>Coincidencia: 75%</Text>

{renderPitch(MOCK_OFFICIAL_LINEUP, "El Once del DT")}



<TouchableOpacity

hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}

style={styles.backButton}

onPress={() => navigation.navigate('Dashboard')}

>

<Text style={styles.backButtonText}>Volver al Inicio</Text>

</TouchableOpacity>

</ScrollView>

</View>

);

}



const styles = StyleSheet.create({

container: { flex: 1, backgroundColor: '#e0e0e0' },

mobileContainer: { flex: 1, maxWidth: 450, alignSelf: 'center', width: '100%', backgroundColor: '#fff', padding: 10 },

title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },

miniPitch: { backgroundColor: '#2d8b2d', borderRadius: 10, padding: 10, marginVertical: 10, height: 200 },

pitchTitle: { color: '#fff', textAlign: 'center', fontWeight: 'bold', marginBottom: 5 },

pitchGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },

miniPosition: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', margin: 5, justifyContent: 'center', alignItems: 'center' },

miniText: { fontSize: 8, fontWeight: 'bold' },

matchStats: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginVertical: 5 },

backButton: { padding: 15, backgroundColor: '#333', borderRadius: 10, alignItems: 'center', marginTop: 20 },

backButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }

});