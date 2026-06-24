import React from 'react';

import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';

import { colors } from '../styles/theme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';



const TOURNAMENTS = [

{ id: 17, name: 'Premier League' },

{ id: 8, name: 'La Liga' },

{ id: 155, name: 'Liga Profesional Argentina' },

{ id: 1024, name: 'Copa Argentina' },

{ id: 384, name: 'Copa Libertadores' },

{ id: 480, name: 'Copa Sudamericana' },

{ id: 7, name: 'UEFA Champions League' },

{ id: 16, name: 'World Cup' },

];





export default function TournamentsScreen() {

const navigation = useNavigation();

const insets = useSafeAreaInsets();



return (

<View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

<Text style={styles.title}>Torneos</Text>

<FlatList

data={TOURNAMENTS}

keyExtractor={(item) => item.id.toString()}

renderItem={({ item }) => (

<View style={styles.card}>

<View style={styles.leftContent}>

<View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 }}>

<Image

source={{ uri: `https://api.sofascore.app/api/v1/unique-tournament/${item.id}/image` }}

style={{ width: 28, height: 28, resizeMode: 'contain' }}

/>

</View>

<Text style={styles.name} numberOfLines={2}>{item.name}</Text>

</View>

<TouchableOpacity

hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}

style={styles.button}

onPress={() => navigation.navigate('TournamentDetail', { leagueId: item.id, leagueName: item.name })}

>

<Text style={styles.buttonText}>Ver</Text>

</TouchableOpacity>

</View>

)}

/>

</View>

);

}



const styles = StyleSheet.create({

container: { flex: 1, padding: 10, backgroundColor: colors.background },

title: { fontSize: 24, fontWeight: 'bold', marginVertical: 15, textAlign: 'center', color: colors.textPrimary },

card: { backgroundColor: colors.card, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderRadius: 8 },

leftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },

name: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, flexShrink: 1 },

button: { backgroundColor: colors.accent, padding: 8, borderRadius: 5 },

buttonText: { color: colors.textPrimary }

});