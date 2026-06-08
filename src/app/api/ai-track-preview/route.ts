import type {
  SpotifyArtist,
  SpotifyArtistSearchResponse,
  SpotifyArtistTopTracksResponse,
  SpotifySearchResponse,
  SpotifyTrack,
} from "@/lib/spotify-types";

type AiTrackSuggestion = {
  query: string;
  name?: string;
  artists?: string[];
  source?: string;
};

type GroqResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message?: string;
  };
};

type JsonOrText<T extends object> = T | { rawText: string };

async function readJsonOrText<T extends object>(
  res: Response
): Promise<JsonOrText<T>> {
  const text = await res.text();

  if (!text) {
    return { rawText: "" };
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { rawText: text };
  }
}

function isRawText<T extends object>(
  value: JsonOrText<T>
): value is { rawText: string } {
  return "rawText" in value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function logStep(step: string, data?: unknown) {
  console.log(`[AI_TRACK_PREVIEW] ${step}`, data ?? "");
}

function logError(step: string, data?: unknown) {
  console.error(`[AI_TRACK_PREVIEW_ERROR] ${step}`, data ?? "");
}

function normalizeText(value?: string) {
  return (
    value
      ?.normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function textMatches(expected?: string, actual?: string) {
  const normalizedExpected = normalizeText(expected);
  const normalizedActual = normalizeText(actual);

  if (!normalizedExpected || !normalizedActual) return false;

  return (
    normalizedActual === normalizedExpected ||
    normalizedActual.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedActual)
  );
}

function spotifyTrackMatchesSuggestion(
  spotifyTrack: SpotifyTrack,
  suggestion: AiTrackSuggestion
) {
  const expectedName = suggestion.name;
  const actualName = spotifyTrack.name;

  const expectedArtists =
    suggestion.artists?.map(normalizeText).filter(Boolean) ?? [];

  const actualArtists =
    spotifyTrack.artists
      ?.map((artist) => normalizeText(artist.name))
      .filter(Boolean) ?? [];

  const nameMatches = expectedName
    ? textMatches(expectedName, actualName)
    : Boolean(spotifyTrack.uri);

  const artistMatches =
    expectedArtists.length === 0 ||
    expectedArtists.some((expectedArtist) =>
      actualArtists.some(
        (actualArtist) =>
          actualArtist === expectedArtist ||
          actualArtist.includes(expectedArtist) ||
          expectedArtist.includes(actualArtist)
      )
    );

  return nameMatches && artistMatches;
}

function buildSpotifySearchQueries(suggestion: AiTrackSuggestion) {
  const query = suggestion.query?.trim();
  const name = suggestion.name?.trim();
  const primaryArtist = suggestion.artists?.[0]?.trim();
  const artists = suggestion.artists?.join(" ").trim();

  const queries = [
    name && primaryArtist ? `track:"${name}" artist:"${primaryArtist}"` : "",
    query,
    [artists, name].filter(Boolean).join(" ").trim(),
  ];

  return Array.from(
    new Set(queries.filter((value): value is string => Boolean(value)))
  );
}

async function searchSpotifyTracks({
  accessToken,
  query,
}: {
  accessToken: string;
  query: string;
}): Promise<{
  tracks: SpotifyTrack[];
  status: number;
  error: unknown;
}> {
  const searchUrl = new URL("https://api.spotify.com/v1/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "track");
  searchUrl.searchParams.set("limit", "5");
  searchUrl.searchParams.set("market", "NL");

  const searchRes: globalThis.Response = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const searchData = await readJsonOrText<SpotifySearchResponse>(searchRes);

  const searchError = isRawText(searchData)
    ? searchData.rawText
    : searchData.error?.message ?? null;

  const tracks = isRawText(searchData) ? [] : searchData.tracks?.items ?? [];

  logStep("Spotify search result", {
    query,
    status: searchRes.status,
    ok: searchRes.ok,
    foundCount: tracks.length,
    firstTrack: tracks[0]
      ? {
          id: tracks[0].id,
          name: tracks[0].name,
          uri: tracks[0].uri,
          artists: tracks[0].artists?.map((artist) => artist.name),
        }
      : null,
    error: searchError,
  });

  if (!searchRes.ok || isRawText(searchData)) {
    return {
      tracks: [],
      status: searchRes.status,
      error: searchError,
    };
  }

  return {
    tracks,
    status: searchRes.status,
    error: null,
  };
}

async function resolveSuggestionToSpotifyTrack({
  accessToken,
  suggestion,
}: {
  accessToken: string;
  suggestion: AiTrackSuggestion;
}): Promise<{
  track: SpotifyTrack | null;
  queryUsed?: string;
  status: number;
  error: unknown;
}> {
  const queries = buildSpotifySearchQueries(suggestion);

  for (const query of queries) {
    const result = await searchSpotifyTracks({
      accessToken,
      query,
    });

    if (result.status === 429) {
      return {
        track: null,
        queryUsed: query,
        status: result.status,
        error: result.error,
      };
    }

    if (!result.tracks.length) {
      continue;
    }

    const matchingTrack = result.tracks.find((track) =>
      spotifyTrackMatchesSuggestion(track, suggestion)
    );

    if (!matchingTrack?.uri) {
      logStep("Spotify results rejected for preview", {
        query,
        expected: {
          name: suggestion.name,
          artists: suggestion.artists,
          source: suggestion.source,
        },
        actualCandidates: result.tracks.map((track) => ({
          name: track.name,
          artists: track.artists?.map((artist) => artist.name),
          uri: track.uri,
        })),
      });

      continue;
    }

    return {
      track: matchingTrack,
      queryUsed: query,
      status: result.status,
      error: null,
    };
  }

  return {
    track: null,
    status: 404,
    error: {
      message: "No Spotify result matched suggestion",
      suggestion,
      queries,
    },
  };
}

function uniqueSuggestions(values: AiTrackSuggestion[]) {
  const seen = new Set<string>();

  return values.filter((track) => {
    const key =
      track.query?.trim().toLowerCase() ||
      `${track.artists?.join(" ").toLowerCase()} ${track.name?.toLowerCase()}`;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function cleanArtistPrompt(prompt: string) {
  return prompt
    .replace(/\bmusic like\b/gi, "")
    .replace(/\bsongs like\b/gi, "")
    .replace(/\bsimilar to\b/gi, "")
    .replace(/\bartists like\b/gi, "")
    .replace(/\btracks like\b/gi, "")
    .replace(/\bmore songs like\b/gi, "")
    .replace(/\bmore tracks like\b/gi, "")
    .replace(/\badd\b/gi, "")
    .replace(/\bto playlist\b/gi, "")
    .replace(/\bplaylist\b/gi, "")
    .replace(/\bsongs? by\b/gi, "")
    .replace(/\btracks? by\b/gi, "")
    .replace(/\bmore songs? from\b/gi, "")
    .replace(/\bmore tracks? from\b/gi, "")
    .replace(/\bsongs? from\b/gi, "")
    .replace(/\btracks? from\b/gi, "")
    .replace(/\bsongs? of\b/gi, "")
    .replace(/\btracks? of\b/gi, "")
    .replace(/['’]s songs?/gi, "")
    .replace(/['’]s tracks?/gi, "")
    .replace(/\bsongs?\b/gi, "")
    .replace(/\btracks?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeExactArtistRequest(prompt: string) {
  const normalized = prompt.toLowerCase().trim();

  const isSimilarRequest =
    /\bmusic like\b/.test(normalized) ||
    /\bsongs like\b/.test(normalized) ||
    /\btracks like\b/.test(normalized) ||
    /\bsimilar to\b/.test(normalized) ||
    /\bartists like\b/.test(normalized) ||
    /\bsame vibe as\b/.test(normalized);

  if (isSimilarRequest) {
    return false;
  }

  return (
    /\b.+['’]s songs?\b/.test(normalized) ||
    /\b.+['’]s tracks?\b/.test(normalized) ||
    /\bsongs? by\b/.test(normalized) ||
    /\btracks? by\b/.test(normalized) ||
    /\bmore songs? from\b/.test(normalized) ||
    /\bmore tracks? from\b/.test(normalized) ||
    /\bsongs? from\b/.test(normalized) ||
    /\btracks? from\b/.test(normalized) ||
    /\bsongs? of\b/.test(normalized) ||
    /\btracks? of\b/.test(normalized)
  );
}

async function searchSpotifyArtist({
  accessToken,
  artistName,
}: {
  accessToken: string;
  artistName: string;
}) {
  const searchUrl = new URL("https://api.spotify.com/v1/search");
  searchUrl.searchParams.set("q", artistName);
  searchUrl.searchParams.set("type", "artist");
  searchUrl.searchParams.set("limit", "1");
  searchUrl.searchParams.set("market", "NL");

  const res: globalThis.Response = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await readJsonOrText<SpotifyArtistSearchResponse>(res);

  const error = isRawText(data) ? data.rawText : data.error?.message ?? null;

  logStep("Spotify artist search result", {
    artistName,
    status: res.status,
    ok: res.ok,
    foundCount: isRawText(data) ? 0 : data.artists?.items?.length ?? 0,
    firstArtist:
      !isRawText(data) && data.artists?.items?.[0]
        ? {
            id: data.artists.items[0].id,
            name: data.artists.items[0].name,
            uri: data.artists.items[0].uri,
          }
        : null,
    error,
  });

  if (!res.ok || isRawText(data)) {
    return {
      artist: null,
      status: res.status,
      error,
    };
  }

  return {
    artist: data.artists?.items?.[0] ?? null,
    status: res.status,
    error: null,
  };
}

async function getSpotifyArtistTopTracks({
  accessToken,
  artistId,
}: {
  accessToken: string;
  artistId: string;
}) {
  const res: globalThis.Response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=NL`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await readJsonOrText<SpotifyArtistTopTracksResponse>(res);

  const error = isRawText(data) ? data.rawText : data.error?.message ?? null;

  logStep("Spotify artist top tracks result", {
    artistId,
    status: res.status,
    ok: res.ok,
    trackCount: isRawText(data) ? 0 : data.tracks?.length ?? 0,
    error,
  });

  if (!res.ok || isRawText(data)) {
    return {
      tracks: [],
      status: res.status,
      error,
    };
  }

  return {
    tracks: data.tracks ?? [],
    status: res.status,
    error: null,
  };
}

function mapSpotifyTrackToPreviewTrack({
  track,
  query,
  source,
}: {
  track: SpotifyTrack;
  query: string;
  source: string;
}) {
  return {
    id: track.id,
    uri: track.uri,
    query,
    name: track.name,
    artists:
      track.artists
        ?.map((artist) => artist.name)
        .filter((name): name is string => Boolean(name)) ?? [],
    album: track.album?.name,
    imageUrl: track.album?.images?.[0]?.url ?? null,
    source,
  };
}

async function generateArtistTopTracksPreview({
  accessToken,
  prompt,
  mode,
  startedAt,
}: {
  accessToken: string;
  prompt: string;
  mode?: string;
  startedAt: number;
}) {
  const artistName = cleanArtistPrompt(prompt);

  if (!artistName) {
    return Response.json(
      {
        error: true,
        message: "Could not detect artist name from prompt.",
        step: "detect_artist_name",
      },
      { status: 400 }
    );
  }

  const artistResult = await searchSpotifyArtist({
    accessToken,
    artistName,
  });

  if (!artistResult.artist?.id) {
    return Response.json(
      {
        error: true,
        message: `Could not find artist "${artistName}" on Spotify.`,
        step: "spotify_artist_search",
        details: artistResult.error,
      },
      { status: artistResult.status || 404 }
    );
  }

  const topTracksResult = await getSpotifyArtistTopTracks({
    accessToken,
    artistId: artistResult.artist.id,
  });

  if (!topTracksResult.tracks.length) {
    return Response.json(
      {
        error: true,
        message: `Could not load top tracks for "${artistResult.artist.name}".`,
        step: "spotify_artist_top_tracks",
        details: topTracksResult.error,
      },
      { status: topTracksResult.status || 404 }
    );
  }

  const seenUris = new Set<string>();

  const tracks = topTracksResult.tracks
    .filter((track) => {
      if (!track.uri || seenUris.has(track.uri)) return false;

      seenUris.add(track.uri);
      return true;
    })
    .slice(0, 15)
    .map((track) =>
      mapSpotifyTrackToPreviewTrack({
        track,
        query: `${artistResult.artist?.name ?? artistName} ${
          track.name ?? ""
        }`.trim(),
        source: "requested artist",
      })
    );

  const responsePayload = {
    success: true,
    tracks,
    debug: {
      prompt,
      mode: mode ?? "artist",
      shortcut: "spotify_artist_top_tracks",
      artist: {
        id: artistResult.artist.id,
        name: artistResult.artist.name,
        uri: artistResult.artist.uri,
      },
      foundTrackCount: tracks.length,
      durationMs: Date.now() - startedAt,
    },
  };

  logStep("SUCCESS_ARTIST_TOP_TRACKS", responsePayload);

  return Response.json(responsePayload);
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    logStep("START");

    const {
      accessToken,
      prompt,
      mode,
    }: {
      accessToken?: string;
      prompt?: string;
      mode?: string;
    } = await req.json();

    logStep("Request body received", {
      hasAccessToken: Boolean(accessToken),
      prompt,
      mode,
    });

    if (!accessToken) {
      return Response.json(
        {
          error: true,
          message: "Missing access token",
          step: "validate_request",
        },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        {
          error: true,
          message: "Missing prompt",
          step: "validate_request",
        },
        { status: 400 }
      );
    }

    if (mode === "artist" && looksLikeExactArtistRequest(prompt)) {
      logStep("Using Spotify artist top tracks shortcut", {
        prompt,
        cleanedArtist: cleanArtistPrompt(prompt),
      });

      return generateArtistTopTracksPreview({
        accessToken,
        prompt,
        mode,
        startedAt,
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return Response.json(
        {
          error: true,
          message: "Missing GROQ_API_KEY",
          step: "environment",
        },
        { status: 500 }
      );
    }

    const aiPrompt = `
You are VibeForge, an expert Spotify playlist curator and music metadata assistant.

Your job is to generate accurate Spotify-resolvable track candidates.
These candidates will be searched on Spotify immediately, so every candidate must be a real track with the correct artist.

User request:
"${prompt}"

Mode:
"${mode ?? "vibe"}"

Return ONLY valid JSON with this exact shape:
{
  "tracks": [
    {
      "query": "artist name song title",
      "name": "song title",
      "artists": ["artist name"],
      "source": "why this belongs"
    }
  ]
}

The "tracks" array must contain exactly 15 objects.

ABSOLUTE RULES:
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations outside the JSON.
- Do not include comments.
- Every item must have exactly these fields: "query", "name", "artists", and "source".
- "query" must be concise and Spotify-searchable.
- "query" must usually be formatted as: "Artist Name Song Title".
- "name" must be the track title only.
- "artists" must be an array of real artist/composer names.
- "source" must be short and useful, for example:
  - "requested artist"
  - "similar artist"
  - "Persona 4 battle theme"
  - "Bleach opening 1"
  - "official OST"
- Do not invent songs.
- Do not invent artists.
- Do not invent anime/game/song associations.
- Do not invent deep cuts.
- Do not use vague queries like "Persona 4 soundtrack", "anime opening", "sad song", or "rock music".
- Do not return albums. Every item must point to a specific track.
- Avoid fan covers, remixes, slowed versions, sped-up versions, nightcore, karaoke, piano covers, orchestral covers, live versions, or tribute versions unless the user explicitly asks for them.
- Prefer tracks likely to exist on Spotify.
- Prefer official artist names and official song titles.
- Avoid duplicates.

REQUEST TYPE DETECTION:
Before generating tracks, silently classify the request as one of these:

1. EXACT_ARTIST_TRACKS
2. SIMILAR_TO_ARTIST
3. MEDIA_FRANCHISE
4. VIBE_OR_GENRE

EXACT_ARTIST_TRACKS:
Use this only if the user asks for:
- songs by an artist
- an artist's songs
- tracks from an artist
- more songs from an artist
- "Aimer's songs"
- "songs by Ado"
- "more Radiohead songs"

Rules:
- Only return tracks by the exact requested artist.
- Do not return similar artists.
- Do not invent obscure tracks.
- Do not invent anime/source associations.
- If unsure, choose famous, widely available songs by the requested artist.
- "source" must be "requested artist".
- The requested artist must appear in "artists".

SIMILAR_TO_ARTIST:
Use this if the user asks for:
- music like an artist
- songs similar to an artist
- same vibe as an artist
- artists like an artist

Rules:
- Include some tracks by the requested artist if useful.
- Include tracks by similar artists with matching language, scene, genre, vocals, production, era, and energy.
- Do not randomly switch to unrelated mainstream artists.
- If the requested artist is Japanese, prefer Japanese or closely related artists unless the user asks otherwise.
- "source" should explain the relation briefly.

MEDIA_FRANCHISE:
Use this if the user asks for:
- anime
- game
- movie
- show
- series
- soundtrack
- OST
- opening
- ending
- OP
- ED
- theme song
- battle theme
- boss theme
- character playlist

Rules:
- Treat the title as a media franchise, not as a normal word.
- Identify the intended anime/game/movie/show first.
- Generate official opening themes, ending themes, insert songs, battle themes, character songs, OST tracks, and closely related official music.
- Prefer exact artist/composer + song title queries.
- Do not include unrelated mainstream artists unless they are actually connected to the franchise.
- Do not interpret titles literally. For example, "Bleach" means the anime Bleach, not cleaning products, colors, or unrelated songs.
- For Japanese anime/games, prefer Japanese artists, official composers, and songs actually used in that anime/game.
- "source" should say where it belongs, for example "Persona 4 battle theme", "Bleach opening 2", or "official OST".

VIBE_OR_GENRE:
Use this if the user asks for:
- a mood
- a setting
- an activity
- a genre
- an aesthetic
- a broad playlist idea

Rules:
- Translate the vibe into real songs matching emotional tone, tempo, genre, and atmosphere.
- Keep the playlist coherent.
- Use variety across artists.
- If the prompt mentions a genre, stay close to that genre.
- If the prompt mentions an activity, choose tracks that fit that activity.

KNOWN ARTIST EXAMPLES:
If the user asks for Aimer tracks, prefer real well-known Aimer songs such as:
- Aimer Brave Shine
- Aimer LAST STARDUST
- Aimer 残響散歌
- Aimer カタオモイ
- Aimer 蝶々結び
- Aimer Ref:rain
- Aimer I beg you
- Aimer SPARK-AGAIN
- Aimer ONE
- Aimer ninelie
- Aimer RE:I AM
- Aimer StarRingChild
- Aimer 六等星の夜
- Aimer Black Bird
- Aimer Torches

If the user asks for Ado tracks, prefer:
- Ado Usseewa
- Ado Odo
- Ado New Genesis
- Ado Backlight
- Ado Tot Musica
- Ado Show
- Ado Readymade
- Ado Gira Gira
- Ado Ashura-chan
- Ado Eien no Akuruhi
- Ado KokoroToIuNaNoFukakai
- Ado Kura Kura

If the user asks for Radiohead tracks, prefer:
- Radiohead Let Down
- Radiohead No Surprises
- Radiohead Weird Fishes Arpeggi
- Radiohead Jigsaw Falling Into Place
- Radiohead Paranoid Android
- Radiohead Karma Police
- Radiohead Everything In Its Right Place
- Radiohead Reckoner
- Radiohead Nude
- Radiohead Street Spirit Fade Out

KNOWN MEDIA EXAMPLES:
Persona:
- Persona 3: "Yumi Kawamura Burn My Dread", "Lotus Juice Mass Destruction", "Yumi Kawamura Memories of You", "Shoji Meguro When the Moon's Reaching Out Stars", "Lotus Juice It's Going Down Now".
- Persona 4: "Shihoko Hirata Pursuing My True Self", "Shihoko Hirata Reach Out To The Truth", "Shihoko Hirata I'll Face Myself", "Shoji Meguro Heartbeat Heartbreak", "Shoji Meguro Your Affection", "Shihoko Hirata Never More", "Shihoko Hirata Shadow World", "Shoji Meguro Signs Of Love".
- Persona 5: "Lyn Last Surprise", "Lyn Wake Up Get Up Get Out There", "Lyn Life Will Change", "Lyn Rivers In the Desert", "Lyn Beneath the Mask", "Lyn Whims of Fate", "Lyn Take Over", "Lyn Colors Flying High".

Bleach:
- "ORANGE RANGE Asterisk"
- "UVERworld D-tecnoLife"
- "High and Mighty Color Ichirin no Hana"
- "YUI Rolling star"
- "Aqua Timez ALONES"
- "KELUN CHU-BURA"
- "SCANDAL Shoujo S"
- "SID Ranbu no Melody"
- "miwa chAngE"
- "Shiro Sagisu Number One"
- "Shiro Sagisu Treachery"
- "Shiro Sagisu Invasion"

Demon Slayer:
- "LiSA Gurenge"
- "LiSA Homura"
- "Aimer Zankyosanka"
- "Aimer Asa ga Kuru"
- "MAN WITH A MISSION Kizuna no Kiseki"
- "milet Koi Kogare"

Jujutsu Kaisen:
- "Eve Kaikai Kitan"
- "ALI LOST IN PARADISE"
- "Who-ya Extended VIVID VICE"
- "King Gnu SPECIALZ"
- "Tatsuya Kitani Ao no Sumika"
- "Soushi Sakiyama Akari"

GOOD OUTPUT EXAMPLES:

User request: "Aimer's songs"
Mode: "artist"
Good output:
{
  "tracks": [
    {
      "query": "Aimer Brave Shine",
      "name": "Brave Shine",
      "artists": ["Aimer"],
      "source": "requested artist"
    },
    {
      "query": "Aimer LAST STARDUST",
      "name": "LAST STARDUST",
      "artists": ["Aimer"],
      "source": "requested artist"
    },
    {
      "query": "Aimer Ref:rain",
      "name": "Ref:rain",
      "artists": ["Aimer"],
      "source": "requested artist"
    }
  ]
}

User request: "music like Aimer"
Mode: "artist"
Good output:
{
  "tracks": [
    {
      "query": "Aimer Brave Shine",
      "name": "Brave Shine",
      "artists": ["Aimer"],
      "source": "requested artist"
    },
    {
      "query": "EGOIST Namae no Nai Kaibutsu",
      "name": "Namae no Nai Kaibutsu",
      "artists": ["EGOIST"],
      "source": "similar dramatic anime vocal style"
    },
    {
      "query": "LiSA Shirushi",
      "name": "Shirushi",
      "artists": ["LiSA"],
      "source": "similar Japanese emotional rock style"
    }
  ]
}

User request: "Persona 4"
Mode: "vibe"
Good output:
{
  "tracks": [
    {
      "query": "Shihoko Hirata Pursuing My True Self",
      "name": "Pursuing My True Self",
      "artists": ["Shihoko Hirata"],
      "source": "Persona 4 opening"
    },
    {
      "query": "Shihoko Hirata Reach Out To The Truth",
      "name": "Reach Out To The Truth",
      "artists": ["Shihoko Hirata"],
      "source": "Persona 4 battle theme"
    },
    {
      "query": "Shoji Meguro Heartbeat Heartbreak",
      "name": "Heartbeat Heartbreak",
      "artists": ["Shoji Meguro"],
      "source": "Persona 4 OST"
    }
  ]
}

User request: "make a playlist containing bleach anime openings endings and ost"
Mode: "vibe"
Good output:
{
  "tracks": [
    {
      "query": "ORANGE RANGE Asterisk",
      "name": "Asterisk",
      "artists": ["ORANGE RANGE"],
      "source": "Bleach opening 1"
    },
    {
      "query": "UVERworld D-tecnoLife",
      "name": "D-tecnoLife",
      "artists": ["UVERworld"],
      "source": "Bleach opening 2"
    },
    {
      "query": "YUI Rolling star",
      "name": "Rolling star",
      "artists": ["YUI"],
      "source": "Bleach opening"
    },
    {
      "query": "Shiro Sagisu Number One",
      "name": "Number One",
      "artists": ["Shiro Sagisu"],
      "source": "Bleach OST"
    }
  ]
}

Before returning final JSON, silently verify:
- Every song title is real.
- Every artist is real.
- Every query is likely to resolve on Spotify.
- The result matches the detected request type.
- There are no duplicate songs.
- There are exactly 15 tracks.

Now generate exactly 15 track suggestions for the user's request.
`;

    logStep("Sending request to Groq", {
      model: "llama-3.1-8b-instant",
      promptLength: aiPrompt.length,
    });

    const aiRes: globalThis.Response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You generate accurate Spotify-resolvable playlist track suggestions. Return valid JSON only.",
            },
            {
              role: "user",
              content: aiPrompt,
            },
          ],
          temperature: 0.1,
          response_format: {
            type: "json_object",
          },
        }),
      }
    );

    const aiData = await readJsonOrText<GroqResponse>(aiRes);

    const aiContent = isRawText(aiData)
      ? null
      : aiData.choices?.[0]?.message?.content ?? null;

    const aiError = isRawText(aiData)
      ? aiData.rawText
      : aiData.error?.message ?? null;

    logStep("Groq response", {
      status: aiRes.status,
      ok: aiRes.ok,
      hasContent: Boolean(aiContent),
      contentPreview: aiContent?.slice(0, 500),
      error: aiError,
    });

    if (!aiRes.ok) {
      const message = isRawText(aiData)
        ? aiData.rawText || "AI request failed"
        : aiData.error?.message ?? "AI request failed";

      return Response.json(
        {
          error: true,
          message:
            aiRes.status === 429
              ? "Too many AI requests. Please wait a bit and try again."
              : message,
          details: aiData,
          step: "ai_request",
        },
        { status: aiRes.status }
      );
    }

    if (isRawText(aiData)) {
      return Response.json(
        {
          error: true,
          message: "AI returned a non-JSON response",
          rawContent: aiData.rawText,
          step: "ai_response_format",
        },
        { status: 500 }
      );
    }

    const content = aiData.choices?.[0]?.message?.content ?? "";

    let parsed: AiTrackSuggestion[];

    try {
      const json = JSON.parse(content) as {
        tracks?: AiTrackSuggestion[];
      };

      parsed = Array.isArray(json.tracks) ? json.tracks : [];
    } catch (error) {
      logError("Failed to parse AI JSON", {
        error: safeError(error),
        rawContent: content,
      });

      return Response.json(
        {
          error: true,
          message: "AI returned invalid JSON",
          rawContent: content,
          step: "parse_ai_json",
        },
        { status: 500 }
      );
    }

    const suggestions = uniqueSuggestions(
      parsed
        .filter((track) => typeof track.query === "string")
        .map((track) => {
          const query = track.query.trim();

          return {
            query,
            name:
              typeof track.name === "string" && track.name.trim()
                ? track.name.trim()
                : query,
            artists: Array.isArray(track.artists)
              ? track.artists.filter(
                  (artist): artist is string =>
                    typeof artist === "string" && Boolean(artist.trim())
                )
              : [],
            source:
              typeof track.source === "string" && track.source.trim()
                ? track.source.trim()
                : "AI suggestion",
          };
        })
    ).slice(0, 15);

    logStep("Parsed preview suggestions", {
      count: suggestions.length,
      suggestions,
    });

    if (!suggestions.length) {
      return Response.json(
        {
          error: true,
          message: "AI generated no usable preview tracks",
          step: "parse_preview_tracks",
        },
        { status: 500 }
      );
    }

    const resolvedTracks: {
      id?: string;
      uri?: string;
      query: string;
      name?: string;
      artists?: string[];
      album?: string;
      imageUrl?: string | null;
      source?: string;
    }[] = [];

    const resolveFailures: {
      query: string;
      status: number;
      error?: unknown;
    }[] = [];

    const seenUris = new Set<string>();

    for (const suggestion of suggestions) {
      const result = await resolveSuggestionToSpotifyTrack({
        accessToken,
        suggestion,
      });

      if (result.status === 429) {
        return Response.json(
          {
            error: true,
            message:
              "Spotify search is rate-limiting requests right now. Please wait a few minutes and try again.",
            step: "spotify_search_rate_limited",
            query: result.queryUsed ?? suggestion.query,
            resolveFailures,
          },
          { status: 429 }
        );
      }

      if (!result.track?.uri || seenUris.has(result.track.uri)) {
        resolveFailures.push({
          query: result.queryUsed ?? suggestion.query,
          status: result.status,
          error: result.error,
        });

        continue;
      }

      seenUris.add(result.track.uri);

      resolvedTracks.push(
        mapSpotifyTrackToPreviewTrack({
          track: result.track,
          query: suggestion.query,
          source: suggestion.source ?? "AI suggestion",
        })
      );

      await sleep(250);
    }

    logStep("Resolved preview tracks", {
      requestedCount: suggestions.length,
      resolvedCount: resolvedTracks.length,
      failureCount: resolveFailures.length,
      resolveFailures,
      resolvedTracks,
    });

    if (!resolvedTracks.length) {
      return Response.json(
        {
          error: true,
          message:
            "Could not resolve any AI suggestions to Spotify tracks. Try a more specific prompt.",
          step: "resolve_preview_tracks",
          suggestions,
          resolveFailures,
        },
        { status: 404 }
      );
    }

    const responsePayload = {
      success: true,
      tracks: resolvedTracks,
      debug: {
        prompt,
        mode: mode ?? "vibe",
        generatedQueries: suggestions.map((track) => track.query),
        foundTrackCount: resolvedTracks.length,
        resolveFailureCount: resolveFailures.length,
        resolveFailures,
        durationMs: Date.now() - startedAt,
      },
    };

    logStep("SUCCESS", responsePayload);

    return Response.json(responsePayload);
  } catch (error) {
    logError("Unhandled route error", {
      error: safeError(error),
      durationMs: Date.now() - startedAt,
    });

    return Response.json(
      {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate track preview",
        step: "unhandled_error",
      },
      { status: 500 }
    );
  }
}