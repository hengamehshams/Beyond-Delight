import { GoogleGenAI, Type } from "@google/genai";

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
"cta_message": "A compelling call to action tailored to their score, inviting them to book a complimentary 15-minute 'Service Improvement Roadmap' session with your product/service design team."`;

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
      res.status(200).json(JSON.parse(responseText));
    } catch (parseError) {
      console.error("JSON Parse error:", parseError);
      res.status(500).json({ error: "Parse failed", raw: responseText });
    }
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ error: "Analysis failed", details: error?.message || String(error) });
  }
}
