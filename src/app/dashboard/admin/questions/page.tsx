"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type QuestionType = "mcq" | "essay" | "drag_drop" | "multipart";

type MaterialRow = {
  id: number;
  title: string;
};

type MaterialDetail = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  tryout_duration_minutes: number | null;
  grade_id: number | null;
  subject_id: number | null;
};

type OptionRow = {
  value: string;
  label: string;
  imageUrl?: string;
  targetKey?: string;
  isCorrect?: boolean;
};

type MultipartItem = {
  label: string;
  prompt: string;
  answer: string;
  imageUrl?: string;
};

type QuestionRow = {
  id: string;
  material_id: number;
  question_number: number | null;
  type: QuestionType;
  prompt: string | null;
  helper_text?: string | null;
  options: OptionRow[];
  correct_answer: string | null;
  explanation: string | null;
  question_image_url: string | null;
  correct_answer_image_url: string | null;
  question_mode?: "practice" | "tryout" | null;
  drop_targets?: Array<{
    id: string;
    label: string;
    placeholder?: string | null;
  }>;
  drop_items?: Array<{
    id: string;
    label: string;
    image_url?: string | null;
    correct_target_id: string;
  }>;
  items?: Array<{
    id: string;
    label: string;
    prompt: string;
    image_url?: string | null;
    answer?: string;
  }>;
};

type UploadKind = "question" | "answer" | "option";

const defaultOption = (): OptionRow => ({
  value: "",
  label: "",
});

const defaultMultipartItem = (): MultipartItem => ({
  label: "",
  prompt: "",
  answer: "",
});

const gradeOptions = Array.from({ length: 9 }, (_, idx) => idx + 1);
const subjectOptions = [
  { id: 1, name: "Matematika" },
  { id: 2, name: "IPA" },
  { id: 3, name: "English" },
  { id: 4, name: "Coding" },
];

export default function AdminQuestionsPage() {
  const toast = useToast();
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialImageUrl, setMaterialImageUrl] = useState("");
  const [materialVideoUrl, setMaterialVideoUrl] = useState("");
  const [materialPdfUrl, setMaterialPdfUrl] = useState("");
  const [materialTryoutMinutes, setMaterialTryoutMinutes] = useState("");
  const [materialGradeId, setMaterialGradeId] = useState("");
  const [materialSubjectId, setMaterialSubjectId] = useState("1");

  const [questionNumber, setQuestionNumber] = useState("");
  const [promptText, setPromptText] = useState("");
  const [helperText, setHelperText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [questionMode, setQuestionMode] = useState<"practice" | "tryout">(
    "practice"
  );
  const [options, setOptions] = useState<OptionRow[]>([defaultOption()]);
  const [multipartItems, setMultipartItems] = useState<MultipartItem[]>([
    defaultMultipartItem(),
  ]);
  const [dropTargets, setDropTargets] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [questionImageUrl, setQuestionImageUrl] = useState("");
  const [answerImageUrl, setAnswerImageUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingMaterial, setCreatingMaterial] = useState(false);
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const [uploadingMaterialImage, setUploadingMaterialImage] = useState(false);
  const [uploadingOptionIndex, setUploadingOptionIndex] = useState<
    number | null
  >(null);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<{
    inserted: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [autoFillInputAnswer, setAutoFillInputAnswer] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const questionInputRef = useRef<HTMLInputElement | null>(null);
  const answerInputRef = useRef<HTMLInputElement | null>(null);
  const materialImageInputRef = useRef<HTMLInputElement | null>(null);
  const optionInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const canSave = useMemo(
    () =>
      selectedId !== null &&
      selectedMaterial !== null &&
      promptText.trim().length > 0,
    [selectedId, selectedMaterial, promptText]
  );

  useEffect(() => {
    void loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      const res = await fetch("/api/adm/materials/list");
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal memuat materi");
      }
      setMaterials(json.materials || []);
      if (!selectedMaterial && json.materials?.length) {
        const nextId = json.materials[0].id;
        setSelectedMaterial(nextId);
        void loadQuestions(nextId);
        void loadMaterialDetail(nextId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  }

  async function loadQuestions(materialId: number) {
    try {
      const res = await fetch(
        `/api/adm/questions/list?materialId=${materialId}`
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal memuat soal");
      }
      setQuestions(json.questions || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  }

  async function loadMaterialDetail(materialId: number) {
    try {
      const res = await fetch(
        `/api/adm/materials/detail?materialId=${materialId}`
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal memuat detail materi");
      }

      const material = json.material as MaterialDetail;
      setMaterialTitle(material.title ?? "");
      setMaterialDescription(material.description ?? "");
      setMaterialImageUrl(material.image_url ?? "");
      setMaterialVideoUrl(material.video_url ?? "");
      setMaterialPdfUrl(material.pdf_url ?? "");
      setMaterialTryoutMinutes(
        material.tryout_duration_minutes !== null
          ? String(material.tryout_duration_minutes)
          : ""
      );
      setMaterialGradeId(material.grade_id ? String(material.grade_id) : "");
      setMaterialSubjectId(
        material.subject_id ? String(material.subject_id) : "1"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  }

  async function handleCreateMaterial() {
    const title = materialTitle.trim();
    if (!title) {
      toast.error("Judul materi wajib diisi.");
      return;
    }

    const duration = materialTryoutMinutes.trim();
    const durationNumber =
      duration.length > 0 && !Number.isNaN(Number(duration))
        ? Number(duration)
        : null;

    try {
      setCreatingMaterial(true);
      const res = await fetch("/api/adm/materials/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: materialDescription.trim() || null,
          imageUrl: materialImageUrl.trim() || null,
          videoUrl: materialVideoUrl.trim() || null,
          pdfUrl: materialPdfUrl.trim() || null,
          tryoutDurationMinutes: durationNumber,
          gradeId: materialGradeId ? Number(materialGradeId) : null,
          subjectId: materialSubjectId ? Number(materialSubjectId) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal membuat materi");
      }

      toast.success("Materi baru berhasil dibuat.");
      setMaterialTitle("");
      setMaterialDescription("");
      setMaterialImageUrl("");
      setMaterialVideoUrl("");
      setMaterialPdfUrl("");
      setMaterialTryoutMinutes("");
      setMaterialGradeId("");
      setMaterialSubjectId("1");
      await loadMaterials();
      if (json.material?.id) {
        setSelectedMaterial(json.material.id);
        resetForm();
        await loadQuestions(json.material.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setCreatingMaterial(false);
    }
  }

  async function handleUpdateMaterial() {
    if (!selectedMaterial) {
      toast.error("Pilih materi yang ingin diperbarui.");
      return;
    }

    const fallbackTitle =
      materials.find((item) => item.id === selectedMaterial)?.title ?? "";
    const title = materialTitle.trim() || fallbackTitle.trim();
    if (!title) {
      toast.error("Judul materi wajib diisi.");
      return;
    }

    const duration = materialTryoutMinutes.trim();
    const durationNumber =
      duration.length > 0 && !Number.isNaN(Number(duration))
        ? Number(duration)
        : null;

    try {
      setCreatingMaterial(true);
      const res = await fetch("/api/adm/materials/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMaterial,
          title,
          description: materialDescription.trim() || null,
          imageUrl: materialImageUrl.trim() || null,
          videoUrl: materialVideoUrl.trim() || null,
          pdfUrl: materialPdfUrl.trim() || null,
          tryoutDurationMinutes: durationNumber,
          gradeId: materialGradeId ? Number(materialGradeId) : null,
          subjectId: materialSubjectId ? Number(materialSubjectId) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal memperbarui materi");
      }

      toast.success("Materi berhasil diperbarui.");
      await loadMaterials();
      await loadMaterialDetail(selectedMaterial);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setCreatingMaterial(false);
    }
  }

  async function handleDeleteMaterial() {
    if (!selectedMaterial) {
      toast.error("Pilih materi yang ingin dihapus.");
      return;
    }

    if (!confirm("Hapus materi ini? Soal terkait bisa ikut terhapus.")) {
      return;
    }

    try {
      setCreatingMaterial(true);
      const res = await fetch("/api/adm/materials/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMaterial }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menghapus materi");
      }

      toast.success("Materi berhasil dihapus.");
      resetForm();
      setMaterialTitle("");
      setMaterialDescription("");
      setMaterialImageUrl("");
      setMaterialVideoUrl("");
      setMaterialPdfUrl("");
      setMaterialTryoutMinutes("");
      setSelectedMaterial(null);
      setQuestions([]);
      await loadMaterials();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setCreatingMaterial(false);
    }
  }

  function resetForm() {
    setSelectedId(null);
    setQuestionNumber("");
    setPromptText("");
    setHelperText("");
    setQuestionType("mcq");
    setQuestionMode("practice");
    setOptions([defaultOption()]);
    setMultipartItems([defaultMultipartItem()]);
    setDropTargets("");
    setCorrectAnswer("");
    setExplanation("");
    setQuestionImageUrl("");
    setAnswerImageUrl("");
  }

  function handleSelectQuestion(row: QuestionRow) {
    setSelectedId(row.id);
    setQuestionNumber(String(row.question_number ?? ""));
    setQuestionType(row.type ?? "mcq");
    setQuestionMode(row.question_mode === "tryout" ? "tryout" : "practice");
    setPromptText(row.prompt ?? "");
    setHelperText(row.helper_text ?? "");
    setQuestionImageUrl(row.question_image_url ?? "");
    setAnswerImageUrl(row.correct_answer_image_url ?? "");
    setExplanation(row.explanation ?? "");

    const dropTargetLabels = (row.drop_targets || [])
      .map((t) => t.label)
      .filter(Boolean)
      .join(",");
    setDropTargets(dropTargetLabels);

    if (row.type === "drag_drop") {
      const targetMap = new Map(
        (row.drop_targets || []).map((t) => [t.id, t.label])
      );
      const mapped = (row.drop_items || []).map((item) => ({
        value: item.label,
        label: item.label,
        imageUrl: item.image_url ?? undefined,
        targetKey: targetMap.get(item.correct_target_id) ?? "",
      }));
      setOptions(mapped.length ? mapped : [defaultOption()]);
      setCorrectAnswer("");
      setMultipartItems([defaultMultipartItem()]);
    } else if (row.type === "multipart") {
      const mappedItems = (row.items || []).map((item) => ({
        label: item.label ?? "",
        prompt: item.prompt ?? "",
        answer: item.answer ?? "",
        imageUrl: item.image_url ?? undefined,
      }));
      setMultipartItems(
        mappedItems.length ? mappedItems : [defaultMultipartItem()]
      );
      setOptions([defaultOption()]);
      setCorrectAnswer("");
    } else {
      const mapped = (row.options || []).map((opt) => ({
        value: opt.value,
        label: opt.label,
        imageUrl: opt.imageUrl,
        targetKey: opt.targetKey,
        isCorrect: opt.isCorrect,
      }));
      setOptions(mapped.length ? mapped : [defaultOption()]);
      const correctOpt = mapped.find((opt) => opt.isCorrect);
      setCorrectAnswer(correctOpt?.value ?? row.correct_answer ?? "");
      setMultipartItems([defaultMultipartItem()]);
    }
  }

  async function handleCreate() {
    if (!selectedMaterial) {
      toast.error("Pilih materi terlebih dahulu.");
      return;
    }
    if (!promptText.trim()) {
      toast.error("Teks soal wajib diisi.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/adm/questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selectedMaterial,
          questionNumber: questionNumber ? Number(questionNumber) : null,
          prompt: promptText.trim(),
          helperText: helperText.trim() || null,
          questionType,
          options,
          multipartItems,
          dropTargets,
          correctAnswer: correctAnswer || null,
          explanation: explanation || null,
          questionImageUrl: questionImageUrl || null,
          correctAnswerImageUrl: answerImageUrl || null,
          questionMode,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal membuat soal");
      }
      toast.success("Soal berhasil dibuat.");
      await loadQuestions(selectedMaterial);
      if (json.id) {
        const newQuestion = (json.question as QuestionRow | undefined) || null;
        if (newQuestion) {
          handleSelectQuestion(newQuestion);
        } else {
          setSelectedId(json.id);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!canSave) {
      toast.error("Lengkapi form terlebih dahulu.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/adm/questions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: selectedId,
          materialId: selectedMaterial,
          questionNumber: questionNumber ? Number(questionNumber) : null,
          prompt: promptText.trim(),
          helperText: helperText.trim() || null,
          questionType,
          options,
          multipartItems,
          dropTargets,
          correctAnswer: correctAnswer || null,
          explanation: explanation || null,
          questionImageUrl: questionImageUrl || null,
          correctAnswerImageUrl: answerImageUrl || null,
          questionMode,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan perubahan");
      }
      toast.success("Perubahan tersimpan.");
      if (selectedMaterial) {
        await loadQuestions(selectedMaterial);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    if (!confirm("Hapus soal ini?")) return;
    try {
      const res = await fetch("/api/adm/questions/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: selectedId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menghapus soal");
      }
      toast.success("Soal dihapus.");
      resetForm();
      if (selectedMaterial) {
        await loadQuestions(selectedMaterial);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  }

  async function handleUpload(
    kind: UploadKind,
    file: File | null,
    optionIndex?: number
  ) {
    if (!file) {
      toast.error("Pilih file gambar terlebih dahulu.");
      return;
    }

    setUploading(kind);
    if (kind === "option" && typeof optionIndex === "number") {
      setUploadingOptionIndex(optionIndex);
    }
    try {
      const form = new FormData();
      form.append("file", file);
      if (selectedId) {
        form.append("questionId", String(selectedId));
      }
      if (kind === "option" && typeof optionIndex === "number") {
        form.append("optionIndex", String(optionIndex));
      }

      const res = await fetch(`/api/adm/questions/upload?kind=${kind}`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal upload gambar");
      }

      if (kind === "question") {
        setQuestionImageUrl(json.url);
      } else if (kind === "answer") {
        setAnswerImageUrl(json.url);
      } else if (kind === "option" && typeof optionIndex === "number") {
        setOptions((prev) => {
          const next = [...prev];
          const existing = next[optionIndex] ?? defaultOption();
          next[optionIndex] = { ...existing, imageUrl: json.url };
          return next;
        });
      }
      toast.success("Upload berhasil.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setUploading(null);
      setUploadingOptionIndex(null);
    }
  }

  async function handleMaterialImageUpload(file: File | null) {
    if (!file) {
      toast.error("Pilih file gambar terlebih dahulu.");
      return;
    }

    setUploadingMaterialImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (selectedMaterial) {
        form.append("materialId", String(selectedMaterial));
      }

      const res = await fetch("/api/adm/materials/upload", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal upload gambar");
      }

      setMaterialImageUrl(json.url);
      toast.success("Upload gambar materi berhasil.");
      if (materialImageInputRef.current) {
        materialImageInputRef.current.value = "";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setUploadingMaterialImage(false);
    }
  }

  async function handleImportCsv() {
    if (!importFile) {
      toast.error("Pilih file CSV terlebih dahulu.");
      return;
    }

    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", importFile);
      form.append("autoFillFromExplanation", String(autoFillInputAnswer));
      form.append("replaceExisting", String(replaceExisting));
      const res = await fetch("/api/adm/questions/import-csv", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const errors = Array.isArray(json.errors) ? json.errors : [];
        setImportReport({
          inserted: Number(json.inserted ?? 0),
          skipped: Number(json.skipped ?? errors.length ?? 0),
          errors,
        });
        throw new Error(json.error || "Gagal import CSV.");
      }
      setImportReport({
        inserted: Number(json.inserted ?? 0),
        skipped: Number(json.skipped ?? 0),
        errors: Array.isArray(json.errors) ? json.errors : [],
      });
      toast.success(
        `Import selesai (${importFile.name}). ${json.inserted} soal masuk, ${json.skipped} baris dilewati.`
      );
      setImportFile(null);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
      if (selectedMaterial) {
        await loadQuestions(selectedMaterial);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CMS Soal (Admin)</h1>
        <p className="text-sm text-slate-500">
          Buat dan edit soal dengan teks atau gambar seperti Google Form.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Materi</label>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={selectedMaterial ?? ""}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedMaterial(val);
              resetForm();
              if (val) {
                void loadQuestions(val);
                void loadMaterialDetail(val);
              }
            }}
          >
            <option value="">Pilih materi</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-900"
          onClick={() => {
            if (selectedMaterial) void loadQuestions(selectedMaterial);
          }}
        >
          Muat soal
        </button>
        <button
          type="button"
          className="rounded-lg border border-cyan-600 bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
          onClick={() => {
            if (selectedMaterial) {
              void loadMaterialDetail(selectedMaterial);
              toast.success("Detail materi dimuat untuk diedit.");
            } else {
              toast.error("Pilih materi terlebih dahulu.");
            }
          }}
        >
          Edit materi
        </button>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <div className="text-xs font-semibold text-slate-700">
            Detail materi
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Judul materi</label>
          <input
            value={materialTitle}
            onChange={(e) => setMaterialTitle(e.target.value)}
            placeholder="Contoh: Penjumlahan 1-10"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">
            Durasi tryout (menit)
          </label>
          <input
            value={materialTryoutMinutes}
            onChange={(e) => setMaterialTryoutMinutes(e.target.value)}
            placeholder="Contoh: 30"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Grade</label>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={materialGradeId}
            onChange={(e) => setMaterialGradeId(e.target.value)}
          >
            <option value="">Pilih grade</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                Kelas {grade}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Mata pelajaran</label>
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={materialSubjectId}
            onChange={(e) => setMaterialSubjectId(e.target.value)}
          >
            {subjectOptions.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs text-slate-500">Deskripsi materi</label>
          <textarea
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            placeholder="Ringkasan materi"
            className="min-h-[96px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs text-slate-500">Gambar materi (URL)</label>
          <input
            value={materialImageUrl}
            onChange={(e) => setMaterialImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <input
              ref={materialImageInputRef}
              type="file"
              accept="image/*"
              className="text-xs text-slate-900"
              onChange={(e) =>
                handleMaterialImageUpload(e.target.files?.[0] ?? null)
              }
              disabled={uploadingMaterialImage}
            />
            {uploadingMaterialImage ? (
              <span>Mengunggah gambar...</span>
            ) : (
              <span>Atau upload langsung dari perangkat.</span>
            )}
            <button
              type="button"
              onClick={() => setMaterialImageUrl("")}
              disabled={!materialImageUrl}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] text-slate-700 hover:border-rose-400/60 hover:text-rose-600 disabled:opacity-60"
            >
              Hapus gambar
            </button>
          </div>
          {materialImageUrl ? (
            <img
              src={materialImageUrl}
              alt="Preview gambar materi"
              className="mt-2 max-h-40 w-full rounded-lg border border-slate-200 object-contain"
            />
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Video URL</label>
          <input
            value={materialVideoUrl}
            onChange={(e) => setMaterialVideoUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">PDF URL</label>
          <input
            value={materialPdfUrl}
            onChange={(e) => setMaterialPdfUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <button
            type="button"
            onClick={handleCreateMaterial}
            disabled={creatingMaterial || materialTitle.trim().length === 0}
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {creatingMaterial ? "Menyimpan..." : "Buat materi"}
          </button>
          <button
            type="button"
            onClick={handleUpdateMaterial}
            disabled={creatingMaterial || !selectedMaterial}
            className="rounded-lg border border-cyan-600 bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
          >
            {creatingMaterial ? "Menyimpan..." : "Simpan perubahan"}
          </button>
          <button
            type="button"
            onClick={handleDeleteMaterial}
            disabled={creatingMaterial || !selectedMaterial}
            className="rounded-lg border border-rose-600 bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {creatingMaterial ? "Menyimpan..." : "Hapus materi"}
          </button>
          <span className="text-[11px] text-slate-500">
            Setelah dibuat, materi otomatis dipilih.
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Import CSV</label>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="text-xs text-slate-900"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setImportFile(file);
            }}
          />
          {importFile ? (
            <p className="text-[11px] text-slate-600">
              File dipilih: <span className="font-semibold">{importFile.name}</span>
            </p>
          ) : null}
          <p className="text-[11px] text-slate-500">
            Gunakan template: <code>docs/question-import-template.csv</code>
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-600">
          <input
            type="checkbox"
            checked={autoFillInputAnswer}
            onChange={(e) => setAutoFillInputAnswer(e.target.checked)}
          />
          Auto-fill jawaban input dari angka pertama di penjelasan
        </label>
        <label className="flex items-center gap-2 text-[11px] text-rose-600">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
          />
          Replace: hapus soal lama pada materi di CSV
        </label>
        <button
          type="button"
          disabled={importing}
          className="rounded-lg border border-cyan-600 bg-cyan-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          onClick={handleImportCsv}
        >
          {importing ? "Mengimpor..." : "Import CSV"}
        </button>
      </div>

      {importReport && (
        <div className="space-y-2 max-w-5xl rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700">
              Laporan Import
            </h3>
            <span className="text-xs text-slate-500">
              {importReport.inserted} masuk · {importReport.skipped} dilewati
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-900"
              onClick={() => setImportReport(null)}
            >
              Tutup laporan
            </button>
          </div>

          {importReport.errors.length > 0 ? (
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-[11px] text-slate-700">
                <thead className="bg-white text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Baris</th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Masalah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {importReport.errors.map((err, idx) => (
                    <tr
                      key={`${err.row}-${idx}`}
                      className="border-t border-slate-200"
                    >
                      <td className="px-3 py-2">#{err.row}</td>
                      <td className="px-3 py-2 text-rose-600">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-emerald-600">
              Tidak ada error. Semua baris valid.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Daftar Soal
            </h2>
            <button
              type="button"
              className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
              onClick={resetForm}
            >
              + Soal Baru
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <button
                type="button"
                className={`rounded-lg border px-3 py-1 ${
                  questionMode === "practice"
                    ? "border-cyan-600 bg-cyan-600 text-white"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
                onClick={() => setQuestionMode("practice")}
              >
                Latihan
              </button>
              <button
                type="button"
                className={`rounded-lg border px-3 py-1 ${
                  questionMode === "tryout"
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
                onClick={() => setQuestionMode("tryout")}
              >
                Tryout
              </button>
              <span className="text-slate-500">
                Filter daftar soal di kiri.
              </span>
            </div>
            {questions.filter(
              (q) =>
                (questionMode === "tryout" && q.question_mode === "tryout") ||
                (questionMode === "practice" && q.question_mode !== "tryout")
            ).length === 0 ? (
              <p className="text-xs text-slate-500">
                Belum ada soal untuk materi ini.
              </p>
            ) : (
              questions
                .filter(
                  (q) =>
                    (questionMode === "tryout" &&
                      q.question_mode === "tryout") ||
                    (questionMode === "practice" &&
                      q.question_mode !== "tryout")
                )
                .map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                      q.id === selectedId
                        ? "border-cyan-600 bg-cyan-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400/50"
                    }`}
                    onClick={() => handleSelectQuestion(q)}
                  >
                    <div className="font-semibold">
                      Soal #{q.question_number ?? "?"} · ID {q.id}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">
                      {q.prompt ?? "-"}
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Nomor Soal</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                type="number"
                value={questionNumber}
                onChange={(e) => setQuestionNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Tipe Soal</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={questionType}
                onChange={(e) =>
                  setQuestionType(e.target.value as QuestionType)
                }
              >
                <option value="mcq">Pilihan ganda</option>
                <option value="essay">Essay / input</option>
                <option value="multipart">Multi-part (a/b/c)</option>
                <option value="drag_drop">Drag & drop</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Mode Soal</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={questionMode}
                onChange={(e) =>
                  setQuestionMode(e.target.value as "practice" | "tryout")
                }
              >
                <option value="practice">Latihan</option>
                <option value="tryout">Tryout</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">Teks Soal</label>
            <textarea
              className="mt-1 min-h-[90px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Contoh: 12 + 5 = ?"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Helper Text</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              value={helperText}
              onChange={(e) => setHelperText(e.target.value)}
              placeholder="Petunjuk singkat (opsional)"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-slate-500">Gambar Soal</label>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                onClick={() => questionInputRef.current?.click()}
                disabled={uploading !== null}
              >
                Pilih file
              </button>
              <input
                ref={questionInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleUpload("question", e.target.files?.[0] ?? null)
                }
              />
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                placeholder="URL gambar soal"
                value={questionImageUrl}
                onChange={(e) => setQuestionImageUrl(e.target.value)}
              />
              {questionImageUrl && (
                <img
                  src={questionImageUrl}
                  alt="Preview soal"
                  className="max-h-32 rounded-lg border border-slate-200 bg-white object-contain"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500">
                Gambar Jawaban Benar
              </label>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                onClick={() => answerInputRef.current?.click()}
                disabled={uploading !== null}
              >
                Pilih file
              </button>
              <input
                ref={answerInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleUpload("answer", e.target.files?.[0] ?? null)
                }
              />
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                placeholder="URL gambar jawaban benar"
                value={answerImageUrl}
                onChange={(e) => setAnswerImageUrl(e.target.value)}
              />
              {answerImageUrl && (
                <img
                  src={answerImageUrl}
                  alt="Preview jawaban"
                  className="max-h-32 rounded-lg border border-slate-200 bg-white object-contain"
                />
              )}
            </div>
          </div>

          {(questionType === "mcq" || questionType === "drag_drop") && (
            <div className="space-y-3">
            <label className="text-xs text-slate-500">Opsi Jawaban</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div
                  key={`${idx}-${opt.value}`}
                  className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                    placeholder="Label"
                    value={opt.label}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = { ...next[idx], label: e.target.value };
                      if (!next[idx].value) next[idx].value = e.target.value;
                      setOptions(next);
                    }}
                  />
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                    placeholder="Value"
                    value={opt.value}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setOptions(next);
                    }}
                  />
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                    placeholder="Image URL"
                    value={opt.imageUrl ?? ""}
                    onChange={(e) => {
                      const next = [...options];
                      next[idx] = { ...next[idx], imageUrl: e.target.value };
                      setOptions(next);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-900"
                      onClick={() => optionInputRefs.current[idx]?.click()}
                      disabled={uploading !== null}
                    >
                      {uploadingOptionIndex === idx
                        ? "Mengunggah..."
                        : "Upload"}
                    </button>
                    <input
                      ref={(el) => {
                        optionInputRefs.current[idx] = el;
                      }}
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleUpload("option", e.target.files?.[0] ?? null, idx)
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-600 bg-rose-600 px-2 text-[11px] text-white"
                    onClick={() => {
                      const next = options.filter((_, i) => i !== idx);
                      setOptions(next.length ? next : [defaultOption()]);
                    }}
                  >
                    Hapus
                  </button>
                  {questionType === "drag_drop" && (
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 md:col-span-4"
                      placeholder="Target key (mis: A, B)"
                      value={opt.targetKey ?? ""}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = { ...next[idx], targetKey: e.target.value };
                        setOptions(next);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
              onClick={() => setOptions((prev) => [...prev, defaultOption()])}
            >
              + Tambah opsi
            </button>
            </div>
          )}

          {questionType === "multipart" && (
            <div className="space-y-3">
              <label className="text-xs text-slate-500">
                Sub-soal (a/b/c/d)
              </label>
              <div className="space-y-2">
                {multipartItems.map((item, idx) => (
                  <div
                    key={`${idx}-${item.label}`}
                    className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[80px_1fr_1fr_1fr_auto]"
                  >
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                      placeholder="Label"
                      value={item.label}
                      onChange={(e) => {
                        const next = [...multipartItems];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setMultipartItems(next);
                      }}
                    />
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                      placeholder="Prompt sub-soal"
                      value={item.prompt}
                      onChange={(e) => {
                        const next = [...multipartItems];
                        next[idx] = { ...next[idx], prompt: e.target.value };
                        setMultipartItems(next);
                      }}
                    />
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                      placeholder="Jawaban benar"
                      value={item.answer}
                      onChange={(e) => {
                        const next = [...multipartItems];
                        next[idx] = { ...next[idx], answer: e.target.value };
                        setMultipartItems(next);
                      }}
                    />
                    <input
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                      placeholder="Image URL (opsional)"
                      value={item.imageUrl ?? ""}
                      onChange={(e) => {
                        const next = [...multipartItems];
                        next[idx] = { ...next[idx], imageUrl: e.target.value };
                        setMultipartItems(next);
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-rose-600 bg-rose-600 px-2 text-[11px] text-white"
                      onClick={() => {
                        const next = multipartItems.filter((_, i) => i !== idx);
                        setMultipartItems(
                          next.length ? next : [defaultMultipartItem()]
                        );
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900"
                onClick={() =>
                  setMultipartItems((prev) => [...prev, defaultMultipartItem()])
                }
              >
                + Tambah sub-soal
              </button>
            </div>
          )}

          {questionType === "drag_drop" && (
            <div>
              <label className="text-xs text-slate-500">
                Drop targets (pisahkan dengan koma)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={dropTargets}
                onChange={(e) => setDropTargets(e.target.value)}
                placeholder="Contoh: A,B,C"
              />
            </div>
          )}

          <div
            className={`grid gap-3 ${
              questionType === "mcq" || questionType === "essay"
                ? "md:grid-cols-2"
                : ""
            }`}
          >
            {(questionType === "mcq" || questionType === "essay") && (
              <div>
                <label className="text-xs text-slate-500">Jawaban Benar</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Value jawaban benar"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500">Penjelasan</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Penjelasan jawaban (opsional)"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!selectedMaterial || creating}
              className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creating ? "Membuat..." : "Buat soal baru"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="rounded-lg border border-cyan-600 bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan perubahan"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!selectedId}
              className="rounded-lg border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Hapus soal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
