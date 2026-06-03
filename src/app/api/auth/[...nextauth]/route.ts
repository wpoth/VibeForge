import type { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

const scopes = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "user-library-read",
  "playlist-read-collaborative",
  "user-read-playback-state",
  "user-modify-playback-state",
];

/**
 * Refresh Spotify access token when expired
 */
async function refreshAccessToken(token: any) {
  try {
    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await res.json();

    if (!res.ok) {
      throw new Error(refreshed.error || "Failed to refresh token");
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    };
  } catch (err) {
    console.error("Refresh token failed:", err);
    return token;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: scopes.join(" "),
          show_dialog: "true",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        const expiresIn = Number(account.expires_in ?? 3600);

        token.expiresAt = Date.now() + expiresIn * 1000;

        return token;
      }

      // SAFE CHECK (no TS error)
      if (token.expiresAt && Date.now() < token.expiresAt) {
        return token;
      }

      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;

      return session;
    },
  },

  events: {
    signIn(message) {
      console.log("🚀 SIGN IN EVENT:", {
        user: message.user.email,
        provider: message.account?.provider,
        scope: message.account?.scope,
      });
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };