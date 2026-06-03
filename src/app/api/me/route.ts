export async function POST(req: Request) {
  const { accessToken } = await req.json();

  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();
  return Response.json(data);
}