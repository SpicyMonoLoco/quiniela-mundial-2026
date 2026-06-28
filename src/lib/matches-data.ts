// 72 partidos de la fase de grupos del Mundial 2026.
// Fuentes: FIFA + Wikipedia + medios (NBC, Sky, MLSSoccer, Yahoo, FoxSports).
// Las horas son las anunciadas oficialmente. Los offsets corresponden a junio 2026.
// CDMX está siempre en UTC-6 (México eliminó horario de verano en 2022).
//
// 6 partidos tienen `timeConfirmed: false` — fecha/sede/oponentes confirmados,
// pero la hora exacta se infirió del patrón. Verifica en fifa.com antes del kickoff.

export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'tp' | 'final';

export type RawMatch = {
  id: number;
  stage: Stage;
  group_letter: string | null;
  matchday: number | null;
  // hora local en el estadio
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h, local del estadio)
  tzOffset: number; // horas vs UTC (junio/julio 2026, ya con DST aplicado)
  venue: string;
  city: string;
  country: 'MEX' | 'USA' | 'CAN';
  home: string;
  away: string;
  timeConfirmed?: boolean;
};

export const RAW_MATCHES: RawMatch[] = [
  // ===== Matchday 1 =====
  { id: 1,  stage: 'group', group_letter: 'A', matchday: 1, date: '2026-06-11', time: '13:00', tzOffset: -6, venue: 'Estadio Azteca',      city: 'Ciudad de México',  country: 'MEX', home: 'México',                   away: 'Sudáfrica' },
  { id: 2,  stage: 'group', group_letter: 'A', matchday: 1, date: '2026-06-11', time: '20:00', tzOffset: -6, venue: 'Estadio Akron',       city: 'Guadalajara',       country: 'MEX', home: 'Corea del Sur',            away: 'República Checa' },
  { id: 3,  stage: 'group', group_letter: 'D', matchday: 1, date: '2026-06-12', time: '18:00', tzOffset: -7, venue: 'SoFi Stadium',        city: 'Inglewood (LA)',    country: 'USA', home: 'Estados Unidos',           away: 'Paraguay' },
  { id: 4,  stage: 'group', group_letter: 'B', matchday: 1, date: '2026-06-12', time: '15:00', tzOffset: -4, venue: 'BMO Field',           city: 'Toronto',           country: 'CAN', home: 'Canadá',                   away: 'Bosnia y Herzegovina' },
  { id: 5,  stage: 'group', group_letter: 'C', matchday: 1, date: '2026-06-13', time: '18:00', tzOffset: -4, venue: 'MetLife Stadium',     city: 'East Rutherford',   country: 'USA', home: 'Brasil',                   away: 'Marruecos' },
  { id: 6,  stage: 'group', group_letter: 'C', matchday: 1, date: '2026-06-13', time: '21:00', tzOffset: -4, venue: 'Gillette Stadium',    city: 'Foxborough',        country: 'USA', home: 'Haití',                    away: 'Escocia' },
  { id: 7,  stage: 'group', group_letter: 'B', matchday: 1, date: '2026-06-13', time: '12:00', tzOffset: -7, venue: "Levi's Stadium",      city: 'Santa Clara',       country: 'USA', home: 'Qatar',                    away: 'Suiza' },
  { id: 8,  stage: 'group', group_letter: 'D', matchday: 1, date: '2026-06-13', time: '21:00', tzOffset: -7, venue: 'BC Place',            city: 'Vancouver',         country: 'CAN', home: 'Australia',                away: 'Türkiye' },
  { id: 9,  stage: 'group', group_letter: 'E', matchday: 1, date: '2026-06-14', time: '12:00', tzOffset: -5, venue: 'NRG Stadium',         city: 'Houston',           country: 'USA', home: 'Alemania',                 away: 'Curazao' },
  { id: 10, stage: 'group', group_letter: 'E', matchday: 1, date: '2026-06-14', time: '19:00', tzOffset: -4, venue: 'Lincoln Financial',   city: 'Philadelphia',      country: 'USA', home: 'Costa de Marfil',          away: 'Ecuador' },
  { id: 11, stage: 'group', group_letter: 'F', matchday: 1, date: '2026-06-14', time: '20:00', tzOffset: -6, venue: 'Estadio BBVA',        city: 'Monterrey',         country: 'MEX', home: 'Suecia',                   away: 'Túnez' },
  { id: 12, stage: 'group', group_letter: 'F', matchday: 1, date: '2026-06-14', time: '15:00', tzOffset: -5, venue: 'AT&T Stadium',        city: 'Arlington',         country: 'USA', home: 'Países Bajos',             away: 'Japón' },
  { id: 13, stage: 'group', group_letter: 'G', matchday: 1, date: '2026-06-15', time: '12:00', tzOffset: -7, venue: 'Lumen Field',         city: 'Seattle',           country: 'USA', home: 'Bélgica',                  away: 'Egipto' },
  { id: 14, stage: 'group', group_letter: 'G', matchday: 1, date: '2026-06-15', time: '18:00', tzOffset: -7, venue: 'SoFi Stadium',        city: 'Inglewood (LA)',    country: 'USA', home: 'Irán',                     away: 'Nueva Zelanda' },
  { id: 15, stage: 'group', group_letter: 'H', matchday: 1, date: '2026-06-15', time: '12:00', tzOffset: -4, venue: 'Mercedes-Benz Stad.', city: 'Atlanta',           country: 'USA', home: 'España',                   away: 'Cabo Verde' },
  { id: 16, stage: 'group', group_letter: 'H', matchday: 1, date: '2026-06-15', time: '18:00', tzOffset: -4, venue: 'Hard Rock Stadium',   city: 'Miami',             country: 'USA', home: 'Arabia Saudí',             away: 'Uruguay' },
  { id: 17, stage: 'group', group_letter: 'I', matchday: 1, date: '2026-06-16', time: '15:00', tzOffset: -4, venue: 'MetLife Stadium',     city: 'East Rutherford',   country: 'USA', home: 'Francia',                  away: 'Senegal' },
  { id: 18, stage: 'group', group_letter: 'I', matchday: 1, date: '2026-06-16', time: '18:00', tzOffset: -4, venue: 'Gillette Stadium',    city: 'Foxborough',        country: 'USA', home: 'Irak',                     away: 'Noruega' },
  { id: 19, stage: 'group', group_letter: 'J', matchday: 1, date: '2026-06-16', time: '20:00', tzOffset: -5, venue: 'Arrowhead Stadium',   city: 'Kansas City',       country: 'USA', home: 'Argentina',                away: 'Argelia' },
  { id: 20, stage: 'group', group_letter: 'J', matchday: 1, date: '2026-06-16', time: '21:00', tzOffset: -7, venue: "Levi's Stadium",      city: 'Santa Clara',       country: 'USA', home: 'Austria',                  away: 'Jordania' },
  { id: 21, stage: 'group', group_letter: 'K', matchday: 1, date: '2026-06-17', time: '12:00', tzOffset: -5, venue: 'NRG Stadium',         city: 'Houston',           country: 'USA', home: 'Portugal',                 away: 'RD Congo' },
  { id: 22, stage: 'group', group_letter: 'K', matchday: 1, date: '2026-06-17', time: '20:00', tzOffset: -6, venue: 'Estadio Azteca',      city: 'Ciudad de México',  country: 'MEX', home: 'Uzbekistán',               away: 'Colombia' },
  { id: 23, stage: 'group', group_letter: 'L', matchday: 1, date: '2026-06-17', time: '15:00', tzOffset: -5, venue: 'AT&T Stadium',        city: 'Arlington',         country: 'USA', home: 'Inglaterra',               away: 'Croacia' },
  { id: 24, stage: 'group', group_letter: 'L', matchday: 1, date: '2026-06-17', time: '19:00', tzOffset: -4, venue: 'BMO Field',           city: 'Toronto',           country: 'CAN', home: 'Ghana',                    away: 'Panamá' },

  // ===== Matchday 2 =====
  { id: 25, stage: 'group', group_letter: 'A', matchday: 2, date: '2026-06-18', time: '19:00', tzOffset: -6, venue: 'Estadio Akron',       city: 'Guadalajara',       country: 'MEX', home: 'México',                   away: 'Corea del Sur' },
  { id: 26, stage: 'group', group_letter: 'A', matchday: 2, date: '2026-06-18', time: '12:00', tzOffset: -4, venue: 'Mercedes-Benz Stad.', city: 'Atlanta',           country: 'USA', home: 'República Checa',          away: 'Sudáfrica' },
  { id: 27, stage: 'group', group_letter: 'B', matchday: 2, date: '2026-06-18', time: '15:00', tzOffset: -7, venue: 'BC Place',            city: 'Vancouver',         country: 'CAN', home: 'Canadá',                   away: 'Qatar' },
  { id: 28, stage: 'group', group_letter: 'B', matchday: 2, date: '2026-06-18', time: '12:00', tzOffset: -7, venue: 'SoFi Stadium',        city: 'Inglewood (LA)',    country: 'USA', home: 'Suiza',                    away: 'Bosnia y Herzegovina' },
  { id: 29, stage: 'group', group_letter: 'C', matchday: 2, date: '2026-06-19', time: '18:00', tzOffset: -4, venue: 'Gillette Stadium',    city: 'Foxborough',        country: 'USA', home: 'Escocia',                  away: 'Marruecos' },
  { id: 30, stage: 'group', group_letter: 'C', matchday: 2, date: '2026-06-19', time: '20:30', tzOffset: -4, venue: 'Lincoln Financial',   city: 'Philadelphia',      country: 'USA', home: 'Brasil',                   away: 'Haití' },
  { id: 31, stage: 'group', group_letter: 'D', matchday: 2, date: '2026-06-19', time: '12:00', tzOffset: -7, venue: 'Lumen Field',         city: 'Seattle',           country: 'USA', home: 'Estados Unidos',           away: 'Australia' },
  { id: 32, stage: 'group', group_letter: 'D', matchday: 2, date: '2026-06-19', time: '20:00', tzOffset: -7, venue: "Levi's Stadium",      city: 'Santa Clara',       country: 'USA', home: 'Türkiye',                  away: 'Paraguay' },
  { id: 33, stage: 'group', group_letter: 'E', matchday: 2, date: '2026-06-20', time: '16:00', tzOffset: -4, venue: 'BMO Field',           city: 'Toronto',           country: 'CAN', home: 'Alemania',                 away: 'Costa de Marfil' },
  { id: 34, stage: 'group', group_letter: 'E', matchday: 2, date: '2026-06-20', time: '19:00', tzOffset: -5, venue: 'Arrowhead Stadium',   city: 'Kansas City',       country: 'USA', home: 'Ecuador',                  away: 'Curazao' },
  { id: 35, stage: 'group', group_letter: 'F', matchday: 2, date: '2026-06-20', time: '12:00', tzOffset: -5, venue: 'NRG Stadium',         city: 'Houston',           country: 'USA', home: 'Países Bajos',             away: 'Suecia' },
  { id: 36, stage: 'group', group_letter: 'F', matchday: 2, date: '2026-06-20', time: '22:00', tzOffset: -6, venue: 'Estadio BBVA',        city: 'Monterrey',         country: 'MEX', home: 'Túnez',                    away: 'Japón' },
  { id: 37, stage: 'group', group_letter: 'G', matchday: 2, date: '2026-06-21', time: '12:00', tzOffset: -7, venue: 'SoFi Stadium',        city: 'Inglewood (LA)',    country: 'USA', home: 'Bélgica',                  away: 'Irán' },
  { id: 38, stage: 'group', group_letter: 'G', matchday: 2, date: '2026-06-21', time: '18:00', tzOffset: -7, venue: 'BC Place',            city: 'Vancouver',         country: 'CAN', home: 'Nueva Zelanda',            away: 'Egipto' },
  { id: 39, stage: 'group', group_letter: 'H', matchday: 2, date: '2026-06-21', time: '12:00', tzOffset: -4, venue: 'Mercedes-Benz Stad.', city: 'Atlanta',           country: 'USA', home: 'España',                   away: 'Arabia Saudí' },
  { id: 40, stage: 'group', group_letter: 'H', matchday: 2, date: '2026-06-21', time: '18:00', tzOffset: -4, venue: 'Hard Rock Stadium',   city: 'Miami',             country: 'USA', home: 'Uruguay',                  away: 'Cabo Verde' },
  { id: 41, stage: 'group', group_letter: 'I', matchday: 2, date: '2026-06-22', time: '17:00', tzOffset: -4, venue: 'Lincoln Financial',   city: 'Philadelphia',      country: 'USA', home: 'Francia',                  away: 'Irak' },
  { id: 42, stage: 'group', group_letter: 'I', matchday: 2, date: '2026-06-22', time: '20:00', tzOffset: -4, venue: 'MetLife Stadium',     city: 'East Rutherford',   country: 'USA', home: 'Noruega',                  away: 'Senegal' },
  { id: 43, stage: 'group', group_letter: 'J', matchday: 2, date: '2026-06-22', time: '12:00', tzOffset: -5, venue: 'AT&T Stadium',        city: 'Arlington',         country: 'USA', home: 'Argentina',                away: 'Austria' },
  { id: 44, stage: 'group', group_letter: 'J', matchday: 2, date: '2026-06-22', time: '20:00', tzOffset: -7, venue: "Levi's Stadium",      city: 'Santa Clara',       country: 'USA', home: 'Jordania',                 away: 'Argelia' },
  { id: 45, stage: 'group', group_letter: 'K', matchday: 2, date: '2026-06-23', time: '12:00', tzOffset: -5, venue: 'NRG Stadium',         city: 'Houston',           country: 'USA', home: 'Portugal',                 away: 'Uzbekistán' },
  { id: 46, stage: 'group', group_letter: 'K', matchday: 2, date: '2026-06-23', time: '20:00', tzOffset: -6, venue: 'Estadio Akron',       city: 'Guadalajara',       country: 'MEX', home: 'Colombia',                 away: 'RD Congo' },
  { id: 47, stage: 'group', group_letter: 'L', matchday: 2, date: '2026-06-23', time: '16:00', tzOffset: -4, venue: 'Gillette Stadium',    city: 'Foxborough',        country: 'USA', home: 'Inglaterra',               away: 'Ghana' },
  { id: 48, stage: 'group', group_letter: 'L', matchday: 2, date: '2026-06-23', time: '19:00', tzOffset: -4, venue: 'BMO Field',           city: 'Toronto',           country: 'CAN', home: 'Panamá',                   away: 'Croacia' },

  // ===== Matchday 3 (kickoffs simultáneos por grupo) =====
  { id: 49, stage: 'group', group_letter: 'A', matchday: 3, date: '2026-06-24', time: '19:00', tzOffset: -6, venue: 'Estadio Azteca',      city: 'Ciudad de México',  country: 'MEX', home: 'República Checa',          away: 'México' },
  { id: 50, stage: 'group', group_letter: 'A', matchday: 3, date: '2026-06-24', time: '19:00', tzOffset: -6, venue: 'Estadio BBVA',        city: 'Monterrey',         country: 'MEX', home: 'Sudáfrica',                away: 'Corea del Sur' },
  { id: 51, stage: 'group', group_letter: 'B', matchday: 3, date: '2026-06-24', time: '12:00', tzOffset: -7, venue: 'BC Place',            city: 'Vancouver',         country: 'CAN', home: 'Suiza',                    away: 'Canadá' },
  { id: 52, stage: 'group', group_letter: 'B', matchday: 3, date: '2026-06-24', time: '12:00', tzOffset: -7, venue: 'Lumen Field',         city: 'Seattle',           country: 'USA', home: 'Bosnia y Herzegovina',     away: 'Qatar' },
  { id: 53, stage: 'group', group_letter: 'C', matchday: 3, date: '2026-06-24', time: '18:00', tzOffset: -4, venue: 'Hard Rock Stadium',   city: 'Miami',             country: 'USA', home: 'Escocia',                  away: 'Brasil' },
  { id: 54, stage: 'group', group_letter: 'C', matchday: 3, date: '2026-06-24', time: '18:00', tzOffset: -4, venue: 'MetLife Stadium',     city: 'East Rutherford',   country: 'USA', home: 'Marruecos',                away: 'Haití' },
  { id: 55, stage: 'group', group_letter: 'D', matchday: 3, date: '2026-06-25', time: '19:00', tzOffset: -7, venue: 'SoFi Stadium',        city: 'Inglewood (LA)',    country: 'USA', home: 'Türkiye',                  away: 'Estados Unidos' },
  { id: 56, stage: 'group', group_letter: 'D', matchday: 3, date: '2026-06-25', time: '19:00', tzOffset: -7, venue: "Levi's Stadium",      city: 'Santa Clara',       country: 'USA', home: 'Paraguay',                 away: 'Australia' },
  { id: 57, stage: 'group', group_letter: 'E', matchday: 3, date: '2026-06-25', time: '16:00', tzOffset: -4, venue: 'MetLife Stadium',     city: 'East Rutherford',   country: 'USA', home: 'Ecuador',                  away: 'Alemania' },
  { id: 58, stage: 'group', group_letter: 'E', matchday: 3, date: '2026-06-25', time: '16:00', tzOffset: -4, venue: 'Lincoln Financial',   city: 'Philadelphia',      country: 'USA', home: 'Curazao',                  away: 'Costa de Marfil' },
  { id: 59, stage: 'group', group_letter: 'F', matchday: 3, date: '2026-06-25', time: '18:00', tzOffset: -5, venue: 'AT&T Stadium',        city: 'Arlington',         country: 'USA', home: 'Japón',                    away: 'Suecia' },
  { id: 60, stage: 'group', group_letter: 'F', matchday: 3, date: '2026-06-25', time: '18:00', tzOffset: -5, venue: 'Arrowhead Stadium',   city: 'Kansas City',       country: 'USA', home: 'Túnez',                    away: 'Países Bajos' },
  { id: 61, stage: 'group', group_letter: 'G', matchday: 3, date: '2026-06-26', time: '20:00', tzOffset: -7, venue: 'Lumen Field',         city: 'Seattle',           country: 'USA', home: 'Egipto',                   away: 'Irán' },
  { id: 62, stage: 'group', group_letter: 'G', matchday: 3, date: '2026-06-26', time: '20:00', tzOffset: -7, venue: 'BC Place',            city: 'Vancouver',         country: 'CAN', home: 'Nueva Zelanda',            away: 'Bélgica' },
  { id: 63, stage: 'group', group_letter: 'H', matchday: 3, date: '2026-06-26', time: '19:00', tzOffset: -5, venue: 'NRG Stadium',         city: 'Houston',           country: 'USA', home: 'Cabo Verde',               away: 'Arabia Saudí' },
  { id: 64, stage: 'group', group_letter: 'H', matchday: 3, date: '2026-06-26', time: '18:00', tzOffset: -6, venue: 'Estadio Akron',       city: 'Guadalajara',       country: 'MEX', home: 'Uruguay',                  away: 'España' },
  { id: 65, stage: 'group', group_letter: 'I', matchday: 3, date: '2026-06-26', time: '15:00', tzOffset: -4, venue: 'Gillette Stadium',    city: 'Foxborough',        country: 'USA', home: 'Noruega',                  away: 'Francia' },
  { id: 66, stage: 'group', group_letter: 'I', matchday: 3, date: '2026-06-26', time: '15:00', tzOffset: -4, venue: 'BMO Field',           city: 'Toronto',           country: 'CAN', home: 'Senegal',                  away: 'Irak' },
  { id: 67, stage: 'group', group_letter: 'J', matchday: 3, date: '2026-06-27', time: '21:00', tzOffset: -5, venue: 'AT&T Stadium',        city: 'Arlington',         country: 'USA', home: 'Jordania',                 away: 'Argentina' },
  { id: 68, stage: 'group', group_letter: 'J', matchday: 3, date: '2026-06-27', time: '21:00', tzOffset: -5, venue: 'Arrowhead Stadium',   city: 'Kansas City',       country: 'USA', home: 'Argelia',                  away: 'Austria' },
  { id: 69, stage: 'group', group_letter: 'K', matchday: 3, date: '2026-06-27', time: '19:30', tzOffset: -4, venue: 'Hard Rock Stadium',   city: 'Miami',             country: 'USA', home: 'Colombia',                 away: 'Portugal' },
  { id: 70, stage: 'group', group_letter: 'K', matchday: 3, date: '2026-06-27', time: '19:30', tzOffset: -4, venue: 'Mercedes-Benz Stad.', city: 'Atlanta',           country: 'USA', home: 'RD Congo',                 away: 'Uzbekistán' },
  { id: 71, stage: 'group', group_letter: 'L', matchday: 3, date: '2026-06-27', time: '17:00', tzOffset: -4, venue: 'MetLife Stadium',     city: 'East Rutherford',   country: 'USA', home: 'Panamá',                   away: 'Inglaterra' },
  { id: 72, stage: 'group', group_letter: 'L', matchday: 3, date: '2026-06-27', time: '17:00', tzOffset: -4, venue: 'Lincoln Financial',   city: 'Philadelphia',      country: 'USA', home: 'Croacia',                  away: 'Ghana' },

  // ============================================================
  //  FASE ELIMINATORIA — placeholders. Cuando termine la fase de
  //  grupos, edita los nombres reales desde /admin.
  //  Fechas y sedes oficiales del calendario FIFA 2026.
  // ============================================================

  // ===== Dieciseisavos (R32) — 28 jun a 3 jul =====
  { id: 73,  stage: 'r32', group_letter: null, matchday: null, date: '2026-06-28', time: '12:00', tzOffset: -7, venue: 'SoFi Stadium',           city: 'Inglewood (LA)',     country: 'USA', home: '2° A',  away: '2° B' },
  { id: 74,  stage: 'r32', group_letter: null, matchday: null, date: '2026-06-29', time: '16:30', tzOffset: -4, venue: 'Gillette Stadium',       city: 'Foxborough',         country: 'USA', home: '1° E',  away: 'Mejor 3° (A/B/C/D/F)' },
  { id: 75,  stage: 'r32', group_letter: null, matchday: null, date: '2026-06-29', time: '19:00', tzOffset: -6, venue: 'Estadio BBVA',           city: 'Monterrey',          country: 'MEX', home: '1° F',  away: '2° C' },
  { id: 76,  stage: 'r32', group_letter: null, matchday: null, date: '2026-06-29', time: '12:00', tzOffset: -5, venue: 'NRG Stadium',            city: 'Houston',            country: 'USA', home: '1° C',  away: '2° F' },
  { id: 77,  stage: 'r32', group_letter: null, matchday: null, date: '2026-06-30', time: '17:00', tzOffset: -4, venue: 'MetLife Stadium',        city: 'East Rutherford',    country: 'USA', home: '1° I',  away: 'Mejor 3° (C/D/F/G/H)' },
  { id: 78,  stage: 'r32', group_letter: null, matchday: null, date: '2026-06-30', time: '12:00', tzOffset: -5, venue: 'AT&T Stadium',           city: 'Arlington',          country: 'USA', home: '2° E',  away: '2° I' },
  { id: 79,  stage: 'r32', group_letter: null, matchday: null, date: '2026-06-30', time: '19:00', tzOffset: -6, venue: 'Estadio Azteca',         city: 'Ciudad de México',   country: 'MEX', home: '1° A',  away: 'Mejor 3° (C/E/F/H/I)' },
  { id: 80,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-01', time: '12:00', tzOffset: -4, venue: 'Mercedes-Benz Stad.',    city: 'Atlanta',            country: 'USA', home: '1° L',  away: 'Mejor 3° (E/H/I/J/K)' },
  { id: 81,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-01', time: '17:00', tzOffset: -7, venue: "Levi's Stadium",         city: 'Santa Clara',        country: 'USA', home: '1° D',  away: 'Mejor 3° (B/E/F/I/J)' },
  { id: 82,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-01', time: '13:00', tzOffset: -7, venue: 'Lumen Field',            city: 'Seattle',            country: 'USA', home: '1° G',  away: 'Mejor 3° (A/E/H/I/J)' },
  { id: 83,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-02', time: '19:00', tzOffset: -4, venue: 'BMO Field',              city: 'Toronto',            country: 'CAN', home: '2° K',  away: '2° L' },
  { id: 84,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-02', time: '12:00', tzOffset: -7, venue: 'SoFi Stadium',           city: 'Inglewood (LA)',     country: 'USA', home: '1° H',  away: '2° J' },
  { id: 85,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-02', time: '20:00', tzOffset: -7, venue: 'BC Place',               city: 'Vancouver',          country: 'CAN', home: '1° B',  away: 'Mejor 3° (E/F/G/I/J)' },
  { id: 86,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-03', time: '18:00', tzOffset: -4, venue: 'Hard Rock Stadium',      city: 'Miami',              country: 'USA', home: '1° J',  away: '2° H' },
  { id: 87,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-03', time: '20:30', tzOffset: -5, venue: 'Arrowhead Stadium',      city: 'Kansas City',        country: 'USA', home: '1° K',  away: 'Mejor 3° (D/E/I/J/L)' },
  { id: 88,  stage: 'r32', group_letter: null, matchday: null, date: '2026-07-03', time: '13:00', tzOffset: -5, venue: 'AT&T Stadium',           city: 'Arlington',          country: 'USA', home: '2° D',  away: '2° G' },

  // ===== Octavos (R16) — 4 a 7 jul =====
  { id: 89,  stage: 'r16', group_letter: null, matchday: null, date: '2026-07-04', time: '17:00', tzOffset: -4, venue: 'Lincoln Financial',      city: 'Philadelphia',       country: 'USA', home: 'Ganador 74', away: 'Ganador 77' },
  { id: 90,  stage: 'r16', group_letter: null, matchday: null, date: '2026-07-04', time: '12:00', tzOffset: -5, venue: 'NRG Stadium',            city: 'Houston',            country: 'USA', home: 'Ganador 73', away: 'Ganador 75' },
  { id: 91,  stage: 'r16', group_letter: null, matchday: null, date: '2026-07-05', time: '16:00', tzOffset: -4, venue: 'MetLife Stadium',        city: 'East Rutherford',    country: 'USA', home: 'Ganador 76', away: 'Ganador 78' },
  { id: 92,  stage: 'r16', group_letter: null, matchday: null, date: '2026-07-05', time: '18:00', tzOffset: -6, venue: 'Estadio Azteca',         city: 'Ciudad de México',   country: 'MEX', home: 'Ganador 79', away: 'Ganador 80' },
  { id: 93,  stage: 'r16', group_letter: null, matchday: null, date: '2026-07-06', time: '14:00', tzOffset: -5, venue: 'AT&T Stadium',           city: 'Arlington',          country: 'USA', home: 'Ganador 87', away: 'Ganador 84' },
  { id: 94,  stage: 'r16', group_letter: null, matchday: null, date: '2026-07-06', time: '17:00', tzOffset: -7, venue: 'Lumen Field',            city: 'Seattle',            country: 'USA', home: 'Ganador 81', away: 'Ganador 82' },
  { id: 95,  stage: 'r16', group_letter: null, matchday: null, date: '2026-07-07', time: '12:00', tzOffset: -4, venue: 'Mercedes-Benz Stad.',    city: 'Atlanta',            country: 'USA', home: 'Ganador 86', away: 'Ganador 88' },
  { id: 96,  stage: 'r16', group_letter: null, matchday: null, date: '2026-07-07', time: '13:00', tzOffset: -7, venue: 'BC Place',               city: 'Vancouver',          country: 'CAN', home: 'Ganador 85', away: 'Ganador 83' },

  // ===== Cuartos (QF) — 9 a 11 jul =====
  { id: 97,  stage: 'qf',  group_letter: null, matchday: null, date: '2026-07-09', time: '16:00', tzOffset: -4, venue: 'Gillette Stadium',       city: 'Foxborough',         country: 'USA', home: 'Ganador 89', away: 'Ganador 90' },
  { id: 98,  stage: 'qf',  group_letter: null, matchday: null, date: '2026-07-10', time: '12:00', tzOffset: -7, venue: 'SoFi Stadium',           city: 'Inglewood (LA)',     country: 'USA', home: 'Ganador 93', away: 'Ganador 94' },
  { id: 99,  stage: 'qf',  group_letter: null, matchday: null, date: '2026-07-11', time: '17:00', tzOffset: -4, venue: 'Hard Rock Stadium',      city: 'Miami',              country: 'USA', home: 'Ganador 91', away: 'Ganador 92' },
  { id: 100, stage: 'qf',  group_letter: null, matchday: null, date: '2026-07-11', time: '20:00', tzOffset: -5, venue: 'Arrowhead Stadium',      city: 'Kansas City',        country: 'USA', home: 'Ganador 95', away: 'Ganador 96' },

  // ===== Semis — 14 y 15 jul =====
  { id: 101, stage: 'sf',  group_letter: null, matchday: null, date: '2026-07-14', time: '14:00', tzOffset: -5, venue: 'AT&T Stadium',           city: 'Arlington',          country: 'USA', home: 'Ganador 97', away: 'Ganador 98' },
  { id: 102, stage: 'sf',  group_letter: null, matchday: null, date: '2026-07-15', time: '15:00', tzOffset: -4, venue: 'Mercedes-Benz Stad.',    city: 'Atlanta',            country: 'USA', home: 'Ganador 99', away: 'Ganador 100' },

  // ===== Tercer lugar — 18 jul =====
  { id: 103, stage: 'tp',  group_letter: null, matchday: null, date: '2026-07-18', time: '17:00', tzOffset: -4, venue: 'Hard Rock Stadium',      city: 'Miami',              country: 'USA', home: 'Perdedor 101', away: 'Perdedor 102' },

  // ===== Final — 19 jul =====
  { id: 104, stage: 'final', group_letter: null, matchday: null, date: '2026-07-19', time: '15:00', tzOffset: -4, venue: 'MetLife Stadium',     city: 'East Rutherford',    country: 'USA', home: 'Ganador 101', away: 'Ganador 102' }
];

// Convierte "fecha local + hora local + offset" a un ISO string UTC.
export function toUtcIso(date: string, time: string, tzOffset: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  // Date.UTC interpreta los números como UTC. Restamos el offset para llegar a UTC real.
  const ms = Date.UTC(y, m - 1, d, hh - tzOffset, mm);
  return new Date(ms).toISOString();
}

export type SeedMatch = Omit<RawMatch, 'date' | 'time' | 'tzOffset'> & {
  kickoff_utc: string;
};

export const SEED_MATCHES: SeedMatch[] = RAW_MATCHES.map((m) => {
  const { date, time, tzOffset, ...rest } = m;
  return { ...rest, kickoff_utc: toUtcIso(date, time, tzOffset) };
});

// Para mostrar en CDMX (UTC-6, sin DST)
export function formatCDMX(isoUtc: string): { date: string; time: string } {
  const ms = new Date(isoUtc).getTime() - 6 * 3600 * 1000;
  const d = new Date(ms);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return { date, time };
}
