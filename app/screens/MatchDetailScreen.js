import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useRoute, useNavigation } from '@react-navigation/native';

import { colors } from '../styles/theme';

// Función para agrupar titulares por línea
const groupLineupByPosition = (playersArray) => {
  if (!playersArray) return { G: [], D: [], M: [], F: [] };
  const starters = playersArray.filter(p => !p.substitute);
  const grouped = { G: [], D: [], M: [], F: [] };
  
  starters.forEach(p => {
    const pos = p?.position || p?.player?.position;
    if (pos && grouped[pos]) {
      grouped[pos].push(p);
    } else if (grouped['M']) {
      // Fallback a mediocampo si la posición es rara/nula
      grouped['M'].push(p); 
    }
  });
  return grouped;
};

const STATS_TRANSLATIONS = {
  // Grupos
  "Expected": "Goles Esperados",
  "Possession": "Posesión",
  "Shots": "Tiros",
  "TVData": "Datos del Partido",
  "Passes": "Pases",
  "Duels": "Duelos",
  "Defending": "Defensa",
  // Ítems de Estadísticas
  "Expected goals": "Goles esperados (xG)",
  "Ball possession": "Posesión de balón",
  "Total shots": "Tiros totales",
  "Shots on target": "Tiros a puerta",
  "Shots off target": "Tiros fuera",
  "Blocked shots": "Tiros bloqueados",
  "Corner kicks": "Córneres",
  "Offsides": "Fueras de juego",
  "Fouls": "Faltas",
  "Yellow cards": "Tarjetas amarillas",
  "Red cards": "Tarjetas rojas",
  "Free kicks": "Tiros libres",
  "Throw-ins": "Saques de banda",
  "Goal kicks": "Saques de meta",
  "Big chances": "Grandes ocasiones",
  "Big chances missed": "Ocasiones claras falladas",
  "Hit woodwork": "Tiros al palo",
  "Counter attacks": "Contraataques",
  "Goalkeeper saves": "Paradas del portero",
  "Passes": "Pases",
  "Accurate passes": "Pases precisos",
  "Long balls": "Pases largos",
  "Crosses": "Centros",
  "Dribbles": "Regates",
  "Possession lost": "Posesión perdida",
  "Duels won": "Duelos ganados",
  "Aerials won": "Duelos aéreos ganados",
  "Tackles": "Entradas",
  "Interceptions": "Intercepciones",
  "Clearances": "Despejes",
  "Expected assists": "Asistencias esperadas (xA)"
};

import { fetchFullMatchDetails } from '../../services/footballApi';



export default function MatchDetailScreen() {

const route = useRoute();

const navigation = useNavigation();

console.log("[DEBUG MATCH SCREEN] Parámetros recibidos en route.params:", route.params);

const { matchId } = route.params || {};



const [loading, setLoading] = useState(true);

const [data, setData] = useState(null);

const [activeTab, setActiveTab] = useState('summary');



useEffect(() => {

  const fetchData = async () => {
    if (!matchId) return;
    
    const cacheKey = `match_v4_${matchId}`;
    setLoading(true);

    try {
      // 1. Buscamos en el "disco duro" del teléfono
      const cachedString = await AsyncStorage.getItem(cacheKey);
      let localData = null;

      if (cachedString) {
        localData = JSON.parse(cachedString);
        setData(localData); // Mostramos lo guardado rápido para buena UX
        
        // Verificamos si el partido ya terminó
        const isFinished = 
          localData.details?.status?.type === 'finished' || 
          localData.details?.status?.description === 'Ended';
          
        if (isFinished) {
          // Si terminó, cortamos la función acá. ¡Ahorramos 4 peticiones!
          setLoading(false);
          return;
        }
      }

       // 2. Si no había caché o el partido está en vivo, vamos a internet
       const freshData = await fetchFullMatchDetails(matchId);
       
       if (!freshData) throw new Error("No data received");

       // NORMALIZACIÓN DE ESTADÍSTICAS
       // Buscamos el array en la raíz, en res.statistics, o en res.data.statistics
       let rawStats = freshData.statistics || [];
       // Nos aseguramos de que sea un array
       if (!Array.isArray(rawStats)) rawStats = Object.values(rawStats);
       
       // NORMALIZACIÓN DE INCIDENTES (Goles, Tarjetas)
       let rawIncidents = freshData.incidents || [];
       // Convertimos el objeto de incidentes con claves numéricas ({"1":{}, "2":{}}) a un Array estándar
       if (!Array.isArray(rawIncidents) && typeof rawIncidents === 'object') {
         rawIncidents = Object.values(rawIncidents).filter(item => typeof item === 'object' && item !== null);
       }

       const processedData = {
         details: freshData.details || {},
         statistics: rawStats,
         incidents: rawIncidents,
         lineups: freshData.lineups || {}
       };
       console.log("[DEBUG PAYLOAD]: Goles/Tarjetas:", processedData?.incidents?.length || 0, "| Estadísticas:", processedData?.statistics?.length || 0);

       // 3. Guardamos los datos nuevos en memoria para la próxima vez
       setData(processedData);
       await AsyncStorage.setItem(cacheKey, JSON.stringify(processedData));


    } catch (error) {
      console.error("[ERROR CACHE/API MATCH]:", error);
    } finally {
      setLoading(false);
    }
  };


fetchData();

}, [matchId]);



if (loading) {

return (

<View style={styles.center}>

<ActivityIndicator size="large" color={colors.accent || '#f59e0b'} />

</View>

);

}



if (!data || !data.details?.homeTeam) {

return (

<View style={[styles.center, { backgroundColor: '#0f172a', padding: 20 }]}>

<Text style={{ color: '#fff', fontSize: 16, marginBottom: 20, textAlign: 'center' }}>No se pudo sincronizar la información del partido</Text>

<TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 15, backgroundColor: '#2563eb', borderRadius: 10 }}>

<Text style={{ color: '#fff', fontWeight: 'bold' }}>Volver</Text>

</TouchableOpacity>

</View>

);

}



const { details, incidents, statistics, lineups } = data;

const event = details?.event || {};



  // --- RENDERIZADO DE CABECERA (BLINDADO) ---
  const renderHeader = () => {
    // Solución al doble anidamiento: evaluamos ambas posibles rutas
    const matchEvent = details?.event || details || {};
    const homeTeam = matchEvent.homeTeam || {};
    const awayTeam = matchEvent.awayTeam || {};
    
    // Parseo seguro del marcador
    const homeScore = matchEvent.homeScore?.current ?? matchEvent.homeScore?.display ?? '-';
    const awayScore = matchEvent.awayScore?.current ?? matchEvent.awayScore?.display ?? '-';
    const statusText = matchEvent.status?.description?.toUpperCase() || '';

    return (
      <View style={styles.headerContainer}>
        <View style={styles.scoreboard}>
            {/* EQUIPO LOCAL */}
            <View style={styles.teamContainer}>
                {homeTeam.id && (
                  <Image 
                    source={{ uri: `https://api.sofascore.app/api/v1/team/${homeTeam.id}/image` }} 
                    style={styles.teamLogo} 
                  />
                )}
                <Text style={styles.teamName} numberOfLines={2}>
                  {homeTeam.name || 'Local'}
                </Text>
            </View>
            
            {/* MARCADOR */}
            <View style={styles.scoreContainer}>
                <Text style={styles.score}>{homeScore} - {awayScore}</Text>
                <Text style={styles.status}>{statusText}</Text>
            </View>
            
            {/* EQUIPO VISITANTE */}
            <View style={styles.teamContainer}>
                {awayTeam.id && (
                  <Image 
                    source={{ uri: `https://api.sofascore.app/api/v1/team/${awayTeam.id}/image` }} 
                    style={styles.teamLogo} 
                  />
                )}
                <Text style={styles.teamName} numberOfLines={2}>
                  {awayTeam.name || 'Visitante'}
                </Text>
            </View>
        </View>
      </View>
    );
  };



const renderTabs = () => (

<View style={styles.tabsContainer}>

{['summary', 'stats', 'lineups'].map((tab) => (

<TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>

<Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>

{tab === 'summary' ? 'Resumen' : tab === 'stats' ? 'Estadísticas' : 'Formaciones'}

</Text>

</TouchableOpacity>

))}

</View>

);



const renderContent = () => {

if (activeTab === 'summary') return renderSummary();

if (activeTab === 'stats') return renderStats();

if (activeTab === 'lineups') return renderLineups();

};



// --- RENDERIZADO DE PESTAÑA RESUMEN (INCIDENTS) ---

const renderSummary = () => {

if (!data) return <Text style={styles.noData}>Cargando...</Text>;

const safeIncidents = Array.isArray(data?.incidents) ? data.incidents : [];

if (safeIncidents.length === 0) return <Text style={styles.noData}>No hay eventos registrados aún.</Text>;

// ... rest of function ...

return (

<View style={styles.content}>

{safeIncidents.map((inc, index) => {
if (!inc) return null;

const type = inc.incidentType || inc.type;
const incClass = inc.incidentClass;

let icon = "";
if (type === 'goal') {
    icon = '⚽';
} else if (type === 'card') {
    icon = (incClass === 'yellow' || incClass === 'yellowCard') ? '🟨' : '🟥';
} else if (type === 'substitution') {
    icon = '🔄';
} else {
    return null; // Filtramos cualquier evento que no sea gol, tarjeta o cambio
}

// Lógica de nombres segura
const pName = type === 'substitution' 
    ? `${inc.playerIn?.shortName || ''} ⬆️ / ${inc.playerOut?.shortName || ''} ⬇️`
    : (inc.player?.name || inc.playerName || "");

return (
<View key={index} style={[styles.incidentRow, inc.isHome ? { justifyContent: 'flex-start' } : { justifyContent: 'flex-end' }]}>
{inc.isHome && <Text style={styles.incidentText}>{inc.time}' {icon} {pName}</Text>}
{!inc.isHome && <Text style={styles.incidentText}>{pName} {icon} {inc.time}'</Text>}
</View>
);
})}

</View>

);

};



// --- RENDERIZADO DE PESTAÑA ESTADÍSTICAS ---

const renderStats = () => {

if (!data) return <Text style={styles.noData}>Cargando...</Text>;

const safeStats = Array.isArray(data?.statistics) ? data.statistics : [];

const allStats = safeStats.find(s => s?.period === 'ALL')?.groups || [];

if (allStats.length === 0) return <Text style={styles.noData}>Estadísticas no disponibles aún.</Text>;

// ... rest of function ...



return (

<View style={styles.content}>

{allStats.map((group, gIdx) => {

if (!group) return null;

const items = Array.isArray(group.statisticsItems) ? group.statisticsItems : [];

return (

<View key={gIdx} style={{ marginBottom: 20 }}>

{/* Blindaje del nombre del grupo */}

<Text style={styles.groupTitle}>
  {STATS_TRANSLATIONS[group?.groupName] || group?.groupName || 'Estadísticas'}
</Text>

{items.map((item, iIdx) => {

if (!item) return null;

const homeVal = parseFloat(item.home) || 0;

const awayVal = parseFloat(item.away) || 0;

const total = homeVal + awayVal;

const homeWidth = total > 0 ? (homeVal / total) * 100 : 50;



return (

<View key={iIdx} style={styles.statItem}>

<View style={styles.statRow}>

<Text style={styles.statValue}>{item.home || '0'}</Text>

{/* Blindaje del nombre de la estadística */}

<Text style={styles.statName}>
  {STATS_TRANSLATIONS[item?.name] || item?.name || '-'}
</Text>

<Text style={styles.statValue}>{item.away || '0'}</Text>

</View>

<View style={styles.progressBar}>

<View style={[styles.progressHome, { width: `${homeWidth}%` }]} />

<View style={[styles.progressAway, { width: `${100 - homeWidth}%` }]} />

</View>

</View>

);

})}

</View>

);

})}

</View>

);

};



  // --- RENDERIZADO DE FORMACIONES (BLINDADO Y CON DATOS REALES) ---
  const renderLineups = () => {
    return (
      <View style={styles.content}>
        {/* CANCHA GRÁFICA (TITULARES) */}
        <View style={styles.pitchContainer}>
          
          {/* LÍNEAS GRÁFICAS DE LA CANCHA (Fondo) */}
          <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]} pointerEvents="none">
            {/* Área Visitante (Arriba) */}
            <View style={[styles.penaltyArea, { top: 0, borderTopWidth: 0 }]} />
            
            {/* Línea de mitad de cancha */}
            <View style={styles.halfwayLineAbsolute} />
            
            {/* Círculo y punto central */}
            <View style={styles.centerCircle} />
            <View style={styles.centerDot} />
            
            {/* Área Local (Abajo) */}
            <View style={[styles.penaltyArea, { bottom: 0, borderBottomWidth: 0 }]} />
          </View>

          {/* ETIQUETA EQUIPO VISITANTE (ARRIBA) */}
          <View style={styles.pitchTeamLabelContainer}>
            <Text style={styles.pitchTeamLabelText}>Formación inicial - {details?.awayTeam?.name || 'Visitante'}</Text>
          </View>

          {/* Mitad Visitante (Leemos de arriba hacia abajo: G, D, M, F) */}
          {(() => {
            const awayGroups = groupLineupByPosition(lineups?.away?.players);
            return ['G', 'D', 'M', 'F'].map(pos => (
              <View key={`away-${pos}`} style={styles.pitchRow}>
                {awayGroups[pos].map((p, idx) => (
                  <View key={`away-p-${idx}`} style={styles.playerMarker}>
                    <View style={[styles.jerseyCircle, { backgroundColor: '#ffffff', borderColor: '#ef4444' }]}>
                      <Text style={styles.jerseyNumberAway}>{p?.jerseyNumber || p?.positionsDetailed?.jerseyNumber || '-'}</Text>
                    </View>
                    <Text style={styles.pitchPlayerName} numberOfLines={1}>
                      {p?.shortName || p?.player?.shortName || p?.name || p?.player?.name || '?'}
                    </Text>
                  </View>
                ))}
              </View>
            ));
          })()}

          {/* Mitad Local (Leemos de arriba hacia abajo: F, M, D, G para enfrentar al visitante) */}
          {(() => {
            const homeGroups = groupLineupByPosition(lineups?.home?.players);
            return ['F', 'M', 'D', 'G'].map(pos => (
              <View key={`home-${pos}`} style={styles.pitchRow}>
                {homeGroups[pos].map((p, idx) => (
                  <View key={`home-p-${idx}`} style={styles.playerMarker}>
                    <View style={[styles.jerseyCircle, { backgroundColor: '#3b82f6', borderColor: '#ffffff' }]}>
                      <Text style={styles.jerseyNumberHome}>{p?.jerseyNumber || p?.positionsDetailed?.jerseyNumber || '-'}</Text>
                    </View>
                    <Text style={styles.pitchPlayerName} numberOfLines={1}>
                      {p?.shortName || p?.player?.shortName || p?.name || p?.player?.name || '?'}
                    </Text>
                  </View>
                ))}
              </View>
            ));
          })()}

          {/* ETIQUETA EQUIPO LOCAL (ABAJO) */}
          <View style={[styles.pitchTeamLabelContainer, { marginTop: 8 }]}>
            <Text style={styles.pitchTeamLabelText}>Formación inicial - {details?.homeTeam?.name || 'Local'}</Text>
          </View>

        </View>

        {/* BLOQUE SUPLENTES */}
        <View style={[styles.lineupContainer, { marginTop: 30 }]}>
          <View style={styles.lineupCol}>
            <Text style={styles.subtitle}>Suplentes</Text>
            {lineups?.home?.players?.filter(p => p.substitute).map((p, idx) => (
              <Text key={`home-suplente-${idx}`} style={styles.playerText} numberOfLines={1}>
                {p?.jerseyNumber || '-'}. {p?.player?.name || p?.name || 'Desconocido'}
              </Text>
            ))}
          </View>
          <View style={styles.lineupCol}>
            <Text style={[styles.subtitle, {textAlign: 'right'}]}>Suplentes</Text>
            {lineups?.away?.players?.filter(p => p.substitute).map((p, idx) => (
              <Text key={`away-suplente-${idx}`} style={[styles.playerText, {textAlign: 'right'}]} numberOfLines={1}>
                {p?.player?.name || p?.name || 'Desconocido'} .{p?.jerseyNumber || '-'}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };



return (

<ScrollView style={styles.container} stickyHeaderIndices={[1]}>

{renderHeader()}

{renderTabs()}

{renderContent()}

</ScrollView>

);

}



const styles = StyleSheet.create({

container: { flex: 1, backgroundColor: colors.background || '#0f172a' },

center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

headerContainer: { backgroundColor: colors.background || '#0f172a', padding: 20 },

scoreboard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },

teamContainer: { alignItems: 'center', width: '30%' },

teamLogo: { width: 60, height: 60, borderRadius: 30 },

teamName: { color: colors.textPrimary || '#fff', marginTop: 5, textAlign: 'center' },

scoreContainer: { alignItems: 'center' },

status: { color: colors.textSecondary || '#94a3b8', marginBottom: 5 },

score: { color: colors.textPrimary || '#fff', fontSize: 32, fontWeight: 'bold' },

metadata: { alignItems: 'center' },

metaText: { color: colors.textSecondary || '#94a3b8', marginVertical: 2 },

tabsContainer: {

flexDirection: 'row',

justifyContent: 'space-around',

alignItems: 'center',

backgroundColor: '#0f172a',

paddingVertical: 15,

borderBottomWidth: 1,

borderBottomColor: '#334155'

},

tab: { paddingHorizontal: 20, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },

activeTab: { borderBottomColor: colors.accent || '#f59e0b' },

tabText: { color: colors.textSecondary || '#94a3b8' },

activeTabText: { color: colors.accent || '#f59e0b', fontWeight: 'bold' },

content: { padding: 20 },

incidentRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },

incidentTime: { color: colors.textSecondary || '#94a3b8', marginHorizontal: 10 },

incidentText: { color: colors.textPrimary || '#fff' },

statGroup: { marginBottom: 20 },

groupTitle: { color: colors.textPrimary || '#fff', fontWeight: 'bold', marginBottom: 10 },

statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },

statName: { color: colors.textSecondary || '#94a3b8' },

statValue: { color: colors.textPrimary || '#fff', fontWeight: 'bold' },

progressBar: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },

progressHome: { backgroundColor: colors.accent || '#f59e0b' },

progressAway: { backgroundColor: '#475569' },

lineupContainer: { flexDirection: 'row' },

lineupCol: { flex: 1 },

playerText: { color: colors.textPrimary || '#fff', marginVertical: 2 },
subtitle: { color: colors.textPrimary || '#fff', fontWeight: 'bold', marginBottom: 10 },
/* ESTILOS DE LA CANCHA */
pitchContainer: { backgroundColor: '#22c55e', borderRadius: 8, paddingVertical: 10, marginVertical: 15, position: 'relative', overflow: 'hidden', zIndex: 1 },
/* ESTILOS DE LÍNEAS DE LA CANCHA (MARCADORES GRÁFICOS) */
penaltyArea: { position: 'absolute', alignSelf: 'center', width: '45%', height: '14%', borderColor: 'rgba(255,255,255,0.3)', borderWidth: 2 },
halfwayLineAbsolute: { position: 'absolute', top: '50%', width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: -1 },
centerCircle: { position: 'absolute', top: '50%', alignSelf: 'center', width: 80, height: 80, borderRadius: 40, borderColor: 'rgba(255,255,255,0.3)', borderWidth: 2, marginTop: -40 },
centerDot: { position: 'absolute', top: '50%', alignSelf: 'center', width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: -4 },
pitchRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', marginVertical: 8, minHeight: 45 },
playerMarker: { alignItems: 'center', width: 60 },
jerseyCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
jerseyNumberHome: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
jerseyNumberAway: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
pitchPlayerName: { color: '#ffffff', fontSize: 10, marginTop: 4, fontWeight: 'bold', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
/* ESTILOS ETIQUETAS DE LA CANCHA */
pitchTeamLabelContainer: { alignSelf: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingVertical: 4, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, zIndex: 10 },
pitchTeamLabelText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

noData: { color: colors.textSecondary || '#94a3b8', textAlign: 'center' }

});
