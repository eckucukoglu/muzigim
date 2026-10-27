"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePiano } from "@/context/PianoContext";
import { Lesson } from "@/data/curriculum";
import { askMaestroAI } from "@/lib/geminiClient";
import {
  Bot,
  Send,
  Sparkles,
  KeyRound,
  Activity,
  HelpCircle,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  usingFallback?: boolean;
}

interface AITeacherPanelProps {
  activeTab: string;
  activeLesson: Lesson;
  exerciseStatsSummary: string;
  externalPrompt: { text: string; id: number } | null;
}

export default function AITeacherPanel({
  activeTab,
  activeLesson,
  exerciseStatsSummary,
  externalPrompt,
}: AITeacherPanelProps) {
  const {
    recentNotes,
    detectedHarmony,
    sustainPedal,
    geminiApiKey,
    setIsSettingsOpen,
  } = usePiano();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Merhaba! Ben **Maestro AI**, senin özel piyano ve müzik teorisi öğretmeninim. Yeni **Roland FP-10 BK** piyanonla çıktığın bu yolculukta her an yanındayım.\n\n• Ekranda gördüğün ve anlam veremediğin herhangi bir müzik kavramını bana sorabilirsin.\n• Piyanoda bastığın tuşları, tuş şiddetini (**velocity**) ve ritmini canlı takip ediyorum; **\"Son Çaldığımı Analiz Et\"** butonuna basarak anlık geri bildirim alabilirsin!",
      timestamp: "Şimdi",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const lastHandledPromptIdRef = useRef<number | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendQuestion = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim();
      if (!trimmed) return;

      const requestId = ++activeRequestIdRef.current;
      const nowTime = new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}-${requestId}`,
        role: "user",
        content: trimmed,
        timestamp: nowTime,
      };

      const aiMsgId = `ai-${Date.now()}-${requestId}`;
      const placeholderAiMsg: ChatMessage = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        timestamp: nowTime,
      };

      const conversationForApi = [...messagesRef.current, userMsg];
      setMessages((prev) => [...prev, userMsg, placeholderAiMsg]);
      setInput("");
      setIsLoading(true);

      const recentPlayedFormatted =
        recentNotes.length > 0
          ? recentNotes
              .slice(-20)
              .map(
                (n) =>
                  `${n.turkishName}(${n.note}) [Vel:${n.velocity}/${n.dynamicSymbol}${
                    n.interOnsetMs ? `, Δ${n.interOnsetMs}ms` : ""
                  }]`
              )
              .join(" -> ")
          : "Henüz tuşa basılmadı";

      const targetNotesFormatted = activeLesson.exercise.targetNotes
        .map((t) => `${t.turkishName}(${t.note})`)
        .join(" - ");

      try {
        const data = await askMaestroAI({
          apiKey: geminiApiKey,
          messages: conversationForApi.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            activeTab,
            lessonTitle: activeLesson.title,
            lessonSummary: activeLesson.summary,
            exerciseTitle: activeLesson.exercise.title,
            targetNotes: targetNotesFormatted,
            recentPlayedNotes: recentPlayedFormatted,
            activeHarmony: detectedHarmony.turkishChordName || "Tek ses / Yok",
            sustainPedal,
            exerciseStats: exerciseStatsSummary,
          },
          onStreamChunk: (textSoFar) => {
            if (activeRequestIdRef.current !== requestId) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, content: textSoFar } : m
              )
            );
          },
        });

        if (activeRequestIdRef.current !== requestId) return;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: data.reply,
                  usingFallback: data.usingFallback,
                }
              : m
          )
        );
      } catch (err: unknown) {
        if (activeRequestIdRef.current !== requestId) return;
        const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: `⚠️ Gemini API bağlantı hatası: ${msg}. Lütfen sağ üstteki Ayarlar menüsünden API anahtarınızı kontrol edin.`,
                }
              : m
          )
        );
      } finally {
        if (activeRequestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [
      recentNotes,
      activeLesson,
      geminiApiKey,
      activeTab,
      detectedHarmony.turkishChordName,
      sustainPedal,
      exerciseStatsSummary,
    ]
  );

  // Trigger external prompts from lesson cards or exercise completion
  useEffect(() => {
    if (
      externalPrompt &&
      externalPrompt.id !== lastHandledPromptIdRef.current
    ) {
      lastHandledPromptIdRef.current = externalPrompt.id;
      sendQuestion(externalPrompt.text);
    }
  }, [externalPrompt, sendQuestion]);

  return (
    <aside className="w-full lg:w-[390px] xl:w-[430px] shrink-0 bg-slate-900/95 border-l border-slate-800/90 flex flex-col h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white">Maestro AI Öğretmen</h2>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Hızlı Yanıt
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Dersini, porteyi ve bastığın tuşları anlık takip eder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Gemini API Anahtarı Ayarları"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
              geminiApiKey
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
            }`}
          >
            {geminiApiKey ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gemini Aktif</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>API Key Gir</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              activeRequestIdRef.current++;
              setIsLoading(false);
              setMessages([
                {
                  id: "reset",
                  role: "assistant",
                  content:
                    "Sohbet temizlendi. Şu anki dersin veya piyanoda bastığın tuşlarla ilgili istediğin soruyu sorabilirsin!",
                  timestamp: "Şimdi",
                },
              ]);
            }}
            title="Sohbeti Temizle"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Context Strip */}
      <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
        <div className="truncate text-slate-400">
          <span className="text-slate-500">Bağlam:</span>{" "}
          <span className="text-amber-300 font-medium">{activeLesson.title}</span>
        </div>
        <button
          onClick={() =>
            sendQuestion(
              `Az önce Roland FP-10 piyanomda şu egzersizi/notaları çaldım. Tuş vuruş şiddetimi (velocity), ritmimi ve nota doğruluğumu kısaca analiz edip geri bildirim verir misin? (${activeLesson.exercise.aiCoachFocus})`
            )
          }
          className="shrink-0 ml-2 flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-medium transition"
        >
          <Activity className="w-3 h-3" />
          <span>Son Çaldığımı Analiz Et</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-amber-500 text-slate-950 font-medium rounded-br-xs"
                  : "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-xs"
              }`}
            >
              {msg.content || (
                <span className="inline-flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Yanıtlanıyor...</span>
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {msg.role === "user" ? "Sen" : "Maestro AI"} • {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Contextual Suggested Questions */}
      <div className="px-3.5 py-2 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1.5">
          <HelpCircle className="w-3 h-3 text-amber-400" />
          <span>Bu dersle ilgili hızlı sorular:</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {activeLesson.quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => sendQuestion(q)}
              className="shrink-0 max-w-[230px] truncate text-left px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition"
              title={q}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestion(input);
        }}
        className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Anlamadığın bir detayı veya çaldığın akoru sor..."
          className="flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}
