import { GoogleGenAI, Type } from "@google/genai";
import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  // CORS for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { businessInfo, responses } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured" });
  }

  // Calculate score
  const scores: Record<string, number> = responses;
  const q1 = scores['Q1'] || 0;
  const q2 = scores['Q2'] || 0;
  const q3 = scores['Q3'] || 0;
  const q4 = scores['Q4'] || 0;
  const q5 = scores['Q5'] || 0;
  const q6 = scores['Q6'] || 0;
  const q7 = scores['Q7'] || 0;
  const q8 = scores['Q8'] || 0;
  const q9 = scores['Q9'] || 0;
  const q10 = scores['Q10'] || 0;

  const user_research_and_data = q1 + q8;
  const customer_journey_and_ux = q2 + q3 + q6;
  const service_operations_and_staff = q4 + q5 + q9;
  const design_agility_and_testing = q7 + q10;

  const totalScore = user_research_and_data + customer_journey_and_ux + service_operations_and_staff + design_agility_and_testing;
  
  let tierLabel = "";
  if (totalScore <= 10) tierLabel = "محصول‌محور / سنتی (نیاز فوری به بازطراحی پایه)";
  else if (totalScore <= 20) tierLabel = "حالت گذار (نیاز به بهینه‌سازی نقاط تماس و CRO)";
  else tierLabel = "کاربرمحور / چابک (آماده برای مقیاس‌پذیری نوآورانه)";

  const ai = new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const prompt = `You are an elite Product and Service Design Consultant tailored for SMEs (Small and Medium Enterprises), especially traditional businesses transitiong to or optimizing their modern/digital channels. Your core mission is to analyze the user's business based on their answers to a 10-question Service Design Maturity assessment and generate a deeply insightful, empathetic, and highly actionable diagnostic report.

### Assessment Philosophy & Business Importance (Why this matters):
Traditional businesses often experience drops in sales, customer complaints, or internal chaos, but they blame it on "market conditions" or "lazy staff." Your role is to show them that these are actually "Service Design Flaws." Every operational bottleneck or lost customer is a result of a poorly designed customer journey, bad communication of value, or a broken internal process. Your analysis must connect their everyday business pain points directly to design solutions (like Customer Journey Mapping, Service Blueprinting, or Conversion Optimization) without using heavy startup jargon in Persian. Explain the solutions in a way a traditional merchant, shop owner, or local service provider can easily understand.

### Scoring Architecture:
- 10 Questions focusing on 4 Core Dimensions:
  1. User Research & Data (Q1, Q8)
  2. Customer Journey & UX (Q2, Q3, Q6)
  3. Service Operations & Staff (Q4, Q5, Q9)
  4. Design Agility & Testing (Q7, Q10)
- Total Score: Max 30 points.
- Choice A = 0 points | Choice B = 1 point | Choice C = 2 points | Choice D = 3 points.
- Score Ranges:
  - 0-10: Traditional/Product-Centric State (Requires urgent foundational Service Redesign)
  - 11-20: Transitional State (Requires Touchpoint Optimization, and removing purchase friction)
  - 21-30: Customer-Centric / Agile State (Ready for Advanced Service Innovation & Scaling)

### Tone and Personality:
- Speak in fluent, warm, respectful, and professional Persian (Farsi).
- Avoid academic, technical, or startup jargon (No "MVP", "UX", "Launch", "Prototype" in the Persian output unless translated/explained simply).
- Use the "Social Desirability Bias" correction: frame weaknesses as "tooling, structural, or capacity limits" rather than managerial failures.

Business info: ${JSON.stringify(businessInfo)}
Total Score: ${totalScore} / 30
Tier: ${tierLabel}
Scores per Dimension:
- User Research & Data (Q1, Q8): ${user_research_and_data} / 6
- Customer Journey & UX (Q2, Q3, Q6): ${customer_journey_and_ux} / 9
- Service Operations & Staff (Q4, Q5, Q9): ${service_operations_and_staff} / 9
- Design Agility & Testing (Q7, Q10): ${design_agility_and_testing} / 6
Individual Question Scores (0-3): ${JSON.stringify(scores)}

Provide a diagnostic report in PERSIAN language. Do NOT include any markdown wrappers like \`\`\`json or any trailing text. Use HTML tags like <b>, <ul>, and <li> inside Persian text values for rich UI rendering on the website. Customize the examples inside greeting_summary and detailed_analysis slightly based on the provided "business_industry" (e.g., use terms like 'بیمار' for healthcare, or 'خریدار' for retail).

Return the output in EXACT JSON format matching the schema with the following requirements for text fields:
"greeting_summary": "An encouraging, professional, and deeply empathetic Persian greeting summarizing their score and mindset tier in everyday business language."
"detailed_analysis": "A high-value analysis of their service/process bottlenecks. Highlight the 1 or 2 biggest friction points in their customer experience or internal flow based on their lowest scores. Explain the issues and their solutions using clear, non-jargon business language (e.g. explain Service Blueprinting as 'نقشه فرآیند پشت صحنه کار')."
"cta_message": "A compelling call to action tailored to their score, inviting them to connect via WhatsApp to book a 45-minute 'Service Improvement Roadmap' session with your service design team. Do not use the word 'رایگان' or 'free'."`;

  try {
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                total_score: { type: Type.NUMBER },
                tier_label: { type: Type.STRING },
                scores_per_dimension: {
                  type: Type.OBJECT,
                  properties: {
                    user_research_and_data: { type: Type.NUMBER },
                    customer_journey_and_ux: { type: Type.NUMBER },
                    service_operations_and_staff: { type: Type.NUMBER },
                    design_agility_and_testing: { type: Type.NUMBER }
                  }
                },
                greeting_summary: { type: Type.STRING },
                detailed_analysis: { type: Type.STRING },
                cta_message: { type: Type.STRING }
              },
              required: ["total_score", "tier_label", "scores_per_dimension", "greeting_summary", "detailed_analysis", "cta_message"]
            }
          }
        });
        break; // Success
      } catch (e: any) {
        if (e.status === 503 || String(e).includes('503')) {
          retries--;
          if (retries === 0) throw e;
          await new Promise(res => setTimeout(res, 2000));
        } else {
          throw e;
        }
      }
    }
    
    const responseText = response?.text || "{}";
    console.log("Raw AI Response:", responseText);

    try {
      const resultData = JSON.parse(responseText);

      // Try sending an email to hengamehshams1995@gmail.com
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: `"Beyond Delight" <${process.env.SMTP_USER}>`,
            to: "hengamehshams1995@gmail.com",
            subject: `گزارش جدید: ${businessInfo.name || 'کاربر ناشناس'} - ${businessInfo.industry || 'بدون حوزه'}`,
            html: `
              <h2>مشخصات کاربر:</h2>
              <ul>
                <li><strong>نام:</strong> ${businessInfo.name || '-'}</li>
                <li><strong>ایمیل:</strong> ${businessInfo.email || req.body.email || '-'}</li>
                <li><strong>سمت سازمانی:</strong> ${businessInfo.role || '-'}</li>
                <li><strong>حوزه فعالیت:</strong> ${businessInfo.industry === 'سایر کسب‌وکارها' ? businessInfo.otherIndustry : businessInfo.industry}</li>
                <li><strong>تعداد کارمندان:</strong> ${businessInfo.employees || '-'}</li>
              </ul>
              <hr />
              <h2>خلاصه گزارش:</h2>
              <p><strong>امتیاز کل:</strong> ${resultData.total_score} از 30</p>
              <p><strong>سطح بلوغ:</strong> ${resultData.tier_label}</p>
              <h3>تحلیل:</h3>
              <p>${resultData.greeting_summary}</p>
              <div>${resultData.detailed_analysis}</div>
              <h3>گام بعدی:</h3>
              <p>${resultData.cta_message}</p>
              <hr />
              <h3>امتیازات به تفکیک:</h3>
              <pre>${JSON.stringify(resultData.scores_per_dimension, null, 2)}</pre>
            `
          });
          console.log("Email sent successfully.");
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      } else {
        console.warn("SMTP credentials not configured, skipping email delivery.");
      }

      // Send to Google Sheets Webhook
      const DEFAULT_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbw-qjYKQcJ2ejhgTHk08gOKsV4gn7-xKkGSp122M_Ckk-eqqy56R5WcN2veuhL5ge-h/exec";
      const sheetWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.GOOGLE_SHEETS_WEBHOOK_URL || DEFAULT_SHEET_WEBHOOK;
      if (sheetWebhookUrl) {
        try {
          const cleanHtml = (html: string) => {
            if (!html) return '';
            return html
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n')
              .replace(/<\/li>/gi, '\n')
              .replace(/<li[^>]*>/gi, '• ')
              .replace(/<[^>]+>/g, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
          };

          const sheetPayload = {
            createdAt: new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' }),
            name: businessInfo.name || 'نامشخص',
            email: businessInfo.email || req.body.email || '-',
            role: businessInfo.role || '-',
            industry: businessInfo.industry === 'سایر کسب‌وکارها' ? (businessInfo.otherIndustry || 'سایر') : (businessInfo.industry || '-'),
            employees: businessInfo.employees || '-',
            totalScore: resultData.total_score,
            tierLabel: resultData.tier_label,
            greetingSummary: cleanHtml(resultData.greeting_summary),
            detailedAnalysis: cleanHtml(resultData.detailed_analysis)
          };

          // Send a single POST request to Google Apps Script Webhook
          const postResponse = await fetch(sheetWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(sheetPayload),
            redirect: 'follow'
          });
          const postText = await postResponse.text();
          console.log(`Google Sheets POST response status: ${postResponse.status}, body: ${postText.slice(0, 150)}`);

        } catch (sheetError) {
          console.error("Failed to send data to Google Sheets:", sheetError);
        }
      } else {
        console.warn("GOOGLE_SHEET_WEBHOOK_URL not set in environment variables.");
      }

      res.status(200).json(resultData);
    } catch (parseError) {
      console.error("JSON Parse error:", parseError);
      res.status(500).json({ error: "Parse failed", raw: responseText });
    }
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ error: "Analysis failed", details: error?.message || String(error) });
  }
}
