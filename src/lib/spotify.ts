type SpotifyApiError = {
  error?: {
    message?: string;
  };
};

type SpotifyPagingResponse<T> = {
  items?: T[];
  next?: string | null;
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
    throw new Error(`Failed to fetch Spotify profile: ${getSpotifyErrorMessage(data)}`);
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
      throw new Error(`Failed to fetch playlists: ${getSpotifyErrorMessage(data)}`);
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
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await res.json()) as SpotifyPagingResponse<unknown>;

    if (!res.ok) {
      throw new Error(`Spotify error ${res.status}: ${getSpotifyErrorMessage(data)}`);
    }

    if (!Array.isArray(data.items)) {
      throw new Error("Invalid Spotify response: missing playlist items");
    }

    items.push(...data.items);
    url = data.next ?? null;
  }

  return items;
}
