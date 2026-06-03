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
  console.log("\n🔄 REFRESH TOKEN FLOW STARTED");
  console.log("Current token expiresAt:", token.expiresAt);

  try {
    const basic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    console.log("🔑 Refresh request sent to Spotify");

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

    console.log("🔄 Spotify refresh response status:", res.status);
    console.log("🔄 Spotify refresh response:", refreshed);

    if (!res.ok) {
      throw new Error(refreshed.error || "Failed to refresh token");
    }

    const newToken = {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    };

    console.log("✅ TOKEN REFRESHED SUCCESSFULLY");
    console.log("New expiresAt:", newToken.expiresAt);

    return newToken;
  } catch (err) {
    console.error("❌ Refresh token failed:", err);
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
          prompt: "consent"
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      console.log("\n🧠 JWT CALLBACK HIT");

      if (account) {
        console.log("🔐 NEW LOGIN DETECTED");
        console.log("Account provider:", account.provider);
        console.log("Scope:", account.scope);
        console.log("Expires in:", account.expires_in);

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        const expiresIn = Number(account.expires_in ?? 3600);
        token.expiresAt = Date.now() + expiresIn * 1000;

        console.log("Access token (preview):", token.accessToken?.slice(0, 20));
        console.log("ExpiresAt:", token.expiresAt);

        return token;
      }

      console.log("🔁 EXISTING TOKEN FLOW");
      console.log("Current expiresAt:", token.expiresAt);

      if (token.expiresAt && Date.now() < token.expiresAt) {
        console.log("✅ TOKEN STILL VALID");
        return token;
      }

      console.log("⚠️ TOKEN EXPIRED → REFRESHING");
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      console.log("\n📦 SESSION CALLBACK HIT");
      console.log("Token exists:", !!token);
      console.log("AccessToken exists:", !!token?.accessToken);

      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;

      console.log("Session user:", session.user?.email);
      console.log("Session accessToken preview:", session.accessToken?.slice(0, 20));

      return session;
    },
  },

  events: {
    signIn(message) {
      console.log("\n🚀 SIGN IN EVENT TRIGGERED");
      console.log("User:", message.user?.email);
      console.log("Provider:", message.account?.provider);
      console.log("Scope:", message.account?.scope);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };