import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

type SpotifyRefreshResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

function isInvalidGrantError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const value = error as {
    error?: unknown;
    error_description?: unknown;
  };

  return (
    value.error === "invalid_grant" ||
    String(value.error_description ?? "")
      .toLowerCase()
      .includes("invalid_grant")
  );
}

async function refreshAccessToken(token: any) {
  try {
    if (!token.refreshToken) {
      return {
        ...token,
        accessToken: undefined,
        accessTokenExpires: 0,
        refreshToken: undefined,
        error: "RefreshAccessTokenError",
      };
    }

    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
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
      cache: "no-store",
    });

    const refreshed = (await res.json()) as SpotifyRefreshResponse;

    console.log("SPOTIFY REFRESH DEBUG:", {
      ok: res.ok,
      status: res.status,
      hasAccessToken: Boolean(refreshed.access_token),
      hasRefreshToken: Boolean(refreshed.refresh_token),
      scope: refreshed.scope,
      error: refreshed.error,
      errorDescription: refreshed.error_description,
    });

    if (!res.ok) {
      if (refreshed.error === "invalid_grant") {
        console.warn(
          "Spotify refresh token is expired or invalid. Clearing token and requiring re-login.",
        );

        return {
          ...token,
          accessToken: undefined,
          accessTokenExpires: 0,
          refreshToken: undefined,
          scope: undefined,
          error: "RefreshAccessTokenError",
        };
      }

      throw refreshed;
    }

    if (!refreshed.access_token || !refreshed.expires_in) {
      throw {
        error: "invalid_refresh_response",
        error_description: "Spotify refresh response did not include token data.",
      };
    }

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

    if (isInvalidGrantError(err)) {
      return {
        ...token,
        accessToken: undefined,
        accessTokenExpires: 0,
        refreshToken: undefined,
        scope: undefined,
        error: "RefreshAccessTokenError",
      };
    }

    return {
      ...token,
      accessToken: token.accessToken,
      accessTokenExpires: 0,
      refreshToken: token.refreshToken,
      scope: token.scope,
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
  "ugc-image-upload",
  "user-library-read",
  "user-library-modify",
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-recently-played",
  "user-top-read",
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
      if (account) {
        const accessTokenExpires = account.expires_at
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

      if (!token.accessTokenExpires || !token.refreshToken) {
        return {
          ...token,
          accessToken: undefined,
          accessTokenExpires: 0,
          refreshToken: undefined,
          error: "RefreshAccessTokenError",
        };
      }

      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      return refreshAccessToken(token);
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