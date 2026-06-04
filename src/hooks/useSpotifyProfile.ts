import { useEffect, useState } from "react";

import type {
  ApiErrorResponse,
  SpotifyProfile,
} from "@/lib/spotify-types";

import { getErrorMessage } from "@/lib/ui-helpers";

type UseSpotifyProfileResult = {
  profile: SpotifyProfile | null;
  profileError: string | null;
};

export function useSpotifyProfile(
  accessToken: string | undefined
): UseSpotifyProfileResult {
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    fetch("/api/me", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken }),
    })
      .then((response) => response.json())
      .then((data: SpotifyProfile & ApiErrorResponse) => {
        if (data?.error) {
          throw new Error(data?.message || "Failed to load profile");
        }

        setProfile(data);
        setProfileError(null);
      })
      .catch((error: unknown) => {
        console.error(error);
        setProfileError(getErrorMessage(error));
      });
  }, [accessToken]);

  return {
    profile,
    profileError,
  };
}