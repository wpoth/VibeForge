"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <button onClick={() => signIn("spotify")}>
        Login with Spotify
      </button>
    );
  }

  return (
    <div>
      <p>Logged in</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}