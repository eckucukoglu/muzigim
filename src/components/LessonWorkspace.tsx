"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Lesson,
  midiToTurkishName,
  velocityToDynamic,
} from "@/data/curriculum";
import { usePiano } from "@/context/PianoContext";
import { soundEngine } from "@/lib/audio";
import StaffVisualizer from "@/components/StaffVisualizer";
import {
  BookOpen,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Timer,
  Award,
  Hand,
} from "lucide-react";

interface LessonWorkspaceProps {
  lesson: Lesson;
  completedLessons: string[];
  onMarkCompleted: (lessonId: string) => void;
  onNextLesson: () => void;
  onAskTeacher: (question: string) => void;
  onTargetMidiChange: (targetMidi: number | null) => void;
  onExerciseStatsChange: (stats: string) => void;
}

export default function LessonWorkspace({
  lesson,
  completedLessons,
  onMarkCompleted,
  onNextLesson,
  onAskTeacher,
  onTargetMidiChange,
  onExerciseStatsChange,
}: LessonWorkspaceProps) {
  const { subscribeNoteOn } = usePiano();

  const [stepIndex, setStepIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongMidi, setWrongMidi] = useState<number | null>(null);
  const [liveFeedback, setLiveFeedback] = useState<{
    type: "idle" | "success" | "error" | "complete";
    message: string;
    detail?: string;
  }>({
    type: "idle",
    message: "Roland FP-10 piyanonuzda sıradaki hedef notaya basarak egzersize başlayın!",
  });

  // Metronome state
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [bpm, setBpm] = useState(lesson.exercise.bpm || 76);
  const [beatCount, setBeatCount] = useState(0);
  const lastStepTimestampRef = useRef<number>(0);
  const stepVelocitiesRef = useRef<number[]>([]);

  const targetNotes = lesson.exercise.targetNotes;
  const currentTarget = targetNotes[stepIndex] || null;
  const isCompleted = stepIndex >= targetNotes.length;

  // Reset exercise state when lesson changes
  useEffect(() => {
    setStepIndex(0);
    setMistakes(0);
    setWrongMidi(null);
    setBpm(lesson.exercise.bpm || 76);
    stepVelocitiesRef.current = [];
    lastStepTimestampRef.current = 0;
    setLiveFeedback({
      type: "idle",
      message: `Başlamak için klavyede işaretlenen ilk notaya (${lesson.exercise.targetNotes[0]?.turkishName}) basın!`,
    });
  }, [lesson]);

  // Notify parent about current target MIDI so the bottom PianoKeyboardDock highlights it
  useEffect(() => {
    onTargetMidiChange(currentTarget ? currentTarget.midi : null);
  }, [currentTarget, onTargetMidiChange]);

  // Update stats summary for AI Teacher
  useEffect(() => {
    const avgVel =
      stepVelocitiesRef.current.length > 0
        ? Math.round(
            stepVelocitiesRef.current.reduce((a, b) => a + b, 0) /
              stepVelocitiesRef.current.length
          )
        : 0;
    const summary = `Adım: ${stepIndex}/${targetNotes.length}, Hatalı Tuş: ${mistakes}, Ortalama Velocity: ${avgVel}`;
    onExerciseStatsChange(summary);
  }, [stepIndex, mistakes, targetNotes.length, onExerciseStatsChange]);

  // Metronome interval
  useEffect(() => {
    if (!metronomeOn) {
      setBeatCount(0);
      return;
    }
    const intervalMs = Math.round((60 / bpm) * 1000);
    let currentBeat = 0;
    const id = setInterval(() => {
      const isAccent = currentBeat % 4 === 0;
      soundEngine.playMetronomeClick(isAccent);
      setBeatCount((currentBeat % 4) + 1);
      currentBeat++;
    }, intervalMs);
    return () => clearInterval(id);
  }, [metronomeOn, bpm]);

  // Real-time MIDI note listener for exercise evaluation
  useEffect(() => {
    const unsub = subscribeNoteOn((evt) => {
      setStepIndex((prevStep) => {
        if (prevStep >= targetNotes.length) return prevStep;
        const expected = targetNotes[prevStep];

        if (evt.midi === expected.midi) {
          setWrongMidi(null);
          stepVelocitiesRef.current.push(evt.velocity);

          // Timing evaluation relative to BPM
          const now = performance.now();
          const expectedMsPerBeat = (60 / bpm) * 1000;
          let timingComment = "Ritim dengeli";
          if (lastStepTimestampRef.current > 0) {
            const delta = now - lastStepTimestampRef.current;
            if (delta < expectedMsPerBeat * 0.55) {
              timingComment = "Biraz acele ettin (Erken vuruş)";
            } else if (delta > expectedMsPerBeat * 1.85) {
              timingComment = "Biraz bekledin (Geç vuruş)";
            } else {
              timingComment = "Tam zamanında! (Harika ritim)";
            }
          }
          lastStepTimestampRef.current = now;

          // Velocity / Touch evaluation
          const dyn = velocityToDynamic(evt.velocity);
          let velocityComment = `Tuşe: ${dyn.symbol} (${evt.velocity})`;
          if (expected.targetVelocity === "p" && evt.velocity > 75) {
            velocityComment += " — Bu notayı biraz daha yumuşak (piano) çalmayı dene";
          } else if (expected.targetVelocity === "f" && evt.velocity < 70) {
            velocityComment += " — Bu zirve notasını biraz daha güçlü (forte) vurgula";
          }

          const nextStep = prevStep + 1;
          if (nextStep >= targetNotes.length) {
            onMarkCompleted(lesson.id);
            setLiveFeedback({
              type: "complete",
              message: `🎉 Tebrikler! "${lesson.exercise.title}" egzersizini başarıyla tamamladın!`,
              detail: `${velocityComment} • ${timingComment}. Şimdi "Performansımı AI Öğretmenime Yorumlat" butonuna basarak detaylı analiz alabilirsin.`,
            });
          } else {
            const nextNote = targetNotes[nextStep];
            setLiveFeedback({
              type: "success",
              message: `✅ Doğru: ${expected.turkishName} (${expected.note})! Sıradaki Nota: ${nextNote.turkishName} (${nextNote.note})${
                nextNote.finger ? ` [${nextNote.finger}. Parmak]` : ""
              }`,
              detail: `${velocityComment} • ${timingComment}`,
            });
          }
          return nextStep;
        } else {
          // Wrong note pressed! Give helpful directional guidance
          setMistakes((m) => m + 1);
          setWrongMidi(evt.midi);
          const semitoneDiff = expected.midi - evt.midi;
          const direction =
            semitoneDiff > 0
              ? `${Math.abs(semitoneDiff)} yarım ses daha SAĞDA (İnce)`
              : `${Math.abs(semitoneDiff)} yarım ses daha SOLDA (Kalın)`;
          setLiveFeedback({
            type: "error",
            message: `❌ Bastığın tuş: ${evt.turkishName} (${evt.note}). Beklenen hedef nota: ${expected.turkishName} (${expected.note})`,
            detail: `İpucu: Hedef nota bastığın tuştan ${direction} yer alıyor.`,
          });
          return prevStep;
        }
      });
    });

    return unsub;
  }, [
    subscribeNoteOn,
    targetNotes,
    bpm,
    lesson.id,
    lesson.exercise.title,
    onMarkCompleted,
  ]);

  const handleListenDemo = useCallback(() => {
    const msPerBeat = Math.round((60 / bpm) * 1000);
    let accumulatedDelay = 0;

    const seq = targetNotes.map((t) => {
      const mult =
        t.duration === "w" ? 3.5 : t.duration === "h" ? 2 : t.duration === "8" ? 0.5 : 1;
      const durMs = Math.round(msPerBeat * mult * 0.9);
      const item = {
        midi: t.midi,
        durationMs: durMs,
        delayMs: accumulatedDelay,
        velocity: t.targetVelocity === "f" ? 100 : t.targetVelocity === "p" ? 52 : 82,
      };
      accumulatedDelay += Math.round(msPerBeat * mult);
      return item;
    });

    soundEngine.playSequence(seq);
  }, [targetNotes, bpm]);

  const resetExercise = () => {
    setStepIndex(0);
    setMistakes(0);
    setWrongMidi(null);
    stepVelocitiesRef.current = [];
    lastStepTimestampRef.current = 0;
    setLiveFeedback({
      type: "idle",
      message: `Egzersiz sıfırlandı. İlk nota: ${targetNotes[0]?.turkishName} (${targetNotes[0]?.note})`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Lesson Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-amber-950/30 border border-slate-800 p-5 sm:p-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              {lesson.level}
            </span>
            <span className="text-xs text-slate-400">
              ⏱️ Tahmini Süre: {lesson.durationMin} dk
            </span>
            {completedLessons.includes(lesson.id) && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tamamlandı
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            {lesson.title}
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
            {lesson.subtitle}
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {lesson.summary}
          </p>
        </div>

        <button
          onClick={() =>
            onAskTeacher(
              `"${lesson.title}" dersindeki temel mantığı bana bir konservatuvar hocası gibi özetler misin ve Roland FP-10 piyanomda bunu çalışırken nelere dikkat etmeliyim?`
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Bu Dersi Öğretmenden Dinle</span>
        </button>
      </div>

      {/* Theory Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Müzik Teorisi & Kavrayış Rehberi</span>
          </h2>
          <span className="text-xs text-slate-400">
            Anlamadığınız her başlığı tek tıkla sağdaki Maestro AI&apos;a sorabilirsiniz
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {lesson.theorySections.map((sec, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-slate-900/85 border border-slate-800/90 p-5 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-amber-300">
                  {sec.heading}
                </h3>
                <button
                  onClick={() =>
                    onAskTeacher(
                      `"${lesson.title}" dersindeki "${sec.heading}" konusunu tam anlayamadım veya daha derin öğrenmek istiyorum. Günlük hayattan bir benzetmeyle ve piyanoda hemen deneyebileceğim küçük bir örnekle açıklar mısın?`
                    )
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Anlamadım / Öğretmene Sor</span>
                </button>
              </div>

              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {sec.content}
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
                <strong className="text-amber-400">💡 Özü Yakala:</strong>{" "}
                {sec.keyTakeaway}
              </div>

              {sec.tryOnPianoTip && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-200">
                  <strong className="text-indigo-400">🎹 Şimdi Roland FP-10&apos;da Dene:</strong>{" "}
                  {sec.tryOnPianoTip}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Practice & Live MIDI Evaluation Box */}
      <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 p-5 sm:p-6 space-y-5 shadow-xl">
        {/* Top Exercise Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span>🎹 İnteraktif Roland FP-10 Uygulama Egzersizi</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Adım: {stepIndex} / {targetNotes.length}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {lesson.exercise.title}
            </h2>
            <p className="text-xs text-slate-300">{lesson.exercise.description}</p>
          </div>

          {/* Controls: Listen Demo, Metronome, Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleListenDemo}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Örnek Çalımı Dinle</span>
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700">
              <button
                onClick={() => setMetronomeOn(!metronomeOn)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold transition ${
                  metronomeOn
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Metronom {metronomeOn ? `(${beatCount}/4)` : "Kapalı"}</span>
              </button>
              <input
                type="number"
                min={40}
                max={180}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value) || 76)}
                className="w-12 bg-slate-950 text-amber-300 font-bold text-xs px-1.5 py-0.5 rounded border border-slate-700 text-center"
              />
              <span className="text-[10px] text-slate-400">BPM</span>
            </div>

            <button
              onClick={resetExercise}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Baştan Başla</span>
            </button>
          </div>
        </div>

        {/* Step-by-step Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="text-xs font-bold text-slate-300">📋 Egzersiz Yönergeleri:</div>
            <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
              {lesson.exercise.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>

          {/* Current Target Note Spotlight Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between">
            {currentTarget ? (
              <>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase text-amber-400">
                    Şimdi Basacağınız Hedef Nota:
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {currentTarget.turkishName}{" "}
                    <span className="text-lg font-semibold text-slate-400">
                      ({currentTarget.note})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <Hand className="w-3.5 h-3.5 text-amber-400" />
                      {currentTarget.hand === "L" ? "Sol El" : "Sağ El"} •{" "}
                      <strong>{currentTarget.finger || 1}. Parmak</strong>
                    </span>
                    {currentTarget.targetVelocity && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-semibold">
                        Hedef Tuşe: {currentTarget.targetVelocity}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">İlerleme</div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    %{Math.round((stepIndex / targetNotes.length) * 100)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-emerald-400" />
                  <div>
                    <div className="text-base font-bold text-emerald-300">
                      Egzersiz Tamamlandı!
                    </div>
                    <div className="text-xs text-slate-400">
                      Toplam Hatalı Dokunuş: {mistakes}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onNextLesson}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition"
                >
                  Sıradaki Derse Geç ➔
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live VexFlow Sheet Music */}
        <StaffVisualizer
          mode="exercise"
          targetNotes={targetNotes}
          currentStepIndex={stepIndex}
          wrongMidi={wrongMidi}
        />

        {/* Real-Time Feedback Banner & AI Performance Coach Button */}
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 transition ${
            liveFeedback.type === "complete"
              ? "bg-emerald-950/70 border-emerald-500/60 text-emerald-100"
              : liveFeedback.type === "error"
              ? "bg-rose-950/60 border-rose-500/50 text-rose-100"
              : liveFeedback.type === "success"
              ? "bg-slate-900 border-emerald-500/40 text-slate-100"
              : "bg-slate-900 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-start gap-3">
            {liveFeedback.type === "error" ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs sm:text-sm font-bold">{liveFeedback.message}</div>
              {liveFeedback.detail && (
                <div className="text-xs text-slate-300 mt-0.5">{liveFeedback.detail}</div>
              )}
              {wrongMidi && (
                <div className="text-[11px] text-rose-300 mt-1">
                  Bastığınız tuş: {midiToTurkishName(wrongMidi)}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() =>
              onAskTeacher(
                `"${lesson.exercise.title}" egzersizindeki canlı MIDI performansımı analiz eder misin? ${lesson.exercise.aiCoachFocus}`
              )
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-lg transition shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Performansımı AI Öğretmenime Yorumlat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
