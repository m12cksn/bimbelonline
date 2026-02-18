"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import {
  MultiBackend,
  HTML5DragTransition,
  TouchTransition,
} from "react-dnd-multi-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import type Konva from "konva";
import { Layer, Line, Stage } from "react-konva";

type QuestionOption = {
  value: string;
  label: string;
  imageUrl?: string;
  targetKey?: string;
};

type QuestionOptionRow = {
  label: string;
  value: string;
  image_url?: string | null;
  is_correct?: boolean | null;
  sort_order?: number | null;
};

type DropTargetRow = {
  id: string;
  label: string;
  placeholder?: string | null;
  sort_order?: number | null;
};

type DropItemRow = {
  id: string;
  label: string;
  image_url?: string | null;
  correct_target_id: string;
  sort_order?: number | null;
};

type QuestionItemRow = {
  id: string;
  label: string;
  prompt: string;
  image_url?: string | null;
  sort_order?: number | null;
};

type Question = {
  id: string;
  question_number: number;
  type: "mcq" | "essay" | "multipart" | "drag_drop";
  prompt: string;
  helper_text?: string | null;
  question_image_url?: string | null;
  question_mode?: "practice" | "tryout" | null;
  options: QuestionOptionRow[];
  drop_targets: DropTargetRow[];
  drop_items: DropItemRow[];
  items: QuestionItemRow[];
};

type QuestionMeta = {
  id: string;
  question_number: number;
  type: "mcq" | "essay" | "multipart" | "drag_drop";
  question_mode?: "practice" | "tryout" | null;
};

type NormalizedQuestion = {
  prompt: string;
  helperText?: string;
  imageUrl?: string;
  type: "mcq" | "essay" | "multipart" | "drag_drop";
  options: QuestionOption[];
  dropTargets?: { key: string; label: string; placeholder?: string }[];
};

interface Props {
  materialId: number;
  questionMeta: QuestionMeta[];
  initialLastNumber: number;
  userId: string;
  isPremium: boolean;
  questionLimit: number;
  planLabel: string;
  planPriceLabel: string;
  upgradeOptions: Array<{ label: string; priceLabel: string }>;
  isAdmin?: boolean;
  isTryout?: boolean;
  timerSeconds?: number;
  isGuest?: boolean;
  onReady?: () => void;
}

const LEVEL_SIZE = 20;

type AttemptStats = {
  totalAnswered: number;
  correct: number;
};

type ApiAttemptRow = {
  attempt_number: number;
  total_answered: number;
  correct: number;
  wrong: number;
  score: number;
};

type DraggableOptionProps = {
  id: string;
  label: string;
  isUsed?: boolean;
};

type DropZoneProps = {
  id: string;
  label: string;
  onDropValue?: (value: string, targetKey: string) => void;
  children?: ReactNode;
  onClick?: () => void;
};

const DRAG_TYPE = "answer";
const DND_OPTIONS = {
  backends: [
    {
      backend: HTML5Backend,
      transition: HTML5DragTransition,
    },
    {
      backend: TouchBackend,
      options: { enableMouseEvents: true },
      transition: TouchTransition,
    },
  ],
};

type DoodleState = { canUndo: boolean; canRedo: boolean; hasStrokes: boolean };
type DoodleHandle = { undo: () => void; redo: () => void; clear: () => void };
type DoodleLine = { points: number[]; color: string; width: number };

function DraggableOption({ id, label, isUsed }: DraggableOptionProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DRAG_TYPE,
      item: { value: id },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id],
  );

  const setDragRef = useCallback(
    (node: HTMLButtonElement | null) => {
      drag(node);
    },
    [drag],
  );

  return (
    <button
      ref={setDragRef}
      type="button"
      className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition ${
        isDragging ? "scale-[1.02] shadow-md shadow-emerald-200/70" : ""
      } ${isUsed ? "opacity-70" : ""}`}
    >
      {label}
    </button>
  );
}

function DropZone({
  id,
  label,
  children,
  onClick,
  onDropValue,
}: DropZoneProps) {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: DRAG_TYPE,
      drop: (item: { value: string }) => {
        onDropValue?.(item.value, id);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [id, onDropValue],
  );

  const setDropRef = useCallback(
    (node: HTMLDivElement | null) => {
      drop(node);
    },
    [drop],
  );

  return (
    <div
      ref={setDropRef}
      onClick={onClick}
      className={`rounded-xl border border-dashed px-4 py-4 text-base transition ${
        isOver
          ? "border-emerald-400 bg-emerald-50"
        : "border-slate-200 bg-slate-50"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      {children}
    </div>
  );
}

const DoodleOverlay = forwardRef<
  DoodleHandle,
  {
    resetKey: string | number | null;
    active: boolean;
    onStateChange?: (state: DoodleState) => void;
  }
>(function DoodleOverlay({ resetKey, active, onStateChange }, ref) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const drawingRef = useRef(false);
  const [lines, setLines] = useState<DoodleLine[]>([]);
  const [redoStack, setRedoStack] = useState<DoodleLine[]>([]);
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    setLines([]);
    setRedoStack([]);
    drawingRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    onStateChange?.({
      canUndo: lines.length > 0,
      canRedo: redoStack.length > 0,
      hasStrokes: lines.length > 0,
    });
  }, [lines, redoStack, onStateChange]);

  useEffect(() => {
    if (!active) drawingRef.current = false;
  }, [active]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const updateSize = () => {
      const rect = wrapper.getBoundingClientRect();
      setStageSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      });
    };
    updateSize();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = () => {
    if (!active) return;
    const stage = stageRef.current;
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;
    drawingRef.current = true;
    setLines((prev) => [
      ...prev,
      { points: [point.x, point.y], color: "#111827", width: 2.5 },
    ]);
    setRedoStack([]);
  };

  const handlePointerMove = () => {
    if (!active || !drawingRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;
    setLines((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = {
        ...last,
        points: last.points.concat([point.x, point.y]),
      };
      return next;
    });
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
  };

  const handleUndo = () => {
    if (lines.length === 0) return;
    setLines((prev) => {
      const next = [...prev];
      const removed = next.pop();
      if (removed) setRedoStack((redo) => [...redo, removed]);
      return next;
    });
  };

  const handleRedo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const restored = next.pop();
      if (restored) setLines((curr) => [...curr, restored]);
      return next;
    });
  };

  const handleClear = () => {
    setLines([]);
    setRedoStack([]);
  };

  useImperativeHandle(
    ref,
    () => ({
      undo: handleUndo,
      redo: handleRedo,
      clear: handleClear,
    }),
    [lines, redoStack],
  );

  return (
    <div ref={wrapperRef} className="pointer-events-none absolute inset-0 z-20">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        className={active ? "pointer-events-auto" : "pointer-events-none"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Layer>
          {lines.map((line, idx) => (
            <Line
              key={idx}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.width}
              lineCap="round"
              lineJoin="round"
              tension={0.2}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
});

export default function MaterialQuiz({
  materialId,
  questionMeta,
  initialLastNumber,
  userId,
  isPremium,
  questionLimit,
  planLabel,
  planPriceLabel,
  upgradeOptions,
  isAdmin = false,
  isTryout = false,
  timerSeconds,
  isGuest = false,
  onReady,
}: Props) {
  const allowAllAccess = isAdmin === true;
  const [currentNumber, setCurrentNumber] = useState(
    initialLastNumber > 0 ? initialLastNumber + 1 : 1,
  );
  const [maxUnlockedNumber, setMaxUnlockedNumber] = useState(
    initialLastNumber > 0 ? initialLastNumber + 1 : 1,
  );
  const [questionDetails, setQuestionDetails] = useState<
    Record<number, Question>
  >({});
  const questionDetailsRef = useRef<Record<number, Question>>({});
  const [loadingLevel, setLoadingLevel] = useState(false);

  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean | null;
    message: string | null;
    imageUrl?: string | null;
    explanation?: string | null;
  }>({ isCorrect: null, message: null, explanation: null });
  const proceedRef = useRef<null | (() => void)>(null);

  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    isTryout && typeof timerSeconds === "number" ? timerSeconds : null,
  );
  const [timeUp, setTimeUp] = useState(false);

  const [essayAnswer, setEssayAnswer] = useState("");
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [multipartAnswers, setMultipartAnswers] = useState<
    Record<string, string>
  >({});
  const [tapMode, setTapMode] = useState(false);
  const [tapSelection, setTapSelection] = useState<string | null>(null);

  // status benar/salah tiap soal di percobaan aktif (buat warna bubble)
  // simpan berdasarkan question_number agar konsisten di UI
  const [questionResults, setQuestionResults] = useState<
    Record<number, "correct" | "wrong">
  >({});

  // riwayat percobaan dari database (1,2)
  const [attemptHistory, setAttemptHistory] = useState<
    Record<number, AttemptStats>
  >({});

  // percobaan yang sedang aktif (dipakai saat menjawab)
  const [attemptNumber, setAttemptNumber] = useState<1 | 2>(1);

  // percobaan mana yang sedang dilihat di UI ringkasan
  const [activeAttemptView, setActiveAttemptView] = useState<number | null>(
    null,
  );

  const [loadingAttempts, setLoadingAttempts] = useState<boolean>(true);
  const [hasSavedThisAttempt, setHasSavedThisAttempt] =
    useState<boolean>(false);
  const [hasSavedTryout, setHasSavedTryout] = useState(false);
  const [levelReview, setLevelReview] = useState<{
    level: number;
    correct: number;
    wrong: number;
    answered: number;
    total: number;
  } | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [promoCountdown, setPromoCountdown] = useState<string | null>(null);
  const doodleRef = useRef<DoodleHandle | null>(null);
  const [doodleActive, setDoodleActive] = useState(false);
  const [doodleState, setDoodleState] = useState<DoodleState>({
    canUndo: false,
    canRedo: false,
    hasStrokes: false,
  });
  const readyRef = useRef(false);

  const activeMeta = useMemo(() => {
    return questionMeta.filter((q) =>
      isTryout ? q.question_mode === "tryout" : q.question_mode !== "tryout",
    );
  }, [questionMeta, isTryout]);

  const orderedMeta = useMemo(() => {
    return [...activeMeta].sort(
      (a, b) => a.question_number - b.question_number,
    );
  }, [activeMeta]);

  const totalQuestions = orderedMeta.length;
  const premiumPrice = "145.000";
  const promoPrice = "99.000";
  const bankAccount = "0961097923";
  const bankHolder = "Iwan Setiawan";
  const progressKey = `material_progress_${materialId}_${userId}`;

  // -------------------------------
  // Sync posisi soal dengan progress server
  // -------------------------------
  useEffect(() => {
    if (allowAllAccess) {
      if (orderedMeta.length > 0) {
        const minNumber = Math.min(...orderedMeta.map((q) => q.question_number));
        const maxNumber = Math.max(...orderedMeta.map((q) => q.question_number));
        setCurrentNumber(minNumber);
        setMaxUnlockedNumber(maxNumber);
      }
      return;
    }
    if (isTryout) {
      const tryoutNumbers = orderedMeta.map((q) => q.question_number);
      const startNumber =
        tryoutNumbers.length > 0 ? Math.min(...tryoutNumbers) : 1;
      setCurrentNumber(startNumber);
      setMaxUnlockedNumber(1);
      return;
    }

    const startNumber = initialLastNumber > 0 ? initialLastNumber + 1 : 1;
    let storedNumber = 0;
    if (typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem(progressKey);
      const parsed = Number(raw);
      if (!Number.isNaN(parsed) && parsed > 0) {
        storedNumber = parsed;
      }
    }
    const nextNumber = Math.max(startNumber, storedNumber);
    setCurrentNumber(nextNumber);
    setMaxUnlockedNumber(nextNumber);
  }, [allowAllAccess, initialLastNumber, isTryout, orderedMeta, progressKey]);

  useEffect(() => {
    if (isTryout) return;
    if (typeof window === "undefined") return;
    if (currentNumber < 1) return;
    window.sessionStorage.setItem(progressKey, String(currentNumber));
  }, [currentNumber, isTryout, progressKey]);

  useEffect(() => {
    if (!isTryout || typeof timerSeconds !== "number") return;
    setSecondsLeft(timerSeconds);
    setTimeUp(false);
  }, [isTryout, timerSeconds]);

  useEffect(() => {
    if (!isTryout || secondsLeft === null || timeUp) return;
    if (secondsLeft <= 0) {
      setTimeUp(true);
      setLockedMessage("Waktu habis. Tryout selesai.");
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => (prev === null ? null : prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isTryout, secondsLeft, timeUp]);

  useEffect(() => {
    questionDetailsRef.current = {};
    setQuestionDetails({});
    setLoadingLevel(false);
  }, [isTryout, materialId]);

  useEffect(() => {
    const end = new Date();
    end.setDate(end.getDate() + 7);

    const update = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        setPromoCountdown("Promo berakhir");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const pad = (val: number) => String(val).padStart(2, "0");
      setPromoCountdown(`${days} hari ${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------
  // Ambil riwayat percobaan dari DB
  // -------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadAttempts() {
      if (allowAllAccess) {
        setAttemptHistory({});
        setAttemptNumber(1);
        setActiveAttemptView(null);
        setLoadingAttempts(false);
        return;
      }
      if (isGuest) {
        setAttemptHistory({});
        setAttemptNumber(1);
        setActiveAttemptView(null);
        setLoadingAttempts(false);
        return;
      }

      try {
        setLoadingAttempts(true);
        const summaryUrl = isTryout
          ? `/api/materials/${materialId}/tryout-summary`
          : `/api/materials/${materialId}/attempt-summary`;
        const res = await fetch(summaryUrl, { method: "GET" });
        if (!res.ok) {
          console.error("Failed to fetch attempt summary", await res.text());
          return;
        }
        const data: {
          attempts: ApiAttemptRow[];
          question_status?: Array<{
            attempt_number: number;
            question_id: string;
            is_correct: boolean;
          }>;
        } = await res.json();

        if (!isMounted) return;

        const map: Record<number, AttemptStats> = {};
        for (const row of data.attempts || []) {
          const num = row.attempt_number;
          if (!num) continue;
          map[num] = {
            totalAnswered: row.total_answered ?? 0,
            correct: row.correct ?? 0,
          };
        }

        setAttemptHistory(map);

        const attemptNumbers = Object.keys(map).map((n) => Number(n));
        const attempt1Total = map[1]?.totalAnswered ?? 0;

        let nextAttemptNumber: 1 | 2 = 1;
        let nextActiveView: number | null = null;

        if (!isPremium) {
          nextAttemptNumber = 1;
          nextActiveView = attemptNumbers.includes(1) ? 1 : null;
        } else if (attemptNumbers.includes(2)) {
          nextAttemptNumber = 2;
          nextActiveView = 2;
          // attempt 2 berjalan atau sudah selesai
        } else if (attemptNumbers.includes(1)) {
          if (attempt1Total < totalQuestions) {
            nextAttemptNumber = 1;
            nextActiveView = 1;
          } else {
            nextAttemptNumber = 2; // attempt 1 selesai, siap untuk attempt 2
            nextActiveView = 1;
          }
        } else {
          nextAttemptNumber = 1;
          nextActiveView = null;
        }

        setAttemptNumber(nextAttemptNumber);
        setActiveAttemptView(nextActiveView);

        const idToNumber = new Map(
          questionMeta.map((q) => [q.id, q.question_number]),
        );
        const resultMap: Record<number, "correct" | "wrong"> = {};
        for (const row of data.question_status || []) {
          if (row.attempt_number !== nextAttemptNumber) continue;
          const number = idToNumber.get(row.question_id);
          if (!number) continue;
          resultMap[number] = row.is_correct ? "correct" : "wrong";
        }
        setQuestionResults(resultMap);
      } catch (err) {
        console.error("loadAttempts error:", err);
      } finally {
        if (isMounted) setLoadingAttempts(false);
      }
    }

    loadAttempts();

    return () => {
      isMounted = false;
    };
  }, [
    allowAllAccess,
    materialId,
    totalQuestions,
    isPremium,
    questionMeta,
    isGuest,
    isTryout,
  ]);

  // reset flag penyimpanan ketika ganti percobaan
  useEffect(() => {
    setHasSavedThisAttempt(false);
  }, [attemptNumber, userId, materialId]);

  // -------------------------------
  // Normalisasi soal
  // -------------------------------
  const currentQuestion = questionDetails[currentNumber];

  useEffect(() => {
    setDoodleActive(false);
    setDoodleState({ canUndo: false, canRedo: false, hasStrokes: false });
  }, [currentQuestion?.id]);

  const normalizedQuestion: NormalizedQuestion | null = useMemo(() => {
    if (!currentQuestion) return null;

    const normalizedOptions: QuestionOption[] = (currentQuestion.options || [])
      .map((opt) => ({
        value: opt.value,
        label: opt.label ?? opt.value,
        imageUrl: opt.image_url ?? undefined,
      }))
      .filter(Boolean);

    const dropTargets = (currentQuestion.drop_targets || []).map((target) => ({
      key: target.id,
      label: target.label,
      placeholder: target.placeholder ?? undefined,
    }));

    const dropItems = (currentQuestion.drop_items || []).map((item) => ({
      value: item.id,
      label: item.label,
      imageUrl: item.image_url ?? undefined,
      targetKey: item.correct_target_id,
    }));

    const questionType: NormalizedQuestion["type"] =
      currentQuestion.type === "drag_drop"
        ? "drag_drop"
        : currentQuestion.type === "essay"
          ? "essay"
          : currentQuestion.type === "multipart"
            ? "multipart"
            : "mcq";

    const finalOptions =
      questionType === "drag_drop" ? dropItems : normalizedOptions;

    return {
      prompt: currentQuestion.prompt,
      helperText: currentQuestion.helper_text ?? undefined,
      imageUrl: currentQuestion.question_image_url ?? undefined,
      type: questionType,
      options: finalOptions,
      dropTargets: questionType === "drag_drop" ? dropTargets : undefined,
    };
  }, [currentQuestion]);

  const toggleDoodle = () => setDoodleActive((prev) => !prev);
  const handleDoodleUndo = () => doodleRef.current?.undo();
  const handleDoodleRedo = () => doodleRef.current?.redo();
  const handleDoodleClear = () => doodleRef.current?.clear();
  const handleTapOption = (value: string) => setTapSelection(value);
  const handleTapTarget = (targetKey: string) => {
    if (!tapSelection) {
      if (!placements[targetKey]) return;
      setPlacements((prev) => {
        const next = { ...prev };
        delete next[targetKey];
        return next;
      });
      return;
    }
    setPlacements((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (next[key] === tapSelection) delete next[key];
      });
      next[targetKey] = tapSelection;
      return next;
    });
    setTapSelection(null);
  };

  const maxQuestionNumber = orderedMeta.length
    ? Math.max(...orderedMeta.map((q) => q.question_number))
    : 0;

  useEffect(() => {
    if (!materialId || orderedMeta.length === 0) return;
    if (currentNumber > maxQuestionNumber) return;

    const levelStart = Math.max(
      1,
      Math.floor((currentNumber - 1) / LEVEL_SIZE) * LEVEL_SIZE + 1,
    );
    const levelEnd = Math.min(levelStart + LEVEL_SIZE - 1, maxQuestionNumber);
    const details = questionDetailsRef.current;
    const needsFetch = orderedMeta
      .filter(
        (q) => q.question_number >= levelStart && q.question_number <= levelEnd,
      )
      .some((q) => !details[q.question_number]);

    if (!needsFetch) return;

    async function fetchLevel() {
      setLoadingLevel(true);
      try {
        const mode = isTryout ? "tryout" : "practice";
        const res = await fetch(
          `/api/materials/${materialId}/questions?mode=${mode}&start=${levelStart}&end=${levelEnd}`,
        );
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Gagal memuat soal.");
        }
        const incoming = Array.isArray(json.questions) ? json.questions : [];
        setQuestionDetails((prev) => {
          const next = { ...prev };
          for (const q of incoming) {
            if (q?.question_number) {
              next[q.question_number] = q;
            }
          }
          questionDetailsRef.current = next;
          return next;
        });
      } catch (err) {
        console.error("fetch level questions error:", err);
      } finally {
        setLoadingLevel(false);
      }
    }

    fetchLevel();
  }, [materialId, currentNumber, isTryout, orderedMeta, maxQuestionNumber]);

  // reset jawaban tiap ganti soal
  useEffect(() => {
    setEssayAnswer("");
    setPlacements({});
    setMultipartAnswers({});
    setTapSelection(null);
    setFeedback({ isCorrect: null, message: null, explanation: null });
    setLockedMessage(null);
  }, [currentQuestion?.id]);

  useEffect(() => {
    readyRef.current = false;
  }, [materialId, isTryout]);

  useEffect(() => {
    if (!currentQuestion || readyRef.current) return;
    readyRef.current = true;
    onReady?.();
  }, [currentQuestion, onReady]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setTapMode(media.matches);
    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  // -------------------------------
  // Jika sudah tidak ada currentQuestion → mode ringkasan
  // -------------------------------

  useEffect(() => {
    if (allowAllAccess) return;
    if (isGuest) return;
    // kalau masih loading attempt dari server, jangan simpan apa-apa dulu
    if (loadingAttempts) return;
    // kalau masih ada soal, berarti belum selesai
    if (currentQuestion) return;

    const summary = attemptHistory[attemptNumber];
    if (!summary || summary.totalAnswered === 0) return;
    if (hasSavedThisAttempt) return;

    async function saveAttemptSummary() {
      try {
        await fetch(`/api/materials/${materialId}/attempt-summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptNumber,
            correct: summary.correct,
            totalAnswered: summary.totalAnswered,
          }),
        });
        setHasSavedThisAttempt(true);
      } catch (err) {
        console.error("Failed to save attempt summary:", err);
      }
    }

    saveAttemptSummary();

    if (isTryout && !hasSavedTryout) {
      fetch(`/api/materials/${materialId}/tryout-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptNumber,
          correct: summary.correct,
          totalAnswered: summary.totalAnswered,
        }),
      })
        .then(() => setHasSavedTryout(true))
        .catch((err) => {
          console.error("Failed to save tryout summary:", err);
        });
    }
  }, [
    currentQuestion,
    attemptHistory,
    attemptNumber,
    materialId,
    hasSavedThisAttempt,
    hasSavedTryout,
    loadingAttempts,
    isTryout,
    isGuest,
  ]);

  const orderedQuestions = orderedMeta;

  if (!currentQuestion || !normalizedQuestion) {
    // MODE RINGKASAN
    const waitingForQuestion =
      orderedMeta.length > 0 && currentNumber <= maxQuestionNumber;

    if (loadingAttempts || (waitingForQuestion && loadingLevel)) {
      return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Memuat soal...
        </div>
      );
    }

    if (waitingForQuestion) {
      return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Menyiapkan soal berikutnya...
        </div>
      );
    }

    if (isGuest) {
      return (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 text-sm text-slate-700 shadow-xl shadow-slate-200/70">
          <h2 className="text-lg font-bold text-emerald-700">
            Latihan gratis selesai 🎉
          </h2>
          <p className="mt-2 text-xs text-slate-600">
            Kamu sudah menyelesaikan {questionLimit} soal gratis. Lanjutkan ke
            materi lain atau upgrade untuk membuka semua soal.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <Link
              href="/materials"
              className="rounded-xl border border-emerald-400/70 bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600"
            >
              Lihat materi lain
            </Link>
            <Link
              href="/dashboard/student/upgrade"
              className="rounded-xl border border-amber-300 bg-amber-400 px-3 py-2 font-semibold text-slate-900 hover:bg-amber-500"
            >
              Upgrade premium
            </Link>
          </div>
        </div>
      );
    }

    const attemptNumbers = Object.keys(attemptHistory).map((n) => Number(n));
    const hasAnyAttempt = attemptNumbers.length > 0;
    const attempt1 = attemptHistory[1];
    const attempt2 = attemptHistory[2];
    const hasAttempt1 = !!attempt1;
    const hasAttempt2 = !!attempt2;

    // Belum ada data sama sekali di DB → ajak mulai percobaan 1
    if (!hasAnyAttempt) {
      function handleStartAttempt1() {
        setAttemptNumber(1);
        setQuestionResults({});
        setCurrentNumber(1);
        setMaxUnlockedNumber(1);
        setActiveAttemptView(null);
        setFeedback({ isCorrect: null, message: null, explanation: null });
        setLockedMessage(null);
      }

      return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-xl shadow-slate-200/70">
          <h2 className="mb-2 text-lg font-bold text-emerald-700">
            Belum ada data percobaan tersimpan
          </h2>
          <p className="mb-4 text-xs text-slate-600">
            Silakan mulai Percobaan 1 untuk materi ini. Setelah kamu
            menyelesaikan semua soal, hasilnya akan otomatis tersimpan di
            server.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Link
              href="/dashboard/student"
              className="rounded-xl border border-cyan-400/70 bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600"
            >
              ⬅️ Kembali ke Dashboard
            </Link>
            <button
              type="button"
              onClick={handleStartAttempt1}
              className="rounded-xl border border-emerald-400/70 bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600"
            >
              ▶ Mulai percobaan 1
            </button>
          </div>
        </div>
      );
    }

    const defaultViewAttempt =
      activeAttemptView && attemptHistory[activeAttemptView]
        ? activeAttemptView
        : Math.max(...attemptNumbers);

    const viewAttempt = defaultViewAttempt;
    const stats = attemptHistory[viewAttempt] ?? {
      totalAnswered: 0,
      correct: 0,
    };

    const answered = stats.totalAnswered;
    const correct = stats.correct;
    const wrong = Math.max(0, answered - correct);
    const score = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    let messageTitle = `Keren, kamu sudah menyelesaikan percobaan ${viewAttempt}! 🎉`;
    let messageBody =
      "Terima kasih sudah berusaha mengerjakan semua soal di materi ini.";

    if (score >= 90) {
      messageTitle = "Luar biasa! 🔥";
      messageBody =
        "Kamu menjawab hampir semua soal dengan benar. Pertahankan ya, kamu sudah sangat menguasai materi ini!";
    } else if (score >= 80) {
      messageTitle = "Sangat bagus! 😄";
      messageBody =
        "Kamu hampir menjawab benar semua soal. Sedikit lagi latihan, kamu pasti bisa 100%!";
    } else if (score >= 60) {
      messageTitle = "Cukup bagus 👍";
      messageBody =
        "Kamu sudah mengerti sebagian besar materi, tapi masih ada beberapa soal yang perlu kamu latihan lagi.";
    } else if (answered > 0) {
      messageTitle = "Jangan menyerah ya 💪";
      messageBody =
        "Kamu sudah berusaha mengerjakan soal. Coba ulangi lagi materi dan latihan pelan-pelan, kamu pasti bisa meningkat!";
    }

    function handleStartAttempt2() {
      if (!hasAttempt1 || hasAttempt2) return;
      setAttemptNumber(2);
      setQuestionResults({});
      setCurrentNumber(1);
      setMaxUnlockedNumber(1);
      setActiveAttemptView(null);
      setFeedback({ isCorrect: null, message: null, explanation: null });
      setLockedMessage(null);
    }

    return (
      <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-white p-4 text-sm text-slate-900 shadow-xl shadow-slate-200/70">
        <h2 className="mb-1 text-lg font-bold text-emerald-700">
          {messageTitle}
        </h2>
        <p className="mb-3 whitespace-pre-line text-xs text-slate-600">
          {messageBody}
        </p>

        {/* tombol pilih percobaan yang ingin dilihat */}
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          {hasAttempt1 && (
            <button
              type="button"
              onClick={() => setActiveAttemptView(1)}
              className={`rounded-full border px-3 py-1 font-semibold ${
                viewAttempt === 1
                  ? "border-emerald-400 bg-emerald-500/30 text-emerald-50"
                  : "border-slate-600 bg-slate-100 text-slate-700"
              }`}
            >
              🔍 Lihat percobaan 1
            </button>
          )}
          {hasAttempt2 && (
            <button
              type="button"
              onClick={() => setActiveAttemptView(2)}
              className={`rounded-full border px-3 py-1 font-semibold ${
                viewAttempt === 2
                  ? "border-cyan-400 bg-cyan-500/30 text-cyan-900"
                  : "border-slate-600 bg-slate-100 text-slate-700"
              }`}
            >
              🔍 Lihat percobaan 2
            </button>
          )}
        </div>

        {/* ringkasan percobaan yang sedang dilihat */}
        <div className="mb-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl bg-slate-50 p-2 text-center">
            <div className="text-slate-500">Benar</div>
            <div className="text-lg font-bold text-emerald-700">{correct}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 text-center">
            <div className="text-slate-500">Salah</div>
            <div className="text-lg font-bold text-rose-300">{wrong}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 text-center">
            <div className="text-slate-500">Total dijawab</div>
            <div className="text-lg font-bold text-slate-700">{answered}</div>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          <span>Paket kamu: {planLabel}</span>
          <span className="text-slate-500">-</span>
          <span>Harga: {planPriceLabel}</span>
        </div>
        <div className="mb-4 text-[11px] text-slate-600">
          Nilai percobaan {viewAttempt}:{" "}
          <span className="font-bold text-emerald-700">{score}%</span>
        </div>

        {upgradeOptions.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
            <div className="font-semibold">Upgrade rekomendasi</div>
            <div className="mt-1">
              {planLabel === "Free"
                ? "Upgrade ke paket berbayar untuk akses soal lebih banyak."
                : planLabel === "Premium"
                  ? "Upgrade ke Bundling 3 Bulan atau Zoom Premium."
                  : planLabel === "3 Bulan"
                    ? "Tambah Zoom Premium untuk kelas tambahan."
                    : ""}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {upgradeOptions.map((opt) => (
                <span
                  key={opt.label}
                  className="rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-1"
                >
                  {opt.label} ({opt.priceLabel})
                </span>
              ))}
            </div>
            <div className="mt-2">
              <Link
                href="/dashboard/student/upgrade"
                className="inline-flex rounded-lg border border-amber-400/60 bg-amber-100 px-3 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-500/30"
              >
                Lihat semua paket
              </Link>
            </div>
          </div>
        )}
        {/* ringkasan percobaan 1 & 2 berdampingan */}
        <div className="mb-4 grid gap-2 text-[11px] sm:grid-cols-2">
          {hasAttempt1 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 font-semibold text-slate-700">
                Percobaan 1
              </div>
              <div>Benar: {attempt1.correct}</div>
              <div>
                Salah: {Math.max(0, attempt1.totalAnswered - attempt1.correct)}
              </div>
              <div>
                Nilai:{" "}
                {Math.round(
                  (attempt1.correct / Math.max(1, attempt1.totalAnswered)) *
                    100,
                )}
                %
              </div>
            </div>
          )}

          {hasAttempt2 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 font-semibold text-slate-700">
                Percobaan 2
              </div>
              <div>Benar: {attempt2.correct}</div>
              <div>
                Salah: {Math.max(0, attempt2.totalAnswered - attempt2.correct)}
              </div>
              <div>
                Nilai:{" "}
                {Math.round(
                  (attempt2.correct / Math.max(1, attempt2.totalAnswered)) *
                    100,
                )}
                %
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link
            href="/dashboard/student"
            className="rounded-xl border border-cyan-400/70 bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600"
          >
            ⬅️ Kembali ke Dashboard
          </Link>

          {!hasAttempt2 && hasAttempt1 && (
            <button
              type="button"
              onClick={handleStartAttempt2}
              className="rounded-xl border border-emerald-400/70 bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600"
            >
              🔁 Mulai percobaan 2
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------
  // MODE KERJAKAN SOAL
  // -------------------------------

  async function handleAnswer(selected: string) {
    if (!currentQuestion) return;
    if (timeUp) return;

    setLoadingAnswer(true);
    setFeedback({ isCorrect: null, message: null, explanation: null });
    setLockedMessage(null);

    try {
      const res = await fetch(`/api/materials/${materialId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          questionNumber: currentQuestion.question_number,
          selectedAnswer: selected,
          attemptNumber,
        }),
      });

      const data = await res.json();

      if (data.locked) {
        setLockedMessage(
          data.message ||
            `Soal ini terkunci untuk paket ${planLabel}. Upgrade paket untuk membuka semua soal.`,
        );
        return;
      }

      const isCorrect: boolean = !!data.isCorrect;
      const correctAnswer: string | undefined = data.correctAnswer;
      const correctAnswerImage: string | undefined = data.correctAnswerImage;
      const explanation: string | undefined = data.explanation ?? undefined;

      // tandai soal ini benar / salah untuk bubble
      const nextResults: Record<number, "correct" | "wrong"> = {
        ...questionResults,
        [currentQuestion.question_number]: isCorrect ? "correct" : "wrong",
      };
      setQuestionResults(nextResults);

      // update statistik percobaan aktif (di memori)
      setAttemptHistory((prevHistory) => {
        const prevSummary = prevHistory[attemptNumber] ?? {
          totalAnswered: 0,
          correct: 0,
        };
        const updated: AttemptStats = {
          totalAnswered: prevSummary.totalAnswered + 1,
          correct: prevSummary.correct + (isCorrect ? 1 : 0),
        };
        return { ...prevHistory, [attemptNumber]: updated };
      });

      let message = "";
      if (isCorrect) {
        message = "Mantap! Jawaban kamu benar.";
      } else if (correctAnswer) {
        message = `Belum tepat. Jawaban yang benar: ${correctAnswer}`;
      } else {
        message =
          "Belum tepat. Jawabanmu tercatat, lanjut ke soal berikutnya ya.";
      }

      setFeedback({
        isCorrect,
        message,
        imageUrl: correctAnswerImage ?? null,
        explanation: explanation ?? null,
      });

      const isEndOfLevel = displayNumber === levelEnd;
      const proceedToNext = () => {
        setFeedback({
          isCorrect: null,
          message: null,
          imageUrl: null,
          explanation: null,
        });
        setEssayAnswer("");
        setPlacements({});

        if (isEndOfLevel) {
          const rangeQuestions = isTryout
            ? orderedQuestions.slice(levelStart - 1, levelEnd)
            : orderedQuestions.filter(
                (q) =>
                  q.question_number >= levelStart &&
                  q.question_number <= levelEnd,
              );
          const levelTotal = rangeQuestions.length;
          const answered = rangeQuestions.filter(
            (q) => nextResults[q.question_number],
          ).length;
          const correct = rangeQuestions.filter(
            (q) => nextResults[q.question_number] === "correct",
          ).length;
          const wrong = Math.max(0, answered - correct);

          setLevelReview({
            level: currentLevel,
            correct,
            wrong,
            answered,
            total: levelTotal,
          });
          return;
        }

        setCurrentNumber((prev) => {
          if (isTryout) {
            const nextIndex = currentIndex + 1;
            if (nextIndex < orderedQuestions.length) {
              const nextNumber = orderedQuestions[nextIndex].question_number;
              setMaxUnlockedNumber((prevMax) =>
                Math.max(prevMax, nextIndex + 1),
              );
              return nextNumber;
            }
            const lastNumber =
              orderedQuestions[orderedQuestions.length - 1]?.question_number ??
              prev;
            setMaxUnlockedNumber((prevMax) =>
              Math.max(prevMax, orderedQuestions.length),
            );
            return lastNumber + 1;
          }

          const next = prev + 1;
          setMaxUnlockedNumber((prevMax) => Math.max(prevMax, next));
          return next;
        });
      };

      proceedRef.current = proceedToNext;

      if (isCorrect) {
        setTimeout(() => {
          proceedRef.current?.();
          proceedRef.current = null;
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        isCorrect: null,
        message: "Ups, terjadi error saat mengirim jawaban.",
        imageUrl: null,
        explanation: null,
      });
    } finally {
      setLoadingAnswer(false);
    }
  }

  const multipartItems = currentQuestion?.items ?? [];
  const multipartReady =
    multipartItems.length > 0 &&
    multipartItems.every(
      (item) => (multipartAnswers[item.id] ?? "").trim().length > 0,
    );
  const questionOrderNumbers = orderedQuestions.map((q) => q.question_number);
  const currentIndex = Math.max(0, questionOrderNumbers.indexOf(currentNumber));
  const displayTotal = isTryout ? orderedQuestions.length : totalQuestions;
  const displayNumber = isTryout
    ? currentIndex + 1
    : currentQuestion.question_number;

  const totalLevels = Math.max(1, Math.ceil(displayTotal / LEVEL_SIZE));
  const currentLevel = Math.min(
    totalLevels,
    Math.max(1, Math.ceil((displayNumber || 1) / LEVEL_SIZE)),
  );
  const levelStart = (currentLevel - 1) * LEVEL_SIZE + 1;
  const levelEnd = Math.min(currentLevel * LEVEL_SIZE, displayTotal);
  const levelProgress =
    levelEnd - levelStart + 1 > 0
      ? Math.min(
          100,
          Math.round(
            ((displayNumber - levelStart + 1) / (levelEnd - levelStart + 1)) *
              100,
          ),
        )
      : 0;
  const answeredCount = Object.keys(questionResults).length;
  const correctCount = Object.values(questionResults).filter(
    (value) => value === "correct",
  ).length;
  const isLockedPremium =
    !allowAllAccess &&
    !isTryout &&
    currentQuestion.question_number > questionLimit;
  const progressPercent = Math.min(
    100,
    Math.round((displayNumber / Math.max(displayTotal, 1)) * 100),
  );
  const scorePercent = Math.min(
    100,
    Math.round((correctCount / Math.max(answeredCount, 1)) * 100),
  );

  // UI saat mengerjakan soal
  return (
    <div className="mt-6 rounded-[36px] border border-sky-200 bg-sky-100 p-4 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] md:p-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-emerald-500 px-4 py-3 text-white shadow-lg shadow-emerald-500/30">
          <div className="text-sm font-semibold tracking-wide">
            Latihan Matematika
          </div>
          <div className="text-xs font-semibold">
            Level {currentLevel}/{totalLevels}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[1fr_220px]">
          <div>
            {levelReview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 text-slate-700 shadow-2xl">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-700/80">
                    Review Level {levelReview.level}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    Mantap, kamu sudah menyelesaikan level ini!
                  </h2>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                      <p className="text-slate-500">Benar</p>
                      <p className="text-lg font-bold text-emerald-700">
                        {levelReview.correct}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                      <p className="text-slate-500">Salah</p>
                      <p className="text-lg font-bold text-rose-300">
                        {levelReview.wrong}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                      <p className="text-slate-500">Dijawab</p>
                      <p className="text-lg font-bold text-cyan-200">
                        {levelReview.answered}/{levelReview.total}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        const nextNumber = levelReview.level * LEVEL_SIZE + 1;
                        const target =
                          nextNumber > totalQuestions
                            ? totalQuestions + 1
                            : nextNumber;
                        setCurrentNumber(target);
                        setMaxUnlockedNumber((prev) => Math.max(prev, target));
                        setFeedback({
                          isCorrect: null,
                          message: null,
                          explanation: null,
                        });
                        setLevelReview(null);
                      }}
                      className="rounded-xl border border-cyan-400/70 bg-cyan-500/30 px-4 py-2 font-semibold text-cyan-900"
                    >
                      {levelReview.level >= totalLevels
                        ? "Lihat ringkasan"
                        : "Lanjut level berikutnya"}
                    </button>
                    {!isPremium && levelReview.level >= totalLevels && (
                      <>
                        <Link
                          href="/materials"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700"
                        >
                          Lihat materi lain
                        </Link>
                        <Link
                          href="/dashboard/student/upgrade"
                          className="rounded-xl border border-emerald-500 bg-emerald-600 px-4 py-2 font-semibold text-white shadow-md shadow-emerald-300/60"
                        >
                          Upgrade premium
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isTryout && secondsLeft !== null && (
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <span>Mode Tryout - Timer berjalan</span>
                <span className="font-semibold">
                  {Math.floor(secondsLeft / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(secondsLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}

            <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 shadow-md md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500/45 via-purple-500/35 to-emerald-400/35 text-lg font-bold text-white shadow-lg shadow-cyan-500/30">
                  {displayNumber}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-500">
                  Soal untukmu
                </div>
                <div className="text-base font-semibold text-slate-900 md:text-lg">
                  {displayNumber}/{displayTotal}{" "}
                  {normalizedQuestion.type === "essay"
                    ? "Jawab bebas"
                    : normalizedQuestion.type === "drag_drop"
                      ? "Seret & jatuhkan"
                      : "Pilih jawaban"}
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div className="h-3 w-36 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (displayNumber / Math.max(displayTotal, 1)) * 100,
                      ),
                    )}%`,
                  }}
                />
              </div>

              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px]">
                {isTryout ? (
                  <span className="text-emerald-700">Tryout</span>
                ) : allowAllAccess ? (
                  <span className="text-emerald-700">Admin</span>
                ) : displayNumber <= questionLimit ? (
                  <span className="text-emerald-700">{planLabel}</span>
                ) : (
                  <span className="text-yellow-300">Terkunci</span>
                )}
              </div>
            </div>

            <div className="relative mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600 shadow-lg shadow-slate-200/70">
              <div className="pointer-events-none absolute -left-6 top-0 h-16 w-16 rounded-full bg-cyan-500/20 blur-2xl" />
              <div className="pointer-events-none absolute -right-6 bottom-0 h-16 w-16 rounded-full bg-emerald-500/20 blur-2xl" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-500">
                  Level {currentLevel}/{totalLevels}
                </span>
                <span className="text-slate-600">
                  Soal {levelStart}-{levelEnd}
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-linear-to-r from-emerald-400 via-cyan-400 to-indigo-400"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            <nav className="mb-4 flex flex-wrap justify-center gap-2 sm:gap-2.5">
              {(isTryout
                ? orderedQuestions.slice(levelStart - 1, levelEnd)
                : orderedQuestions.filter(
                    (qq) =>
                      qq.question_number >= levelStart &&
                      qq.question_number <= levelEnd,
                  )
              ).map((qq, idx) => {
                const displayIndex = isTryout
                  ? levelStart + idx
                  : qq.question_number;
                const isCurrent = qq.id === currentQuestion.id;
                const unlocked = allowAllAccess
                  ? true
                  : isTryout
                    ? displayIndex <= maxUnlockedNumber
                    : qq.question_number <= maxUnlockedNumber;
                const status = questionResults[qq.question_number];
                const answered = !!status;

                let cls =
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border transition-colors";

                if (isCurrent) {
                  cls +=
                    " bg-pink-500 border-pink-300 text-white shadow-[0_0_14px_rgba(236,72,153,0.9)]";
                } else if (status === "correct") {
                  cls +=
                    " bg-emerald-500/40 border-emerald-300 text-emerald-50 shadow-[0_0_14px_rgba(16,185,129,0.85)]";
                } else if (status === "wrong") {
                  cls +=
                    " bg-rose-500/35 border-rose-300 text-rose-50 shadow-[0_0_14px_rgba(244,63,94,0.85)]";
                } else if (unlocked && !answered) {
                  cls +=
                    " bg-slate-100 border-slate-200 text-slate-700 hover:border-cyan-400 hover:text-cyan-700";
                } else {
                  cls += " bg-white border-slate-200 text-slate-600";
                }

                return (
                  <button
                    key={qq.id}
                    type="button"
                    disabled={!unlocked || (!allowAllAccess && answered)}
                    onClick={() => {
                      if (!unlocked || (!allowAllAccess && answered)) return;
                      setCurrentNumber(qq.question_number);
                    }}
                    className={cls}
                  >
                    {displayIndex}
                  </button>
                );
              })}
            </nav>

            <div>
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl shadow-slate-200/70">
                <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-tr from-cyan-500/25 via-purple-500/25 to-pink-500/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-16 h-32 w-32 rounded-full bg-linear-to-br from-emerald-500/25 via-cyan-500/25 to-indigo-500/25 blur-3xl" />

                <DoodleOverlay
                  ref={doodleRef}
                  resetKey={currentQuestion?.id ?? null}
                  active={doodleActive}
                  onStateChange={setDoodleState}
                />

                <div className="relative space-y-3">
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-slate-900 md:text-2xl leading-snug">
                        {normalizedQuestion.prompt}
                      </p>
                      {normalizedQuestion.helperText && (
                        <p className="text-xs text-slate-600 md:text-sm">
                          {normalizedQuestion.helperText}
                        </p>
                      )}
                    </div>

                    {normalizedQuestion.imageUrl && (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner shadow-slate-200/70">
                        <img
                          src={normalizedQuestion.imageUrl}
                          alt="Ilustrasi soal"
                          className="h-full w-full rounded-xl object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {isLockedPremium ? (
                    <div className="relative z-10 overflow-hidden rounded-2xl border border-rose-200 bg-white p-6 text-slate-700 shadow-[0_20px_70px_-45px_rgba(244,63,94,0.45)]">
                      <div className="pointer-events-none absolute -right-24 -top-20 h-48 w-48 rounded-full bg-rose-200/70 blur-3xl" />
                      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-amber-200/60 blur-3xl" />

                      <div className="relative grid gap-5 md:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase text-rose-600">
                            Promo terbatas
                          </div>
                          <h3 className="text-xl font-extrabold text-slate-900">
                            Diskon Paket Premium! Upgrade sekarang supaya semua
                            soal terbuka.
                          </h3>
                          <p className="text-[13px] text-slate-600">
                            Kamu sudah menyelesaikan soal gratis. Buka akses
                            penuh, pembahasan lengkap, dan sesi Zoom tambahan
                            untuk hasil terbaik.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-center">
                              <div className="text-[11px] uppercase text-rose-500">
                                Harga normal
                              </div>
                              <div className="mx-auto mt-1 w-fit text-4xl font-extrabold text-slate-400 line-through">
                                Rp {premiumPrice}
                              </div>
                              <div className="mt-2 text-[11px] uppercase text-rose-500">
                                Harga promo
                              </div>
                              <div className="mt-1 text-5xl font-extrabold text-rose-600">
                                Rp {promoPrice}
                              </div>
                              <div className="mt-3 rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold text-rose-700">
                                Diskon 7 hari saja
                              </div>
                              <div className="mt-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[10px] text-rose-700">
                                Berakhir dalam:{" "}
                                <span
                                  className="font-semibold"
                                  suppressHydrationWarning
                                >
                                  {promoCountdown ?? "Menghitung..."}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2 text-[11px] text-slate-600">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                                  Semua soal terbuka
                                </span>
                                <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">
                                  Analisis & progres
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Transfer ke rekening</span>
                            <img
                              src="/images/bca.png"
                              alt="BCA"
                              className="h-4 w-auto"
                            />
                          </div>
                          <div className="text-lg font-semibold text-slate-900">
                            {bankAccount}
                          </div>
                          <div className="text-[12px] text-slate-600">
                            a.n {bankHolder}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  bankAccount,
                                );
                                setCopiedBank(true);
                                setTimeout(() => setCopiedBank(false), 2000);
                              } catch {
                                // ignore clipboard failure
                              }
                            }}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            {copiedBank
                              ? "Rekening tersalin"
                              : "Salin nomor rekening"}
                          </button>
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                            QRIS menyusul. Setelah transfer, kirim bukti ke
                            admin.
                          </div>
                          <Link
                            href="/dashboard/student/upgrade"
                            className="inline-flex items-center justify-center rounded-xl border border-emerald-500 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                          >
                            Konfirmasi & lanjutkan
                          </Link>
                          <Link
                            href="/dashboard/student/upgrade"
                            className="inline-flex mr-3 items-center justify-center rounded-xl border border-purple-200 bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:-translate-y-0.5 hover:bg-purple-700"
                          >
                            Lihat paket lain
                          </Link>
                          <Link
                            href="/materials"
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200  px-4 py-2 text-xs font-semibold bg-amber-400 text-slate-700 hover:bg-slate-50"
                          >
                            Lihat materi lain
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {normalizedQuestion.type === "mcq" && (
                        <div className="space-y-3">
                          <div className="grid gap-2 md:grid-cols-2">
                            {normalizedQuestion.options.map((opt) => (
                              <button
                                key={opt.value}
                                disabled={loadingAnswer}
                                onClick={() => handleAnswer(opt.value)}
                                className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-base text-slate-900 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-slate-100 hover:shadow-md hover:shadow-cyan-500/30 disabled:opacity-60"
                              >
                                {opt.imageUrl && (
                                  <div className="mb-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                    <img
                                      src={opt.imageUrl}
                                      alt={opt.label}
                                      className="h-32 w-full object-contain"
                                    />
                                  </div>
                                )}
                                <span className="font-semibold text-slate-900">
                                  {opt.label}
                                </span>
                                <div className="pointer-events-none absolute -bottom-6 -right-8 h-16 w-16 rounded-full bg-linear-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
                              </button>
                            ))}
                          </div>
                          <div className="relative z-30 flex flex-wrap items-center justify-end gap-2 text-[11px] text-slate-600">
                            <button
                              type="button"
                              onClick={toggleDoodle}
                              aria-pressed={doodleActive}
                              title="Coret-coret"
                              className={`rounded-xl border px-2 py-2 text-sm transition ${
                                doodleActive
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={handleDoodleUndo}
                              disabled={!doodleState.canUndo}
                              title="Undo"
                              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                            >
                              ↶
                            </button>
                            <button
                              type="button"
                              onClick={handleDoodleRedo}
                              disabled={!doodleState.canRedo}
                              title="Redo"
                              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                            >
                              ↷
                            </button>
                            <button
                              type="button"
                              onClick={handleDoodleClear}
                              disabled={!doodleState.hasStrokes}
                              title="Hapus"
                              className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                            >
                              🧹
                            </button>
                          </div>
                        </div>
                      )}

                      {normalizedQuestion.type === "essay" && (
                        <div className="space-y-2">
                          <textarea
                            value={essayAnswer}
                            onChange={(e) => setEssayAnswer(e.target.value)}
                            placeholder="Tulis jawabanmu di sini..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-900 shadow-inner shadow-slate-200/70 focus:border-cyan-400 focus:outline-none"
                            rows={6}
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                            <span>
                              Ekspresikan jawaban dengan bahasamu sendiri. Kamu
                              boleh menulis langkah-langkahnya.
                            </span>
                            <div className="relative z-30 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={toggleDoodle}
                                aria-pressed={doodleActive}
                                title="Coret-coret"
                                className={`rounded-xl border px-2 py-2 text-sm transition ${
                                  doodleActive
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={handleDoodleUndo}
                                disabled={!doodleState.canUndo}
                                title="Undo"
                                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                              >
                                ↶
                              </button>
                              <button
                                type="button"
                                onClick={handleDoodleRedo}
                                disabled={!doodleState.canRedo}
                                title="Redo"
                                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                              >
                                ↷
                              </button>
                              <button
                                type="button"
                                onClick={handleDoodleClear}
                                disabled={!doodleState.hasStrokes}
                                title="Hapus"
                                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                              >
                                🧹
                              </button>
                              <button
                                type="button"
                                disabled={loadingAnswer || !essayAnswer.trim()}
                                onClick={() => handleAnswer(essayAnswer.trim())}
                                className="rounded-xl border border-emerald-500 bg-emerald-600 px-3 py-2 font-semibold text-white shadow-md shadow-emerald-500/40 transition hover:-translate-y-px hover:bg-emerald-700 disabled:opacity-60"
                              >
                                Kirim jawaban
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {normalizedQuestion.type === "multipart" && (
                        <div className="space-y-3">
                          <div className="text-[11px] font-semibold text-slate-600">
                            Jawab tiap bagian berikut:
                          </div>
                          <div className="space-y-3">
                            {multipartItems.map((item, idx) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner shadow-slate-200/70"
                              >
                                <p className="text-sm font-semibold text-slate-900">
                                  {item.label || String.fromCharCode(97 + idx)}.{" "}
                                  {item.prompt}
                                </p>
                                {item.image_url && (
                                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                    <img
                                      src={item.image_url}
                                      alt={`Ilustrasi ${item.label}`}
                                      className="h-32 w-full object-contain"
                                    />
                                  </div>
                                )}
                                <input
                                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                                  placeholder="Jawaban bagian ini..."
                                  value={multipartAnswers[item.id] ?? ""}
                                  onChange={(e) =>
                                    setMultipartAnswers((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                            <span>
                              Pastikan semua bagian terisi sebelum mengirim.
                            </span>
                            <div className="relative z-30 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={toggleDoodle}
                                aria-pressed={doodleActive}
                                title="Coret-coret"
                                className={`rounded-xl border px-2 py-2 text-sm transition ${
                                  doodleActive
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={handleDoodleUndo}
                                disabled={!doodleState.canUndo}
                                title="Undo"
                                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                              >
                                ↶
                              </button>
                              <button
                                type="button"
                                onClick={handleDoodleRedo}
                                disabled={!doodleState.canRedo}
                                title="Redo"
                                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                              >
                                ↷
                              </button>
                              <button
                                type="button"
                                onClick={handleDoodleClear}
                                disabled={!doodleState.hasStrokes}
                                title="Hapus"
                                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                              >
                                🧹
                              </button>
                              <button
                                type="button"
                                disabled={loadingAnswer || !multipartReady}
                                onClick={() =>
                                  handleAnswer(JSON.stringify(multipartAnswers))
                                }
                                className="rounded-xl border border-emerald-500 bg-emerald-600 px-3 py-2 font-semibold text-white shadow-md shadow-emerald-500/40 transition hover:-translate-y-px hover:bg-emerald-700 disabled:opacity-60"
                              >
                                Kirim jawaban
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {normalizedQuestion.type === "drag_drop" && (
                        <>
                          {tapMode ? (
                            <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                              <div className="space-y-2">
                                <div className="text-[11px] font-semibold text-slate-600">
                                  Tap pilihan, lalu tap kotak jawaban
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {normalizedQuestion.options.map((opt) => {
                                    const used = Object.values(
                                      placements,
                                    ).includes(opt.value);
                                    const isSelected =
                                      tapSelection === opt.value;
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() =>
                                          handleTapOption(opt.value)
                                        }
                                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                          isSelected
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-700"
                                        } ${used ? "opacity-70" : ""}`}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                {tapSelection && (
                                  <div className="text-[11px] text-slate-500">
                                    Dipilih:{" "}
                                    {
                                      normalizedQuestion.options.find(
                                        (opt) => opt.value === tapSelection,
                                      )?.label
                                    }
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner shadow-slate-200/70">
                                <div className="text-[11px] font-semibold text-slate-600">
                                  Kotak jawaban
                                </div>

                                <div className="space-y-2">
                                  {(normalizedQuestion.dropTargets || []).map(
                                    (target) => (
                                      <DropZone
                                        key={target.key}
                                        id={target.key}
                                        label={target.label}
                                        onClick={() =>
                                          handleTapTarget(target.key)
                                        }
                                      >
                                        {placements[target.key] ? (
                                          <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                                            {normalizedQuestion.options.find(
                                              (opt) =>
                                                opt.value ===
                                                placements[target.key],
                                            )?.label ?? placements[target.key]}
                                          </div>
                                        ) : (
                                          <div className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-500">
                                            {target.placeholder ??
                                              "Tap untuk mengisi"}
                                          </div>
                                        )}
                                      </DropZone>
                                    ),
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                                  <span>
                                    {Object.values(placements).length}/
                                    {normalizedQuestion.dropTargets?.length ??
                                      0}{" "}
                                    kotak terisi.
                                  </span>
                                  <div className="relative z-30 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={toggleDoodle}
                                      aria-pressed={doodleActive}
                                      title="Coret-coret"
                                      className={`rounded-xl border px-2 py-2 text-sm transition ${
                                        doodleActive
                                          ? "border-slate-900 bg-slate-900 text-white"
                                          : "border-slate-200 bg-white text-slate-600"
                                      }`}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDoodleUndo}
                                      disabled={!doodleState.canUndo}
                                      title="Undo"
                                      className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                                    >
                                      ↶
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDoodleRedo}
                                      disabled={!doodleState.canRedo}
                                      title="Redo"
                                      className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                                    >
                                      ↷
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDoodleClear}
                                      disabled={!doodleState.hasStrokes}
                                      title="Hapus"
                                      className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                                    >
                                      🧹
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        loadingAnswer ||
                                        !normalizedQuestion.dropTargets?.every(
                                          (target) => placements[target.key],
                                        )
                                      }
                                      onClick={() =>
                                        handleAnswer(
                                          JSON.stringify(
                                            normalizedQuestion.dropTargets?.reduce(
                                              (acc, target) => ({
                                                ...acc,
                                                [target.key]:
                                                  placements[target.key] ?? "",
                                              }),
                                              {},
                                            ) || {},
                                          ),
                                        )
                                      }
                                      className="rounded-xl border border-cyan-600 bg-cyan-600 px-3 py-2 font-semibold text-white shadow-md shadow-cyan-200/70 transition hover:-translate-y-px hover:bg-cyan-700 disabled:opacity-60"
                                    >
                                      Kirim jawaban
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                          <DndProvider backend={MultiBackend} options={DND_OPTIONS}>
                              <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                                <div className="space-y-2">
                                  <div className="text-[11px] font-semibold text-slate-600">
                                    Pilih kartu jawaban
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {normalizedQuestion.options.map((opt) => {
                                      const used = Object.values(
                                        placements,
                                      ).includes(opt.value);
                                      return (
                                        <DraggableOption
                                          key={opt.value}
                                          id={opt.value}
                                          label={opt.label}
                                          isUsed={used}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner shadow-slate-200/70">
                                  <div className="text-[11px] font-semibold text-slate-600">
                                    Kotak jawaban
                                  </div>

                                  <div className="space-y-2">
                                    {(normalizedQuestion.dropTargets || []).map(
                                      (target) => (
                                        <DropZone
                                          key={target.key}
                                          id={target.key}
                                          label={target.label}
                                          onDropValue={(value, targetKey) => {
                                            setPlacements((prev) => {
                                              const next = { ...prev };
                                              Object.keys(next).forEach(
                                                (key) => {
                                                  if (next[key] === value)
                                                    delete next[key];
                                                },
                                              );
                                              next[targetKey] = value;
                                              return next;
                                            });
                                          }}
                                        >
                                          {placements[target.key] ? (
                                            <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                                              {normalizedQuestion.options.find(
                                                (opt) =>
                                                  opt.value ===
                                                  placements[target.key],
                                              )?.label ??
                                                placements[target.key]}
                                            </div>
                                          ) : (
                                            <div className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-500">
                                              {target.placeholder ??
                                                "Seret jawaban ke sini"}
                                            </div>
                                          )}
                                        </DropZone>
                                      ),
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                                    <span>
                                      {Object.values(placements).length}/
                                      {normalizedQuestion.dropTargets?.length ??
                                        0}{" "}
                                      kotak terisi.
                                    </span>
                                    <div className="relative z-30 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={toggleDoodle}
                                        aria-pressed={doodleActive}
                                        title="Coret-coret"
                                        className={`rounded-xl border px-2 py-2 text-sm transition ${
                                          doodleActive
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-white text-slate-600"
                                        }`}
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleDoodleUndo}
                                        disabled={!doodleState.canUndo}
                                        title="Undo"
                                        className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                                      >
                                        ↶
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleDoodleRedo}
                                        disabled={!doodleState.canRedo}
                                        title="Redo"
                                        className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                                      >
                                        ↷
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleDoodleClear}
                                        disabled={!doodleState.hasStrokes}
                                        title="Hapus"
                                        className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-600 disabled:opacity-50"
                                      >
                                        🧹
                                      </button>
                                      <button
                                        type="button"
                                        disabled={
                                          loadingAnswer ||
                                          !normalizedQuestion.dropTargets?.every(
                                            (target) => placements[target.key],
                                          )
                                        }
                                        onClick={() =>
                                          handleAnswer(
                                            JSON.stringify(
                                              normalizedQuestion.dropTargets?.reduce(
                                                (acc, target) => ({
                                                  ...acc,
                                                  [target.key]:
                                                    placements[target.key] ??
                                                    "",
                                                }),
                                                {},
                                              ) || {},
                                            ),
                                          )
                                        }
                                        className="rounded-xl border border-cyan-600 bg-cyan-600 px-3 py-2 font-semibold text-white shadow-md shadow-cyan-200/70 transition hover:-translate-y-px hover:bg-cyan-700 disabled:opacity-60"
                                      >
                                        Kirim jawaban
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DndProvider>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {feedback.isCorrect !== null && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
                      <div
                        className={`relative w-full max-w-md overflow-hidden rounded-3xl border px-6 py-7 text-center shadow-2xl ${
                          feedback.isCorrect
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-rose-200 bg-rose-50 text-rose-900"
                        }`}
                      >
                        {feedback.isCorrect && (
                          <>
                            <span className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-300/40 blur-2xl" />
                            <span className="absolute -left-6 top-6 h-12 w-12 rounded-full bg-cyan-300/50 blur-xl animate-pulse" />
                            <span className="absolute right-10 bottom-6 h-10 w-10 rounded-full bg-rose-300/50 blur-xl animate-pulse" />
                            <span className="absolute left-12 bottom-8 h-8 w-8 rounded-full bg-lime-300/50 blur-lg animate-pulse" />
                            <span className="absolute right-20 top-14 h-6 w-6 rounded-full bg-sky-300/50 blur-lg animate-pulse" />
                          </>
                        )}
                        {!feedback.isCorrect && (
                          <>
                            <span className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-rose-300/40 blur-xl" />
                            <span className="absolute -left-4 top-8 h-10 w-10 rounded-full bg-amber-300/40 blur-lg animate-pulse" />
                          </>
                        )}

                        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-amber-100 via-rose-100 to-sky-100 shadow-lg shadow-amber-200/60">
                          {feedback.isCorrect ? (
                            <span className="text-9xlxl">🎆</span>
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-8 w-8 text-rose-500"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M6 6l12 12M6 18L18 6" />
                            </svg>
                          )}
                        </div>

                        <p className="text-lg font-bold">
                          {feedback.isCorrect ? "Benar!" : "Belum tepat"}
                        </p>
                        {feedback.message && (
                          <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            {feedback.message}
                          </p>
                        )}
                        {!feedback.isCorrect && (
                          <div className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-xs text-slate-700 shadow-inner">
                            <span className="font-semibold">Penjelasan:</span>{" "}
                            {feedback.explanation ||
                              "Pembahasan belum tersedia."}
                          </div>
                        )}
                        {!feedback.isCorrect && feedback.imageUrl && (
                          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
                            <img
                              src={feedback.imageUrl}
                              alt="Jawaban benar"
                              className="h-36 w-full object-contain"
                            />
                          </div>
                        )}
                        {!feedback.isCorrect && (
                          <button
                            type="button"
                            className="mt-4 w-full rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-px hover:bg-slate-800"
                            onClick={() => {
                              proceedRef.current?.();
                              proceedRef.current = null;
                            }}
                          >
                            Lanjut ke soal berikutnya
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {feedback.message && (
                    <div
                      className={`relative z-10 mt-4 rounded-xl px-3 py-2 text-xs ${
                        feedback.isCorrect === null
                          ? "border border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                          : feedback.isCorrect
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-rose-500/40 bg-rose-500/15 text-rose-100"
                      }`}
                    >
                      <div>{feedback.message}</div>
                      {feedback.imageUrl && !feedback.isCorrect && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <img
                            src={feedback.imageUrl}
                            alt="Jawaban benar"
                            className="h-32 w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {lockedMessage && (
                    <div className="relative z-10 mt-3 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                      {lockedMessage}
                    </div>
                  )}
                </div>
              </div>
              <aside className="hidden flex-col gap-4 md:flex">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center text-slate-700 shadow-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700/80">
                    Questions answered
                  </p>
                  <div
                    className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#34d399 ${
                        progressPercent * 3.6
                      }deg, #e2e8f0 0deg)`,
                    }}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-900">
                      {displayNumber}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    dari {displayTotal}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center text-slate-700 shadow-md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600/90">
                    Smart score
                  </p>
                  <div
                    className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#38bdf8 ${
                        scorePercent * 3.6
                      }deg, #e2e8f0 0deg)`,
                    }}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-900">
                      {scorePercent}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {correctCount} benar
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
