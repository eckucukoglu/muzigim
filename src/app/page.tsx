"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CURRICULUM_MODULES, Lesson } from "@/data/curriculum";
import { usePiano } from "@/context/PianoContext";
import LessonWorkspace from "@/components/LessonWorkspace";
import EarTrainingLab from "@/components/EarTrainingLab";
import ImprovisationStudio from "@/components/ImprovisationStudio";
import AITeacherPanel from "@/components/AITeacherPanel";
import PianoKeyboardDock from "@/components/PianoKeyboardDock";
import SettingsModal from "@/components/SettingsModal";
import { APP_VERSION } from "@/lib/version";
import {
  BookOpen,
  Ear,
  Wand2,
  Settings,
  CheckCircle2,
  ChevronRight,
  Music2,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type MainTab = "curriculum" | "ear-training" | "studio";

export default function HomePage() {
  const { setIsSettingsOpen, geminiApiKey } = usePiano();

  const allLessons = useMemo(
    () => CURRICULUM_MODULES.flatMap((m) => m.lessons),
    []
  );

  const [activeTab, setActiveTab] = useState<MainTab>("curriculum");
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    allLessons[0].id
  );
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [targetMidi, setTargetMidi] = useState<number | null>(60);
  const [exerciseStatsSummary, setExerciseStatsSummary] = useState<string>("");
  const [externalPrompt, setExternalPrompt] = useState<{
    text: string;
    id: number;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("roland_fp10_completed_lessons");
      if (saved) {
        try {
          setCompletedLessons(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const handleMarkCompleted = useCallback((lessonId: string) => {
    setCompletedLessons((prev) => {
      if (prev.includes(lessonId)) return prev;
      const next = [...prev, lessonId];
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "roland_fp10_completed_lessons",
          JSON.stringify(next)
        );
      }
      return next;
    });
  }, []);

  const activeLesson: Lesson = useMemo(
    () =>
      allLessons.find((l) => l.id === selectedLessonId) || allLessons[0],
    [allLessons, selectedLessonId]
  );

  const handleNextLesson = useCallback(() => {
    const idx = allLessons.findIndex((l) => l.id === selectedLessonId);
    if (idx !== -1 && idx + 1 < allLessons.length) {
      setSelectedLessonId(allLessons[idx + 1].id);
    }
  }, [allLessons, selectedLessonId]);

  const handleAskTeacher = useCallback((question: string) => {
    setExternalPrompt({ text: question, id: Date.now() });
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#090b10] text-slate-100">
      {/* Top Navbar */}
      <header className="h-14 shrink-0 px-4 bg-slate-950/95 border-b border-slate-800/90 flex items-center justify-between gap-4 z-30">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {activeTab === "curriculum" && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Müfredat Menüsünü Aç/Kapat"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Music2 className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                FP-10 Müzik Akademisi
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-900 text-slate-400 border border-slate-800">
                {APP_VERSION}
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-amber-400 border border-slate-700">
                Roland FP-10 BK Stage Piano
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "curriculum"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sıfırdan Müfredat & Dersler</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("ear-training");
              setTargetMidi(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "ear-training"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Ear className="w-3.5 h-3.5" />
            <span>Kulak Eğitimi Lab</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("studio");
              setTargetMidi(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "studio"
                ? "bg-indigo-500 text-white shadow"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Zihindekini Müziğe Dök (Atölye)</span>
          </button>
        </nav>

        {/* Progress & Settings */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">İlerleme:</span>
            <span className="font-bold text-white">
              {completedLessons.length}/{allLessons.length} Ders
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Ayarlar & API</span>
            {!geminiApiKey && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area (Left Curriculum Sidebar + Center Workspace + Right AI Teacher) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Curriculum Sidebar (visible in curriculum tab) */}
        {activeTab === "curriculum" && sidebarOpen && (
          <aside className="w-72 shrink-0 bg-slate-950/80 border-r border-slate-800/90 overflow-y-auto p-3.5 space-y-4 hidden md:block">
            <div className="px-1">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Bütüncül Müzik Müfredatı
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sıfırdan teori, armoni, kulak ve doğaçlama yolculuğu
              </p>
            </div>

            <div className="space-y-4">
              {CURRICULUM_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="rounded-xl bg-slate-900/60 border border-slate-800/90 overflow-hidden"
                >
                  <div
                    className={`p-3 bg-gradient-to-r ${mod.color} border-b border-slate-800/80`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Modül {mod.number}
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {mod.title}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {mod.lessons.map((les) => {
                      const isSelected = les.id === selectedLessonId;
                      const isDone = completedLessons.includes(les.id);
                      return (
                        <button
                          key={les.id}
                          onClick={() => setSelectedLessonId(les.id)}
                          className={`w-full p-2.5 text-left flex items-start gap-2.5 transition ${
                            isSelected
                              ? "bg-amber-500/15 text-white"
                              : "hover:bg-slate-800/50 text-slate-300"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <div
                                className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                  isSelected
                                    ? "bg-amber-500 text-slate-950"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {les.order}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-xs font-semibold leading-snug ${
                                isSelected ? "text-amber-300" : "text-slate-200"
                              }`}
                            >
                              {les.title}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {les.level} • {les.durationMin} dk
                            </div>
                          </div>
                          {isSelected && (
                            <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Özel Ders İsteyin</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Müfredat dışında merak ettiğiniz bir şarkıyı, makam/gam yapısını veya tekniği sağdaki Maestro AI&apos;a anında sorabilirsiniz.
              </p>
            </div>
          </aside>
        )}

        {/* Center Interactive Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "curriculum" && (
            <LessonWorkspace
              lesson={activeLesson}
              completedLessons={completedLessons}
              onMarkCompleted={handleMarkCompleted}
              onNextLesson={handleNextLesson}
              onAskTeacher={handleAskTeacher}
              onTargetMidiChange={setTargetMidi}
              onExerciseStatsChange={setExerciseStatsSummary}
            />
          )}

          {activeTab === "ear-training" && (
            <EarTrainingLab onAskTeacher={handleAskTeacher} />
          )}

          {activeTab === "studio" && (
            <ImprovisationStudio onAskTeacher={handleAskTeacher} />
          )}
        </main>

        {/* Right Side: Context-Aware AI Music Teacher */}
        <AITeacherPanel
          activeTab={
            activeTab === "curriculum"
              ? "Müfredat & Dersler"
              : activeTab === "ear-training"
              ? "Kulak Eğitimi Laboratuvarı"
              : "Serbest Doğaçlama ve Armoni Atölyesi"
          }
          activeLesson={activeLesson}
          exerciseStatsSummary={exerciseStatsSummary}
          externalPrompt={externalPrompt}
        />
      </div>

      {/* Bottom Dock: Roland FP-10 Real-Time Visual Keyboard & Telemetry */}
      <PianoKeyboardDock
        targetMidi={activeTab === "curriculum" ? targetMidi : null}
      />

      {/* Settings & USB-MIDI Guide Modal */}
      <SettingsModal />
    </div>
  );
}
