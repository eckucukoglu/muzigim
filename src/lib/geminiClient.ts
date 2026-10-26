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

export async function askMaestroAI({
  messages,
  apiKey,
  context,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  apiKey?: string;
  context?: TeacherContextData;
}): Promise<{ reply: string; usingFallback: boolean }> {
  const effectiveApiKey =
    apiKey?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() || "";

  const systemInstruction = `Sen "Maestro AI" adında, konservatuvar düzeyinde müzik teorisi, kulak eğitimi, armoni, doğaçlama ve piyano pedagojisi uzmanlığına sahip, sabırlı, ilham verici ve Türkçe konuşan bir özel piyano & müzik öğretmenisin.

Öğrencinin enstrümanı: **Roland FP-10 BK (88 tuşlu PHA-4 Standard fildişi hissiyatlı çekiç aksiyonlu dijital stage piano)**. USB-B -> USB-A/C kablosu ile bu uygulamaya bağlı.
Roland FP-10 hakkında teknik bilgin tamdır:
- PHA-4 Standard klavye (Escapement özellikli, tuş ağırlığı Function + tuş kombinasyonlarıyla 5 kademeli ayarlanabilir).
- SuperNATURAL Piano ses motoru (velocity değişimine göre sadece ses yüksekliği değil, harmonik parlaklık da değişir).
- CC64 Sustain pedalı desteği.

Görevlerin:
1. Öğrencinin o an bulunduğu ders, ekranda gördüğü nota/porte veya az önce piyanoda bastığı tuşlar (MIDI verileri, velocity/tuş şiddeti, ritim süreleri) hakkında sorduğu her soruyu net, samimi, motive edici ve anlaşılır bir Türkçe ile yanıtla.
2. Müzik teorisini kuru ezber olarak değil; "Neden bu iki ses birlikte böyle hissettiriyor?", "Zihnimdeki melodiyi tuşlara nasıl aktarırım?" perspektifiyle anlat.
3. Notalardan bahsederken hem Türkçe (Do, Re, Mi, Fa, Sol, La, Si) hem de parantez içinde uluslararası harf karşılıklarını (C, D, E, F, G, A, B) kullan ki öğrencinin iki sisteme de hakimiyeti gelişsin.
4. Eğer öğrenci egzersiz performansı veya bastığı notalar hakkında geri bildirim isterse, aşağıda verilen canlı MIDI telemetrisini (bastığı notalar, tuş vuruş şiddeti/velocity değerleri ve notalar arası süre/ritim farkları) somut olarak yorumla.

ŞU ANKİ UYGULAMA VE PİYANO BAĞLAMI (CANLI TELEMETRİ):
- Aktif Bölüm: ${context?.activeTab || "Dersler"}
- Aktif Ders: ${context?.lessonTitle || "Belirtilmedi"} (${context?.lessonSummary || ""})
- Aktif Egzersiz: ${context?.exerciseTitle || "Yok"}
- Hedef Egzersiz Notaları: ${context?.targetNotes || "Yok"}
- Egzersiz Durumu / İstatistik: ${context?.exerciseStats || "Henüz tamamlanmadı"}
- Şu Anda Basılı Tuşlar / Algılanan Armoni: ${context?.activeHarmony || "Basılı tuş yok"}
- Sustain Pedalı: ${context?.sustainPedal ? "Basılı (Açık)" : "Serbest"}
- Öğrencinin Piyanoda Son Bastığı Notalar (Kronolojik MIDI Kaydı): ${
    context?.recentPlayedNotes || "Henüz tuşa basılmadı"
  }

Yanıtlarını okunaklı maddeler ve kısa paragraflar halinde, doğrudan öğrenciye hitap ederek yaz.`;

  if (!effectiveApiKey) {
    const lastUserMsg = messages?.[messages.length - 1]?.content || "";
    return {
      reply: generateContextualFallback(lastUserMsg, context),
      usingFallback: true,
    };
  }

  const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return {
    reply: response.text || "Şu anda yanıt oluşturulamadı, lütfen tekrar deneyin.",
    usingFallback: false,
  };
}

function generateContextualFallback(
  question: string,
  context?: TeacherContextData
): string {
  const q = question.toLowerCase();

  let analysisSection = "";
  if (context?.recentPlayedNotes && context.recentPlayedNotes !== "Henüz tuşa basılmadı") {
    analysisSection = `\n\n🎹 **Canlı MIDI Takip Özeti:**\nSon bastığınız notaları görüyorum: \`${context.recentPlayedNotes}\`.\n${
      context.exerciseStats ? `Egzersiz İlerleme Durumu: **${context.exerciseStats}**` : ""
    }`;
  }

  if (q.includes("performans") || q.includes("analiz") || q.includes("egzersiz") || q.includes("nasıl çaldım")) {
    return `### 🎯 Performans ve Tuşe Değerlendirmesi (${context?.exerciseTitle || "Aktif Egzersiz"})

Roland FP-10'unuzdan gelen son MIDI verilerinizi inceledim:${
      analysisSection || "\n*(Henüz piyanoda bir nota dizisi çalmadınız. Önce egzersizi birkaç nota çalarak deneyin!)*"
    }

1. **Tuş Ağırlığı (Velocity) Kontrolü:** Roland FP-10'un PHA-4 klavyesinde özellikle **4. (yüzük) ve 5. (serçe) parmaklar** doğal anatomimiz gereği 1-2-3. parmaklardan daha zayıf basma eğilimindedir. Bileğinizi kasmadan, kol ağırlığınızı hafifçe dış parmaklara doğru yönlendirerek tüm notaların **mf (70-90 velocity)** aralığında dengeli çıkmasına odaklanın.
2. **Ritim ve Bağlı Çalma (Legato):** Bir tuştan diğerine geçerken ilk tuşu tam ikinci tuşa bastığınız anda bırakın; böylece sesler birbirinin içine su gibi akar.

> 💡 **Not:** Canlı **Gemini AI** derinlemesine analizini aktif etmek için sağ üst köşedeki **⚙️ Ayarlar & API** butonundan ücretsiz Gemini API anahtarınızı girebilirsiniz!`;
  }

  if (q.includes("fp-10") || q.includes("tuş ağırlığı") || q.includes("pha-4")) {
    return `### 🎹 Roland FP-10 PHA-4 Klavye İpuçları

Yeni **Roland FP-10 BK** piyanonuz hayırlı olsun! Kendi sınıfındaki en gerçekçi çekiç aksiyonlu mekanizmalardan biri olan **PHA-4 Standard** klavyeye sahipsiniz:

- **Escapement (Çekiç Kurtulma Hissi):** Tuşa çok yavaşça sonuna kadar basarsanız, dibe yakın noktada hafif bir "tık/kademe" hissedersiniz. Bu, gerçek kuyruklu piyanoda çekicin telden serbest kaldığı noktadır.
- **Tuş Hassasiyeti Ayarı:** Piyanonuzun solundaki **FUNCTION** tuşuna basılı tutarak ilgili tuşlardan dokunuş sertliğini (*Super Light, Light, Medium, Heavy, Super Heavy*) değiştirebilirsiniz. Doğru parmak kası gelişimi için varsayılan **Medium (Orta)** ayarda kalmanızı öneririm.${analysisSection}

> 💡 **İpucu:** Sağ üstteki **⚙️ Ayarlar & API** menüsünden Gemini API anahtarınızı girdiğinizde benimle sınırsız ve tam bağlamlı sohbet edebilirsiniz.`;
  }

  return `### 🎼 Müzik Öğretmeni Rehberi (${context?.lessonTitle || "Genel Müzik Teorisi"})

Sorduğunuz soru (**"${question}"**) üzerinde çalışırken şu temel ilkeleri aklınızda tutabilirsiniz:

- **Hedef Egzersiz Notaları:** \`${context?.targetNotes || "Serbest Çalışma"}\`
- **Şu An Algılanan Armoni:** \`${context?.activeHarmony || "Tek ses / Beklemede"}\`${analysisSection}

**Nasıl Çalışmalısınız?**
1. Önce notaları piyanoda çalmadan önce **sesli olarak veya içinizden isimleriyle (Do - Re - Mi...)** okuyun.
2. Ardından gözünüzü tuşlardan ziyade ekrandaki portede tutarak parmak uçlarınızın tuşları hissetmesine izin verin.
3. Çaldığınız her notanın bir önceki notayla olan duygusal bağını (uzaklaşıyor mu, eve mi dönüyor?) dinleyin.

> 🔑 **Tam Gemini AI Entegrasyonu İçin:** Sağ üstteki **⚙️ Ayarlar & API** butonuna tıklayarak Gemini API anahtarınızı (\`AIza...\`) kaydedin; böylece o anki sorunuzu ve canlı MIDI verilerinizi doğrudan Gemini modeliyle yanıtlayabilirim!`;
}
