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
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const text = await res.text(); 

  if (!res.ok) {
    console.error("SPOTIFY ERROR:", text);

    throw new Error(
      `Spotify API failed: ${res.status} ${res.statusText}`
    );
  }

  return JSON.parse(text);
}