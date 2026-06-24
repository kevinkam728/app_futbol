import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchTournamentData, fetchRoundMatches } from '../../services/footballApi';
import { colors } from '../styles/theme';
import TeamCrest from '../components/TeamCrest';
import MatchCard from '../components/MatchCard';

const CUP_TOURNAMENTS_GLOBAL = [1024, 384, 480, 7, 16];

// Función auxiliar para obtener el nombre a mostrar
const getRoundName = (roundId, leagueId) => {
  const isCup = CUP_TOURNAMENTS_GLOBAL.includes(Number(leagueId));
  
  // Si no es una copa, es una liga regular. Mostramos el número directo.
  if (!isCup) return `Fecha ${roundId}`;

  const isConmebol = [384, 480].includes(Number(leagueId));
  if (!isConmebol) {
    if (roundId === 5) return "32avos";
    if (roundId === 6) return "16avos";
  }

  const ROUND_NAMES = {
    27: "Octavos",
    28: "Cuartos",
    29: "Semifinal",
    50: "Final",
    60: "Final"
  };

  return ROUND_NAMES[roundId] || `Fase ${roundId}`;
};

// Función para el ordenamiento lógico
const getRoundOrder = (roundId, leagueId) => {
  const isCup = CUP_TOURNAMENTS_GLOBAL.includes(Number(leagueId));
  
  // Si no es copa, se ordena numéricamente normal
  if (!isCup) return roundId;

  const isConmebol = [384, 480].includes(Number(leagueId));
  if (!isConmebol) {
    const orderMap = { 5: 98, 6: 99, 27: 100, 28: 101, 29: 102, 50: 103, 60: 103 };
    return orderMap[roundId] || roundId;
  } else {
    const orderMap = { 27: 100, 28: 101, 29: 102, 50: 103, 60: 103 };
    return orderMap[roundId] || roundId;
  }
};

export default function TournamentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { leagueId, leagueName } = route.params;
  const actualLeagueId = leagueName === 'Copa Sudamericana' ? 480 : leagueId;

  const CUP_TOURNAMENTS = [1024, 384, 480, 7, 16]; // Arg, Lib, Sud, UCL, WC
  const LEAGUES_WITHOUT_STANDINGS = [1024]; // Solo Copa Arg no tiene grupos

  const hasCupTree = CUP_TOURNAMENTS.includes(Number(actualLeagueId));
  const hasStandings = !LEAGUES_WITHOUT_STANDINGS.includes(Number(actualLeagueId));

  const [activeTab, setActiveTab] = useState(hasStandings ? 'standings' : 'matches');
  const [data, setData] = useState({ standings: [], scorers: [], assists: [], matches: [], rounds: [], selectedRound: null, roundMatches: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const tournamentData = await fetchTournamentData(actualLeagueId);
        if (!tournamentData) throw new Error("No data received");

        // Extracción ultra-defensiva de datos para cubrir todas las variantes de RapidAPI
        const topP = tournamentData.topPlayers || {};
        const goalsArr = topP.goals || topP.data?.goals || topP.topPlayers?.goals || topP.data?.topPlayers?.goals || [];
        const assistsArr = topP.assists || topP.data?.assists || topP.topPlayers?.assists || topP.data?.topPlayers?.assists || [];

        setData(prev => ({
          ...prev,
          standings: tournamentData.standings || [],
          scorers: Array.isArray(goalsArr) ? goalsArr : [],
          assists: Array.isArray(assistsArr) ? assistsArr : [],
          rounds: tournamentData.rounds?.rounds ? [...new Set(tournamentData.rounds.rounds)].sort((a, b) => getRoundOrder(a, actualLeagueId) - getRoundOrder(b, actualLeagueId)) : [],
          selectedRound: tournamentData.rounds?.currentRound || null,
          matches: tournamentData.cupTrees || []
        }));
      } catch (error) {
        console.error(`[ERROR LOADING DATA]:`, error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [actualLeagueId, hasStandings, hasCupTree]);

  useEffect(() => {
    if (activeTab === 'fixtures' && data.selectedRound) {
      const loadMatches = async () => {
        if (!data.selectedRound) return;
        setLoadingMatches(true);
        const roundMatches = await fetchRoundMatches(actualLeagueId, data.selectedRound);
        setData(prev => ({ ...prev, roundMatches }));
        setLoadingMatches(false);
      };
      loadMatches();
    }
  }, [data.selectedRound, activeTab]);

  if (loading) {
    return (
      <LinearGradient colors={[colors.background, '#1E293B']} style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, '#1E293B']} style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#334155', backgroundColor: colors.card }]}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
          <Image
            source={{ uri: `https://api.sofascore.app/api/v1/unique-tournament/${actualLeagueId}/image` }}
            style={{ width: 26, height: 26, resizeMode: 'contain' }}
          />
        </View>
        <Text style={[styles.title, { fontSize: 20, color: colors.textPrimary, margin: 0 }]}>
          {leagueName || data.standings?.[0]?.tournament?.name || 'Carga Detalle'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        {hasStandings && (
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => setActiveTab('standings')} style={[styles.tab, activeTab === 'standings' && styles.activeTab]}>
            <Text style={{ color: activeTab === 'standings' ? colors.accent : colors.textSecondary }}>Posiciones</Text>
          </TouchableOpacity>
        )}
        {hasStandings && (
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => setActiveTab('fixtures')} style={[styles.tab, activeTab === 'fixtures' && styles.activeTab]}>
            <Text style={{ color: activeTab === 'fixtures' ? colors.accent : colors.textSecondary }}>Fechas</Text>
          </TouchableOpacity>
        )}
        {hasCupTree && (
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => setActiveTab('matches')} style={[styles.tab, activeTab === 'matches' && styles.activeTab]}>
            <Text style={{ color: activeTab === 'matches' ? colors.accent : colors.textSecondary }}>Llaves</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => setActiveTab('stats')} style={[styles.tab, activeTab === 'stats' && styles.activeTab]}>
          <Text style={{ color: activeTab === 'stats' ? colors.accent : colors.textSecondary }}>Estadísticas</Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}>
        
        {activeTab === 'fixtures' && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roundSelector}>
              {data.rounds.map((round, index) => (
                <TouchableOpacity key={index} onPress={() => setData(prev => ({ ...prev, selectedRound: round }))} style={[styles.roundButton, data.selectedRound === round && styles.activeRoundButton]}>
                  <Text style={[styles.roundButtonText, data.selectedRound === round && { color: '#ffffff' }]}>
                    {getRoundName(round, actualLeagueId)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flex: 1, marginTop: 10 }}>
              {loadingMatches ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
              ) : !loadingMatches && data.roundMatches.length === 0 && data.selectedRound >= 5 && hasCupTree ? (
                <View style={styles.knockoutFallback}>
                  <Text style={styles.knockoutTitle}>🏆 Fase de Eliminación</Text>
                  <Text style={styles.knockoutDesc}>Los cruces de esta instancia se visualizan en el cuadro del torneo.</Text>
                  <TouchableOpacity style={styles.knockoutButton} onPress={() => setActiveTab('matches')}>
                    <Text style={styles.knockoutButtonText}>Ver Llaves</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                data.roundMatches.map(match => (<MatchCard key={match.id} match={match} />))
              )}
            </View>
          </View>
        )}

        {activeTab === 'standings' && (
          (data.standings && data.standings.length > 0 ? (
            data.standings.map((table, tableIndex) => (
              <View key={`table-${tableIndex}`} style={styles.cardContainer}>
                {table?.title && table.title !== "Standings" && (
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{table.title}</Text>
                  </View>
                )}
                <View style={styles.columnHeader}>
                  <Text style={[styles.colText, { width: 30, textAlign: 'center' }]}>#</Text>
                  <Text style={[styles.colText, { flex: 1 }]}>Equipo</Text>
                  <Text style={[styles.colText, { width: 40, textAlign: 'center' }]}>Pts</Text>
                  <Text style={[styles.colText, { width: 40, textAlign: 'center' }]}>PJ</Text>
                </View>
                {table?.rows?.map((row, rowIndex) => (
                  <View key={`row-${rowIndex}`} style={[styles.row, rowIndex % 2 !== 0 && styles.rowAlternate]}>
                    <Text style={[styles.rank, { color: (row?.rank || 0) <= 4 ? colors.accent : colors.textPrimary }]}>{row?.rank}</Text>
                    <View style={styles.teamRow}>
                      <TeamCrest teamId={row?.team?.id} size={24} />
                      <Text style={[styles.team, { color: colors.textPrimary, marginLeft: 8, transform: [{ translateY: -2 }] }]} numberOfLines={1}>{row?.team?.name || 'N/A'}</Text>
                    </View>
                    <Text style={[styles.pts, { color: colors.textPrimary, fontWeight: 'bold' }]}>{row?.points ?? '-'}</Text>
                    <Text style={[styles.pts, { color: colors.textSecondary }]}>{row?.all?.played ?? '-'}</Text>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.cardContainer}><Text style={styles.emptyText}>Sin datos de posiciones.</Text></View>
          ))
        )}

        {activeTab === 'matches' && (
          <View>
            {(() => {
              const cupTreeSource = data?.matches;
              let roundsArray = [];
              
              if (Array.isArray(cupTreeSource) && cupTreeSource.length > 0) {
                roundsArray = cupTreeSource[0].rounds || cupTreeSource;
              } else if (cupTreeSource && typeof cupTreeSource === 'object') {
                roundsArray = cupTreeSource.rounds || Object.values(cupTreeSource);
              }

              if (!Array.isArray(roundsArray)) roundsArray = [];

              let processedRounds = roundsArray.map(round => {
                let name = round.description || round.name || '';
                if (name.toUpperCase().includes('QUALIFICATION ROUND 1')) name = 'Fase Previa 1';
                if (name.toUpperCase().includes('QUALIFICATION ROUND 2')) name = 'Fase Previa 2';
                if (name.toUpperCase().includes('QUALIFICATION ROUND 3')) name = 'Fase Previa 3';
                return { ...round, description: name };
              });

              const createPlaceholderBlocks = (count) => Array(count).fill(null).map(() => ({
                participants: [{ team: { id: 'placeholder-home', name: 'Por definir' } }, { team: { id: 'placeholder-away', name: 'Por definir' } }],
                homeTeamScore: '-', awayTeamScore: '-'
              }));

              const isLibertadores = Number(actualLeagueId) === 384;
              const isSudamericana = Number(actualLeagueId) === 480;

              if (isLibertadores) {
                if (!processedRounds.some(r => r.description.includes('Octavos'))) processedRounds.push({ description: 'Octavos de Final', blocks: createPlaceholderBlocks(8) });
                if (!processedRounds.some(r => r.description.includes('Cuartos'))) processedRounds.push({ description: 'Cuartos de Final', blocks: createPlaceholderBlocks(4) });
                if (!processedRounds.some(r => r.description.includes('Semifinal'))) processedRounds.push({ description: 'Semifinal', blocks: createPlaceholderBlocks(2) });
                if (!processedRounds.some(r => r.description === 'Final' || r.description === 'FINAL')) processedRounds.push({ description: 'Final', blocks: createPlaceholderBlocks(1) });
              }
              if (isSudamericana) {
                if (!processedRounds.some(r => r.description.includes('Dieciseisavos'))) processedRounds.push({ description: 'Dieciseisavos de Final', blocks: createPlaceholderBlocks(8) });
                if (!processedRounds.some(r => r.description.includes('Octavos'))) processedRounds.push({ description: 'Octavos de Final', blocks: createPlaceholderBlocks(8) });
                if (!processedRounds.some(r => r.description.includes('Cuartos'))) processedRounds.push({ description: 'Cuartos de Final', blocks: createPlaceholderBlocks(4) });
                if (!processedRounds.some(r => r.description.includes('Semifinal'))) processedRounds.push({ description: 'Semifinal', blocks: createPlaceholderBlocks(2) });
                if (!processedRounds.some(r => r.description === 'Final' || r.description === 'FINAL')) processedRounds.push({ description: 'Final', blocks: createPlaceholderBlocks(1) });
              }

              const getPhaseOrder = (name) => {
                if (name.includes('Previa 1')) return 1;
                if (name.includes('Previa 2')) return 2;
                if (name.includes('Previa 3')) return 3;
                if (name.includes('Dieciseisavos')) return 4;
                if (name.includes('Octavos')) return 5;
                if (name.includes('Cuartos')) return 6;
                if (name.includes('Semifinal')) return 7;
                if (name === 'Final' || name === 'FINAL') return 8;
                return 99;
              };
              processedRounds.sort((a, b) => getPhaseOrder(a.description) - getPhaseOrder(b.description));

              const validRounds = processedRounds.filter(r => r.blocks && r.blocks.length > 0);

              return validRounds.length > 0 ? validRounds.map((round, rIndex) => (
                <View key={rIndex} style={styles.cardContainer}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{round.description}</Text>
                  </View>
                  {round.blocks?.map((block, bIndex) => {
                    if (!block.participants || block.participants.length < 2) return null;
                    const home = block.participants[0];
                    const away = block.participants[1];
                    const isHomePlaceholder = !home.team?.id || String(home.team.id).includes('placeholder');
                    const isAwayPlaceholder = !away.team?.id || String(away.team.id).includes('placeholder');

                    const homeScore = typeof block.homeTeamScore === 'object' ? block.homeTeamScore?.current : block.homeTeamScore;
                    const awayScore = typeof block.awayTeamScore === 'object' ? block.awayTeamScore?.current : block.awayTeamScore;

                    let finalHomeScore = String(homeScore ?? '-');
                    let finalAwayScore = String(awayScore ?? '-');
                    let homePen = null;
                    let awayPen = null;

                    if (finalHomeScore.includes('(')) {
                      const parts = finalHomeScore.split('(');
                      finalHomeScore = parts[0].trim();
                      homePen = parts[1].replace(')', '').trim();
                    }
                    if (finalAwayScore.includes('(')) {
                      const parts = finalAwayScore.split('(');
                      finalAwayScore = parts[0].trim();
                      awayPen = parts[1].replace(')', '').trim();
                    }
                    const hasPenalties = homePen && awayPen;

                    return (
                      <View key={bIndex} style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', paddingVertical: 15, paddingHorizontal: 12 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 50, marginBottom: 12 }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 5 }}>
                            {isHomePlaceholder ? (
                              <View style={{ width: 32, height: 32, marginRight: 8, backgroundColor: '#334155', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>?</Text></View>
                            ) : (
                              <Image source={{ uri: `https://api.sofascore.app/api/v1/team/${home.team.id}/image` }} style={{ width: 32, height: 32, marginRight: 8 }} />
                            )}
                            <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1, flexWrap: 'wrap', transform: [{ translateY: -2 }] }} numberOfLines={3}>{home.team.name}</Text>
                          </View>
                          <View style={{ width: 85, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
                            <Text style={{ fontSize: 16, color: colors.accent, fontWeight: 'bold', textAlign: 'center' }}>{finalHomeScore} - {finalAwayScore}</Text>
                            {hasPenalties && (
                              <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 2, fontWeight: 'bold' }}>Penales: {homePen}-{awayPen}</Text>
                            )}
                          </View>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingLeft: 5 }}>
                            <Text style={{ textAlign: 'right', color: colors.textPrimary, fontSize: 13, flex: 1, flexWrap: 'wrap', transform: [{ translateY: -2 }] }} numberOfLines={3}>{away.team.name}</Text>
                            {isAwayPlaceholder ? (
                              <View style={{ width: 32, height: 32, marginLeft: 8, backgroundColor: '#334155', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>?</Text></View>
                            ) : (
                              <Image source={{ uri: `https://api.sofascore.app/api/v1/team/${away.team.id}/image` }} style={{ width: 32, height: 32, marginLeft: 8 }} />
                            )}
                          </View>
                        </View>
                        <TouchableOpacity style={{ backgroundColor: '#334155', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 20 }} activeOpacity={0.7} onPress={() => block.matchId && navigation.navigate('MatchDetail', { matchId: block.matchId })}>
                          <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 'bold' }}>Ver info</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )) : <Text style={styles.emptyText}>Las llaves aún no están disponibles</Text>;
            })()}
          </View>
        )}

        {activeTab === 'stats' && (
          <View>
            <Text style={styles.subtitle}>Goleadores</Text>
            {(!data.scorers || data.scorers.length === 0) ? (
              <Text style={styles.emptyText}>Sin datos de goleadores.</Text>
            ) : (
              data.scorers.slice(0, 10).map((p, i) => (
                <View key={`scorer-${i}`} style={styles.statRow}>
                  <Image 
                    source={{ uri: `https://api.sofascore.app/api/v1/player/${p.player?.id}/image` }} 
                    style={styles.photo} 
                  />
                  <Text style={styles.statText}>
                    {p.player?.name || p.player?.shortName || 'Jugador'} - {p.statistics?.goals ?? p.goals ?? 0} goles
                  </Text>
                </View>
              ))
            )}

            <Text style={styles.subtitle}>Asistencias</Text>
            {(!data.assists || data.assists.length === 0) ? (
              <Text style={styles.emptyText}>Sin datos de asistencias.</Text>
            ) : (
              data.assists.slice(0, 10).map((p, i) => (
                <View key={`assist-${i}`} style={styles.statRow}>
                  <Image 
                    source={{ uri: `https://api.sofascore.app/api/v1/player/${p.player?.id}/image` }} 
                    style={styles.photo} 
                  />
                  <Text style={styles.statText}>
                    {p.player?.name || p.player?.shortName || 'Jugador'} - {p.statistics?.assists ?? p.assists ?? 0} asis.
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', margin: 15, color: colors.textPrimary },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    maxHeight: 50,
    minHeight: 50
  },
  tab: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', height: '100%' },
  activeTab: { backgroundColor: colors.card },
  content: { flex: 1, padding: 15 },
  cardContainer: { backgroundColor: colors.card, borderRadius: 12, marginBottom: 24, overflow: 'hidden', elevation: 5 },
  cardHeader: { backgroundColor: '#1A202C', paddingVertical: 12, paddingHorizontal: 16 },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  columnHeader: { flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 10, paddingHorizontal: 16 },
  colText: { color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  rowAlternate: { backgroundColor: '#2D3748' },
  rank: { width: 30, fontWeight: 'bold' },
  teamRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  team: { fontSize: 14 },
  pts: { width: 40, textAlign: 'center', fontSize: 14 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, padding: 10, backgroundColor: colors.card, borderRadius: 8 },
  photo: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  statText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  subtitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 10, color: colors.textPrimary },
  emptyText: { textAlign: 'center', marginTop: 20, color: colors.textSecondary },
  roundSelector: { marginBottom: 20 },
  roundButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1e293b', borderRadius: 20, marginRight: 10 },
  activeRoundButton: { backgroundColor: '#2563eb' },
  roundButtonText: { color: '#f8fafc', fontWeight: 'bold' },
  knockoutFallback: { alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 20, backgroundColor: colors.card, borderRadius: 12 },
  knockoutTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 10 },
  knockoutDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  knockoutButton: { backgroundColor: colors.accent, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  knockoutButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
