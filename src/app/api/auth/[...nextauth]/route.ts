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

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization:
        "https://accounts.spotify.com/authorize?scope=" +
        scopes.join(" "),
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        console.log("🔐 NEW LOGIN - ACCOUNT OBJECT:");
        console.log({
          provider: account.provider,
          type: account.type,
          scope: account.scope,
          token_type: account.token_type,
          expires_at: account.expires_at,
        });

        console.log("🔑 ACCESS TOKEN RECEIVED (first 20 chars):");
        console.log(account.access_token?.slice(0, 20) + "...");

        token.accessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      console.log("📦 SESSION CALLBACK HIT");
      console.log("SESSION BEFORE:", session);

      if (token?.accessToken) {
        session.accessToken = token.accessToken as string;
      }

      console.log("SESSION AFTER:");
      console.log({
        user: session.user,
        hasAccessToken: !!session.accessToken,
      });

      return session;
    },
  },

  events: {
    async signIn(message) {
      console.log("🚀 SIGN IN EVENT:");
      console.log({
        user: message.user,
        account: {
          provider: message.account?.provider,
          scope: message.account?.scope,
        },
      });
    },
  },
});

export { handler as GET, handler as POST };