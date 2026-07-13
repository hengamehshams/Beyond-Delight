import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please set it in your environment variables via Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Persian consultant system prompt
const SYSTEM_INSTRUCTION = `
شما یک ابزار تحلیل‌گر وضعیت کسب‌وکار هستید. هدف شما تحلیل پاسخ‌های کاربر به یک ارزیابی ۹ سوالی و ارائه یک گزارش عارضه‌یابی مستقل و تخصصی است.

ساختار گزارش باید دقیقاً و تنها شامل دو بخش زیر باشد:

۱. گزارش تشخیصی کسب‌وکار (Business Diagnosis)
۲. نقشه راه پیشنهادی (Recommended Roadmap)

قوانین نگارش و ساختار:
- گزارش را مستقیماً با عنوان «گزارش تشخیصی کسب‌وکار» یا «تحلیل وضعیت کسب‌وکار» آغاز کنید.
- هیچ معرفی، عنوان نقش، نام‌گذاری، یا خطاب شخصی (مانند جناب آقای/سرکار خانم) استفاده نکنید.
- از به کار بردن کاراکترهای *** یا سایر فرمت‌های فانتزی خودداری کنید.
- لحن گزارش باید حرفه‌ای، تخصصی، طبیعی و به دور از زبان تبلیغاتی باشد.
- تحلیل‌ها باید منطقی، مبتنی بر داده‌های ارائه شده و فاقد قضاوت قطعی باشند.
- به هیچ عنوان «دستاورد سریع»، «دعوت به اقدام»، «رزرو جلسه»، «مشاوره»، «تماس» یا «همکاری» را مطرح نکنید.
- گزارش نباید حاوی هیچ‌گونه جمع‌بندی تبلیغاتی یا دعوت به اقدامات خارج از تحلیل باشد.
- خروجی نهایی باید تنها شامل تحلیل وضعیت فعلی و مسیر بهبود پیشنهادی باشد.
`;

app.post("/api/analyze", async (req, res) => {
  try {
    const { answers, scores, totalScore, tier, businessInfo } = req.body;

    if (!answers || !scores) {
      return res.status(400).json({ error: "اطلاعات ارسالی ارزیابی ناقص است." });
    }

    const ai = getGeminiClient();

    const userContextPrompt = `
مشخصات کسب‌وکار کاربر:
- نام کسب‌وکار: ${businessInfo?.name || "ثبت نشده"}
- حوزه فعالیت: ${businessInfo?.industry || "ثبت نشده"}
- تعداد پرسنل: ${businessInfo?.teamSize || "ثبت نشده"}

پاسخ‌های سوالات (از ۹ سوال):
${answers.map((ans: any, index: number) => `سوال ${index + 1}: ${ans.questionText}\nگزینه انتخابی: ${ans.choiceText} (امتیاز: ${ans.score})`).join("\n\n")}

امتیازات محورها:
- تجربه مشتری و بازار (CX): ${scores.cx} از ۹ امتیاز
- کارایی عملیاتی (Operations): ${scores.ops} از ۹ امتیاز
- رشد و مقیاس‌پذیری (Growth): ${scores.growth} از ۹ امتیاز

امتیاز کل کسب‌وکار: ${totalScore} از ۲۷ امتیاز
سطح کسب‌وکار: ${tier.label} (${tier.title})

لطفاً بر اساس این اطلاعات، گزارش تحلیل تشخصی اختصاصی، فوق‌العاده کاربردی و همدلانه خود را به زبان فارسی تهیه کنید.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userContextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ report: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: "خطایی در برقراری ارتباط با موتور هوش مصنوعی رخ داده است.",
      details: error.message 
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, reportContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: "پیام کاربر دریافت نشد." });
    }

    const ai = getGeminiClient();

    const chatContextPrompt = `
شما یک ابزار تحلیل‌گر وضعیت کسب‌وکار هستید. هدف شما پاسخ به سوالات مدیر کسب‌وکار بر اساس گزارش عارضه‌یابی قبلی است.

گزارش تشخیصی قبلی که به کاربر ارائه شده است به شرح زیر است:
=== شروع گزارش ===
${reportContext || "گزارش قبلی یافت نشد."}
=== پایان گزارش ===

تاریخچه گفتگوهای قبلی در این جلسه:
${(history || []).map((msg: any) => `${msg.sender === "user" ? "کاربر" : "تحلیل‌گر"}: ${msg.text}`).join("\n")}

پیام جدید کاربر:
"${message}"

لطفاً به پیام کاربر به صورت حرفه‌ای، تخصصی، مستقیم و بدون اشاره به نقش یا شخصیت پاسخ دهید. از لحن تبلیغاتی، تشویقیِ کاذب، یا توصیه به تماس/مشاوره پرهیز کنید. پاسخ شما باید کوتاه، متمرکز و مبتنی بر تحلیل باشد.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatContextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ 
      error: "خطایی در فرستادن پیام رخ داد.",
      details: error.message 
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
