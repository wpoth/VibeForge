"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    fetch("/api/me", {
      method: "POST",
      body: JSON.stringify({ accessToken: session.accessToken }),
    })
      .then((r) => r.json())
      .then(setProfile);
  }, [session]);

  if (!session) return <button onClick={() => signIn("spotify")}>Login</button>;

  return (
    <div>
      <h1>VibeForge</h1>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}