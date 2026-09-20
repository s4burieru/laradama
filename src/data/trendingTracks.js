// ============================================================================
// TRENDING MUSIC POOL — powers the Spotify player on /features
// ----------------------------------------------------------------------------
// Snapshot taken from Spotify's daily charts via kworb.net on TRENDING_SNAPSHOT:
//   International -> https://kworb.net/spotify/country/global_daily.html (Top 20)
//   OPM           -> https://kworb.net/spotify/country/ph_daily.html    (Filipino artists)
//
// Every id below was verified against Spotify's public oEmbed endpoint
// (https://open.spotify.com/oembed?url=https://open.spotify.com/track/<id>),
// so the embeds always resolve. `rank` is the song's position on that chart.
//
// TO REFRESH: open the two chart links, replace the entries with the current
// top tracks (keep `rank` accurate), bump TRENDING_SNAPSHOT and re-verify the
// ids with the oEmbed call above. The player shuffles this pool, so the order
// inside the array does not matter.
// ============================================================================

export const TRENDING_SNAPSHOT = "2026-09-18";

export const trendingTracks = [
  { id: "3h5T5JypYU7huFiVYhv1dr", title: "BbY WOW", artist: "KAROL G", region: "international", rank: 1 },
  { id: "02HyFYmpzt02VJ8k0CqxKj", title: "Ain't In LA", artist: "ADÉLA", region: "international", rank: 2 },
  { id: "0eAuGrXyGFYwur9ARUe7LJ", title: "Earrings", artist: "Malcolm Todd", region: "international", rank: 3 },
  { id: "70cHKK8bHAfJrOGVnfRG9J", title: "Nicole Kidman", artist: "ADÉLA", region: "international", rank: 4 },
  { id: "6QFCMUUq1T2Vf5sFUXcuQ7", title: "Beauty And A Beat", artist: "Justin Bieber", region: "international", rank: 5 },
  { id: "4qW3BbQAwZsrnu8a3ZRdyT", title: "Self Aware", artist: "Temper City", region: "international", rank: 6 },
  { id: "2009X8GyWTqyxIdzAEYW6N", title: "The One That Got Away", artist: "Katy Perry", region: "international", rank: 7 },
  { id: "6Qyc6fS4DsZjB2mRW9DsQs", title: "Iris", artist: "Goo Goo Dolls", region: "international", rank: 8 },
  { id: "55pBIZO1cqoldeqpp5WR7H", title: "the cure", artist: "Olivia Rodrigo", region: "international", rank: 9 },
  { id: "7bxaFZ1O3cHkgLKMsdC3xR", title: "Loser", artist: "Tame Impala", region: "international", rank: 10 },
  { id: "2plbrEY59IikOBgBGLjaoe", title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", region: "international", rank: 11 },
  { id: "7yNf9YjeO5JXUE3JEBgnYc", title: "Babydoll", artist: "Dominic Fike", region: "international", rank: 12 },
  { id: "7qjZnBKE73H4Oxkopwulqe", title: "back to friends", artist: "sombr", region: "international", rank: 13 },
  { id: "20jbSiX29FDX4oQxBXyUEi", title: "hate that i made you love me", artist: "Ariana Grande", region: "international", rank: 14 },
  { id: "0kosUz0jePvjiz4ctmR6wL", title: "Dai Dai", artist: "Shakira", region: "international", rank: 15 },
  { id: "5b5cPscqVEMChvDqscVw26", title: "Training Season", artist: "Dua Lipa", region: "international", rank: 16 },
  { id: "7scFxt9VhL4FJwuPSfRlfN", title: "Choosin' Texas", artist: "Ella Langley", region: "international", rank: 17 },
  { id: "5qqabIl2vWzo9ApSC317sa", title: "Wonderwall (Remastered)", artist: "Oasis", region: "international", rank: 18 },
  { id: "68lbSrXDORS51pmyjZv712", title: "SWIM", artist: "BTS", region: "international", rank: 19 },
  { id: "49j6SvuvWfbEKZKzsHCdLJ", title: "stupid song", artist: "Olivia Rodrigo", region: "international", rank: 20 },

  { id: "0D5huw4lFGtUfCkf91rGvQ", title: "Mahal Magmahal", artist: "Esremborak", region: "opm", rank: 1 },
  { id: "1udOOSbJnytCdgvbgYOF5s", title: "Kalapastangan", artist: "fitterkarma", region: "opm", rank: 2 },
  { id: "3Fu4WzdH4SpUUPLroN4qyS", title: "Totoong tayo", artist: "Jin DC", region: "opm", rank: 3 },
  { id: "3cZUIZ8i74C1Kvnix4xZez", title: "Libu-Libong Buwan (Uuwian)", artist: "Kyle Raphael", region: "opm", rank: 4 },
  { id: "6wcjLOGIdmw8BUaRho4c9L", title: "Panaginip", artist: "nicole", region: "opm", rank: 5 },
  { id: "6dz4FTaIgrPIk7lfphecQh", title: "Summer Crush", artist: "HELLMERRY", region: "opm", rank: 7 },
  { id: "410fyfFghBsxNu45LiNJ24", title: "Pag-Ibig ay Kanibalismo II", artist: "fitterkarma", region: "opm", rank: 8 },
  { id: "71b7gpfBHekpvpZMSxqMTT", title: "TMA", artist: "groundZERO Records", region: "opm", rank: 9 },
  { id: "4yzDFThA5Xd1s9aZzwyxCk", title: "Since Day One", artist: "Skusta Clee", region: "opm", rank: 10 },
  { id: "4Nyyfm1HlgI2QsaKfuu6Ol", title: "Dominga", artist: "La Mave", region: "opm", rank: 11 },
  { id: "0jByCc9MS4p34rE3o9Cdmw", title: "Pahintulot", artist: "shirebound", region: "opm", rank: 12 },
  { id: "5tlb0AxuzsMWL2GtEppXGX", title: "Multo", artist: "Cup of Joe", region: "opm", rank: 13 },
  { id: "1m4zRUexgXzzpI9Sb94bgz", title: "Shuloks", artist: "RAPROJECT SIX", region: "opm", rank: 14 },
  { id: "3TCKsNjab1MhAJvCAmNEEd", title: "Alabang", artist: "RAPROJECT SIX", region: "opm", rank: 16 },
  { id: "1zMUvVkAyYw9NTwDw72Ode", title: "Syempre", artist: "Willie Revillame", region: "opm", rank: 17 },
  { id: "3hyIrTUsUEic7sgIjl4wN1", title: "Eyes Can't Lie", artist: "RAPROJECT SIX", region: "opm", rank: 18 },
  { id: "6AIACiACh45NhUyAWKwqql", title: "Ayoko Maging Kaibigan", artist: "kiddotin", region: "opm", rank: 19 },
  { id: "29eiVZ3R6iJcXB01dOAl6H", title: "Waltz of Four Left Feet", artist: "shirebound", region: "opm", rank: 20 },
  { id: "5U3UOiWDos9P2NWV7xTNwJ", title: "Na Para Bang", artist: "Mariah Deborah", region: "opm", rank: 23 },
];

export const regionFilters = [
  { id: "all", label: "All trending" },
  { id: "international", label: "International" },
  { id: "opm", label: "OPM" },
];

export const trendingSources = {
  international: {
    badge: "INTL",
    label: "International",
    chart: "Spotify Global Daily",
    playlistLabel: "Today's Top Hits",
    playlistUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
  },
  opm: {
    badge: "OPM",
    label: "OPM",
    chart: "Spotify Philippines Daily",
    playlistLabel: "Hot Hits Philippines",
    playlistUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcZQSjptOQtk",
  },
};
