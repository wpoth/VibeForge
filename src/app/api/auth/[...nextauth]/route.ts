import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
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
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
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