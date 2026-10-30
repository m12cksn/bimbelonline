import { isValidElement, type ReactNode } from "react";
import MaterialPage from "./page";
import MaterialWithResources from "./material_client";
import { TAMAN_TAMBAH_QUESTION_IDS, TAMAN_TAMBAH_TEST_PATH } from "@/lib/tamanTambah";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
jest.mock("./material_client", () => ({ __esModule: true, default: () => null }));

function findQuiz(node: ReactNode): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) { const found = findQuiz(child); if (found) return found; }
    return null;
  }
  if (!isValidElement<{children?: ReactNode}>(node)) return null;
  if (node.type === MaterialWithResources) return node.props as Record<string, unknown>;
  return findQuiz(node.props.children);
}

const metadata = TAMAN_TAMBAH_QUESTION_IDS.map((id, i) => ({id, type: "essay", question_number: i + 1, question_mode: "practice"}));
function mockDatabase(loggedIn: boolean) {
  const from = jest.fn((table: string) => {
    const data = table === "profiles" ? {role:"student",learning_track:"math"}
      : table === "materials" ? {id:42,title:"Penjumlahan",grade_id:1,subject_id:1,video_url:null,pdf_url:null}
      : table === "student_material_progress" ? {last_question_number:0} : metadata;
    const query: Record<string, unknown> = {};
    for (const method of ["select","eq","order","or"]) query[method] = () => query;
    query.single = async () => ({data,error:null});
    query.limit = async () => ({data:[],error:null});
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({data,error:null}).then(resolve);
    return query;
  });
  jest.mocked(createSupabaseServerClient).mockResolvedValue({auth:{getUser:async()=>({data:{user:loggedIn?{id:"student"}:null}})},from} as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
  return from;
}
const props = {params:Promise.resolve({id:"42"}),searchParams:Promise.resolve({set:"taman-tambah",start:"practice"})};
test("guest must sign in with the exact test return path before content queries", async () => {
  const from = mockDatabase(false);
  await expect(MaterialPage(props)).rejects.toThrow(`redirect:/login?next=${encodeURIComponent(TAMAN_TAMBAH_TEST_PATH)}`);
  expect(from).not.toHaveBeenCalled();
});
test("authenticated handoff starts the regular engine with exactly 15 selected questions", async () => {
  mockDatabase(true);
  const quiz = findQuiz(await MaterialPage(props));
  expect(quiz?.autoStartPractice).toBe(true);
  expect(quiz?.isGuest).toBe(false);
  expect((quiz?.questionMeta as typeof metadata).map(q=>q.id)).toEqual(TAMAN_TAMBAH_QUESTION_IDS);
});
