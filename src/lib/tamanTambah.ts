// Public membership only. Grading keys remain in the existing server grader.
export const TAMAN_TAMBAH_TEST_PATH = "/materials/42?start=practice&set=taman-tambah";
export const TAMAN_TAMBAH_QUESTION_IDS = [
  "b7c47b90-1da5-4bbe-a152-88f61e01bfb1",
  "5b74c59b-f630-4f57-b71e-03f812141c6a",
  "76b09fc8-fed5-4c70-9f4f-556dbdd285ed",
  "59d58a86-47d5-43da-b01f-c574d1a2ce7c",
  "3e8feab6-5843-4114-ac75-92265abbb9cf",
  "776ab619-6ead-4c02-8c4d-8e840f607618",
  "ad76e5fa-a890-40b5-8c1b-e4b3f9481f41",
  "6ea10e75-3377-46a0-8f98-d91a942068f0",
  "a268ce78-3360-42f1-827a-6afbfc4d6c43",
  "0cb56077-8c02-47fb-ae25-85ca5b021e3a",
  "77b3dd14-324e-4569-ba39-dd37e5556861",
  "b1c9146d-a5b1-44a8-888d-d84b16802102",
  "cd9a12f9-ae30-4650-88ea-ca23af31a216",
  "0105a321-a145-49b8-982a-4d902b4c4673",
  "21c442c7-0eaa-4741-9d21-1511e8b6bafe",
] as const;

export function selectTamanTambahQuestions<T extends {
  id: string; type: string; question_mode?: string | null;
}>(questions: readonly T[]): T[] {
  const byId = new Map(questions.map(question => [question.id, question]));
  const selected = TAMAN_TAMBAH_QUESTION_IDS.map(id => byId.get(id));
  if (selected.some(question => !question || question.question_mode === "tryout" ||
      !["essay", "mcq"].includes(question.type))) return [];
  return selected as T[];
}

// Allow exactly our same-origin destination; never accept arbitrary next URLs.
export function tamanTambahLoginDestination(next: string | null): string | null {
  return next === TAMAN_TAMBAH_TEST_PATH ? TAMAN_TAMBAH_TEST_PATH : null;
}
