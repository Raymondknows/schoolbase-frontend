import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

export async function POST(req: Request) {
  try {
    const url = `${getBackendUrl()}/api/whatsapp/retry`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
      body: await req.text(),
    });

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    console.error('[WHATSAPP RETRY] Proxy error:', err);
    return NextResponse.json({ error: 'Failed to proxy retry to backend' }, { status: 500 });
  }
}
