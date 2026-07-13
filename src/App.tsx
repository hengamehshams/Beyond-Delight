import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import html2pdf from 'html2pdf.js';
import {
  ASSESSMENT_QUESTIONS,
  TIERS,
  type Question,
  type Answer,
  type BusinessInfo,
  type Scores,
  type Tier,
  INDUSTRIES
} from "./types";
import {
  Building2,
  Briefcase,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Printer,
  Calendar,
  RefreshCw,
  Award,
  TrendingUp,
  Settings2,
  Copy,
  Sparkles,
  Phone,
  HelpCircle,
  Clock,
  ShieldCheck,
  ChevronLeft
} from "lucide-react";

export default function App() {
  // App States
  const [step, setStep] = useState<"welcome" | "assessment" | "loading" | "dashboard">("welcome");
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: "",
    industry: "",
    teamSize: "۱ تا ۵ نفر"
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; industry?: string }>({});

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});

  // Loading Screen State
  const [loadingStage, setLoadingStage] = useState<number>(0);
  const loadingMessages = [
    "در حال ثبت و پردازش پاسخ‌های کسب‌وکار شما...",
    "تحلیل نقاط قوت در حوزه تجربه مشتری و بازار (CX)...",
    "بررسی گلوگاه‌های فرآیندی و عملیاتی...",
    "شبیه‌سازی سناریوهای مقیاس‌پذیری و رشد...",
    "در حال تدوین گزارش نهایی مشاور توسط هوش مصنوعی..."
  ];

  // Dashboard / Report States
  const [report, setReport] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Booking Widget State - REMOVED

  // Format dates for next 5 business days
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    let count = 0;
    while (count < 5) {
      today.setDate(today.getDate() + 1);
      // Skip Thursdays & Fridays (standard weekend in Iran)
      const day = today.getDay();
      if (day !== 4 && day !== 5) {
        const option = today.toLocaleDateString("fa-IR", {
          weekday: "long",
          month: "long",
          day: "numeric"
        });
        dates.push({
          raw: today.toISOString().split("T")[0],
          formatted: option
        });
        count++;
      }
    }
    return dates;
  }, []);

  const timeSlots = ["۰۹:۰۰ صبح", "۱۱:۳۰ صبح", "۱۴:۰۰ بعد از ظهر", "۱۶:۳۰ عصر"];

  // Scroll chat to bottom on new messages
  // Removed chat scroll useEffect

  // Handle loading step automation
  useEffect(() => {
    if (step === "loading") {
      const interval = setInterval(() => {
        setLoadingStage((prev) => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Form Validation & Submission
  const handleStartAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; industry?: string } = {};
    if (!businessInfo.name.trim()) errors.name = "لطفاً نام کسب‌وکار خود را وارد کنید.";
    if (!businessInfo.industry.trim()) errors.industry = "لطفاً حوزه فعالیت را مشخص کنید.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setStep("assessment");
    setCurrentQuestionIdx(0);
  };

  // Choice Selection
  const handleSelectChoice = (question: Question, choiceId: "A" | "B" | "C" | "D") => {
    const choice = question.choices.find((c) => c.id === choiceId)!;
    const answer: Answer = {
      questionId: question.id,
      questionText: question.text,
      choiceId: choiceId,
      choiceText: choice.text,
      score: choice.score
    };

    setAnswers((prev) => ({
      ...prev,
      [question.id]: answer
    }));
  };

  // Score Calculation
  const scores = useMemo<Scores>(() => {
    const result: Scores = { cx: 0, ops: 0, growth: 0 };
    (Object.values(answers) as Answer[]).forEach((ans) => {
      const q = ASSESSMENT_QUESTIONS.find((question) => question.id === ans.questionId);
      if (q) {
        result[q.axis] += ans.score;
      }
    });
    return result;
  }, [answers]);

  const totalScore = useMemo<number>(() => {
    return scores.cx + scores.ops + scores.growth;
  }, [scores]);

  const activeTier = useMemo<Tier>(() => {
    return TIERS.find((t) => totalScore >= t.min && totalScore <= t.max) || TIERS[0];
  }, [totalScore]);

  // Submit assessment & request AI report
  const handleSubmitAssessment = async () => {
    // Check that all 9 questions are answered
    if (Object.keys(answers).length < ASSESSMENT_QUESTIONS.length) {
      alert("لطفاً به تمام سوالات ارزیابی پاسخ دهید.");
      return;
    }

    setStep("loading");
    setLoadingStage(0);
    setIsGeneratingReport(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.values(answers),
          scores,
          totalScore,
          tier: activeTier,
          businessInfo
        })
      });

      if (!response.ok) {
        throw new Error("خطایی در ایجاد گزارش رخ داد. مجدداً تلاش کنید.");
      }

      const data = await response.json();
      setReport(data.report);
      setStep("dashboard");
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "برقراری ارتباط با سرور با خطا مواجه شد.");
      setStep("dashboard"); // Go to dashboard to show backup scores even if AI fails
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Download PDF Report
  const handleDownloadPDF = () => {
    const element = document.getElementById('executive-report');
    if (!element) return;
    const opt = {
      margin: 0.5,
      filename: 'گزارش-تشخیصی-کسب‌وکار.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    (html2pdf() as any).set(opt).from(element).save();
  };

  // Book complimentary session - REMOVED

  // Simple Markdown Inline & Block Renderer
  const renderMarkdown = (text: string) => {
    if (!text) {
      return (
        <div className="text-center py-8 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
          در حال ارزیابی...
        </div>
      );
    }

    const lines = text.split("\n");
    return lines.map((line, index) => {
      // Check headers
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-bold text-stone-800 mt-5 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {line.replace("### ", "").replace(/\*\*/g, "")}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl font-extrabold text-stone-950 mt-6 mb-3 border-r-4 border-emerald-600 pr-2 pb-0.5">
            {line.replace("## ", "").replace(/\*\*/g, "")}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-2xl font-black text-emerald-900 mt-8 mb-4 pb-2 border-b-2 border-stone-100">
            {line.replace("# ", "").replace(/\*\*/g, "")}
          </h1>
        );
      }

      // Blockquote
      if (line.startsWith("> ")) {
        return (
          <blockquote key={index} className="border-r-4 border-amber-500 bg-amber-50/50 pr-4 pl-3 py-3 my-4 text-stone-700 rounded-l font-medium">
            {parseInlineMarkdown(line.substring(2))}
          </blockquote>
        );
      }

      // Bullet list
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2);
        return (
          <ul key={index} className="list-disc list-inside pr-5 my-1.5 text-stone-700 leading-relaxed">
            <li className="marker:text-emerald-500">{parseInlineMarkdown(content)}</li>
          </ul>
        );
      }

      // Empty space
      if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }

      // Standard paragraph
      return (
        <p key={index} className="my-2.5 text-stone-700 leading-relaxed text-[15px]">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-bold text-indigo-950 bg-indigo-50 px-1 rounded text-indigo-900">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Helper colors
  const getTierColorClass = (color: string) => {
    switch (color) {
      case "rose":
        return "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10";
      case "emerald":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getAxisScoreColor = (score: number) => {
    if (score <= 3) return "text-rose-600 bg-rose-50 border-rose-100";
    if (score <= 6) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-indigo-600 bg-indigo-50 border-indigo-100";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans selection:bg-indigo-100" dir="rtl" id="sme-app-root">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3.5 shadow-sm" id="main-header">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Settings2 className="w-5.5 h-5.5 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">
               مشاور طراحی خدمات و محصول
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                تحلیلگر تخصصی ساختارهای تجربه مشتری و توسعه عملیاتی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium text-indigo-700 bg-indigo-50/80 px-2.5 py-1.5 rounded-lg border border-indigo-100/50">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>اتصال ایمن</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col items-center justify-center">
        
        <AnimatePresence mode="wait">
          
          {/* STEP 1: WELCOME SCREEN */}
          {step === "welcome" && (
            <motion.div
              key="welcome-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-md p-6 md:p-8"
              id="welcome-card"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-4 border border-indigo-100/80">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight">
                 مشاور طراحی خدمات و محصول
                </h2>
                <p className="text-slate-500 mt-2.5 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                  کسب‌وکارهای چابک، متناسب با تغییرات بازار، فرآیندهای خود را به‌طور مستمر بازطراحی می‌کنند. با پاسخ به ۹ سؤال کوتاه، نقاط قوت، گلوگاه‌های فرآیندی و مهم‌ترین فرصت‌های بهبود کسب‌وکارتان را شناسایی کنید.                
                </p>
              </div>

              {/* Onboarding Form */}
              <form onSubmit={handleStartAssessment} className="space-y-5" id="onboarding-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      نام کسب‌وکار شما:
                    </label>
                    <input
                      type="text"
                      placeholder="مانند: آژانس هواپیمایی سپهر، فروشگاه گل‌پت"
                      value={businessInfo.name}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                      className={`w-full bg-slate-50/50 border ${
                        formErrors.name ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                      } rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2`}
                    />
                    {formErrors.name && (
                      <p className="text-rose-500 text-xs font-medium mt-1 flex items-center gap-1">
                        <span>{formErrors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Industry / Sector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      حوزه فعالیت / صنعت:
                    </label>
                    <select
                      value={businessInfo.industry}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
                      className={`w-full bg-slate-50/50 border ${
                        formErrors.industry ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                      } rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2`}
                    >
                      <option value="">انتخاب کنید...</option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                    {formErrors.industry && (
                      <p className="text-rose-500 text-xs font-medium mt-1 flex items-center gap-1">
                        <span>{formErrors.industry}</span>
                      </p>
                    )}
                  </div>

                </div>

                {/* Team Size Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    تعداد پرسنل و اعضای تیم:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {["۱ تا ۵ نفر", "۶ تا ۱۵ نفر", "۱۶ تا ۵۰ نفر", "بالای ۵۰ نفر"].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setBusinessInfo({ ...businessInfo, teamSize: size })}
                        className={`py-2.5 text-xs font-medium rounded-xl border transition-all ${
                          businessInfo.teamSize === size
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 hover:scale-[1.01]"
                  id="btn-start"
                >
                  <span>شروع ارزیابی تشخیصی کسب‌وکار</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                <span>توسعه یافته بر پایه متدولوژی چابک و تفکر طراحی (Design Thinking)</span>
                <span>زمان حدودی پاسخ‌دهی: ۵ دقیقه</span>
              </div>
            </motion.div>
          )}

          {/* STEP 2: ASSESSMENT QUESTIONNAIRE */}
          {step === "assessment" && (
            <motion.div
              key="assessment-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-md p-5 md:p-7 flex flex-col"
              id="assessment-card"
            >
              {/* Progress and Axis Indicator */}
              {(() => {
                const question = ASSESSMENT_QUESTIONS[currentQuestionIdx];
                const answeredCount = Object.keys(answers).length;
                const progressPercent = Math.round((answeredCount / ASSESSMENT_QUESTIONS.length) * 100);

                let axisThemeColor = "bg-blue-600";
                let axisBgColor = "bg-blue-50 text-blue-700 border-blue-100";
                if (question.axis === "ops") {
                  axisThemeColor = "bg-purple-600";
                  axisBgColor = "bg-purple-50 text-purple-700 border-purple-100";
                } else if (question.axis === "growth") {
                  axisThemeColor = "bg-orange-500";
                  axisBgColor = "bg-orange-50 text-orange-700 border-orange-100";
                }

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${axisBgColor}`}>
                          {question.axisLabel}
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium">
                          سوال {currentQuestionIdx + 1} از {ASSESSMENT_QUESTIONS.length}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {progressPercent}٪ پاسخ داده شده
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
                      <div
                        className={`h-full ${axisThemeColor} transition-all duration-300`}
                        style={{ width: `${progressPercent}٪` }}
                      ></div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 mb-8">
                      <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-6">
                        {question.text}
                      </h3>

                      {/* Choices Grid */}
                      <div className="space-y-3">
                        {question.choices.map((choice) => {
                          const isSelected = answers[question.id]?.choiceId === choice.id;
                          return (
                            <button
                              key={choice.id}
                              type="button"
                              onClick={() => handleSelectChoice(question, choice.id)}
                              className={`w-full text-right p-4 rounded-xl border transition-all flex items-start gap-4 hover:bg-slate-50/50 ${
                                isSelected
                                  ? "bg-indigo-50/20 border-indigo-600 ring-1 ring-indigo-600 shadow-sm"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {choice.id === "A" ? "الف" : choice.id === "B" ? "ب" : choice.id === "C" ? "ج" : "د"}
                              </span>
                              <div className="flex-1">
                                <p className={`text-sm leading-relaxed ${isSelected ? "text-slate-950 font-medium" : "text-slate-700"}`}>
                                  {choice.text}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                        disabled={currentQuestionIdx === 0}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                          currentQuestionIdx === 0
                            ? "border-slate-100 text-slate-300 cursor-not-allowed"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>سوال قبلی</span>
                      </button>

                      {currentQuestionIdx < ASSESSMENT_QUESTIONS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!answers[question.id]) {
                              alert("لطفاً یک گزینه را برای این سوال انتخاب کنید.");
                              return;
                            }
                            setCurrentQuestionIdx((p) => p + 1);
                          }}
                          className="px-5 py-2.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-850 text-white transition-all flex items-center gap-1.5"
                        >
                          <span>سوال بعدی</span>
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitAssessment}
                          disabled={!answers[question.id]}
                          className={`px-6 py-3 text-sm font-extrabold rounded-xl text-white transition-all flex items-center gap-1.5 shadow-md ${
                            !answers[question.id]
                              ? "bg-slate-300 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/15 hover:scale-[1.01]"
                          }`}
                        >
                          <span>ثبت و دریافت گزارش تشخیص</span>
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* STEP 3: LOADING CONSULTANCY SCREEN */}
          {step === "loading" && (
            <motion.div
              key="loading-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-md p-8 text-center flex flex-col items-center"
              id="loading-card"
            >
              <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 relative">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-600 border-t-transparent animate-ping opacity-25"></div>
              </div>

              <h3 className="text-lg font-extrabold text-slate-800 mb-2">
                در حال پردازش داده‌های سازمانی شما
              </h3>
              <p className="text-slate-500 text-xs mb-8">
                مشاور ارشد با بررسی ماتریس امتیازات، در حال پیاده‌سازی گام‌های مربی‌گری است.
              </p>

              {/* Staggered process tracker */}
              <div className="w-full space-y-4 text-right mb-6">
                {loadingMessages.map((msg, idx) => {
                  const isCurrent = idx === loadingStage;
                  const isCompleted = idx < loadingStage;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-indigo-50/50 border-indigo-200 text-indigo-850 font-semibold"
                          : isCompleted
                          ? "bg-slate-50 border-transparent text-slate-400"
                          : "border-transparent text-slate-300"
                      }`}
                    >
                      <div className="shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-indigo-600" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                        )}
                      </div>
                      <span className="text-xs">{msg}</span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${((loadingStage + 1) / loadingMessages.length) * 100}%` }}
                ></div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: DIAGNOSTIC DASHBOARD & EXECUTIVE REPORT */}
          {step === "dashboard" && (
            <motion.div
              key="dashboard-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full space-y-6 pb-12"
              id="dashboard-container"
            >
              
              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="summary-section">
                
                {/* Score Summary Badge */}
                <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  {/* Left Circle Dial */}
                  <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        stroke="#f1f5f9"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="54"
                        stroke={activeTier.color === "emerald" ? "#4f46e5" : activeTier.color === "amber" ? "#d97706" : "#e11d48"}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 54}
                        strokeDashoffset={2 * Math.PI * 54 * (1 - totalScore / 27)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-800">{totalScore}</span>
                      <span className="text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-0.5 mt-0.5">از ۲۷ امتیاز</span>
                    </div>
                  </div>

                  {/* Right Details */}
                  <div className="flex-1 text-center md:text-right">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
                      <span className="text-xs text-slate-500 font-semibold">وضعیت ارزیابی کسب‌وکار:</span>
                      <span className={`text-[11px] font-bold py-0.5 px-2.5 rounded-full border ${getTierColorClass(activeTier.color)}`}>
                        {activeTier.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-800">
                      {businessInfo.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      حوزه فعالیت: {businessInfo.industry} • اعضای تیم: {businessInfo.teamSize}
                    </p>
                    <p className="text-slate-600 text-xs leading-relaxed mt-3 border-t border-slate-100 pt-3">
                      {activeTier.description}
                    </p>
                  </div>
                </div>

                {/* Print & Action Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">اقدامات مدیریتی</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      این گزارش یک ابزار تشخیصی برای هدایت استراتژیک شرکت شماست. می‌توانید آن را به عنوان سند مرجع چاپ یا ذخیره کنید.
                    </p>
                  </div>
                  <div className="space-y-2 mt-4">
                    <button
                      onClick={() => handleDownloadPDF()}
                      className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>چاپ و ذخیره فایل گزارش به صورت PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(report);
                        alert("متن گزارش با موفقیت کپی شد.");
                      }}
                      className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>کپی کل متن گزارش تحلیل</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Three Axes Detailed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="axes-section">
                
                {/* Axis 1: CX */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">تجربه مشتری و بازار (CX)</span>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${getAxisScoreColor(scores.cx)}`}>
                        {scores.cx} از ۹
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(scores.cx / 9) * 100}%` }}></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-100">
                    {scores.cx <= 3 
                      ? "نیاز مبرم به بازنگری اساسی در هویت ارزش پیشنهادی و فرآیند دریافت بازخوردها." 
                      : scores.cx <= 6 
                      ? "پایه‌های خوب برقرار است؛ تمرکز بر ایجاد مستمر استانداردهای یکنواخت در کلیه شعبه‌ها/بخش‌ها." 
                      : "قدرتمند و پیشگام؛ مشتری مداری پویا و متمایز وجود دارد."}
                  </p>
                </div>

                {/* Axis 2: Operations */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Settings2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">کارایی عملیاتی</span>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${getAxisScoreColor(scores.ops)}`}>
                        {scores.ops} از ۹
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${(scores.ops / 9) * 100}%` }}></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-100">
                    {scores.ops <= 3 
                      ? "فرآیندهای دستی منجر به اتلاف شدید منابع مالی و زمانی شده است؛ استانداردسازی ضروری است." 
                      : scores.ops <= 6 
                      ? "دستورالعمل‌ها وجود دارند اما اتوماسیون کارهای تکراری می‌تواند بهره‌وری تیم را به شدت جهش دهد." 
                      : "سیستم فرآیندها بهینه و یکپارچه است؛ عملکرد به شدت شفاف و کم اتلاف."}
                  </p>
                </div>

                {/* Axis 3: Growth */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">رشد و مقیاس‌پذیری</span>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${getAxisScoreColor(scores.growth)}`}>
                        {scores.growth} از ۹
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-550 rounded-full" style={{ width: `${(scores.growth / 9) * 100}%` }}></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-100">
                    {scores.growth <= 3 
                      ? "جذب مشتری ناپایدار است؛ وابستگی شدید به معرف‌های تصادفی به شدت مقیاس‌پذیری را ناممکن کرده." 
                      : scores.growth <= 6 
                      ? "پتانسیل خوب برای مقیاس‌پذیری وجود دارد؛ نیازمند کانال‌های فروش منظم با قابلیت تکرارپذیری." 
                      : "مدل کسب‌وکار آماده رشد تصاعدی و بدون نیاز به افزایش شدید ساختار هزینه‌ها."}
                  </p>
                </div>

              </div>

              {/* Main Report & Interaction layout (Split Screen desktop, Stack mobile) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="report-interaction-grid">
                
                {/* Right Column: AI Consultant Report */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col" id="executive-report">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800">گزارش تشخیصی و نقشه راه مشاور</h3>
                      <p className="text-xs text-slate-500">تحلیل کاملاً اختصاصی سازمانی تولید شده توسط مشاور هوش مصنوعی</p>
                    </div>
                  </div>

                  {/* AI Report Markdown */}
                  <div className="markdown-body text-slate-800 pr-1 select-text">
                    {renderMarkdown(report)}
                  </div>
                </div>
              </div>



              {/* Back to welcome */}
              <div className="text-center pt-4">
                <button
                  onClick={() => setStep("welcome")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>انجام مجدد ارزیابی تشخیصی</span>
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-100 py-5 px-4 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
          <span>ابزار ارزیابی و تشخیص وضعیت کسب‌وکار. © ۱۴۰۵</span>
        </div>
      </footer>

    </div>
  );
}
