export async function getSpotifyProfile(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Spotify profile");
  }

  return res.json();
}

export async function getUserPlaylists(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch playlists");
  }

  return res.json();
}

export async function getPlaylistTracks(accessToken: string, playlistId: string) {
  let tracks: any[] = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (url) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    console.log("SPOTIFY STATUS:", res.status);
    console.log("SPOTIFY RESPONSE:", JSON.stringify(data, null, 2));

    // 🚨 HARD GUARD: stop before crash
    if (!res.ok) {
      throw new Error(
        `Spotify error ${res.status}: ${data?.error?.message || JSON.stringify(data)}`
      );
    }

    // 🚨 SAFE GUARD (this is what prevents your 500)
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid Spotify response: missing items");
    }

    tracks.push(...data.items.map((item: any) => item.track));

    url = data.next;
  }

  return tracks;
}