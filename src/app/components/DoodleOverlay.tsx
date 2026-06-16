"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type Konva from "konva";
import { Layer, Line, Stage } from "react-konva";

export type DoodleState = {
  canUndo: boolean;
  canRedo: boolean;
  hasStrokes: boolean;
};

export type DoodleHandle = {
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

type DoodleLine = {
  points: number[];
  color: string;
  width: number;
};

type DoodleOverlayProps = {
  resetKey: string | number | null;
  active: boolean;
  strokeColor?: string;
  onStateChange?: (state: DoodleState) => void;
};

const DoodleOverlay = forwardRef<DoodleHandle, DoodleOverlayProps>(
  function DoodleOverlay(
    { resetKey, active, strokeColor = "#111827", onStateChange },
    ref,
  ) {
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

      const observer = new ResizeObserver(updateSize);
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
        { points: [point.x, point.y], color: strokeColor, width: 3.2 },
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
      setLines((prev) => {
        if (prev.length === 0) return prev;
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
        if (restored) setLines((current) => [...current, restored]);
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
      [],
    );

    return (
      <div ref={wrapperRef} className="pointer-events-none absolute inset-0 z-20">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          className={active ? "pointer-events-auto touch-none" : "pointer-events-none"}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <Layer>
            {lines.map((line, index) => (
              <Line
                key={index}
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
  },
);

export default DoodleOverlay;
