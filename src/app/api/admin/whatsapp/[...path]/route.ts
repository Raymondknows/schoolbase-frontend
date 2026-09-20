import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/api-client";

const buildWhatsAppBackendUrl = (pathSegments: string[], search: string): string => {
  const path = pathSegments.join("/");
  // Keep the public proxy path neutral while targeting the backend Baileys route.
  return buildApiUrl(`/admin/whatsapp-baileys/${path}`, search);
};

const resolvePathSegments = async (params: Promise<{ path?: string[] }> | { path?: string[] }) => {
  const resolvedParams = await params;
  return resolvedParams.path ?? [];
};

const forwardRequest = async (request: NextRequest, pathSegments: string[]) => {
  const url = new URL(buildWhatsAppBackendUrl(pathSegments, request.nextUrl.search));

  try {
    const hasCookie = Boolean(request.headers.get('cookie'));
    const params = new URLSearchParams(url.search);
    if (!hasCookie && !params.has('schoolId')) {
      const devId = process.env.DEV_SCHOOL_ID || 'cmpfstpy30002ttiwhvivq6gt';
      if (process.env.NODE_ENV !== 'production' && devId) {
        params.set('schoolId', devId);
      }
      url.search = params.toString();
      console.debug('[WHATSAPP PROXY] Injected DEV_SCHOOL_ID into forwarded request');
    }
  } catch (e) {
    // ignore
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key === "host" || key === "content-length") {
      return;
    }
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    const bodyText = await request.text();
    if (bodyText) {
      init.body = bodyText;
    }
  }

  try {
    const response = await fetch(url.toString(), init);
    const responseBody = await response.arrayBuffer();
    const responseHeaders = new Headers(response.headers);

    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("connection");

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[WHATSAPP PROXY] Failed to forward request to backend:', error);
    return NextResponse.json(
      { error: 'Failed to forward request to backend', details: String(error) },
      { status: 502 }
    );
  }
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return forwardRequest(request, await resolvePathSegments(params));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return forwardRequest(request, await resolvePathSegments(params));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return forwardRequest(request, await resolvePathSegments(params));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return forwardRequest(request, await resolvePathSegments(params));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return forwardRequest(request, await resolvePathSegments(params));
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return forwardRequest(request, await resolvePathSegments(params));
}
