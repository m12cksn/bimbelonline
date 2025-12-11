// app/api/teacher/notes/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface Params {
  params: Promise<{ id: string }>;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          /* noop */
        },
      },
    }
  );
}

export async function PATCH(req: Request, props: Params) {
  const { id } = await props.params;
  const body = await req.json().catch(() => null);
  const newContent = body?.content?.toString()?.trim();

  if (!newContent) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const supabase = await getSupabase();

  // auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // get note
  const { data: note, error: noteError } = await supabase
    .from("teacher_notes")
    .select("id, student_id, material_id, content, created_by")
    .eq("id", id)
    .single();

  if (noteError || !note) {
    console.error("Patch note: fetch error", noteError);
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // get roles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? null;

  // only owner (created_by) or admin can update
  if (note.created_by !== user.id && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // update
  const { error: updateError } = await supabase
    .from("teacher_notes")
    .update({ content: newContent, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    console.error("Patch note: update error", updateError);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, props: Params) {
  const { id } = await props.params;

  const supabase = await getSupabase();

  // auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // get note
  const { data: note, error: noteError } = await supabase
    .from("teacher_notes")
    .select("id, created_by")
    .eq("id", id)
    .single();

  if (noteError || !note) {
    console.error("Delete note: fetch error", noteError);
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // get role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? null;

  // only owner or admin
  if (note.created_by !== user.id && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: delError } = await supabase
    .from("teacher_notes")
    .delete()
    .eq("id", id);

  if (delError) {
    console.error("Delete note: delete error", delError);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
