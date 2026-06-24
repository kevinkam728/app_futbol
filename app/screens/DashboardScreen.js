import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Image } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import MatchCard from '../components/MatchCard';

import MenuComponent from '../components/MenuComponent';

import { useTeam } from '../../services/TeamContext';

import { fetchMatchesByDate } from '../../services/footballApi';

import { colors } from '../styles/theme';



export default function DashboardScreen() {

const [matches, setMatches] = useState([]);

const [isLoading, setIsLoading] = useState(true);

const [error, setError] = useState(null);

const [expandedLeagues, setExpandedLeagues] = useState({});

const [menuVisible, setMenuVisible] = useState(false);

const navigation = useNavigation();

const { selectedTeam } = useTeam();

const insets = useSafeAreaInsets();



useEffect(() => {

loadMatches();

}, []);



const loadMatches = async () => {

try {

setIsLoading(true);

const today = new Date().toLocaleDateString('sv-SE');

const data = await fetchMatchesByDate(today);



const ligasTop = [155, 1024, 17, 8, 384, 480, 7, 16];

const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000;

const endOfToday = new Date(new Date().setHours(23, 59, 59, 999)).getTime() / 1000;



const filtrados = (data || []).filter(match => {

const idTorneo = Number(match.uniqueTournament?.id || match.tournament?.uniqueTournament?.id);

const esLigaTop = ligasTop.includes(idTorneo);

const esHoy = match.timestamp >= startOfToday && match.timestamp <= endOfToday;

return esLigaTop && esHoy;

}).sort((a, b) => (a.timestamp || a.startTimestamp || 0) - (b.timestamp || b.startTimestamp || 0));



setMatches(filtrados);

const initialExpanded = {};

filtrados.forEach(m => initialExpanded[m.tournament?.name?.split(',')[0].trim() || 'Otros'] = true);

setExpandedLeagues(initialExpanded);



} catch (e) {

console.error("[DEBUG DASHBOARD ERROR]:", e.message);

setError('Error al cargar los partidos');

} finally {

setIsLoading(false);

}

};



const groupedMatches = matches.reduce((acc, match) => {

const tournamentName = match.tournament?.name?.split(',')[0].trim() || 'Otros';

if (!acc[tournamentName]) acc[tournamentName] = [];

acc[tournamentName].push(match);

return acc;

}, {});



const toggleLeague = (leagueName) => {

setExpandedLeagues(prev => ({ ...prev, [leagueName]: !prev[leagueName] }));

};



if (isLoading) return <LinearGradient colors={[colors.background, '#1E293B']} style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.accent} /></LinearGradient>;

if (error) return <LinearGradient colors={[colors.background, '#1E293B']} style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, justifyContent: 'center', alignItems: 'center' }]}><Text style={styles.errorText}>{error}</Text></LinearGradient>;



return (

<LinearGradient colors={[colors.background, '#1E293B']} style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

<View style={styles.header}>

<TouchableOpacity hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} onPress={() => setMenuVisible(true)}><Text style={styles.menuIcon}>☰</Text></TouchableOpacity>

<Text style={styles.teamTitle}>{selectedTeam ? `Mi Equipo: ${selectedTeam}` : 'Selecciona un equipo'}</Text>

</View>

<MenuComponent visible={menuVisible} onClose={() => setMenuVisible(false)} onNavigate={(screen) => navigation.navigate(screen)} />

<ScrollView style={styles.mobileContainer} contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}>

<Text style={styles.title}>Partidos</Text>

{matches.length === 0 ? <Text style={styles.noMatchesText}>No hay partidos destacados para el día de hoy.</Text> :

Object.keys(groupedMatches).map(leagueName => {

const firstMatch = groupedMatches[leagueName][0];

const tourneyId = firstMatch.uniqueTournament?.id || firstMatch.tournament?.uniqueTournament?.id;



return (

<View key={leagueName} style={styles.leagueContainer}>

<TouchableOpacity style={styles.leagueHeader} onPress={() => toggleLeague(leagueName)}>

<View style={{ flexDirection: 'row', alignItems: 'center' }}>

{tourneyId && (

<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>

<Image

source={{ uri: `https://api.sofascore.app/api/v1/unique-tournament/${tourneyId}/image` }}

style={{ width: 24, height: 24, resizeMode: 'contain' }}

/>

</View>

)}

<Text style={styles.leagueTitle}>{leagueName}</Text>

</View>

<Text style={{color: colors.textPrimary}}>{expandedLeagues[leagueName] ? '▲' : '▼'}</Text>

</TouchableOpacity>

{expandedLeagues[leagueName] && (

<View style={styles.matchesContainer}>

{groupedMatches[leagueName].map(match => (

<MatchCard

key={match.id}

match={match}

onVerEquipos={(e) => { e.stopPropagation(); navigation.navigate('MatchInfo', { matchData: match }); }}

/>

))}

</View>

)}

</View>

);

})

}

</ScrollView>

</LinearGradient>

);

}



const styles = StyleSheet.create({

container: { flex: 1 },

header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: '#334155' },

menuIcon: { fontSize: 24, marginRight: 15, color: colors.textPrimary },

teamTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },

mobileContainer: { flex: 1, maxWidth: 450, alignSelf: 'center', width: '100%', padding: 10 },

title: { fontSize: 24, fontWeight: 'bold', marginVertical: 15, textAlign: 'center', color: colors.textPrimary },

leagueContainer: { backgroundColor: colors.card, borderRadius: 12, marginBottom: 15, overflow: 'hidden' },

leagueHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#334155' },

leagueTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },

matchesContainer: { padding: 10 },

noMatchesText: { color: colors.textPrimary, textAlign: 'center', marginTop: 20 },

errorText: { color: colors.textPrimary, textAlign: 'center', marginTop: 20, fontSize: 16 },

});