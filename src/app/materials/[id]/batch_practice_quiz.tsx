"use client";
import workspaceStyles from "./practice-workspace.module.css";
import { selectTamanTambahQuestions } from "@/lib/tamanTambah";
import ContextualAnswer from "@/components/learning/ContextualAnswer";
import { contextualAnswer } from "@/components/learning/contextualAnswer";
import { parseMissingAddend } from "@/components/learning/missingAddend";
import MissingAddend from "@/components/learning/MissingAddend";

import { useRef, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { regularPracticeCatalog, mergePracticeResults, shouldAdvancePractice } from "@/components/learning/practiceSession";
import NumberOrdering from "@/components/learning/NumberOrdering";
import MatchingCards from "@/components/learning/MatchingCards";
import LearningVisual from "@/components/learning/LearningVisual";
import PlaceValue from "@/components/learning/PlaceValue";
import ShapeVisual from "@/components/learning/ShapeVisual";
import ComparisonVisual from "@/components/learning/ComparisonVisual";
import { parseNumberSequence } from "@/components/learning/numberSequence";
import NumberSequence from "@/components/learning/NumberSequence";
import CountingVisual from "@/components/learning/CountingVisual";
import VisualArithmetic from "@/components/learning/VisualArithmetic";
import MathText from "@/app/components/MathText";
import DoodleOverlay, {
  DoodleHandle,
  DoodleState,
} from "@/app/components/DoodleOverlay";

type QuestionMeta = {
  id: string;
  question_number: number;
  type: "mcq" | "essay" | "multipart" | "drag_drop";
  question_mode?: "practice" | "tryout" | null;
};

type QuestionOption = {
  label: string;
  value: string;
  image_url?: string | null;
};

type QuestionItem = {
  id: string;
  label: string;
  prompt: string;
  image_url?: string | null;
};

type DropTarget = {
  id: string;
  label: string;
  placeholder?: string | null;
};

type DropItem = {
  id: string;
  label: string;
  image_url?: string | null;
};

type Question = QuestionMeta & {
  prompt: string;
  helper_text?: string | null;
  question_image_url?: string | null;
  options: QuestionOption[];
  items: QuestionItem[];
  drop_targets: DropTarget[];
  drop_items: DropItem[];
};

type AnswerResult = {
  isCorrect: boolean;
  explanation?: string | null;
  correctAnswer?: string | null;
  correctAnswerImage?: string | null;
  multipartResults?: Array<{
    itemId: string;
    label: string;
    isCorrect: boolean;
    correctAnswer: string;
  }> | null;
};

type Props = {
  materialId: number;
  questionMeta: QuestionMeta[];
  isGuest?: boolean;
  childFriendly?: boolean;
  isAdmin?: boolean;
};

const DEFAULT_PAGE_SIZE = 10;

function PageDoodleLayer({ resetKey }: { resetKey: string }) {
  const doodleRef = useRef<DoodleHandle | null>(null);
  const [active, setActive] = useState(false);
  const [state, setState] = useState<DoodleState>({
    canUndo: false,
    canRedo: false,
    hasStrokes: false,
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-40 ${
          active ? "" : "pointer-events-none"
        }`}
      >
        {active && (
          <div className="pointer-events-none absolute inset-0 bg-black/35 backdrop-blur-[1px]" />
        )}
        <DoodleOverlay
          ref={doodleRef}
          resetKey={resetKey}
          active={active}
          strokeColor="#facc15"
          onStateChange={setState}
        />
      </div>
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {active && (
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => doodleRef.current?.undo()}
              disabled={!state.canUndo}
              className="rounded-lg border-2 border-white bg-slate-950 px-4 py-2 text-xs font-extrabold text-white shadow-lg disabled:opacity-40"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => doodleRef.current?.redo()}
              disabled={!state.canRedo}
              className="rounded-lg border-2 border-white bg-slate-950 px-4 py-2 text-xs font-extrabold text-white shadow-lg disabled:opacity-40"
            >
              Redo
            </button>
            <button
              type="button"
              onClick={() => doodleRef.current?.clear()}
              disabled={!state.hasStrokes}
              className="rounded-lg border-2 border-white bg-red-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg disabled:opacity-40"
            >
              Hapus
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setActive((current) => !current)}
          aria-pressed={active}
          className={`rounded-xl border-2 px-5 py-3 text-sm font-extrabold shadow-xl transition ${
            active
              ? "border-white bg-red-600 text-white shadow-red-900/30"
              : "border-slate-950 bg-amber-300 text-slate-950 shadow-amber-900/30 hover:bg-amber-200"
          }`}
        >
          {active ? "Exit" : "Coret"}
        </button>
      </div>
      {active && (
        <div className="pointer-events-none fixed bottom-5 left-5 z-50 rounded-md bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 shadow-sm">
          Mode coret aktif. Klik Exit untuk menjawab.
        </div>
      )}
    </>
  );
}

export default function BatchPracticeQuiz({
  materialId,
  questionMeta,
  isGuest = false,
  isAdmin = false,
  childFriendly = false,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const adminPreview = isAdmin && showAll;
  const PAGE_SIZE = adminPreview ? Math.max(1, questionMeta.length) : childFriendly ? 1 : DEFAULT_PAGE_SIZE;
  const orderedMeta = useMemo(
    () =>
      materialId === 42 && !isGuest ? selectTamanTambahQuestions(questionMeta) : regularPracticeCatalog(questionMeta, childFriendly, isGuest),
    [questionMeta, childFriendly, isGuest, materialId],
  );
  const [page, setPage] = useState(0);
  const questionCache = useMemo(() => new Map<string, Question>(), [materialId, isGuest, childFriendly]);
  const pendingLoads = useMemo(() => new Map<string, Promise<Question[]>>(), [materialId, isGuest, childFriendly]);
  const [autoAdvancePage, setAutoAdvancePage] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(orderedMeta.length / PAGE_SIZE));
  const pageMeta = useMemo(
    () => orderedMeta.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [orderedMeta, page, PAGE_SIZE],
  );

  useEffect(() => {
    let active = true;

    async function loadPage() {
      if (pageMeta.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      const cached = pageMeta.map(meta => questionCache.get(meta.id));
      if (cached.every((question): question is Question => Boolean(question))) {
        setQuestions(cached);
        setLoading(false);
        setError(null);
        return;
      }
      setQuestions([]);
      setLoading(true);
      setError(null);

      try {
        // Fetch a small authorized window once, rather than repeating auth and
        // content queries for each single-question screen. Cache is session-local.
        const startIndex = orderedMeta.findIndex(meta => meta.id === pageMeta[0].id);
        const windowMeta = childFriendly && !adminPreview ? orderedMeta.slice(startIndex, startIndex + 5) : pageMeta;
        const start = windowMeta[0].question_number;
        const end = windowMeta[windowMeta.length - 1].question_number;
        const key = `${start}:${end}`;
        let pending = pendingLoads.get(key);
        if (!pending) {
          pending = (async () => {
            const response = await fetch(`/api/materials/${materialId}/questions?mode=practice&start=${start}&end=${end}`);
            const data = await response.json() as {ok?: boolean; questions?: Question[]; error?: string};
            if (!response.ok || !data.ok) throw new Error(data.error ?? "Gagal memuat latihan soal.");
            const loaded = data.questions ?? [];
            loaded.forEach(question => questionCache.set(question.id, question));
            return loaded;
          })();
          pendingLoads.set(key, pending);
          void pending.finally(() => pendingLoads.delete(key)).catch(() => {});
        }
        await pending;
        if (active) setQuestions(pageMeta.flatMap(meta => {
          const question = questionCache.get(meta.id);
          return question ? [question] : [];
        }));
      } catch (loadError) {
        if (active) setError((loadError as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();
    return () => {
      active = false;
    };
  }, [materialId, pageMeta, orderedMeta, childFriendly, questionCache, pendingLoads, adminPreview]);

  useEffect(() => {
    if (autoAdvancePage === null || autoAdvancePage !== page) return;
    const timer = window.setTimeout(() => {
      setAutoAdvancePage(null);
      setPage(current => current === autoAdvancePage ? current + 1 : current);
      document.getElementById("batch-practice-top")?.focus();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [autoAdvancePage, page]);

  function setAnswer(questionId: string, value: string) {
    if (results[questionId]) return;
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function setMultipartAnswer(
    questionId: string,
    itemId: string,
    value: string,
  ) {
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(answers[questionId] ?? "{}");
    } catch {
      parsed = {};
    }
    parsed[itemId] = value;
    setAnswer(questionId, JSON.stringify(parsed));
  }

  function setDropAnswer(
    questionId: string,
    targetId: string,
    itemId: string,
  ) {
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(answers[questionId] ?? "{}");
    } catch {
      parsed = {};
    }
    parsed[targetId] = itemId;
    setAnswer(questionId, JSON.stringify(parsed));
  }

  function isAnswered(question: Question) {
    const answer = answers[question.id];
    if (!answer?.trim()) return false;

    if (question.type === "multipart") {
      try {
        const parsed = JSON.parse(answer) as Record<string, string>;
        return (
          question.items.length > 0 &&
          question.items.every((item) => parsed[item.id]?.trim())
        );
      } catch {
        return false;
      }
    }

    if (question.type === "drag_drop") {
      try {
        const parsed = JSON.parse(answer) as Record<string, string>;
        return (
          question.drop_targets.length > 0 &&
          question.drop_targets.every((target) => parsed[target.id]?.trim())
        );
      } catch {
        return false;
      }
    }

    return true;
  }

  const allAnswered =
    questions.length > 0 && questions.every((question) => isAnswered(question));
  const canSubmitPage = isAdmin ? questions.length > 0 : allAnswered;
  const submitted =
    questions.length > 0 &&
    questions.every((question) => Boolean(results[question.id]));
  const completedCount = orderedMeta.filter((question) =>
    Boolean(results[question.id]),
  ).length;
  const correctCount = Object.values(results).filter(
    (result) => result.isCorrect,
  ).length;
  const wrongCount = completedCount - correctCount;
  const finalPageSubmitted =
    page === totalPages - 1 &&
    submitted &&
    completedCount === orderedMeta.length;
  const finalScore =
    completedCount > 0
      ? Math.round((correctCount / completedCount) * 100)
      : 0;

  async function submitPage() {
    if (adminPreview || !canSubmitPage || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const responses = await Promise.all(
        questions.map(async (question) => {
          const response = await fetch(`/api/materials/${materialId}/answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId: question.id,
              questionNumber: question.question_number,
              selectedAnswer: answers[question.id] ?? "",
              attemptNumber: 1,
            }),
          });
          const data = (await response.json()) as AnswerResult & {
            error?: string;
          };
          if (!response.ok) {
            throw new Error(data.error ?? "Gagal memeriksa jawaban.");
          }
          return [question.id, data] as const;
        }),
      );

      setResults(previous => mergePracticeResults(previous, responses));
      if (shouldAdvancePractice(childFriendly, page, totalPages, responses.map(([, result]) => result))) {
        setAutoAdvancePage(page);
      }
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function movePage(nextPage: number) {
    setAutoAdvancePage(null);
    setPage(nextPage);
    window.setTimeout(() => {
      document
        .getElementById("batch-practice-top")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function restartPractice() {
    setAutoAdvancePage(null);
    setAnswers({});
    setResults({});
    setError(null);
    setPage(0);
    window.setTimeout(() => {
      document
        .getElementById("batch-practice-top")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Memuat soal latihan...
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Belum ada soal latihan pada materi ini.
      </div>
    );
  }

  return (
    <section id="batch-practice-top" tabIndex={-1} className={materialId === 42 && !adminPreview ? workspaceStyles.workspace : childFriendly ? "mx-auto max-w-3xl space-y-6 rounded-xl border border-emerald-100 bg-[#f6faf7] shadow-lg shadow-emerald-950/5 p-4 sm:p-8 [&_button]:min-h-12 [&_input]:min-h-12 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-emerald-700" : "space-y-5"}>
      {materialId === 42 && <div className="mb-2 flex items-center justify-between gap-3 border-b border-emerald-100 pb-4"><span className="text-lg font-extrabold tracking-tight text-emerald-900">BeSmart<span className="text-emerald-600">Kids</span> <span className="ml-2 text-sm font-semibold text-slate-500">Ruang latihan</span></span><Link href="/materials/42" className="rounded-md px-3 py-2 text-base font-semibold text-slate-600 underline underline-offset-4">Keluar</Link></div>}
      <PageDoodleLayer resetKey={`material-${materialId}-page-${page}`} />
      {isAdmin && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <button type="button" aria-pressed={adminPreview} className="rounded-lg border border-emerald-700 bg-white px-4 py-3 font-bold text-emerald-800" onClick={() => { setAutoAdvancePage(null); setPage(0); setShowAll(current => !current); }}>
          {adminPreview ? "Kembali ke latihan per halaman" : "Preview semua soal"}
        </button>
        {adminPreview && <p className="mt-2 text-sm text-slate-700">Preview seluruh soal latihan pada materi ini. Input dapat dicoba tanpa mengirim jawaban atau menyimpan progres.</p>}
      </div>}
      <header className="rounded-lg sticky top-0 z-30 flex flex-col gap-3 border border-emerald-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:rounded-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Latihan Soal
          </p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-900">
            Soal {page * PAGE_SIZE + 1}{(!childFriendly || adminPreview) && "–"}
            {(!childFriendly || adminPreview) &&
            Math.min((page + 1) * PAGE_SIZE, orderedMeta.length)} dari{" "}
            {orderedMeta.length}
          </h2>
        </div>
        <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          Halaman {page + 1} dari {totalPages}
        </span>
      </header>

      {materialId === 42 && !adminPreview && <div className="space-y-2"><div role="progressbar" aria-label="Progres pengerjaan" aria-valuemin={0} aria-valuemax={orderedMeta.length} aria-valuenow={Math.min(page * PAGE_SIZE, orderedMeta.length)} className="h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-600 transition-[width] motion-reduce:transition-none" style={{width:`${orderedMeta.length ? Math.min(page * PAGE_SIZE / orderedMeta.length * 100, 100) : 0}%`}} /></div><p className="text-base text-slate-600">Pelan-pelan saja. Perhatikan gambar, lalu jawab.</p></div>}
      {questions.map((question, index) => {
        const result = results[question.id];
        const isEvenQuestion = (page * PAGE_SIZE + index + 1) % 2 === 0;
        const cardColor = result
          ? result.isCorrect
            ? "border-emerald-400 bg-emerald-50"
            : "border-red-400 bg-red-50"
          : isEvenQuestion
            ? "border-slate-300 bg-slate-100"
            : "border-slate-200 bg-white";

        return (
          <article
            key={question.id}
            className={`border p-4 shadow-sm sm:p-6 ${childFriendly ? "rounded-xl bg-white border-2 shadow-[0_5px_0_#e0eadf]" : "rounded-lg transition"} ${cardColor}`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-sm font-extrabold text-white">
                {page * PAGE_SIZE + index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className={childFriendly ? "text-xl font-bold leading-relaxed text-slate-900" : "text-base font-bold leading-relaxed text-slate-900"}>
                  <MathText text={question.prompt} />
                </h3>
                {question.helper_text && (
                  <details className="mt-3 text-sm text-slate-600"><summary className="cursor-pointer py-3 font-bold text-emerald-800">Butuh petunjuk?</summary><MathText text={question.helper_text} /></details>
                )}
              </div>
            </div>

            {childFriendly && !question.question_image_url && <MissingAddend key={`missing-${question.id}`} prompt={question.prompt} answer={answers[question.id] ?? ""} disabled={submitted} onAnswerChange={question.type === "essay" ? value=>setAnswer(question.id,value) : undefined} />}
            {childFriendly && !question.question_image_url && <PlaceValue key={`place-${question.id}`} prompt={question.prompt} />}
            {childFriendly && !question.question_image_url && <ShapeVisual key={`shape-${question.id}`} prompt={question.prompt} />}
            {childFriendly && !question.question_image_url && <ComparisonVisual key={`comparison-${question.id}`} prompt={question.prompt} />}
            {childFriendly && !question.question_image_url && <NumberSequence key={`sequence-${question.id}`} prompt={question.prompt} answer={answers[question.id] ?? ""} disabled={submitted} onAnswerChange={question.type === "essay" ? value=>setAnswer(question.id,value) : undefined} />}
            {childFriendly && !question.question_image_url && <CountingVisual key={`count-${question.id}`} prompt={question.prompt} />}
            {childFriendly && !question.question_image_url && <VisualArithmetic key={question.id} prompt={question.prompt} variation={question.question_number} />}

            {question.question_image_url && (
              <div className="relative mx-auto mt-4 h-[min(420px,60vw)] min-h-48 w-full max-w-3xl overflow-hidden rounded-md border border-slate-200 bg-white">
                <Image
                  src={question.question_image_url}
                  alt={`Gambar soal ${page * PAGE_SIZE + index + 1}`}
                  fill
                  sizes="(min-width: 1024px) 768px, 100vw"
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}

            <div className="mt-5">
              {question.type === "mcq" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {question.options.map((option) => {
                    const selectedValue = answers[question.id];
                    const isSelected = selectedValue === option.value;
                    const isCorrectOption =
                      result?.correctAnswer === option.value;
                    const optionStateClass = result
                      ? isCorrectOption
                        ? "border-emerald-500 bg-emerald-100 text-emerald-950 shadow-sm"
                        : isSelected
                          ? "border-red-500 bg-red-200 text-red-950 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 opacity-80"
                      : isSelected
                        ? "border-emerald-500 bg-emerald-100 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300";

                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${materialId === 42 ? "min-h-20 hover:border-emerald-500 hover:shadow-sm" : ""} ${optionStateClass} ${
                          submitted ? "cursor-default" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option.value}
                          checked={isSelected}
                          disabled={submitted}
                          onChange={() => setAnswer(question.id, option.value)}
                          className="mt-1 accent-emerald-600"
                        />
                        <span className={materialId === 42 ? "text-xl font-bold leading-relaxed" : "text-sm font-semibold"}>
                          <MathText text={option.label} />
                          {result && isSelected && !isCorrectOption && (
                            <span className="ml-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                              Jawaban kamu
                            </span>
                          )}
                          {result && isCorrectOption && (
                            <span className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                              Jawaban benar
                            </span>
                          )}
                          {option.image_url && (
                            <span className="relative mt-2 block h-40 w-full overflow-hidden rounded-md bg-white">
                              <Image
                                src={option.image_url}
                                alt={option.label}
                                fill
                                sizes="(min-width: 640px) 50vw, 100vw"
                                className="object-contain"
                                unoptimized
                              />
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === "essay" && childFriendly && <NumberOrdering key={`ordering-${question.id}`} prompt={question.prompt} value={answers[question.id] ?? ""} disabled={submitted} onChange={value=>setAnswer(question.id,value)} />}
              {question.type === "essay" && childFriendly && !question.question_image_url && <ContextualAnswer prompt={question.prompt} value={answers[question.id] ?? ""} disabled={submitted} onChange={value=>setAnswer(question.id,value)}/>}
              {question.type === "essay" && !(childFriendly && !question.question_image_url && (parseNumberSequence(question.prompt) || parseMissingAddend(question.prompt) || contextualAnswer(question.prompt))) && (
                <textarea
                  value={answers[question.id] ?? ""}
                  disabled={submitted}
                  onChange={(event) =>
                    setAnswer(question.id, event.target.value)
                  }
                  rows={3}
                  placeholder="Tuliskan jawabanmu..."
                  className={childFriendly ? "w-full rounded-lg border-2 border-emerald-200 bg-white p-4 text-xl text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100" : "w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100"}
                />
              )}

              {question.type === "multipart" && (
                <div className="space-y-3">
                  {question.items.map((item) => {
                    let parsed: Record<string, string> = {};
                    try {
                      parsed = JSON.parse(answers[question.id] ?? "{}");
                    } catch {
                      parsed = {};
                    }
                    const itemResult = result?.multipartResults?.find(
                      (part) => part.itemId === item.id,
                    );
                    const inputStateClass = itemResult
                      ? itemResult.isCorrect
                        ? "border-emerald-500 bg-emerald-100 text-emerald-950 disabled:bg-emerald-100"
                        : "border-red-500 bg-red-200 text-red-950 disabled:bg-red-200"
                      : "border-slate-300 bg-white focus:border-emerald-500 disabled:bg-slate-100";
                    return (
                      <div key={item.id} className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          {item.label}. <MathText text={item.prompt} />
                        </span>
                        {childFriendly && !item.image_url && <LearningVisual key={item.id} prompt={item.prompt} variation={question.question_number} answer={parsed[item.id] ?? ""} disabled={submitted} onAnswerChange={value=>setMultipartAnswer(question.id,item.id,value)} />}
                        {item.image_url && (
                          <span className="relative my-2 block h-52 w-full overflow-hidden rounded-md bg-white">
                            <Image
                              src={item.image_url}
                              alt={item.prompt}
                              fill
                              sizes="100vw"
                              className="object-contain"
                              unoptimized
                            />
                          </span>
                        )}
                        {!(childFriendly && !item.image_url && (parseNumberSequence(item.prompt) || parseMissingAddend(item.prompt) || contextualAnswer(item.prompt))) && <input
                          aria-label={`Jawaban bagian ${item.label}: ${item.prompt}`}
                          value={parsed[item.id] ?? ""}
                          disabled={submitted}
                          onChange={(event) =>
                            setMultipartAnswer(
                              question.id,
                              item.id,
                              event.target.value,
                            )
                          }
                          className={`mt-2 w-full rounded-md border p-3 text-sm outline-none ${inputStateClass}`}
                          placeholder="Jawaban bagian ini..."
                        />}
                        {itemResult && (
                          <div
                            className={`mt-2 rounded-md px-3 py-2 text-xs font-semibold ${
                              itemResult.isCorrect
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {itemResult.isCorrect
                              ? "Bagian ini benar."
                              : `Bagian ini belum tepat. Jawaban benar: ${itemResult.correctAnswer}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {question.type === "drag_drop" && childFriendly && (<MatchingCards targets={question.drop_targets} items={question.drop_items} value={answers[question.id] ?? "{}"} disabled={submitted} onChange={(targetId,itemId)=>setDropAnswer(question.id,targetId,itemId)} />)}

              {question.type === "drag_drop" && !childFriendly && (
                <div className="space-y-3">
                  {question.drop_targets.map((target) => {
                    let parsed: Record<string, string> = {};
                    try {
                      parsed = JSON.parse(answers[question.id] ?? "{}");
                    } catch {
                      parsed = {};
                    }
                    return (
                      <label key={target.id} className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          {target.label}
                        </span>
                        <select
                          value={parsed[target.id] ?? ""}
                          disabled={submitted}
                          onChange={(event) =>
                            setDropAnswer(
                              question.id,
                              target.id,
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
                        >
                          <option value="">
                            {target.placeholder || "Pilih jawaban"}
                          </option>
                          {question.drop_items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {result && (
              <div
                className={`mt-5 rounded-md border p-4 ${
                  result.isCorrect
                    ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                    : "border-red-300 bg-red-100 text-red-900"
                }`}
              >
                <p className="font-extrabold">
                  {result.isCorrect
                    ? "Jawaban sudah benar."
                    : "Jawaban belum tepat."}
                </p>
                {!result.isCorrect && (
                  <>
                    <p className="mt-2 text-sm leading-relaxed">
                      <MathText
                        text={
                          result.explanation ||
                          "Periksa kembali langkah pengerjaan dan coba pahami konsep pada soal ini."
                        }
                      />
                    </p>
                    {result.correctAnswerImage && (
                      <span className="relative mt-3 block h-64 w-full overflow-hidden rounded-md bg-white">
                        <Image
                          src={result.correctAnswerImage}
                          alt="Gambar jawaban benar"
                          fill
                          sizes="100vw"
                          className="object-contain"
                          unoptimized
                        />
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </article>
        );
      })}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {adminPreview ? null : !submitted ? (
        <button
          type="button"
          disabled={!canSubmitPage || submitting}
          onClick={submitPage}
          className="w-full rounded-lg bg-emerald-600 px-6 py-4 text-base font-extrabold text-white shadow-md transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
        >
          {submitting
            ? "Memeriksa jawaban..."
            : isAdmin
              ? "Submit dan Periksa Jawaban (Mode Admin)"
              : allAnswered
              ? (materialId === 42 ? "Periksa jawaban →" : "Submit dan Periksa Jawaban")
              : childFriendly ? "Pilih atau isi jawabanmu dulu" : "Jawab semua soal untuk mengaktifkan Submit"}
        </button>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          {page > 0 && (
            <button
              type="button"
              onClick={() => movePage(page - 1)}
              className="flex-1 rounded-lg border border-emerald-300 bg-white px-5 py-3 font-bold text-emerald-700 hover:bg-emerald-50"
            >
              {childFriendly ? "Soal sebelumnya" : "Halaman Sebelumnya"}
            </button>
          )}
          {autoAdvancePage === page ? <p role="status" className="p-3 text-center font-bold text-emerald-800">Benar! Lanjut ke soal berikutnya…</p> : page < totalPages - 1 ? (
            <button
              type="button"
              onClick={() => movePage(page + 1)}
              className="flex-1 rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500"
            >
              Lanjut ke Soal {page * PAGE_SIZE + PAGE_SIZE + 1}{!childFriendly && "–"}
              {!childFriendly && Math.min(
                page * PAGE_SIZE + PAGE_SIZE * 2,
                orderedMeta.length,
              )}
            </button>
          ) : !finalPageSubmitted ? (
            <div className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-3 text-center font-bold text-emerald-800">
              Semua soal telah selesai diperiksa.
            </div>
          ) : null}
        </div>
      )}

      {finalPageSubmitted && (
        <section className="rounded-lg border border-emerald-300 bg-white p-5 shadow-md sm:p-7">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Ringkasan Latihan
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
              Latihan selesai
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Kamu telah menyelesaikan seluruh {orderedMeta.length} soal.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-md bg-emerald-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-700">
                {correctCount}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-800">
                Jawaban benar
              </p>
            </div>
            <div className="rounded-md bg-red-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-red-700">
                {wrongCount}
              </p>
              <p className="mt-1 text-xs font-semibold text-red-800">
                Jawaban salah
              </p>
            </div>
            <div className="rounded-md bg-sky-50 p-4 text-center">
              <p className="text-2xl font-extrabold text-sky-700">
                {finalScore}
              </p>
              <p className="mt-1 text-xs font-semibold text-sky-800">
                Skor akhir
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={restartPractice}
              className="rounded-lg border border-emerald-300 bg-white px-5 py-3 font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Ulangi Latihan
            </button>
            <Link
              href="/dashboard/student"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500"
            >
              Kembali ke Daftar Materi
            </Link>
          </div>
        </section>
      )}

      {(isGuest || isAdmin) && (
        <p className="text-center text-xs text-slate-500">
          {isAdmin
            ? "Mode admin: hasil latihan tidak disimpan sebagai progres siswa."
            : "Mode tamu: hasil latihan tidak disimpan ke akun."}
        </p>
      )}
    </section>
  );
}
