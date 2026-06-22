type SpotifyApiError = {
  error?: {
    message?: string;
  };
};

type SpotifyPagingResponse<T> = {
  items?: T[];
  next?: string | null;
  total?: number;
  error?: {
    message?: string;
  };
};

function getSpotifyErrorMessage(data: SpotifyApiError | unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof data.error === "object" &&
    data.error !== null &&
    "message" in data.error &&
    typeof data.error.message === "string"
  ) {
    return data.error.message;
  }

  return JSON.stringify(data);
}

export async function getSpotifyProfile(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Spotify profile: ${getSpotifyErrorMessage(data)}`,
    );
  }

  return data;
}

export async function getUserPlaylists(accessToken: string) {
  let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";
  const playlists: unknown[] = [];

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await res.json()) as SpotifyPagingResponse<unknown>;

    if (!res.ok) {
      throw new Error(
        `Failed to fetch playlists: ${getSpotifyErrorMessage(data)}`,
      );
    }

    if (!Array.isArray(data.items)) {
      throw new Error("Invalid Spotify response: missing playlist items");
    }

    playlists.push(...data.items);
    url = data.next ?? null;
  }

  return playlists;
}

export async function getPlaylistItems(accessToken: string, playlistId: string) {
  const items: unknown[] = [];
  let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await res.json()) as SpotifyPagingResponse<unknown>;

    if (!res.ok) {
      throw new Error(
        `Spotify error ${res.status}: ${getSpotifyErrorMessage(data)}`,
      );
    }

    if (!Array.isArray(data.items)) {
      throw new Error("Invalid Spotify response: missing playlist items");
    }

    items.push(...data.items);
    url = data.next ?? null;
  }

  return items;
}

export async function getSavedTracks(accessToken: string, maxItems = 200) {
  const items: unknown[] = [];
  let url: string | null = "https://api.spotify.com/v1/me/tracks?limit=50";

  while (url && items.length < maxItems) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await res.json()) as SpotifyPagingResponse<unknown>;

    if (!res.ok) {
      throw new Error(
        `Spotify error ${res.status}: ${getSpotifyErrorMessage(data)}`,
      );
    }

    if (!Array.isArray(data.items)) {
      throw new Error("Invalid Spotify response: missing saved tracks");
    }

    items.push(...data.items);
    url = data.next ?? null;
  }

  return items.slice(0, maxItems);
}

export async function getSavedTrackCount(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me/tracks?limit=1", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await res.json()) as SpotifyPagingResponse<unknown>;

  if (!res.ok) {
    throw new Error(
      `Spotify error ${res.status}: ${getSpotifyErrorMessage(data)}`,
    );
  }

  return data.total ?? 0;
}