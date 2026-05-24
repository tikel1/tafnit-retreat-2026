/**
 * Gemini API proxy for Tafnit Retreat (Cloudflare Worker).
 *
 * The browser calls this worker; the worker attaches GEMINI_API_KEY and
 * forwards to Google. The key never ships in the static GitHub Pages bundle.
 *
 * Routes (prefix /gemini):
 *   POST /gemini/v1beta/models/...     → REST generateContent
 *   GET  /gemini/v1beta/models/...     → SSE streamGenerateContent
 *   WS   /gemini/ws/...                → Gemini Live (BidiGenerateContent)
 */

const UPSTREAM_HTTP = "https://generativelanguage.googleapis.com";
const UPSTREAM_WS = "wss://generativelanguage.googleapis.com";
const PREFIX = "/gemini";

function parseAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || "https://tikel1.github.io";
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const allowed = parseAllowedOrigins(env);
  return allowed.some(a => {
    if (a.endsWith("*")) {
      const prefix = a.slice(0, -1);
      return origin.startsWith(prefix);
    }
    return origin === a;
  });
}

function corsHeaders(origin, env) {
  if (!origin || !isAllowedOrigin(origin, env)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function stripPrefix(pathname) {
  if (!pathname.startsWith(PREFIX)) return null;
  const rest = pathname.slice(PREFIX.length);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

async function proxyHttp(request, env, origin) {
  const url = new URL(request.url);
  const upstreamPath = stripPrefix(url.pathname);
  if (!upstreamPath) {
    return new Response("Not found", { status: 404, headers: corsHeaders(origin, env) });
  }

  const target = new URL(`${UPSTREAM_HTTP}${upstreamPath}`);
  target.search = url.search;
  target.searchParams.set("key", env.GEMINI_API_KEY);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");

  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body
  });

  const outHeaders = new Headers(upstream.headers);
  Object.entries(corsHeaders(origin, env)).forEach(([k, v]) => outHeaders.set(k, v));

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders
  });
}

async function proxyWebSocket(request, env, origin) {
  if (!isAllowedOrigin(origin, env)) {
    return new Response("Forbidden origin", { status: 403 });
  }

  const url = new URL(request.url);
  const upstreamPath = stripPrefix(url.pathname);
  if (!upstreamPath) {
    return new Response("Not found", { status: 404 });
  }

  const target = `${UPSTREAM_WS}${upstreamPath}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);
  server.accept();

  let upstream;
  try {
    const res = await fetch(target, { headers: { Upgrade: "websocket" } });
    upstream = res.webSocket;
    if (!upstream) {
      server.close(1011, "Upstream WebSocket unavailable");
      return new Response("Bad gateway", { status: 502 });
    }
    upstream.accept();
  } catch {
    server.close(1011, "Upstream connect failed");
    return new Response("Bad gateway", { status: 502 });
  }

  const pipe = (from, to) => {
    from.addEventListener("message", ev => {
      try {
        to.send(ev.data);
      } catch {
        /* closed */
      }
    });
    from.addEventListener("close", ev => {
      try {
        to.close(ev.code, ev.reason);
      } catch {
        /* ignore */
      }
    });
    from.addEventListener("error", () => {
      try {
        to.close(1011, "Socket error");
      } catch {
        /* ignore */
      }
    });
  };

  pipe(server, upstream);
  pipe(upstream, server);

  return new Response(null, { status: 101, webSocket: client });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      const headers = corsHeaders(origin, env);
      if (!headers["Access-Control-Allow-Origin"]) {
        return new Response("Forbidden", { status: 403 });
      }
      return new Response(null, { status: 204, headers });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response("Proxy misconfigured", { status: 503 });
    }

    const upgrade = request.headers.get("Upgrade");
    if (upgrade?.toLowerCase() === "websocket") {
      return proxyWebSocket(request, env, origin);
    }

    if (!isAllowedOrigin(origin, env)) {
      return new Response("Forbidden origin", { status: 403 });
    }

    return proxyHttp(request, env, origin);
  }
};
