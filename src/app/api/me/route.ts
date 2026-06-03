export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();

    console.log("\n======================");
    console.log("📥 /api/me HIT");
    console.log("======================");

    console.log("🔑 Access token preview:", accessToken?.slice(0, 25));

    if (!accessToken) {
      console.log("❌ Missing access token");
      return Response.json({ error: "Missing access token" }, { status: 400 });
    }

    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    console.log("\n👤 SPOTIFY /me RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n📊 QUICK SUMMARY:");
    console.log("User ID:", data?.id);
    console.log("Display name:", data?.display_name);
    console.log("Country:", data?.country);
    console.log("Product:", data?.product);

    if (!res.ok) {
      console.log("❌ Spotify /me failed:", res.status);
      return Response.json(
        { error: true, message: data },
        { status: res.status }
      );
    }

    return Response.json(data);
  } catch (err: any) {
    console.log("\n💥 /api/me CRASHED");
    console.error(err);

    return Response.json(
      {
        error: true,
        message: err.message,
      },
      { status: 500 }
    );
  }
}