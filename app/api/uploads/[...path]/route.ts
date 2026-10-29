import { NextResponse } from "next/server";

const BACKEND_ORIGIN = "http://localhost:8080";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const backendUrl = `${BACKEND_ORIGIN}/uploads/${path.join("/")}`;

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");
  if (auth) {
    headers.set("authorization", auth);
  }
  if (cookie) {
    headers.set("cookie", cookie);
  }

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get("content-type");
    const body = await response.arrayBuffer();

    const res = new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": contentType || "application/octet-stream",
        "cache-control": "private, max-age=3600",
      },
    });
    return res;
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
