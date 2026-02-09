import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";
import { randomUUID } from "crypto";

function parseDataImage(input: string): { mime: string; buffer: Buffer } | null {
  const match = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  try {
    const buffer = Buffer.from(base64, "base64");
    return { mime, buffer };
  } catch {
    return null;
  }
}

function extensionFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  return "bin";
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["admin"]);

    const limitParam = req.nextUrl.searchParams.get("limit");
    const dryRunParam = req.nextUrl.searchParams.get("dryRun");

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 500) : 100;
    const dryRun = dryRunParam === "true";

    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, email, avatar_url")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const base64Users = (users || []).filter((u) => typeof u.avatar_url === "string" && u.avatar_url.startsWith("data:image/"));

    const toProcess = base64Users.slice(0, limit);

    const results: Array<{ id: string; email: string; status: "migrated" | "skipped" | "error"; message?: string; newUrl?: string }> = [];

    for (const u of toProcess) {
      const parsed = parseDataImage(u.avatar_url);
      if (!parsed) {
        results.push({ id: u.id, email: u.email, status: "skipped" });
        continue;
      }

      const ext = extensionFromMime(parsed.mime);
      const objectPath = `avatars/${u.id}/migrated-${Date.now()}-${randomUUID()}.${ext}`;

      if (dryRun) {
        const { data: publicUrlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(objectPath);
        results.push({ id: u.id, email: u.email, status: "migrated", message: "dryRun", newUrl: publicUrlData.publicUrl });
        continue;
      }

      const { error: uploadError } = await supabaseAdmin.storage
        .from("avatars")
        .upload(objectPath, parsed.buffer, {
          contentType: parsed.mime,
          upsert: true,
        });

      if (uploadError) {
        results.push({ id: u.id, email: u.email, status: "error", message: uploadError.message });
        continue;
      }

      const { data: publicUrlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(objectPath);
      const newUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ avatar_url: newUrl, updated_at: new Date().toISOString() })
        .eq("id", u.id);

      if (updateError) {
        results.push({ id: u.id, email: u.email, status: "error", message: updateError.message });
        continue;
      }

      results.push({ id: u.id, email: u.email, status: "migrated", newUrl });
    }

    return NextResponse.json({
      success: true,
      dryRun,
      foundBase64: base64Users.length,
      processed: toProcess.length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}
