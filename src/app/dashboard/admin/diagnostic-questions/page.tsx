"use client";

import { useEffect, useMemo, useState } from "react";
import MathText from "@/app/components/MathText";
import { useToast } from "@/app/components/ToastProvider";

type DiagnosticCategory =
  | "Pemahaman Bilangan"
  | "Kelancaran Berhitung"
  | "Pecahan"
  | "Soal Cerita"
  | "Penalaran Logis";

type Difficulty = "mudah" | "sedang" | "menantang";
type AssessmentBand = "foundation" | "core" | "stretch";
type CognitiveType = "fluency" | "concept" | "application" | "reasoning";

type DiagnosticQuestion = {
  id: string;
  gradeLevel: number;
  skillLevel: number;
  assessmentBand: AssessmentBand;
  category: DiagnosticCategory;
  domain: string;
  skill: string;
  subskill: string;
  prerequisiteSkill: string;
  difficulty: Difficulty;
  cognitiveType: CognitiveType;
  recommendationKey: string;
  misconceptionKey: string | null;
  diagnosticWeight: number;
  diagnosticVersion: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  sortOrder?: number | null;
  isActive?: boolean;
};

const categories: DiagnosticCategory[] = [
  "Pemahaman Bilangan",
  "Kelancaran Berhitung",
  "Pecahan",
  "Soal Cerita",
  "Penalaran Logis",
];

const difficulties: Difficulty[] = ["mudah", "sedang", "menantang"];
const assessmentBands: AssessmentBand[] = ["foundation", "core", "stretch"];
const cognitiveTypes: CognitiveType[] = [
  "fluency",
  "concept",
  "application",
  "reasoning",
];

const bandLabels: Record<AssessmentBand, string> = {
  foundation: "Foundation",
  core: "Core",
  stretch: "Stretch",
};

const cognitiveLabels: Record<CognitiveType, string> = {
  fluency: "Fluency",
  concept: "Concept",
  application: "Application",
  reasoning: "Reasoning",
};

const visualIconTools = [
  { label: "Lingkaran", token: "{{circle:6}}" },
  { label: "Lingkaran Hijau", token: "{{circle-green:6}}" },
  { label: "Lingkaran Pink", token: "{{circle-pink:6}}" },
  { label: "Lingkaran Ungu", token: "{{circle-purple:6}}" },
  { label: "Segitiga", token: "{{triangle:6}}" },
  { label: "Bintang", token: "{{star:6}}" },
  { label: "Apel", token: "{{apple:6}}" },
  { label: "Pisang", token: "{{banana:6}}" },
  { label: "Kucing", token: "{{cat:6}}" },
  { label: "Ikan", token: "{{fish:6}}" },
  { label: "Jeruk", token: "{{orange:6}}" },
  { label: "Blok", token: "{{block:6}}" },
  { label: "Kotak", token: "{{box:6}}" },
  { label: "Tambah", token: "{{plus:6}}" },
  { label: "Pecahan", token: "{{icon:fraction:1}}" },
  { label: "Geometri", token: "{{icon:geometry:1}}" },
  { label: "Aritmatika", token: "{{icon:aritmatika:1}}" },
  { label: "Pengukuran", token: "{{icon:pengukuran:1}}" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-black text-[#102449]">{title}</h2>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function defaultSkillFromCategory(category: DiagnosticCategory) {
  const map: Record<DiagnosticCategory, string> = {
    "Pemahaman Bilangan": "Number Sense",
    "Kelancaran Berhitung": "Calculation Fluency",
    Pecahan: "Fractions",
    "Soal Cerita": "Word Problem Modeling",
    "Penalaran Logis": "Logical Reasoning",
  };
  return map[category];
}

function defaultCognitiveType(category: DiagnosticCategory): CognitiveType {
  if (category === "Kelancaran Berhitung") return "fluency";
  if (category === "Soal Cerita") return "application";
  if (category === "Penalaran Logis") return "reasoning";
  return "concept";
}

function defaultRecommendationKey(
  gradeLevel: number,
  category: DiagnosticCategory,
) {
  return `G${gradeLevel}_${defaultSkillFromCategory(category)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;
}

const emptyForm = (gradeLevel = 1): Omit<DiagnosticQuestion, "id"> => ({
  gradeLevel,
  skillLevel: gradeLevel,
  assessmentBand: "core",
  category: "Pemahaman Bilangan",
  domain: defaultSkillFromCategory("Pemahaman Bilangan"),
  skill: defaultSkillFromCategory("Pemahaman Bilangan"),
  subskill: defaultSkillFromCategory("Pemahaman Bilangan"),
  prerequisiteSkill: "",
  difficulty: "sedang",
  cognitiveType: defaultCognitiveType("Pemahaman Bilangan"),
  recommendationKey: defaultRecommendationKey(gradeLevel, "Pemahaman Bilangan"),
  misconceptionKey: null,
  diagnosticWeight: 1,
  diagnosticVersion: "MATH_CHECKUP_V1",
  prompt: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
  sortOrder: null,
  isActive: true,
});

export default function AdminDiagnosticQuestionsPage() {
  const toast = useToast();
  const [gradeLevel, setGradeLevel] = useState(1);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<DiagnosticQuestion, "id">>(
    emptyForm(1),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const testScore = useMemo(() => {
    const total = questions.length;
    const correct = questions.filter(
      (question) => testAnswers[question.id] === question.correctAnswer,
    ).length;
    return {
      correct,
      total,
      score: total ? Math.round((correct / total) * 100) : 0,
    };
  }, [questions, testAnswers]);

  useEffect(() => {
    void loadQuestions(gradeLevel);
  }, [gradeLevel]);

  async function loadQuestions(nextGrade = gradeLevel) {
    setLoading(true);
    setShowResult(false);
    setTestAnswers({});
    try {
      const res = await fetch(
        `/api/adm/diagnostic-questions/list?gradeLevel=${nextGrade}`,
      );
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal memuat soal diagnostic.");
      setQuestions(json.questions ?? []);
      setSelectedId(null);
      setForm(emptyForm(nextGrade));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function selectQuestion(question: DiagnosticQuestion) {
    setSelectedId(question.id);
    setForm({
      gradeLevel: question.gradeLevel,
      skillLevel: question.skillLevel ?? question.gradeLevel,
      assessmentBand: question.assessmentBand ?? "core",
      category: question.category,
      domain: question.domain ?? question.category,
      skill: question.skill ?? defaultSkillFromCategory(question.category),
      subskill:
        question.subskill ??
        question.skill ??
        defaultSkillFromCategory(question.category),
      prerequisiteSkill: question.prerequisiteSkill ?? "",
      difficulty: question.difficulty,
      cognitiveType:
        question.cognitiveType ?? defaultCognitiveType(question.category),
      recommendationKey:
        question.recommendationKey ??
        defaultRecommendationKey(question.gradeLevel, question.category),
      misconceptionKey: question.misconceptionKey ?? null,
      diagnosticWeight: question.diagnosticWeight ?? 1,
      diagnosticVersion: question.diagnosticVersion ?? "MATH_CHECKUP_V1",
      prompt: question.prompt,
      options: [...question.options, "", "", "", ""].slice(
        0,
        Math.max(4, question.options.length),
      ),
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      sortOrder: question.sortOrder ?? null,
      isActive: question.isActive ?? true,
    });
  }

  function updateOption(index: number, value: string) {
    setForm((current) => {
      const options = [...current.options];
      options[index] = value;
      return {
        ...current,
        options,
        correctAnswer:
          current.correctAnswer === current.options[index]
            ? value
            : current.correctAnswer,
      };
    });
  }

  function addOption() {
    setForm((current) => ({ ...current, options: [...current.options, ""] }));
  }

  function removeOption(index: number) {
    setForm((current) => {
      const removed = current.options[index];
      const options = current.options.filter(
        (_, itemIndex) => itemIndex !== index,
      );
      return {
        ...current,
        options,
        correctAnswer:
          current.correctAnswer === removed ? "" : current.correctAnswer,
      };
    });
  }

  function updateCategory(category: DiagnosticCategory) {
    setForm((current) => {
      const skill = defaultSkillFromCategory(category);
      return {
        ...current,
        category,
        domain: current.domain || skill,
        skill: current.skill || skill,
        subskill: current.subskill || skill,
        cognitiveType: defaultCognitiveType(category),
        recommendationKey:
          current.recommendationKey ||
          defaultRecommendationKey(current.gradeLevel, category),
      };
    });
  }

  function insertVisualIconToken(token: string) {
    setForm((current) => ({
      ...current,
      prompt: current.prompt ? `${current.prompt}\n${token}` : token,
    }));
  }

  function payload() {
    const options = form.options.map((option) => option.trim()).filter(Boolean);
    return {
      gradeLevel: form.gradeLevel,
      skillLevel: form.skillLevel,
      assessmentBand: form.assessmentBand,
      category: form.category,
      domain: form.domain,
      skill: form.skill.trim(),
      subskill: form.subskill.trim(),
      prerequisiteSkill: form.prerequisiteSkill.trim(),
      difficulty: form.difficulty,
      cognitiveType: form.cognitiveType,
      recommendationKey: form.recommendationKey.trim(),
      misconceptionKey: form.misconceptionKey?.trim() || null,
      diagnosticWeight: Number(form.diagnosticWeight),
      diagnosticVersion: form.diagnosticVersion.trim(),
      prompt: form.prompt.trim(),
      options,
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation.trim(),
      sortOrder: form.sortOrder ? Number(form.sortOrder) : null,
      isActive: form.isActive ?? true,
    };
  }

  async function createQuestion() {
    setSaving(true);
    try {
      const res = await fetch("/api/adm/diagnostic-questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal membuat soal.");
      toast.success("Soal diagnostic berhasil dibuat.");
      await loadQuestions(form.gradeLevel);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveQuestion() {
    if (!selectedId) {
      toast.error("Pilih soal yang ingin diedit.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/adm/diagnostic-questions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, ...payload() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal menyimpan soal.");
      toast.success("Soal diagnostic tersimpan.");
      await loadQuestions(form.gradeLevel);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion() {
    if (!selectedId || !window.confirm("Hapus soal diagnostic ini?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/adm/diagnostic-questions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal menghapus soal.");
      toast.success("Soal diagnostic dihapus.");
      await loadQuestions(gradeLevel);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function seedDefaults() {
    if (
      !window.confirm(
        `Sinkronkan soal default untuk Kelas ${gradeLevel}? Soal default kelas ini dengan ID yang sama akan diperbarui.`,
      )
    )
      return;
    setSaving(true);
    try {
      const res = await fetch("/api/adm/diagnostic-questions/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeLevel }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json.error || "Gagal sinkron soal default.");
      toast.success(
        `Soal default Kelas ${json.gradeLevel ?? gradeLevel} sudah disinkronkan.`,
      );
      await loadQuestions(gradeLevel);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eefbf3] p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden border border-emerald-100 bg-white shadow-[0_24px_70px_-55px_rgba(15,23,42,0.45)]">
          <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-lime-500 p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
                  Admin Diagnostic
                </p>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                  Kelola Soal Math Check-Up
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-emerald-50">
                  Isi soal utama dulu. Metadata lanjutan disembunyikan agar
                  halaman tidak terasa seperti form panjang.
                </p>
              </div>
              <button
                type="button"
                onClick={seedDefaults}
                disabled={saving}
                className="border border-white/30 bg-white/95 px-4 py-3 text-sm font-black text-emerald-800 shadow-[0_14px_35px_-24px_rgba(15,23,42,0.65)] hover:bg-emerald-50 disabled:opacity-60"
              >
                Sinkron Soal Kelas {gradeLevel}
              </button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
            <aside className="border-b border-slate-200 bg-slate-50/80 lg:border-b-0 lg:border-r">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4">
                <label className="block">
                  <FieldLabel>Pilih Kelas</FieldLabel>
                  <select
                    value={gradeLevel}
                    onChange={(event) =>
                      setGradeLevel(Number(event.target.value))
                    }
                    className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black outline-none transition focus:border-emerald-500 focus:bg-white"
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map(
                      (grade) => (
                        <option key={grade} value={grade}>
                          Kelas {grade}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setForm(emptyForm(gradeLevel));
                    setShowAdvanced(false);
                  }}
                  className="mt-3 w-full bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-[0_12px_30px_-22px_rgba(5,150,105,0.9)] hover:bg-emerald-700"
                >
                  + Buat Soal Baru
                </button>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-black">
                  <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                    {questions.length} soal
                  </div>
                  <div className="border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                    Kelas {gradeLevel}
                  </div>
                </div>
              </div>

              <div className="max-h-[72vh] overflow-y-auto p-3">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-24 animate-pulse border border-slate-200 bg-white"
                      />
                    ))}
                  </div>
                ) : questions.length === 0 ? (
                  <div className="border border-dashed border-slate-300 bg-white p-5 text-center">
                    <p className="text-sm font-black text-slate-700">
                      Belum ada soal.
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Klik Buat Soal Baru untuk mulai.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((question, index) => {
                      const active = selectedId === question.id;
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => selectQuestion(question)}
                          className={`w-full border p-3 text-left transition ${
                            active
                              ? "border-emerald-500 bg-emerald-50 shadow-[0_14px_34px_-28px_rgba(5,150,105,0.9)]"
                              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap gap-1">
                              <span className="bg-slate-900 px-2 py-1 text-[10px] font-black text-white">
                                #{question.sortOrder ?? index + 1}
                              </span>
                              <span className="bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-800">
                                {question.assessmentBand ?? "core"}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-black ${question.isActive === false ? "text-red-600" : "text-emerald-700"}`}
                            >
                              {question.isActive === false
                                ? "nonaktif"
                                : "aktif"}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                            <MathText text={question.prompt} />
                          </p>
                          <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500">
                            {question.domain || question.category} -{" "}
                            {question.skill}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            <section className="grid gap-0 xl:grid-cols-[1fr_400px]">
              <div className="bg-white p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      {selectedId ? "Mode Edit" : "Mode Buat"}
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-[#102449]">
                      Editor Soal
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {selectedId
                        ? `Sedang mengedit ${selectedId}`
                        : "Soal baru akan masuk ke daftar kelas terpilih."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={createQuestion}
                      disabled={saving}
                      className="bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Buat
                    </button>
                    <button
                      type="button"
                      onClick={saveQuestion}
                      disabled={saving || !selectedId}
                      className="border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={deleteQuestion}
                      disabled={saving || !selectedId}
                      className="border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="border border-slate-200 bg-slate-50/70 p-4">
                    <SectionTitle
                      eyebrow="Step 1"
                      title="Identitas Soal"
                      description="Tentukan kelas, kategori, tingkat soal, dan urutan tampil."
                    />
                    <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                      <label className="block">
                        <FieldLabel>Kelas</FieldLabel>
                        <select
                          value={form.gradeLevel}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              gradeLevel: Number(event.target.value),
                            }))
                          }
                          className="mt-2 w-full border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                        >
                          {Array.from(
                            { length: 12 },
                            (_, index) => index + 1,
                          ).map((grade) => (
                            <option key={grade} value={grade}>
                              Kelas {grade}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <FieldLabel>Kategori</FieldLabel>
                        <select
                          value={form.category}
                          onChange={(event) =>
                            updateCategory(
                              event.target.value as DiagnosticCategory,
                            )
                          }
                          className="mt-2 w-full border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <FieldLabel>Kesulitan</FieldLabel>
                        <select
                          value={form.difficulty}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              difficulty: event.target.value as Difficulty,
                            }))
                          }
                          className="mt-2 w-full border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                        >
                          {difficulties.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                              {difficulty}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <FieldLabel>Urutan</FieldLabel>
                        <input
                          value={form.sortOrder ?? ""}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              sortOrder: event.target.value
                                ? Number(event.target.value)
                                : null,
                            }))
                          }
                          className="mt-2 w-full border border-slate-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                          placeholder="1"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border border-slate-200 bg-white p-4 shadow-sm">
                    <SectionTitle
                      eyebrow="Step 2"
                      title="Isi Soal"
                      description="Tulis pertanyaan, opsi jawaban, jawaban benar, dan pembahasan."
                    />
                    <label className="mt-4 block">
                      <FieldLabel>Teks Soal</FieldLabel>
                      <div className="mt-2 flex flex-wrap gap-2 border border-emerald-100 bg-emerald-50/70 p-2">
                        {visualIconTools.map((tool) => (
                          <button
                            key={tool.token}
                            type="button"
                            onClick={() => insertVisualIconToken(tool.token)}
                            className="inline-flex items-center gap-2 border border-white bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                            title={`Masukkan ${tool.token}`}
                          >
                            <MathText text={tool.token.replace(":6", ":1")} />
                            {tool.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                        Bisa juga ketik manual, misalnya: Kelompok A:{" "}
                        {"{{circle:6}}"} dan Kelompok B: {"{{triangle:7}}"}.
                      </p>
                      <textarea
                        value={form.prompt}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            prompt: event.target.value,
                          }))
                        }
                        rows={5}
                        className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-emerald-500 focus:bg-white"
                        placeholder="Tulis soal diagnostic di sini..."
                      />
                    </label>

                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3">
                        <FieldLabel>Opsi Jawaban</FieldLabel>
                        <button
                          type="button"
                          onClick={addOption}
                          className="text-xs font-black text-emerald-700 hover:text-emerald-900"
                        >
                          + Tambah Opsi
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {form.options.map((option, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-[1fr_auto] gap-2"
                          >
                            <input
                              value={option}
                              onChange={(event) =>
                                updateOption(index, event.target.value)
                              }
                              className="border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:bg-white"
                              placeholder={`Opsi ${index + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="border border-red-100 bg-white px-3 text-xs font-black text-red-600 hover:bg-red-50"
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <FieldLabel>Jawaban Benar</FieldLabel>
                        <select
                          value={form.correctAnswer}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              correctAnswer: event.target.value,
                            }))
                          }
                          className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
                        >
                          <option value="">Pilih jawaban benar</option>
                          {form.options.filter(Boolean).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-end gap-2 pb-3 text-sm font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.isActive ?? true}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              isActive: event.target.checked,
                            }))
                          }
                        />
                        Soal aktif digunakan di Math Check-Up
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <FieldLabel>Penjelasan</FieldLabel>
                      <textarea
                        value={form.explanation}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            explanation: event.target.value,
                          }))
                        }
                        rows={4}
                        className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-emerald-500 focus:bg-white"
                        placeholder="Penjelasan yang tampil di hasil diagnostic..."
                      />
                    </label>
                  </div>

                  <div className="border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((value) => !value)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left"
                    >
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Step 3
                        </p>
                        <h2 className="mt-1 text-lg font-black text-[#102449]">
                          Metadata Diagnostic Lanjutan
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Untuk analisis skill, hidden gap, recommendation
                          engine, dan versi diagnostic.
                        </p>
                      </div>
                      <span className="shrink-0 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                        {showAdvanced ? "Tutup" : "Buka"}
                      </span>
                    </button>

                    {showAdvanced && (
                      <div className="border-t border-slate-200 p-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <label className="block">
                            <FieldLabel>Skill Level</FieldLabel>
                            <select
                              value={form.skillLevel}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  skillLevel: Number(event.target.value),
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                            >
                              {Array.from(
                                { length: 12 },
                                (_, index) => index + 1,
                              ).map((grade) => (
                                <option key={grade} value={grade}>
                                  Kelas {grade}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <FieldLabel>Assessment Band</FieldLabel>
                            <select
                              value={form.assessmentBand}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  assessmentBand: event.target
                                    .value as AssessmentBand,
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                            >
                              {assessmentBands.map((band) => (
                                <option key={band} value={band}>
                                  {bandLabels[band]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <FieldLabel>Cognitive Type</FieldLabel>
                            <select
                              value={form.cognitiveType}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  cognitiveType: event.target
                                    .value as CognitiveType,
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                            >
                              {cognitiveTypes.map((type) => (
                                <option key={type} value={type}>
                                  {cognitiveLabels[type]}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <label className="block">
                            <FieldLabel>Domain</FieldLabel>
                            <input
                              value={form.domain}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  domain: event.target.value,
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                              placeholder="Number Sense"
                            />
                          </label>
                          <label className="block">
                            <FieldLabel>Skill</FieldLabel>
                            <input
                              value={form.skill}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  skill: event.target.value,
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                              placeholder="Number Sense"
                            />
                          </label>
                          <label className="block">
                            <FieldLabel>Subskill</FieldLabel>
                            <input
                              value={form.subskill}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  subskill: event.target.value,
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                              placeholder="Counting forward"
                            />
                          </label>
                        </div>

                        <label className="mt-4 block">
                          <FieldLabel>Prerequisite Skill</FieldLabel>
                          <input
                            value={form.prerequisiteSkill}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                prerequisiteSkill: event.target.value,
                              }))
                            }
                            className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                            placeholder="Number recognition"
                          />
                        </label>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <label className="block md:col-span-2">
                            <FieldLabel>Recommendation Key</FieldLabel>
                            <input
                              value={form.recommendationKey}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  recommendationKey: event.target.value,
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                              placeholder="G1_NUMBER_SENSE"
                            />
                          </label>
                          <label className="block">
                            <FieldLabel>Diagnostic Weight</FieldLabel>
                            <input
                              type="number"
                              step="0.1"
                              value={form.diagnosticWeight}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  diagnosticWeight: Number(event.target.value),
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                              placeholder="1"
                            />
                          </label>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <FieldLabel>Misconception Key</FieldLabel>
                            <input
                              value={form.misconceptionKey ?? ""}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  misconceptionKey: event.target.value || null,
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                              placeholder="Optional"
                            />
                          </label>
                          <label className="block">
                            <FieldLabel>Diagnostic Version</FieldLabel>
                            <input
                              value={form.diagnosticVersion}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  diagnosticVersion: event.target.value,
                                }))
                              }
                              className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                              placeholder="MATH_CHECKUP_V1"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-50/80 p-4 xl:border-l xl:border-t-0">
                <div className="sticky top-4 space-y-4">
                  <div className="border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                          Live Preview
                        </p>
                        <h2 className="mt-1 text-lg font-black text-[#102449]">
                          Tampilan Siswa
                        </h2>
                      </div>
                      <span className="bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                        {form.difficulty}
                      </span>
                    </div>
                    <div className="mt-4 border border-emerald-100 bg-emerald-50/70 p-4">
                      <p className="text-sm font-black leading-6">
                        <MathText
                          text={form.prompt || "Teks soal akan tampil di sini."}
                        />
                      </p>
                      <div className="mt-4 space-y-2">
                        {form.options.filter(Boolean).map((option) => (
                          <div
                            key={option}
                            className={`border bg-white p-3 text-sm font-bold ${option === form.correctAnswer ? "border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-700"}`}
                          >
                            <MathText text={option} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-slate-600">
                      <span className="border border-slate-200 bg-slate-50 px-2 py-2">
                        {form.assessmentBand}
                      </span>
                      <span className="border border-slate-200 bg-slate-50 px-2 py-2">
                        {form.cognitiveType}
                      </span>
                      <span className="border border-slate-200 bg-slate-50 px-2 py-2">
                        {form.domain || "Domain"}
                      </span>
                      <span className="border border-slate-200 bg-slate-50 px-2 py-2">
                        Bobot {form.diagnosticWeight}
                      </span>
                    </div>
                  </div>

                  <div className="border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                          Admin Test
                        </p>
                        <h2 className="mt-1 text-lg font-black text-[#102449]">
                          Coba Soal Kelas Ini
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Tidak menyimpan attempt siswa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowResult(true)}
                        className="bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
                      >
                        Koreksi
                      </button>
                    </div>

                    {showResult && (
                      <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
                        Skor percobaan: {testScore.correct}/{testScore.total}{" "}
                        benar ({testScore.score}%)
                      </div>
                    )}

                    <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                      {questions.map((question, index) => {
                        const selected = testAnswers[question.id] ?? "";
                        const checked = showResult && Boolean(selected);
                        const correct = selected === question.correctAnswer;
                        return (
                          <div
                            key={question.id}
                            className={`border p-4 ${checked ? (correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50") : "border-slate-200 bg-white"}`}
                          >
                            <p className="text-xs font-black text-emerald-700">
                              Soal {index + 1} - {question.category}
                            </p>
                            <p className="mt-2 text-sm font-bold leading-5">
                              <MathText text={question.prompt} />
                            </p>
                            <div className="mt-3 space-y-2">
                              {question.options.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    setTestAnswers((current) => ({
                                      ...current,
                                      [question.id]: option,
                                    }))
                                  }
                                  className={`w-full border p-2 text-left text-xs font-bold ${
                                    selected === option
                                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-white text-slate-700"
                                  } ${showResult && option === question.correctAnswer ? "!border-emerald-500 !bg-emerald-100 !text-emerald-800" : ""}`}
                                >
                                  <MathText text={option} />
                                </button>
                              ))}
                            </div>
                            {showResult && !correct && selected && (
                              <p className="mt-3 text-xs font-semibold leading-relaxed text-red-700">
                                <strong>Penjelasan:</strong>{" "}
                                <MathText text={question.explanation} />
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
