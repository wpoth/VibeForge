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

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string
) {
  let tracks: any[] = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (url) {
    console.log("PLAYLIST TRACKS URL:", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    console.log("PLAYLIST ID:", playlistId);
    console.log("SPOTIFY STATUS:", res.status);
    console.log("SPOTIFY RESPONSE:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      throw new Error(
        `Spotify error ${res.status}: ${JSON.stringify(data)}`
      );
    }

    tracks.push(...data.items.map((item: any) => item.track));

    url = data.next;
  }

  return tracks;
}