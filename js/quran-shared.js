/* Shared Quran helpers used by BOTH the popup (index.js) and the service worker.
   Loaded via <script> in index.html and via importScripts() in serviceWorker.js.
   Pure functions only (no DOM, no chrome.* calls) so it is safe in either context. */

/* Surah audio: one MP3 per surah. Only bitrate 128 is served for surah audio, and the
   islamic.network CDN id is the reciter identifier with any trailing '-surah' stripped. */
const QURAN_AUDIO_BASE = 'https://cdn.islamic.network/quran/audio-surah/128/';
const QURAN_DEFAULT_RECITER = 'ar.alafasy-surah';
const QURAN_SURAH_COUNT = 114;

/* When Qur'an playback auto-resumes after an adhan/alarm interrupted it, rewind this many
   seconds for context. A manual pause → play resumes from the exact spot (no rewind). */
const QURAN_ADHAN_RESUME_REWIND = 10;

function quranReciterCdnId(identifier) {
    return (identifier && identifier.endsWith('-surah')) ? identifier.slice(0, -6) : identifier;
}

/* Reciters not surah-by-surah on islamic.network are served from mp3quran.net instead:
   {base}/{NNN}.mp3 (zero-padded surah number). Keyed by the reciter identifier in quran-reciters.js. */
const QURAN_ALT_AUDIO_BASES = {
    'mp3quran.sudais': 'https://cdn.mp3quran.net/audio/abdulrahman-sudais/r1/',
    'mp3quran.maher': 'https://cdn.mp3quran.net/audio/maher-muaiqly/r1/',
    'mp3quran.mahermujawwad': 'https://cdn.mp3quran.net/audio/maher-muaiqly/r3/',
    'mp3quran.wadieyamani': 'https://cdn.mp3quran.net/audio/wadee-yamani/r1/',
    'mp3quran.minshawi': 'https://cdn.mp3quran.net/audio/muhammad-minshawi/r1/',
    'mp3quran.husary': 'https://cdn.mp3quran.net/audio/mahmoud-husary/r1/',
    'mp3quran.saadalghamdi': 'https://cdn.mp3quran.net/audio/saad-ghamdi/r1/',
    'mp3quran.shatri': 'https://cdn.mp3quran.net/audio/abubakr-shatri/r1/',
    'mp3quran.alijaber': 'https://cdn.mp3quran.net/audio/ali-jaber/r1/',
    'mp3quran.budair': 'https://cdn.mp3quran.net/audio/salah-budair/r1/',
    'mp3quran.abdulmohsenqasim': 'https://cdn.mp3quran.net/audio/abdulmohsen-qasim/r1/'
};

function quranSurahAudioUrl(surahNumber, reciterIdentifier) {
    const alt = QURAN_ALT_AUDIO_BASES[reciterIdentifier];
    if (alt) return alt + String(surahNumber).padStart(3, '0') + '.mp3';
    return QURAN_AUDIO_BASE + quranReciterCdnId(reciterIdentifier) + '/' + surahNumber + '.mp3';
}

/* The chosen reciter (one global reciter for all surahs), else the default. */
function quranReciter(quran) {
    return (quran && quran.reciter) || QURAN_DEFAULT_RECITER;
}
