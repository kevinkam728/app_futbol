// --- CONFIGURACIÓN DEL BACKEND LOCAL (BFF) ---
const BASE_URL = 'http://192.168.0.11:3000/api';

// --- API Methods ---
export const fetchMatchesByDate = async (dateString) => {
  try {
    console.log(`[BFF REQUEST] 🌐 Consultando: ${BASE_URL}/matches/${dateString}`);
    const res = await fetch(`${BASE_URL}/matches/${dateString}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('[API ERROR] fetchMatchesByDate:', error);
    return null;
  }
};

export const fetchTournamentData = async (leagueId) => {
  try {
    console.log(`[BFF REQUEST] 🌐 Consultando: ${BASE_URL}/tournament/${leagueId}/data`);
    const res = await fetch(`${BASE_URL}/tournament/${leagueId}/data`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('[API ERROR] fetchTournamentData:', error);
    return null;
  }
};

export const fetchFullMatchDetails = async (matchId) => {
  try {
    console.log(`[BFF REQUEST] 🌐 Consultando: ${BASE_URL}/match/${matchId}/details`);
    const res = await fetch(`${BASE_URL}/match/${matchId}/details`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('[API ERROR] fetchFullMatchDetails:', error);
    return null;
  }
};

export const fetchRoundMatches = async (leagueId, roundNumber) => {
  try {
    const res = await fetch(`${BASE_URL}/tournament/${leagueId}/round/${roundNumber}/matches`);
    if (!res.ok) throw new Error('Network response was not ok');
    const json = await res.json();
    // Parseo defensivo para encontrar el array de eventos
    return json.events || json.data?.events || (Array.isArray(json) ? json : []);
  } catch (error) {
    console.error('[API ERROR] fetchRoundMatches:', error);
    return [];
  }
};
