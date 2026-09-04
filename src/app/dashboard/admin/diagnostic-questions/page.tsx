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
const cognitiveTypes: CognitiveType[] = ["fluency", "concept", "application", "reasoning"];

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

function defaultRecommendationKey(gradeLevel: number, category: DiagnosticCategory) {
  return `G${gradeLevel}_${defaultSkillFromCategory(category).toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
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
  const [form, setForm] = useState<Omit<DiagnosticQuestion, "id">>(emptyForm(1));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedId) ?? null,
    [questions, selectedId],
  );

  const testScore = useMemo(() => {
    const total = questions.length;
    const correct = questions.filter((question) => testAnswers[question.id] === question.correctAnswer).length;
    return { correct, total, score: total ? Math.round((correct / total) * 100) : 0 };
  }, [questions, testAnswers]);

  useEffect(() => {
    void loadQuestions(gradeLevel);
  }, [gradeLevel]);

  async function loadQuestions(nextGrade = gradeLevel) {
    setLoading(true);
    setShowResult(false);
    setTestAnswers({});
    try {
      const res = await fetch(`/api/adm/diagnostic-questions/list?gradeLevel=${nextGrade}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal memuat soal diagnostic.");
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
      subskill: question.subskill ?? question.skill ?? defaultSkillFromCategory(question.category),
      prerequisiteSkill: question.prerequisiteSkill ?? "",
      difficulty: question.difficulty,
      cognitiveType: question.cognitiveType ?? defaultCognitiveType(question.category),
      recommendationKey: question.recommendationKey ?? defaultRecommendationKey(question.gradeLevel, question.category),
      misconceptionKey: question.misconceptionKey ?? null,
      diagnosticWeight: question.diagnosticWeight ?? 1,
      diagnosticVersion: question.diagnosticVersion ?? "MATH_CHECKUP_V1",
      prompt: question.prompt,
      options: [...question.options, "", "", "", ""].slice(0, Math.max(4, question.options.length)),
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
        correctAnswer: current.correctAnswer === current.options[index] ? value : current.correctAnswer,
      };
    });
  }

  function addOption() {
    setForm((current) => ({ ...current, options: [...current.options, ""] }));
  }

  function removeOption(index: number) {
    setForm((current) => {
      const removed = current.options[index];
      const options = current.options.filter((_, itemIndex) => itemIndex !== index);
      return {
        ...current,
        options,
        correctAnswer: current.correctAnswer === removed ? "" : current.correctAnswer,
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
          current.recommendationKey || defaultRecommendationKey(current.gradeLevel, category),
      };
    });
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
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal membuat soal.");
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
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal menyimpan soal.");
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
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal menghapus soal.");
      toast.success("Soal diagnostic dihapus.");
      await loadQuestions(gradeLevel);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function seedDefaults() {
    if (!window.confirm("Sinkronkan soal default kelas 1-12 ke database? Soal default dengan ID yang sama akan diperbarui.")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/adm/diagnostic-questions/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal sinkron soal default.");
      toast.success("Soal default diagnostic sudah disinkronkan.");
      await loadQuestions(gradeLevel);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Admin</p>
            <h1 className="mt-1 text-2xl font-black text-[#102449]">CRUD Soal Diagnostic</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Kelola soal Math Check-Up per kelas dan coba langsung semua soal sebagai admin.
            </p>
          </div>
          <button
            type="button"
            onClick={seedDefaults}
            disabled={saving}
            className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
          >
            Sinkron Soal Default
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <label className="text-xs font-black text-slate-500">Pilih Kelas</label>
              <select
                value={gradeLevel}
                onChange={(event) => setGradeLevel(Number(event.target.value))}
                className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-black outline-none focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => (
                  <option key={grade} value={grade}>Kelas {grade}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setForm(emptyForm(gradeLevel));
                }}
                className="mt-3 w-full bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-[#123a82]"
              >
                + Soal Baru
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-3">
              {loading ? (
                <p className="p-4 text-sm font-bold text-slate-500">Memuat soal...</p>
              ) : questions.length === 0 ? (
                <p className="p-4 text-sm font-bold text-slate-500">Belum ada soal.</p>
              ) : (
                <div className="space-y-2">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => selectQuestion(question)}
                      className={`w-full border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 ${
                        selectedId === question.id ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-black text-blue-700">#{question.sortOrder ?? index + 1} · {question.category}</p>
                        <span className={`text-[10px] font-black ${question.isActive === false ? "text-red-600" : "text-emerald-700"}`}>
                          {question.isActive === false ? "nonaktif" : "aktif"}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-800"><MathText text={question.prompt} /></p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <div className="border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#102449]">Editor Soal</h2>
                  <p className="text-sm font-semibold text-slate-500">{selectedId ? `Edit ID ${selectedId}` : "Buat soal diagnostic baru"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={createQuestion} disabled={saving} className="bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-[#123a82] disabled:opacity-60">Buat</button>
                  <button type="button" onClick={saveQuestion} disabled={saving || !selectedId} className="border border-blue-200 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-50 disabled:opacity-60">Simpan</button>
                  <button type="button" onClick={deleteQuestion} disabled={saving || !selectedId} className="border border-red-200 px-4 py-2 text-sm font-black text-red-700 hover:bg-red-50 disabled:opacity-60">Hapus</button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Kelas</span>
                  <select value={form.gradeLevel} onChange={(event) => setForm((current) => ({ ...current, gradeLevel: Number(event.target.value) }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none">
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>Kelas {grade}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Skill Level</span>
                  <select value={form.skillLevel} onChange={(event) => setForm((current) => ({ ...current, skillLevel: Number(event.target.value) }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none">
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>Kelas {grade}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Assessment Band</span>
                  <select value={form.assessmentBand} onChange={(event) => setForm((current) => ({ ...current, assessmentBand: event.target.value as AssessmentBand }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none">
                    {assessmentBands.map((band) => <option key={band} value={band}>{band}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Kategori</span>
                  <select value={form.category} onChange={(event) => updateCategory(event.target.value as DiagnosticCategory)} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none">
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Domain</span>
                  <input value={form.domain} onChange={(event) => setForm((current) => ({ ...current, domain: event.target.value }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="Number Sense" />
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Kesulitan</span>
                  <select value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as Difficulty }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none">
                    {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Urutan</span>
                  <input value={form.sortOrder ?? ""} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value ? Number(event.target.value) : null }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="1" />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Skill</span>
                  <input value={form.skill} onChange={(event) => setForm((current) => ({ ...current, skill: event.target.value }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="Number Sense" />
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Subskill</span>
                  <input value={form.subskill} onChange={(event) => setForm((current) => ({ ...current, subskill: event.target.value }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="Counting forward" />
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Prerequisite Skill</span>
                  <input value={form.prerequisiteSkill} onChange={(event) => setForm((current) => ({ ...current, prerequisiteSkill: event.target.value }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="Number recognition" />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Cognitive Type</span>
                  <select value={form.cognitiveType} onChange={(event) => setForm((current) => ({ ...current, cognitiveType: event.target.value as CognitiveType }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none">
                    {cognitiveTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Recommendation Key</span>
                  <input value={form.recommendationKey} onChange={(event) => setForm((current) => ({ ...current, recommendationKey: event.target.value }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="G1_NUMBER_SENSE" />
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Misconception Key</span>
                  <input value={form.misconceptionKey ?? ""} onChange={(event) => setForm((current) => ({ ...current, misconceptionKey: event.target.value || null }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="Optional" />
                </label>
                <label className="block">
                  <span className="text-xs font-black text-slate-500">Diagnostic Weight</span>
                  <input type="number" step="0.1" value={form.diagnosticWeight} onChange={(event) => setForm((current) => ({ ...current, diagnosticWeight: Number(event.target.value) }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="1" />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-black text-slate-500">Diagnostic Version</span>
                <input value={form.diagnosticVersion} onChange={(event) => setForm((current) => ({ ...current, diagnosticVersion: event.target.value }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none" placeholder="MATH_CHECKUP_V1" />
              </label>

              <label className="mt-4 block">
                <span className="text-xs font-black text-slate-500">Teks Soal</span>
                <textarea value={form.prompt} onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))} rows={5} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold leading-6 outline-none focus:border-blue-500" placeholder="Tulis soal diagnostic di sini..." />
              </label>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black text-slate-500">Opsi Jawaban</span>
                  <button type="button" onClick={addOption} className="text-xs font-black text-blue-700">+ Tambah Opsi</button>
                </div>
                <div className="mt-2 space-y-2">
                  {form.options.map((option, index) => (
                    <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                      <input value={option} onChange={(event) => updateOption(index, event.target.value)} className="border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500" placeholder={`Opsi ${index + 1}`} />
                      <button type="button" onClick={() => removeOption(index)} className="border border-red-100 px-3 text-xs font-black text-red-600 hover:bg-red-50">Hapus</button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-black text-slate-500">Jawaban Benar</span>
                <select value={form.correctAnswer} onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none">
                  <option value="">Pilih jawaban benar</option>
                  {form.options.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="text-xs font-black text-slate-500">Penjelasan</span>
                <textarea value={form.explanation} onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))} rows={4} className="mt-2 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold leading-6 outline-none focus:border-blue-500" placeholder="Penjelasan yang tampil di hasil diagnostic..." />
              </label>

              <label className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={form.isActive ?? true} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                Soal aktif digunakan di Math Check-Up
              </label>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-[#102449]">Preview Soal</h2>
                <div className="mt-4 border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-black"><MathText text={form.prompt || "Teks soal akan tampil di sini."} /></p>
                  <div className="mt-4 space-y-2">
                    {form.options.filter(Boolean).map((option) => (
                      <div key={option} className={`border bg-white p-3 text-sm font-bold ${option === form.correctAnswer ? "border-emerald-400 text-emerald-700" : "border-slate-200 text-slate-700"}`}>
                        <MathText text={option} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-[#102449]">Coba Semua Soal</h2>
                    <p className="text-xs font-semibold text-slate-500">Mode admin, tidak menyimpan attempt.</p>
                  </div>
                  <button type="button" onClick={() => setShowResult(true)} className="bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700">
                    Koreksi
                  </button>
                </div>

                {showResult && (
                  <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
                    Skor percobaan: {testScore.correct}/{testScore.total} benar ({testScore.score}%)
                  </div>
                )}

                <div className="mt-4 max-h-[680px] space-y-3 overflow-y-auto pr-1">
                  {questions.map((question, index) => {
                    const selected = testAnswers[question.id] ?? "";
                    const checked = showResult && selected;
                    const correct = selected === question.correctAnswer;
                    return (
                      <div key={question.id} className={`border p-4 ${checked ? (correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50") : "border-slate-200 bg-white"}`}>
                        <p className="text-xs font-black text-blue-700">Soal {index + 1} · {question.category}</p>
                        <p className="mt-2 text-sm font-bold"><MathText text={question.prompt} /></p>
                        <div className="mt-3 space-y-2">
                          {question.options.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setTestAnswers((current) => ({ ...current, [question.id]: option }))}
                              className={`w-full border p-2 text-left text-xs font-bold ${
                                selected === option ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"
                              } ${showResult && option === question.correctAnswer ? "!border-emerald-500 !bg-emerald-100 !text-emerald-800" : ""}`}
                            >
                              <MathText text={option} />
                            </button>
                          ))}
                        </div>
                        {showResult && !correct && (
                          <p className="mt-3 text-xs font-semibold leading-relaxed text-red-700">
                            <strong>Penjelasan:</strong> <MathText text={question.explanation} />
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
