import React, { useState, useEffect } from 'react';

import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { colors } from '../styles/theme';

import TeamCrest from './TeamCrest';



export default function MatchCard({ match, onVerEquipos }) {

const navigation = useNavigation();

const [currentMinute, setCurrentMinute] = useState(null);



let displayStatus = 'Programado';

if (match.status?.type === 'finished') {

displayStatus = 'FT';

} else if (match.status?.type === 'notstarted' || match.status?.description === 'Not started') {

const matchTime = match.timestamp || match.startTimestamp;

if (matchTime) {

const date = new Date(matchTime * 1000);

const hours = date.getHours().toString().padStart(2, '0');

const minutes = date.getMinutes().toString().padStart(2, '0');

displayStatus = `${hours}:${minutes}`;

} else {

displayStatus = 'Por definir';

}

} else {

displayStatus = match.status?.description || 'Programado';

}



useEffect(() => {

if (!match?.id) return;

const isLive = match.status?.type === 'inprogress';

if (isLive && match.time?.currentPeriodStartTimestamp) {

const calculateMinute = () => {

const now = Math.floor(Date.now() / 1000);

const baseMinute = Math.floor((now - match.time.currentPeriodStartTimestamp) / 60);

const periodOffset = (match.time?.period === '2nd' ? 45 : 0);

return Math.max(1, baseMinute + periodOffset);

};

const interval = setInterval(() => {

setCurrentMinute(calculateMinute());

}, 60000);

// Cálculo inicial

setCurrentMinute(calculateMinute());

return () => clearInterval(interval);

}

}, [match]);



return (

<View style={styles.matchCard}>

<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>

{/* Equipo Local (Micro-ajustes de padding, logo y font) */}

<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingRight: 4 }}>

<Image

source={{ uri: `https://api.sofascore.app/api/v1/team/${match.homeTeam?.id}/image` }}

style={{ width: 28, height: 28, marginRight: 6 }}

/>

<Text style={{ fontSize: 13, color: colors.textPrimary, flexShrink: 1, textAlign: 'left' }} numberOfLines={2}>

{match.homeTeam?.name || 'Local'}

</Text>

</View>



{/* Marcador Central (Ancho reducido a 55px) */}

<View style={{ width: 55, alignItems: 'center', justifyContent: 'center' }}>

<Text style={{ fontSize: 15, color: colors.accent, fontWeight: 'bold', textAlign: 'center' }}>

{match.homeScore?.current ?? '-'}:{match.awayScore?.current ?? '-'}

</Text>

{match.status?.type === 'inprogress' ? (

<Text style={{ fontSize: 12, color: '#22c55e', marginTop: 2 }}>{currentMinute}'</Text>

) : (

<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{displayStatus}</Text>

)}

</View>



{/* Equipo Visitante (Micro-ajustes de padding, logo y font) */}

<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingLeft: 4 }}>

<Text style={{ fontSize: 13, color: colors.textPrimary, flexShrink: 1, textAlign: 'right', marginRight: 6 }} numberOfLines={2}>

{match.awayTeam?.name || 'Visitante'}

</Text>

<Image

source={{ uri: `https://api.sofascore.app/api/v1/team/${match.awayTeam?.id}/image` }}

style={{ width: 28, height: 28 }}

/>

</View>



</View>

<View style={styles.buttonContainer}>

<TouchableOpacity

style={styles.actionButton}

activeOpacity={0.7}

onPress={() => navigation.navigate('MatchDetail', { matchId: match.id })}

>

<Text style={styles.actionButtonText}>Ver info</Text>

</TouchableOpacity>

</View>

</View>

);

}



const styles = StyleSheet.create({

matchCard: { backgroundColor: colors.background, padding: 15, marginBottom: 10, borderRadius: 10 },

matchInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

teamContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },

teamName: { color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' },

scorersText: { color: '#94a3b8', fontSize: 10, marginTop: 2 },

scoreContainer: { alignItems: 'center', marginHorizontal: 10 },

scoreText: { color: colors.accent, fontSize: 18, fontWeight: 'bold' },

liveMinute: { color: '#22c55e', fontSize: 14, fontWeight: 'bold' },

matchStatus: { color: colors.textSecondary, fontSize: 12 },

buttonContainer: { alignItems: 'center', marginTop: 15 },

actionButton: { backgroundColor: '#334155', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },

actionButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' },

});