export type SpotifyArtist = {
  id?: string;
  name?: string;
  uri?: string;
};

export type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

export type SpotifyAlbum = {
  name?: string;
  images?: SpotifyImage[];
};

export type SpotifyExternalUrls = {
  spotify?: string;
};

export type SpotifyTrack = {
  id?: string;
  uri?: string;
  name?: string;
  type?: string;
  artists?: SpotifyArtist[];
  album?: SpotifyAlbum;
  external_urls?: SpotifyExternalUrls;
};

export type SpotifyPlaylistItem = {
  added_at?: string | null;
  added_by?: {
    id?: string;
    uri?: string;
  } | null;
  item?: SpotifyTrack | null;
  track?: SpotifyTrack | null;
};

export type SpotifyPlaylist = {
  id: string;
  name: string;
  snapshot_id?: string;
  images?: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
  items?: {
    total?: number;
  };
  tracks?: {
    total?: number;
  };
};

export type SpotifyProfile = {
  display_name?: string;
};

export type AiPreviewTrack = {
  id?: string;
  uri?: string;
  query: string;
  name?: string;
  artists?: string[];
  album?: string;
  imageUrl?: string | null;
  source?: string;
};

export type ApiErrorResponse = {
  error?: boolean | string;
  message?: string;
};

export type PlaylistsResponse = ApiErrorResponse & {
  items?: SpotifyPlaylist[];
  total?: number;
  hidden?: number;
};

export type PlaylistTracksResponse = ApiErrorResponse & {
  items?: SpotifyPlaylistItem[];
};

export type AiTrackPreviewResponse = ApiErrorResponse & {
  success?: boolean;
  tracks?: AiPreviewTrack[];
  debug?: {
    prompt?: string;
    mode?: string;
    shortcut?: string;
    generatedQueries?: string[];
    foundTrackCount?: number;
    resolveFailureCount?: number;
    resolveFailures?: unknown[];
    durationMs?: number;
  };
};

export type AiPlaylistResponse = ApiErrorResponse & {
  success?: boolean;
  action?: "create" | "append";
  skippedDuplicates?: number;
  message?: string;
  playlist?: {
    id?: string;
    name?: string;
    url?: string;
    images?: SpotifyImage[];
    items?: {
      total?: number;
    };
    tracks?: {
      total?: number;
    };
  };
  tracks?: {
    id?: string;
    uri?: string;
    name?: string;
    artists?: string[];
    album?: string;
    imageUrl?: string | null;
    source?: string;
  }[];
};

export type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifyTrack[];
  };
  error?: {
    message?: string;
  };
};

export type SpotifyArtistSearchResponse = {
  artists?: {
    items?: SpotifyArtist[];
  };
  error?: {
    message?: string;
  };
};

export type SpotifyArtistTopTracksResponse = {
  tracks?: SpotifyTrack[];
  error?: {
    message?: string;
  };
};

export type SpotifyUserResponse = {
  id?: string;
  display_name?: string;
  email?: string;
  error?: {
    message?: string;
  };
};

export type SpotifyCreatePlaylistResponse = {
  id?: string;
  name?: string;
  external_urls?: SpotifyExternalUrls;
  error?: {
    message?: string;
  };
};

export type SpotifyAddItemsResponse = {
  snapshot_id?: string;
  error?: {
    message?: string;
  };
};

export type SpotifyPlaylistTracksResponse = {
  items?: {
    track?: {
      uri?: string;
    } | null;
  }[];
  next?: string | null;
  error?: {
    message?: string;
  };
};