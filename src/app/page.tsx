"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.accessToken) return;

      const res = await fetch("/api/me", {
        method: "POST",
        body: JSON.stringify({
          accessToken: session.accessToken,
        }),
      });

      const data = await res.json();
      setProfile(data);
    }

    loadProfile();
  }, [session]);

  if (status === "loading") return <p>Loading...</p>;

  if (!session) {
    return <button onClick={() => signIn("spotify")}>Login</button>;
  }

  return (
    <div>
      <h1>VibeForge</h1>

      <p>Logged in as:</p>
      <pre>{JSON.stringify(profile, null, 2)}</pre>

      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}