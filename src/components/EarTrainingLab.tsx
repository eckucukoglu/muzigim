"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePiano } from "@/context/PianoContext";
import { soundEngine } from "@/lib/audio";
import { midiToNoteName, midiToTurkishName } from "@/data/curriculum";
import {
  Ear,
  Volume2,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
  Trophy,
} from "lucide-react";

type EarMode = "interval" | "chord" | "dictation";

interface IntervalOption {
  semitones: number;
  name: string;
  songHint: string;
  emotion: string;
}

const INTERVAL_OPTIONS: IntervalOption[] = [
  {
    semitones: 2,
    name: "Büyük İkili (Tam Ses)",
    songHint: "İyi ki Doğdun (ilk 2 nota)",
    emotion: "Doğal yürüyüş adımı",
  },
  {
    semitones: 3,
    name: "Küçük Üçlü (Minör 3'lü)",
    songHint: "Ninni / Hüzünlü başlangıç",
    emotion: "Melankolik ve içsel",
  },
  {
    semitones: 4,
    name: "Büyük Üçlü (Majör 3'lü)",
    songHint: "Kapı zili (Ding-Dong tersi)",
    emotion: "Sıcak, neşeli ve aydınlık",
  },
  {
    semitones: 5,
    name: "Tam Dörtlü",
    songHint: "İstiklal Marşı / Düğün Marşı başlangıcı",
    emotion: "Resmi çağrı ve kararlılık",
  },
  {
    semitones: 7,
    name: "Tam Beşli",
    songHint: "Star Wars Ana Tema / Twinkle Twinkle",
    emotion: "Kahramanca, geniş ve güçlü",
  },
  {
    semitones: 12,
    name: "Tam Sekizli (Oktav)",
    songHint: "Somewhere Over the Rainbow",
    emotion: "Tam bütünleşme (2 kat frekans)",
  },
];

interface ChordOption {
  id: string;
  name: string;
  intervals: number[];
  emotion: string;
  formula: string;
}

const CHORD_OPTIONS: ChordOption[] = [
  {
    id: "major",
    name: "Majör Akor (Üçlü)",
    intervals: [0, 4, 7],
    emotion: "Aydınlık, mutlu, kararlı ve net",
    formula: "Kök + Büyük 3'lü (4YS) + Tam 5'li (7YS)",
  },
  {
    id: "minor",
    name: "Minör Akor (Üçlü)",
    intervals: [0, 3, 7],
    emotion: "Hüzünlü, duygusal, derin ve sinematik",
    formula: "Kök + Küçük 3'lü (3YS) + Tam 5'li (7YS)",
  },
  {
    id: "maj7",
    name: "Majör Yedili (Maj7)",
    intervals: [0, 4, 7, 11],
    emotion: "Rüya gibi, romantik, lo-fi / caz sıcaklığı",
    formula: "Kök + 4YS + 7YS + 11YS (Büyük 7'li)",
  },
  {
    id: "dom7",
    name: "Dominant Yedili (7)",
    intervals: [0, 4, 7, 10],
    emotion: "Gerilimli, blues karakterli, eve çözülmek isteyen",
    formula: "Kök + 4YS + 7YS + 10YS (Küçük 7'li)",
  },
];

interface EarTrainingLabProps {
  onAskTeacher: (question: string) => void;
}

export default function EarTrainingLab({ onAskTeacher }: EarTrainingLabProps) {
  const { subscribeNoteOn, setHighlightedMidis } = usePiano();
  const [mode, setMode] = useState<EarMode>("interval");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Interval state
  const [rootMidi, setRootMidi] = useState(60);
  const [targetInterval, setTargetInterval] = useState<IntervalOption>(INTERVAL_OPTIONS[2]);
  const [intervalSolved, setIntervalSolved] = useState<boolean | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);

  // Chord state
  const [targetChord, setTargetChord] = useState<ChordOption>(CHORD_OPTIONS[0]);
  const [chordSolved, setChordSolved] = useState<boolean | null>(null);

  // Melodic dictation state (Play back on Roland FP-10!)
  const [dictationMelody, setDictationMelody] = useState<number[]>([60, 62, 64, 67]);
  const [dictationProgress, setDictationProgress] = useState(0);
  const [dictationHint, setDictationHint] = useState<string>(
    "Melodiyi dinleyin ve ilk notadan (Do4 / C4) başlayarak Roland FP-10 piyanonuzda aynı sesleri bulmaya çalışın!"
  );

  // Play current question audio
  const playCurrentQuestion = useCallback(() => {
    if (mode === "interval") {
      soundEngine.playSequence([
        { midi: rootMidi, durationMs: 650, delayMs: 0, velocity: 85 },
        {
          midi: rootMidi + targetInterval.semitones,
          durationMs: 850,
          delayMs: 700,
          velocity: 88,
        },
      ]);
    } else if (mode === "chord") {
      const chordMidis = targetChord.intervals.map((i) => rootMidi + i);
      // Play arpeggio then full chord so ear hears both individual notes and blend
      const seq = chordMidis.map((m, idx) => ({
        midi: m,
        durationMs: 450,
        delayMs: idx * 240,
        velocity: 82,
      }));
      soundEngine.playSequence(seq);
      setTimeout(() => {
        soundEngine.playChord(chordMidis, 1.4, 85);
      }, chordMidis.length * 240 + 250);
    } else if (mode === "dictation") {
      const seq = dictationMelody.map((m, idx) => ({
        midi: m,
        durationMs: 520,
        delayMs: idx * 580,
        velocity: 85,
      }));
      soundEngine.playSequence(seq);
    }
  }, [mode, rootMidi, targetInterval, targetChord, dictationMelody]);

  const generateNewQuestion = useCallback(
    (targetMode: EarMode = mode) => {
      const possibleRoots = [60, 62, 64, 65, 67]; // C4, D4, E4, F4, G4
      const newRoot = possibleRoots[Math.floor(Math.random() * possibleRoots.length)];
      setRootMidi(newRoot);
      setSelectedGuess(null);

      if (targetMode === "interval") {
        const nextIvl =
          INTERVAL_OPTIONS[Math.floor(Math.random() * INTERVAL_OPTIONS.length)];
        setTargetInterval(nextIvl);
        setIntervalSolved(null);
        setHighlightedMidis([newRoot]);
        setTimeout(() => {
          soundEngine.playSequence([
            { midi: newRoot, durationMs: 650, delayMs: 0, velocity: 85 },
            {
              midi: newRoot + nextIvl.semitones,
              durationMs: 850,
              delayMs: 700,
              velocity: 88,
            },
          ]);
        }, 120);
      } else if (targetMode === "chord") {
        const nextChord =
          CHORD_OPTIONS[Math.floor(Math.random() * CHORD_OPTIONS.length)];
        setTargetChord(nextChord);
        setChordSolved(null);
        setHighlightedMidis([newRoot]);
        setTimeout(() => {
          const midis = nextChord.intervals.map((i) => newRoot + i);
          soundEngine.playChord(midis, 1.5, 85);
        }, 120);
      } else {
        // Dictation pool (C Major Pentatonic / White keys C4-A4 so it's approachable and musical)
        const pool = [60, 62, 64, 65, 67, 69];
        const mel = [60]; // Always anchor first note on Middle C (Do4)
        for (let i = 1; i < 4; i++) {
          const candidate = pool[Math.floor(Math.random() * pool.length)];
          mel.push(candidate);
        }
        setDictationMelody(mel);
        setDictationProgress(0);
        setHighlightedMidis([60]);
        setDictationHint(
          "1. nota her zaman Orta Do (Do4). Şimdi 4 notalık gizemli melodiyi piyanoda sırayla çalın!"
        );
        setTimeout(() => {
          const seq = mel.map((m, idx) => ({
            midi: m,
            durationMs: 520,
            delayMs: idx * 580,
            velocity: 85,
          }));
          soundEngine.playSequence(seq);
        }, 120);
      }
    },
    [mode, setHighlightedMidis]
  );

  // Listen to Roland FP-10 MIDI keys for Melodic Dictation & Interval discovery!
  useEffect(() => {
    const unsub = subscribeNoteOn((evt) => {
      if (mode === "dictation") {
        setDictationProgress((prevStep) => {
          if (prevStep >= dictationMelody.length) return prevStep;
          const expectedMidi = dictationMelody[prevStep];
          if (evt.midi === expectedMidi) {
            const nextStep = prevStep + 1;
            if (nextStep === dictationMelody.length) {
              setScore((s) => s + 25);
              setStreak((st) => st + 1);
              setDictationHint(
                `🎉 Muhteşem! Duyduğun 4 notanın tamamını (${dictationMelody
                  .map((m) => midiToTurkishName(m))
                  .join(" - ")}) piyanoda kulaktan buldun!`
              );
              setHighlightedMidis(dictationMelody);
            } else {
              setDictationHint(
                `✅ Harika! ${prevStep + 1}. nota (${midiToTurkishName(
                  expectedMidi
                )}) doğru. Şimdi ${nextStep + 1}. notayı bul!`
              );
            }
            return nextStep;
          } else {
            const diff = expectedMidi - evt.midi;
            const direction =
              diff > 0
                ? `Bastığın ${evt.turkishName} notasından biraz daha İNCE (sağda) bir tuş dene!`
                : `Bastığın ${evt.turkishName} notasından biraz daha KALIN (solda) bir tuş dene!`;
            setDictationHint(`💡 İpucu (${prevStep + 1}. nota için): ${direction}`);
            return prevStep;
          }
        });
      } else if (mode === "interval" && !intervalSolved) {
        const expectedSecondMidi = rootMidi + targetInterval.semitones;
        if (evt.midi === expectedSecondMidi) {
          setIntervalSolved(true);
          setSelectedGuess(targetInterval.name);
          setScore((s) => s + 15);
          setStreak((st) => st + 1);
          setHighlightedMidis([rootMidi, expectedSecondMidi]);
        }
      }
    });
    return unsub;
  }, [
    subscribeNoteOn,
    mode,
    dictationMelody,
    intervalSolved,
    rootMidi,
    targetInterval,
    setHighlightedMidis,
  ]);

  return (
    <div className="space-y-5">
      {/* Top Banner & Stats */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-slate-900 border border-emerald-500/30 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Ear className="w-4 h-4" />
            <span>İnteraktif Müzik Kulağı Geliştirme Laboratuvarı</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Duyduğunu Anla ve Roland FP-10&apos;da Kulaktan Bul
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            İyi bir müzisyen sadece notayı kağıttan okumaz; duyduğu aralığı, akorun duygusunu ve melodiyi doğrudan parmaklarına aktarır.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Kulak Puanı</div>
            <div className="text-lg font-bold text-amber-400 flex items-center gap-1 justify-center">
              <Trophy className="w-4 h-4" /> {score}
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-[11px] text-slate-400">Seri</div>
            <div className="text-lg font-bold text-emerald-400">{streak} 🔥</div>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            setMode("interval");
            generateNewQuestion("interval");
          }}
          className={`p-4 rounded-xl border text-left transition ${
            mode === "interval"
              ? "bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/70"
          }`}
        >
          <div className="font-bold text-sm text-emerald-300">1. Aralık (Interval) Avcısı</div>
          <p className="text-xs text-slate-400 mt-1">
            İki nota arasındaki mesafeyi dinle; ister listeden seç ister 2. notayı doğrudan piyanonda bul!
          </p>
        </button>

        <button
          onClick={() => {
            setMode("chord");
            generateNewQuestion("chord");
          }}
          className={`p-4 rounded-xl border text-left transition ${
            mode === "chord"
              ? "bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/70"
          }`}
        >
          <div className="font-bold text-sm text-emerald-300">2. Akor Karakteri & Duygu Analizi</div>
          <p className="text-xs text-slate-400 mt-1">
            Çalınan akorun Majör, Minör, Maj7 veya Dominant 7 olduğunu renginden ve duygusundan tanı.
          </p>
        </button>

        <button
          onClick={() => {
            setMode("dictation");
            generateNewQuestion("dictation");
          }}
          className={`p-4 rounded-xl border text-left transition ${
            mode === "dictation"
              ? "bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg"
              : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/70"
          }`}
        >
          <div className="font-bold text-sm text-amber-300">3. Melodik Dikte (Duy & Piyanoda Çal)</div>
          <p className="text-xs text-slate-400 mt-1">
            Uygulamanın çaldığı 4 notalık gizemli melodiyi dinle ve Roland FP-10 tuşlarında kulaktan bul!
          </p>
        </button>
      </div>

      {/* Active Exercise Area */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase">
              Başlangıç Referans Notası: {midiToTurkishName(rootMidi)} ({midiToNoteName(rootMidi)})
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {mode === "interval" &&
                "Soru: Referans notadan sonra çalınan ikinci nota hangi aralıktadır?"}
              {mode === "chord" &&
                "Soru: Duyduğunuz bu akorun armonik karakteri ve türü nedir?"}
              {mode === "dictation" &&
                "Soru: Duyduğunuz 4 notalık melodiyi Roland FP-10 klavyenizde çalın!"}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={playCurrentQuestion}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>Sesi Tekrar Dinle</span>
            </button>

            <button
              onClick={() => generateNewQuestion(mode)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Yeni Soru</span>
            </button>

            <button
              onClick={() =>
                onAskTeacher(
                  mode === "interval"
                    ? `${midiToTurkishName(rootMidi)} notasından başlayan ${targetInterval.name} aralığını kulaktan daha hızlı tanımak için bana pratik bir ipucu verir misin?`
                    : mode === "chord"
                    ? `${targetChord.name} akorunun duygusal tınısını diğer akorlardan kulaktan nasıl ayırt edebilirim?`
                    : `Melodik dikte çalışırken duyduğum melodiyi piyanoda tek seferde bulmak için içsel duyuşumu (audiation) nasıl geliştirebilirim?`
                )
              }
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Öğretmenden İpucu Al</span>
            </button>
          </div>
        </div>

        {/* Mode 1: Interval Options */}
        {mode === "interval" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              💡 <strong>İki şekilde cevaplayabilirsiniz:</strong> Aşağıdaki kartlardan aralığı seçebilir <em>veya</em> Roland FP-10 piyanonuzda{" "}
              <strong className="text-amber-300">{midiToTurkishName(rootMidi)}</strong> tuşundan sonraki hedef tuşa doğrudan basabilirsiniz!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {INTERVAL_OPTIONS.map((opt) => {
                const isSelected = selectedGuess === opt.name;
                const isRight = opt.semitones === targetInterval.semitones;
                return (
                  <button
                    key={opt.semitones}
                    onClick={() => {
                      setSelectedGuess(opt.name);
                      if (isRight) {
                        setIntervalSolved(true);
                        setScore((s) => s + 10);
                        setStreak((st) => st + 1);
                        setHighlightedMidis([rootMidi, rootMidi + opt.semitones]);
                      } else {
                        setIntervalSolved(false);
                        setStreak(0);
                      }
                    }}
                    className={`p-4 rounded-xl border text-left transition ${
                      isSelected && isRight
                        ? "bg-emerald-500/20 border-emerald-500 text-white"
                        : isSelected && !isRight
                        ? "bg-rose-500/20 border-rose-500 text-white"
                        : "bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{opt.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                        {opt.semitones} Yarım Ses
                      </span>
                    </div>
                    <div className="text-xs text-emerald-300/90 mt-1.5">
                      🎵 Hafıza Şarkısı: {opt.songHint}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{opt.emotion}</div>
                  </button>
                );
              })}
            </div>

            {intervalSolved !== null && (
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  intervalSolved
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                    : "bg-rose-950/60 border-rose-500/50 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  {intervalSolved ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Harika Kulak!</strong> Aralığımız:{" "}
                        <strong>{targetInterval.name}</strong> (
                        {midiToTurkishName(rootMidi)} ➔{" "}
                        {midiToTurkishName(rootMidi + targetInterval.semitones)}). Şimdi klavyede bu iki tuşa basarak tınıyı pekiştirin!
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>
                        Henüz değil! &quot;Sesi Tekrar Dinle&quot; butonuna basıp şarkı ipuçlarıyla karşılaştırın veya piyanoda {midiToTurkishName(rootMidi)} tuşundan itibaren deneyerek bulun.
                      </span>
                    </>
                  )}
                </div>
                {intervalSolved && (
                  <button
                    onClick={() => generateNewQuestion("interval")}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0"
                  >
                    Sıradaki Aralık ➔
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Chord Character */}
        {mode === "chord" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHORD_OPTIONS.map((ch) => {
                const isSelected = selectedGuess === ch.id;
                const isRight = ch.id === targetChord.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedGuess(ch.id);
                      if (isRight) {
                        setChordSolved(true);
                        setScore((s) => s + 15);
                        setStreak((st) => st + 1);
                        setHighlightedMidis(ch.intervals.map((i) => rootMidi + i));
                      } else {
                        setChordSolved(false);
                        setStreak(0);
                      }
                    }}
                    className={`p-4 rounded-xl border text-left transition ${
                      isSelected && isRight
                        ? "bg-emerald-500/20 border-emerald-500 text-white"
                        : isSelected && !isRight
                        ? "bg-rose-500/20 border-rose-500 text-white"
                        : "bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 text-slate-200"
                    }`}
                  >
                    <div className="font-bold text-base text-white">{ch.name}</div>
                    <div className="text-xs text-amber-300 mt-1">✨ Duygu: {ch.emotion}</div>
                    <div className="text-[11px] text-slate-400 mt-1">📐 Formül: {ch.formula}</div>
                  </button>
                );
              })}
            </div>

            {chordSolved && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center justify-between">
                <div className="text-xs sm:text-sm">
                  🎉 <strong>Doğru!</strong> Duyduğunuz akor{" "}
                  <strong>
                    {midiToTurkishName(rootMidi)} {targetChord.name}
                  </strong>{" "}
                  (Notaları:{" "}
                  {targetChord.intervals
                    .map((i) => midiToTurkishName(rootMidi + i))
                    .join(" - ")}
                  ). Aşağıdaki klavyede işaretlenen bu tuşlara aynı anda basarak akoru kendi ellerinizle çalın!
                </div>
                <button
                  onClick={() => generateNewQuestion("chord")}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0"
                >
                  Yeni Akor ➔
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Melodic Dictation on Roland FP-10 */}
        {mode === "dictation" && (
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-3">
              {dictationMelody.map((midi, idx) => {
                const isFound = idx < dictationProgress;
                const isCurrent = idx === dictationProgress;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-center transition ${
                      isFound
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : isCurrent
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse"
                        : "bg-slate-800/70 border-slate-700 text-slate-400"
                    }`}
                  >
                    <div className="text-xs uppercase font-semibold">
                      {idx + 1}. Nota
                    </div>
                    <div className="text-xl font-extrabold mt-1">
                      {isFound || idx === 0
                        ? `${midiToTurkishName(midi)} (${midiToNoteName(midi)})`
                        : "❓"}
                    </div>
                    <div className="text-[11px] mt-1">
                      {isFound
                        ? "✅ Bulundu!"
                        : isCurrent
                        ? "🎹 Şimdi Piyanoda Basın"
                        : "Bekliyor"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-200">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{dictationHint}</span>
              </div>
              {dictationProgress >= dictationMelody.length && (
                <button
                  onClick={() => generateNewQuestion("dictation")}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0"
                >
                  Yeni Melodi ➔
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
