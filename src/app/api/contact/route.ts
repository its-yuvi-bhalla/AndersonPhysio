export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(process.env.GS_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Google Sheets Error:", errorText);
      return new Response(JSON.stringify({ error: "Google Sheets Error" }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Server Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
