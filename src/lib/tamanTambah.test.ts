import { TAMAN_TAMBAH_QUESTION_IDS, TAMAN_TAMBAH_TEST_PATH, selectTamanTambahQuestions, tamanTambahLoginDestination } from "./tamanTambah";

const catalog: Array<{id: string; type: string; question_mode: string}> = TAMAN_TAMBAH_QUESTION_IDS.map((id, index) => ({id, type: index < 10 ? "essay" : "mcq", question_mode: "practice"}));
test("selects exactly the selected 24 questions in stable order from a larger catalog", () => {
  const selected = selectTamanTambahQuestions([...catalog].reverse().concat([{id:"unrelated",type:"essay",question_mode:"practice"}]));
  expect(selected.map(q => q.id)).toEqual(TAMAN_TAMBAH_QUESTION_IDS);
  expect(new Set(selected.map(q => q.id)).size).toBe(24);
});
test.each(["missing", "tryout", "drag_drop"])("does not silently offer an incomplete or changed set: %s", change => {
  const changed = catalog.map(q => ({...q}));
  if(change === "missing") changed.pop();
  else if(change === "tryout") changed[0].question_mode = "tryout";
  else changed[0].type = change;
  expect(selectTamanTambahQuestions(changed)).toEqual([]);
});
test("login accepts only the exact local test destination", () => {
  expect(tamanTambahLoginDestination(TAMAN_TAMBAH_TEST_PATH)).toBe(TAMAN_TAMBAH_TEST_PATH);
  for(const next of [null,"https://evil.test","//evil.test", "/materials/41", TAMAN_TAMBAH_TEST_PATH+"&next=https://evil.test"])
    expect(tamanTambahLoginDestination(next)).toBeNull();
});
