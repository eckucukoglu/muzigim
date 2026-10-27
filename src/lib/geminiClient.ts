import { GoogleGenAI } from "@google/genai";

export interface TeacherContextData {
  activeTab?: string;
  lessonTitle?: string;
  lessonSummary?: string;
  exerciseTitle?: string;
  targetNotes?: string;
  recentPlayedNotes?: string;
  activeHarmony?: string;
  sustainPedal?: boolean;
  exerciseStats?: string;
}

const STATIC_SYSTEM_INSTRUCTION = `Sen "Maestro AI" adında, konservatuvar düzeyinde müzik teorisi, armoni, kulak eğitimi ve piyano pedagojisi uzmanlığına sahip, ilham verici, sabırlı ve Türkçe konuşan bir özel piyano öğretmenisin.

Öğrencinin Enstrümanı: Roland FP-10 BK (88 tuşlu PHA-4 Standard fildişi tuşlu, çekiç aksiyonlu dijital stage piano).

ÖĞRETMENLİK İLKELERİN:
1. Yanıtlarını doyurucu, pedagojik açıdan zengin, müzikal sezgi ve pratik benzetmelerle açıkla (kuru ezber yerine seslerin neden öyle hissettirdiğini aktar).
2. Notaları hem Türkçe hem uluslararası harf koduyla yaz: ör. Do (C4), Mi (E4), Fa# (F#4).
3. Roland FP-10 üzerinde çalışırken parmak numaraları (1-baş, 2-işaret, 3-orta, 4-yüzük, 5-serçe), tuş ağırlığı (velocity) ve tuş hassasiyeti hakkında somut önerilerde bulun.
4. Gereksiz uzun bürokratik giriş/selamlama yapma; doğrudan konunun özüne ve öğrencinin sorusuna odaklan.
5. Performans analizi istendiğinde öğrencinin bastığı son MIDI notalarını, tuşe dengesini ve ritmini konservatuvar hocası gözüyle yapıcı biçimde yorumla.`;

function buildCompactTurnInput(
  messages: { role: "user" | "assistant"; content: string }[],
  context?: TeacherContextData
): string {
  const lastUserMsg =
    messages.filter((m) => m.role === "user").pop()?.content ||
    messages?.[messages.length - 1]?.content ||
    "";

  const recentHistory = messages
    .slice(-5, -1)
    .map((m) => `${m.role === "user" ? "Öğrenci" : "Maestro"}: ${m.content.slice(0, 220)}`)
    .join("\n");

  return `[CANLI PİYANO VERİSİ]
• Ders: ${context?.lessonTitle || "Genel"} | Egzersiz: ${context?.exerciseTitle || "Yok"}
• Hedef Notalar: ${context?.targetNotes || "Yok"}
• Egzersiz Durumu: ${context?.exerciseStats || "Başlamadı"}
• Basılı Akor/Armoni: ${context?.activeHarmony || "Yok"} | Pedal: ${
    context?.sustainPedal ? "Açık" : "Serbest"
  }
• Son Çalınan MIDI Notaları: ${context?.recentPlayedNotes || "Henüz tuşa basılmadı"}${
    recentHistory ? `\n\n[ÖNCEKİ KISA GEÇMİŞ]\n${recentHistory}` : ""
  }

[ÖĞRENCİNİN SORUSU / İSTEĞİ]
${lastUserMsg}`;
}

export async function askMaestroAI({
  messages,
  apiKey,
  context,
  onStreamChunk,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  apiKey?: string;
  context?: TeacherContextData;
  onStreamChunk?: (textSoFar: string) => void;
}): Promise<{ reply: string; usingFallback: boolean }> {
  const effectiveApiKey =
    apiKey?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() || "";

  const lastUserMsg =
    messages.filter((m) => m.role === "user").pop()?.content ||
    messages?.[messages.length - 1]?.content ||
    "";

  if (!effectiveApiKey) {
    const fallbackReply = generateContextualFallback(lastUserMsg, context);
    onStreamChunk?.(fallbackReply);
    return {
      reply: fallbackReply,
      usingFallback: true,
    };
  }

  const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
  const turnInput = buildCompactTurnInput(messages, context);

  const stream = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: turnInput,
    system_instruction: STATIC_SYSTEM_INSTRUCTION,
    generation_config: {
      thinking_level: "low",
      max_output_tokens: 700,
    },
    store: false,
    stream: true,
  });

  let accumulatedText = "";

  for await (const event of stream) {
    if (event.event_type === "step.delta") {
      if (event.delta?.type === "text" && event.delta.text) {
        accumulatedText += event.delta.text;
        onStreamChunk?.(accumulatedText);
      }
    } else if (event.event_type === "interaction.completed") {
      if (!accumulatedText && event.interaction?.steps) {
        for (const step of event.interaction.steps) {
          if (step.type === "model_output" && step.content) {
            for (const part of step.content) {
              if (part.type === "text" && part.text) {
                accumulatedText += part.text;
              }
            }
          }
        }
        if (accumulatedText) {
          onStreamChunk?.(accumulatedText);
        }
      }
    }
  }

  const finalReply =
    accumulatedText.trim() ||
    generateContextualFallback(lastUserMsg, context);

  return {
    reply: finalReply,
    usingFallback: false,
  };
}

function generateContextualFallback(
  question: string,
  context?: TeacherContextData
): string {
  const q = question.toLowerCase();

  const offlineNotice = `> ⚠️ **Çevrimdışı Şablon Modu (API Key Girilmedi):**\n> Şu anda gerçek Gemini AI yerine tarayıcı içi yerel şablon yanıtını görmektesiniz. Maestro AI'ın dersi, majör gam formülünü ve canlı tuşenizi doyurucu ve derinlemesine yanıtlayabilmesi için sağ üstteki **[🔑 API Key Gir]** butonuna tıklayarak ücretsiz Gemini API anahtarınızı tanımlayın.\n\n`;

  let analysisSection = "";
  if (context?.recentPlayedNotes && context.recentPlayedNotes !== "Henüz tuşa basılmadı") {
    analysisSection = `\n\n🎹 **Canlı MIDI Takip Özeti:**\nSon bastığınız notalar: \`${context.recentPlayedNotes}\`\n${
      context.exerciseStats ? `Egzersiz Durumu: **${context.exerciseStats}**` : ""
    }`;
  }

  if (
    q.includes("performans") ||
    q.includes("analiz") ||
    q.includes("egzersiz") ||
    q.includes("nasıl çaldım") ||
    q.includes("yorumla")
  ) {
    return `${offlineNotice}### 🎯 Performans ve Tuşe Değerlendirmesi (${context?.exerciseTitle || "Aktif Egzersiz"})
${
  analysisSection ||
  "\n⚠️ **Henüz piyanoda veya ekran klavyesinde nota çalmadınız.** Önce egzersizdeki notaları birkaç kez çalın, ardından tekrar bu butona basın!"
}

• **Tuş Ağırlığı (Velocity):** Roland FP-10 PHA-4 klavyede tüm parmakların dengeli (**mf: 70-90**) basmasına odaklanın.
• **Ritim & Legato:** Notalar arası geçişte önceki tuşu tam yeni tuşa basarken bırakın.`;
  }

  if (q.includes("fp-10") || q.includes("tuş ağırlığı") || q.includes("pha-4")) {
    return `${offlineNotice}### 🎹 Roland FP-10 PHA-4 Klavye İpuçları
• **Escapement:** Tuşa yavaşça basıldığında dipteki hafif kademe hissi kuyruklu piyano çekiç mekanizmasını simüle eder.
• **Tuş Sertliği:** Piyanoda **FUNCTION** tuşuna basılı tutarak dokunuş ağırlığını *Medium* seviyesinde tutmanız parmak tekniği için idealdir.${analysisSection}`;
  }

  return `${offlineNotice}### 🎼 Müzik Öğretmeni Rehberi (${context?.lessonTitle || "Genel Müzik Teorisi"})
• **Hedef Notalar:** \`${context?.targetNotes || "Serbest Çalışma"}\`
• **Algılanan Armoni:** \`${context?.activeHarmony || "Tek ses / Beklemede"}\`${analysisSection}

1. Notaları çalmadan önce isimleriyle (**Do - Re - Mi**) okuyun.
2. Gözünüzü portede tutarak parmak uçlarınızla tuşları hissedin.`;
}
