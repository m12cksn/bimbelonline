import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

interface SummaryPageProps {
  params: Promise<{ id: string }>;
}

function isMarkdownUrl(rawUrl: string | null): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.pathname.toLowerCase().endsWith(".md");
  } catch {
    return rawUrl.toLowerCase().endsWith(".md");
  }
}

export default async function MaterialSummaryPage(props: SummaryPageProps) {
  const { id } = await props.params;
  const materialId = Number(id);
  if (!Number.isFinite(materialId)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbClient =
    !user && serviceKey
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase;

  const { data: material } = await dbClient
    .from("materials")
    .select("id, title, pdf_url")
    .eq("id", materialId)
    .single();

  if (!material || !isMarkdownUrl(material.pdf_url)) {
    notFound();
  }

  const mdResp = await fetch(material.pdf_url!, { cache: "no-store" });
  if (!mdResp.ok) {
    notFound();
  }

  const markdown = await mdResp.text();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-slate-900">
            Ringkasan Materi: {material.title}
          </h1>
          <Link
            href={`/materials/${material.id}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Kembali ke Materi
          </Link>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-sm">
          <div className="prose prose-slate max-w-none text-sm leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}

