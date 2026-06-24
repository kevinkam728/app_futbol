import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation, useRoute } from '@react-navigation/native';

import {

fetchMatchDetails,

fetchMatchStatistics,

fetchMatchIncidents,

fetchMatchLineups

} from '../../services/footballApi';



export default function MatchInfoScreen() {

const navigation = useNavigation();

const route = useRoute();

const { matchId } = route.params || {};

const insets = useSafeAreaInsets();



const [loading, setLoading] = useState(true);

const [activeTab, setActiveTab] = useState('summary');

const [data, setData] = useState({ details: null, statistics: [], incidents: [], lineups: null });



useEffect(() => {

const loadMatchData = async () => {

if (!matchId) return;

setLoading(true);

try {

const [detailsRes, statsRes, incidentsRes, lineupsRes] = await Promise.all([

fetchMatchDetails(matchId),

fetchMatchStatistics(matchId),

fetchMatchIncidents(matchId),

fetchMatchLineups(matchId)

]);



setData({

details: detailsRes?.event || detailsRes?.data?.event || detailsRes,

statistics: statsRes?.statistics || statsRes?.data?.statistics || (Array.isArray(statsRes) ? statsRes : []),

incidents: incidentsRes?.incidents || incidentsRes?.data?.incidents || (Array.isArray(incidentsRes) ? incidentsRes : []),

lineups: lineupsRes?.lineups || lineupsRes?.data?.lineups || lineupsRes

});

} catch (error) {

console.error('[ERROR LOADING MATCH DETAILS]:', error);

} finally {

setLoading(false);

}

};

loadMatchData();

}, [matchId]);



if (loading) {

return (

<View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

<ActivityIndicator size="large" />

</View>

);

}



const { details, incidents, lineups } = data;



return (

<View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

{/* HEADER */}

<View style={styles.header}>

<View style={styles.headerRow}>

<View style={styles.teamSide}>

<Image source={{ uri: details?.homeTeam?.imagePath }} style={styles.crest} />

<Text style={styles.teamName}>{details?.homeTeam?.name}</Text>

</View>

<View style={styles.scoreCenter}>

<Text style={styles.scoreText}>{details?.homeScore?.current} - {details?.awayScore?.current}</Text>

</View>

<View style={styles.teamSide}>

<Image source={{ uri: details?.awayTeam?.imagePath }} style={styles.crest} />

<Text style={styles.teamName}>{details?.awayTeam?.name}</Text>

</View>

</View>

</View>



{/* TABS */}

<View style={styles.tabsContainer}>

{['summary', 'lineups'].map(tab => (

<TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>

<Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>{tab.toUpperCase()}</Text>

</TouchableOpacity>

))}

</View>



{/* CONTENT */}

<ScrollView>

{activeTab === 'summary' && incidents?.map((inc, i) => (

<View key={i} style={[styles.incidentRow, { justifyContent: inc.isHome ? 'flex-start' : 'flex-end' }]}>

<Text>{inc.type === 'goal' ? '⚽' : inc.incidentClass === 'yellowCard' ? '🟨' : inc.incidentClass === 'redCard' ? '🟥' : '🔄'}</Text>

<Text style={styles.incidentText}>{inc.player?.name}</Text>

</View>

))}



{activeTab === 'lineups' && lineups && (

<View>

<Text style={styles.subtitle}>Titulares</Text>

{lineups.home?.players?.filter(p => !p.substitute).map(p => <Text key={p.id}>{p.jerseyNumber}. {p.player.name}</Text>)}

<Text style={styles.subtitle}>Suplentes</Text>

{lineups.home?.players?.filter(p => p.substitute).map(p => <Text key={p.id}>{p.jerseyNumber}. {p.player.name}</Text>)}

</View>

)}

</ScrollView>



<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>

<Text style={styles.backButtonText}>Volver</Text>

</TouchableOpacity>

</View>

);

}



const styles = StyleSheet.create({

container: { flex: 1, backgroundColor: '#fff' },

centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

header: { padding: 20 },

headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

teamSide: { alignItems: 'center', flex: 1 },

crest: { width: 50, height: 50 },

teamName: { fontWeight: 'bold', marginTop: 5 },

scoreCenter: { flex: 1, alignItems: 'center' },

scoreText: { fontSize: 24, fontWeight: 'bold' },

tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 10, borderBottomWidth: 1 },

tabButton: { padding: 10 },

tabText: { color: '#888' },

activeTabText: { fontWeight: 'bold', color: '#000' },

incidentRow: { flexDirection: 'row', alignItems: 'center', padding: 5 },

incidentText: { marginLeft: 5 },

subtitle: { fontWeight: 'bold', fontSize: 16, marginTop: 10 },

backButton: { padding: 15, backgroundColor: '#333', borderRadius: 10, alignItems: 'center', margin: 20 },

backButtonText: { color: '#fff', fontWeight: 'bold' }

});