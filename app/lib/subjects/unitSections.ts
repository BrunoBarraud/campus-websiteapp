import { supabaseAdmin } from "@/app/lib/supabaseClient";

interface GetUnitSectionsOptions {
  contentActiveOnly?: boolean;
}

export async function getUnitSections(
  unitId: string,
  options: GetUnitSectionsOptions = {}
) {
  const { contentActiveOnly = false } = options;

  let contentQuery = supabaseAdmin
    .from("subject_content")
    .select(
      `
      id,
      title,
      content_type,
      content,
      file_url,
      file_name,
      created_at,
      is_active,
      creator:users(name)
    `
    )
    .eq("unit_id", unitId)
    .order("created_at", { ascending: true });

  if (contentActiveOnly) {
    contentQuery = contentQuery.eq("is_active", true);
  }

  const [contentRes, forumsRes] = await Promise.all([
    contentQuery,
    supabaseAdmin
      .from("forums")
      .select(
        `
        id,
        title,
        description,
        created_at,
        questions_count,
        is_locked,
        is_active,
        creator:users!forums_created_by_fkey(name)
      `
      )
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  if (contentRes.error) {
    throw new Error(contentRes.error.message || "Error al obtener contenidos");
  }

  if (forumsRes.error) {
    throw new Error(forumsRes.error.message || "Error al obtener foros");
  }

  const contents = contentRes.data || [];
  const forums = forumsRes.data || [];

  const assignmentContentIds = contents
    .filter((section) => section.content_type === "assignment")
    .map((section) => section.id);

  let assignmentMap = new Map<string, { id: string; due_date: string | null; is_active: boolean | null }>();

  if (assignmentContentIds.length > 0) {
    const { data: assignments, error: assignmentError } = await supabaseAdmin
      .from("assignments")
      .select("id, due_date, is_active, subject_content_id")
      .in("subject_content_id", assignmentContentIds);

    if (assignmentError) {
      throw new Error(assignmentError.message || "Error al obtener tareas");
    }

    assignmentMap = new Map(
      (assignments || []).map((assignment: any) => [
        assignment.subject_content_id,
        {
          id: assignment.id,
          due_date: assignment.due_date ?? null,
          is_active: assignment.is_active ?? null,
        },
      ])
    );
  }

  const normalizedContents = contents.map((section: any) => {
    const assignment = assignmentMap.get(section.id);
    return {
      id: section.id,
      title: section.title,
      content_type: section.content_type,
      content: section.content || "",
      file_url: section.file_url ?? null,
      file_name: section.file_name ?? null,
      created_at: section.created_at,
      creator_name: section.creator?.name || "Desconocido",
      assignment_id: assignment?.id || null,
      due_date: assignment?.due_date || null,
      is_active:
        section.content_type === "assignment"
          ? assignment?.is_active ?? null
          : section.is_active ?? null,
      forum_id: null,
      questions_count: null,
      is_closed: null,
    };
  });

  const normalizedForums = forums.map((forum: any) => ({
    id: `forum-${forum.id}`,
    title: forum.title,
    content_type: "forum",
    content: forum.description || "",
    file_url: null,
    file_name: null,
    created_at: forum.created_at,
    creator_name: forum.creator?.name || "Profesor",
    assignment_id: null,
    due_date: null,
    is_active: forum.is_active ?? true,
    forum_id: forum.id,
    questions_count: forum.questions_count || 0,
    is_closed: forum.is_locked || false,
  }));

  return [...normalizedContents, ...normalizedForums].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}
