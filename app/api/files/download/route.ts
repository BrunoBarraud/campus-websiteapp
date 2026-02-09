import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

function parseSupabasePublicObjectUrl(rawUrl: string): { bucket: string; path: string } | null {
  try {
    const url = new URL(rawUrl);

    // Expected forms:
    // /storage/v1/object/public/<bucket>/<path>
    // /storage/v1/object/sign/<bucket>/<path>
    const parts = url.pathname.split("/").filter(Boolean);
    const storageIdx = parts.indexOf("storage");
    if (storageIdx === -1) return null;

    const objectIdx = parts.indexOf("object");
    if (objectIdx === -1) return null;

    const access = parts[objectIdx + 1];
    if (!access) return null;

    const bucket = parts[objectIdx + 2];
    if (!bucket) return null;

    const path = parts.slice(objectIdx + 3).join("/");
    if (!path) return null;

    return { bucket, path };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin", "teacher", "student"]);

    const urlParam = req.nextUrl.searchParams.get("url");
    const nameParam = req.nextUrl.searchParams.get("name");
    if (!urlParam) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const parsed = parseSupabasePublicObjectUrl(urlParam);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid storage url" }, { status: 400 });
    }

    const { bucket, path } = parsed;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || "Could not create signed URL" },
        { status: 404 }
      );
    }

    const redirectUrl = new URL(data.signedUrl);
    if (nameParam && nameParam.trim()) {
      redirectUrl.searchParams.set("download", nameParam);
    }

    return NextResponse.redirect(redirectUrl.toString(), { status: 302 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
