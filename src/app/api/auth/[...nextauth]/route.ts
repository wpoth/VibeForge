import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

async function refreshAccessToken(token: any) {
  try {
    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await res.json();

    console.log("SPOTIFY REFRESH DEBUG:", {
      ok: res.ok,
      status: res.status,
      hasAccessToken: Boolean(refreshed.access_token),
      hasRefreshToken: Boolean(refreshed.refresh_token),
      scope: refreshed.scope,
      error: refreshed.error,
    });

    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      scope: refreshed.scope ?? token.scope,
      error: undefined,
    };
  } catch (err) {
    console.error("REFRESH ACCESS TOKEN ERROR:", err);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const scopes = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-modify",
  "user-read-currently-playing",
  "user-modify-playback-state",
  "user-modify-playback-state",
].join(" ");

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: scopes,
          show_dialog: true,
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }: any) {
      // Initial login
      if (account) {
        const accessTokenExpires =
          account.expires_at
            ? account.expires_at * 1000
            : Date.now() + account.expires_in * 1000;

        console.log("SPOTIFY LOGIN DEBUG:", {
          hasAccessToken: Boolean(account.access_token),
          hasRefreshToken: Boolean(account.refresh_token),
          expiresAt: account.expires_at,
          expiresIn: account.expires_in,
          accessTokenExpires,
          scope: account.scope,
        });

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires,
          scope: account.scope,
          error: undefined,
        };
      }

      // If token is still valid, return it
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      // Token expired, refresh it
      return await refreshAccessToken(token);
    },

    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      session.scope = token.scope;

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };