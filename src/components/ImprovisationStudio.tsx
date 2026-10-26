"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePiano } from "@/context/PianoContext";
import { getScaleNotes } from "@/lib/theory";
import { soundEngine } from "@/lib/audio";
import StaffVisualizer from "@/components/StaffVisualizer";
import {
  Wand2,
  Play,
  Sparkles,
  Music,
  CircleDot,
  Square,
  Trash2,
} from "lucide-react";

interface ImprovisationStudioProps {
  onAskTeacher: (question: string) => void;
}

const ROOTS = [
  { code: "C", tr: "Do (C)" },
  { code: "D", tr: "Re (D)" },
  { code: "E", tr: "Mi (E)" },
  { code: "F", tr: "Fa (F)" },
  { code: "G", tr: "Sol (G)" },
  { code: "A", tr: "La (A)" },
  { code: "B", tr: "Si (B)" },
];

const SCALES = [
  { id: "major", label: "Majör Gam (Aydınlık & Neşeli)" },
  { id: "minor", label: "Doğal Minör (Duygusal & Melankolik)" },
  { id: "major pentatonic", label: "Majör Pentatonik (5 Ses - Güvenli Doğaçlama)" },
  { id: "minor pentatonic", label: "Minör Pentatonik (Sinematik / Blues)" },
  { id: "harmonic minor", label: "Armonik Minör (Klasik & Doğu Tınısı)" },
  { id: "dorian", label: "Dorian Modu (Modern Caz & Film Müziği)" },
];

export default function ImprovisationStudio({ onAskTeacher }: ImprovisationStudioProps) {
  const {
    activeNotes,
    detectedHarmony,
    recentNotes,
    clearRecentNotes,
    setHighlightedMidis,
    subscribeNoteOn,
  } = usePiano();

  const [selectedRoot, setSelectedRoot] = useState("C");
  const [selectedScale, setSelectedScale] = useState("major pentatonic");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<
    { midi: number; turkishName: string; note: string; velocity: number; offsetMs: number }[]
  >([]);
  const [recordStartTime, setRecordStartTime] = useState<number>(0);

  const scaleInfo = useMemo(
    () => getScaleNotes(selectedRoot, selectedScale),
    [selectedRoot, selectedScale]
  );

  useEffect(() => {
    setHighlightedMidis(scaleInfo.midis);
    return () => setHighlightedMidis([]);
  }, [scaleInfo.midis, setHighlightedMidis]);

  useEffect(() => {
    if (!isRecording) return;
    const unsub = subscribeNoteOn((evt) => {
      const offsetMs = Date.now() - recordStartTime;
      setRecordedNotes((prev) => [
        ...prev,
        {
          midi: evt.midi,
          turkishName: evt.turkishName,
          note: evt.note,
          velocity: evt.velocity,
          offsetMs,
        },
      ]);
    });
    return unsub;
  }, [isRecording, recordStartTime, subscribeNoteOn]);

  const activeMidiList = Object.keys(activeNotes).map(Number);

  const playScalePreview = () => {
    const seq = scaleInfo.midis.map((m, idx) => ({
      midi: m,
      durationMs: 360,
      delayMs: idx * 320,
      velocity: 82,
    }));
    soundEngine.playSequence(seq);
  };

  const replayRecording = () => {
    if (recordedNotes.length === 0) return;
    const firstOffset = recordedNotes[0].offsetMs;
    const seq = recordedNotes.map((r) => ({
      midi: r.midi,
      durationMs: 450,
      delayMs: Math.max(0, r.offsetMs - firstOffset),
      velocity: r.velocity,
    }));
    soundEngine.playSequence(seq);
  };

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/30 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Wand2 className="w-4 h-4" />
            <span>Yaratıcılık, Armoni ve Doğaçlama Atölyesi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Zihnindeki Melodiyi ve Akorları Müziğe Dök
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Roland FP-10 piyanonuzda bastığınız her tuş ve akor burada anında analiz edilir, porteye dökülür. Gam rehberini seçip özgürce doğaçlama yapın!
          </p>
        </div>

        <button
          onClick={() =>
            onAskTeacher(
              `Şu anda Serbest Atölye'de ${selectedRoot} ${selectedScale} dizisi üzerinde çalışıyorum. Son bastığım notalar: ${
                recentNotes
                  .slice(-12)
                  .map((n) => n.turkishName)
                  .join(" - ") || "Henüz yok"
              }. Zihnimdeki melodiyi geliştirirken sol elimle hangi akor yürüyüşünü basmalıyım ve bu melodiyi nasıl daha duygusal hale getirebilirim?`
            )
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Çaldığım Fikri Maestro AI&apos;a Yorumlat</span>
        </button>
      </div>

      {/* Live Staff + Real-Time Chord & Harmony Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <StaffVisualizer mode="live" activeMidis={activeMidiList} />
        </div>

        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              🔍 Canlı Armoni & Akor Dedektifi
            </div>
            {detectedHarmony.turkishChordName ? (
              <div className="mt-2 space-y-2">
                <div className="text-xl font-extrabold text-white">
                  {detectedHarmony.turkishChordName}
                </div>
                <p className="text-xs text-amber-300">
                  ✨ Karakter: {detectedHarmony.moodDescription}
                </p>
                {detectedHarmony.suggestedNextChords.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Bu akordan sonra gidebileceğiniz uyumlu akorlar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {detectedHarmony.suggestedNextChords.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-semibold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Roland FP-10 piyanonuzda aynı anda <strong>2 tuşa (Aralık)</strong> veya{" "}
                <strong>3-4 tuşa (Akor)</strong> basın; bastığınız akorun adını, hissiyatını ve bir sonraki adımda hangi akora gidebileceğinizi anında görün!
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Basılı Tuş Sayısı: {activeMidiList.length}</span>
            {recentNotes.length > 0 && (
              <button
                onClick={clearRecentNotes}
                className="text-slate-400 hover:text-white underline"
              >
                Geçmişi Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scale & Improvisation Guide + Idea Recorder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scale Highlighter */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <span>Gam & Doğaçlama Pusulası (Klavyede Aydınlatır)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Seçtiğiniz dizinin notaları aşağıdaki piyanoda mor/mavi renkle işaretlenir.
              </p>
            </div>
            <button
              onClick={playScalePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Diziyi Dinle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Kök Nota (Ton):</label>
              <select
                value={selectedRoot}
                onChange={(e) => setSelectedRoot(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              >
                {ROOTS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.tr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Dizi / Mod Türü:</label>
              <select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              >
                {SCALES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400">
              Formül & Karakter: <span className="text-amber-300 font-medium">{scaleInfo.formula}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scaleInfo.turkishNames.map((n, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 font-bold text-xs"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Musical Idea MIDI Recorder */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                🎙️ Müzikal Fikir & Melodi Kaydedici (MIDI)
              </h3>
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <button
                    onClick={() => {
                      setRecordedNotes([]);
                      setRecordStartTime(Date.now());
                      setIsRecording(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition"
                  >
                    <CircleDot className="w-3.5 h-3.5" />
                    <span>Kaydı Başlat</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsRecording(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Kaydı Durdur ({recordedNotes.length} Nota)</span>
                  </button>
                )}

                {recordedNotes.length > 0 && !isRecording && (
                  <>
                    <button
                      onClick={replayRecording}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Dinle</span>
                    </button>
                    <button
                      onClick={() => setRecordedNotes([])}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Aklınıza gelen bir melodiyi Roland FP-10&apos;da çalarken kaydedin, tekrar dinleyin ve AI öğretmene bu melodiyi nasıl tam bir şarkıya dönüştürebileceğinizi sorun!
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 min-h-[84px] flex items-center">
            {recordedNotes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {recordedNotes.map((r, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                  >
                    {r.turkishName}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">
                {isRecording
                  ? "🔴 Kayıt aktif! Şimdi Roland FP-10 piyanonuzda melodiyi çalın..."
                  : "Henüz kayıt yok. 'Kaydı Başlat' butonuna basıp piyanoda doğaçlama yapın."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
