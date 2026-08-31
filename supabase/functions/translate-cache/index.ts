// Server-side gate for translations_cache writes. Previously the browser
// wrote directly to this public table (insert policy: `with check (true)`),
// so anyone could poison the shared cache with an arbitrary source/
// translated pair via the REST API, no UI needed. This function is now the
// only writer: it calls the translation API itself and only ever inserts a
// pair it generated. The insert RLS policy on translations_cache should be
// dropped once this is deployed (see migration_lock_down_write_paths.sql).
import { createClient } from "jsr:@supabase/supabase-js@2"

// Both callers of this are invoked cross-origin from the browser (the site
// lives on GitHub Pages, functions live on *.supabase.co), so every response
// needs a matching CORS header. Only the production origin and local dev
// servers are allowed — never a wildcard, since this function writes data.
const ALLOWED_ORIGINS = new Set([
  "https://kenjisatolove.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
])

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : ""
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  }
}

function handleOptions(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null
  return new Response("ok", { headers: corsHeaders(req.headers.get("origin")) })
}

const MAX_LEN = 2000

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight
  const headers = { ...corsHeaders(req.headers.get("origin")), "Content-Type": "application/json" }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers })
  }

  let body: { source_text?: unknown }
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== "object") throw new Error("not an object")
    body = parsed
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers })
  }

  const sourceText = typeof body.source_text === "string" ? body.source_text.trim() : ""
  if (!sourceText || sourceText.length > MAX_LEN) {
    return new Response(JSON.stringify({ error: "Invalid source_text" }), { status: 400, headers })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data: cached } = await supabase
    .from("translations_cache")
    .select("translated_text")
    .eq("source_text", sourceText)
    .maybeSingle()
  if (cached?.translated_text) {
    return new Response(JSON.stringify({ translated_text: cached.translated_text }), { status: 200, headers })
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=lv|en&de=hello@trackparts.lv`,
      )
      const json = await res.json()
      const translated = json?.responseData?.translatedText
      if (
        typeof translated === "string" &&
        translated.length > 0 &&
        translated.length <= MAX_LEN &&
        translated.toLowerCase() !== sourceText.toLowerCase()
      ) {
        await supabase.from("translations_cache").insert({ source_text: sourceText, translated_text: translated })
        return new Response(JSON.stringify({ translated_text: translated }), { status: 200, headers })
      }
    } catch {
      // offline or API hiccup — fall through to retry
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return new Response(JSON.stringify({ translated_text: sourceText }), { status: 200, headers })
})
