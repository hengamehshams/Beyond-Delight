/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BusinessInfo, Question, AnalysisReport } from './types';
import { Activity, ArrowRight, ArrowLeft, User, Mail, UserCheck, Briefcase, Users, Target, CheckCircle2, Loader2, Sparkles, PieChart, CalendarCheck, FileText, ChevronLeft, ChevronRight, BarChart, Zap, Printer, Copy, Check, MessageCircle } from 'lucide-react';

const QUESTIONS: Question[] = [
  { 
    id: 'Q1', category: 'User Research', text: 'وقتی میخواهید محصول یا خدمات جدیدی ارائه دهید، چطور مطمئن میشوید مشتریان واقعاً از آن استقبال میکنند؟',
    options: [
      { value: 'A', label: 'بر اساس تجربه سالها کار در بازار و سلیقه خودمان تصمیم میگیریم؛ چون معمولاً سلیقه مشتری را خوب میشناسیم.', points: 0 },
      { value: 'B', label: 'به آمار فروش کلی یا میزان استقبال رقبایمان در بازار نگاه میکنیم، اما فرصت عمیق شدن در علت رفتارهای مشتری را نداریم.', points: 1 },
      { value: 'C', label: 'گاهی با چند مشتری وفادار و قدیمی گپ میزنیم یا نظرسنجی میگذاریم، اما این کار به صورت روال همیشگی و علمی نیست.', points: 2 },
      { value: 'D', label: 'روش مشخصی برای گفتگو با مشتریان مختلف (حتی مشتریان جدید یا ناراضی) داریم و قبل از صرف هر هزینهای، نیازهای واقعی آنها را میسنجیم.', points: 3 },
    ]
  },
  { 
    id: 'Q2', category: 'Customer Journey', text: 'فرآیند آشنایی مشتری با شما، ثبت سفارش، تحویل نهایی محصول یا انجام خدمات چقدر برای او روان و بی‌دردسر پیش میرود؟',
    options: [
      { value: 'A', label: 'به دلیل ماهیت کار ما، فرآیند خرید به هماهنگی‌های دستی زیادی نیاز دارد؛ مشتریان سوالات مکرری میپرسند و بخش زیادی از کار را به صورت تلفنی یا حضوری جلو میبریم.', points: 0 },
      { value: 'B', label: 'سایت یا کانالهای ارتباطی آنلاین داریم، اما به دلیل حجم بالای کار، هماهنگی نهایی یا تایید واریزها زمان میبرد و گاهی مشتری مجبور به پیگیری میشود.', points: 1 },
      { value: 'C', label: 'مسیر خرید نسبتاً روان است، اما تجربه مشتری در بخش‌های مختلف (مثلاً نحوه برخورد در سایت با تماس تلفنی یا تحویل حضوری) هنوز کاملاً یکدست نیست.', points: 2 },
      { value: 'D', label: 'تمام مراحل خرید و تحویل به هم متصل و شفاف هستند؛ مشتری بدون نیاز به پیگیری یا تماس اضافه، به راحتی به خواسته‌اش میرسد.', points: 3 },
    ]
  },
  { 
    id: 'Q3', category: 'Value Proposition', text: 'آیا مشتریان به‌راحتی متوجه می‌شوند چرا باید شما را به جای رقبایتان انتخاب کنند؟',
    options: [
      { value: 'A', label: 'در این بازار پر از رقابت، تفاوت عجیبی بین ما و بقیه نیست؛ به همین دلیل معمولاً مجبوریم با کاهش قیمت یا تخفیف‌های مداوم مشتری را جذب کنیم.', points: 0 },
      { value: 'B', label: 'محصول یا خدمات ما واقعاً باکیفیت است، اما شلوغی کار فرصت نداده این تمایز را به زبان ساده در وبسایت یا توسط تیم فروش به مشتری توضیح دهیم.', points: 1 },
      { value: 'C', label: 'تفاوت‌های خوبی داریم و مشتریان قدیمی این را میدانند، اما گاهی مشتریان جدید بعد از خرید حس میکنند محصول/خدمات با ادعای اولیه ما کمی تفاوت دارد.', points: 2 },
      { value: 'D', label: 'ویژگی خاص و تمایز ما کاملاً مشخص است و مشتری در اولین نگاه متوجه میشود چه دغدغه یا مشکلی از او را به طور ویژه حل میکنیم.', points: 3 },
    ]
  },
  { 
    id: 'Q4', category: 'Service Blueprint', text: 'آیا شلوغی و نحوه تقسیم کارها در پشت صحنه تیم شما، روی سرعت ارائه خدمات به مشتری تاثیر میگذارد؟',
    options: [
      { value: 'A', label: 'حجم کارها بالاست و اطلاعات زیادی بین اعضای تیم جابه‌جا میشود؛ به همین دلیل گاهی هماهنگی‌ها از دستمان در میرود و کار مشتری با تاخیر یا اشتباهات ناخواسته مواجه میشود.', points: 0 },
      { value: 'B', label: 'روال کار در ذهن افراد کلیدی هست، اما چون مکتوب نشده، در روزهای شلوغ یا زمان غیبت یک نفر، گاهی فشار کار روی بقیه چند برابر شده و سرعت کار کم میشود.', points: 1 },
      { value: 'C', label: 'فرآیندها و روال‌های کاری مشخصی داریم، اما بعضی از آنها دست‌وپاگیر هستند و به جای سرعت دادن به کار مشتری، فرآیند را طولانی میکنند.', points: 2 },
      { value: 'D', label: 'هماهنگی داخلی ما عالی است؛ فرآیندهای پشت صحنه به گونه‌ای چیده شده‌اند که کار مشتری دقیق، بدون خطا و سر وقت انجام شود.', points: 3 },
    ]
  },
  { 
    id: 'Q5', category: 'Employee Experience', text: 'کارمندانی که مستقیماً با مشتری سر و کار دارند (پشتیبانی، فروش و...) چقدر ابزار و اختیار برای حل سریع چالش‌های مشتری دارند?',
    options: [
      { value: 'A', label: 'برای حفظ کیفیت و جلوگیری از خطا، ترجیح میدهیم تصمیمات و تخفیف‌های کلیدی حتماً با تایید مستقیم مدیریت انجام شود؛ حتی اگر پاسخ به مشتری کمی طولانی شود.', points: 0 },
      { value: 'B', label: 'روال کار را میدانند، اما به دلیل یکپارچه نبودن سیستم‌ها یا نرم‌افزارها، برای چک کردن سوابق مشتری یا حل مشکل او زمان زیادی صرف میکنند.', points: 1 },
      { value: 'C', label: 'دسترسی و ابزارها خوب است، اما روال یا استاندارد مشخصی برای نحوه برخورد با مشتریان شاکی یا شرایط خاص تعریف نکرده‌ایم.', points: 2 },
      { value: 'D', label: 'ابزارها و اختیارات لازم را دارند تا در سریع‌ترین زمان ممکن، مشکل مشتری را در همان خط اول حل و او را با رضایت راهی کنند.', points: 3 },
    ]
  },
  { 
    id: 'Q6', category: 'Feedback Loop', text: 'وقتی مشتری از خدمات یا محصول شما انتقاد میکند یا شاکی است، فرآیند چطور پیش میرود؟',
    options: [
      { value: 'A', label: 'راه یا کانال مشخصی برای شنیدن صدای مشتری ناراضی نداریم؛ فرآیند معمولاً با پیگیری‌های مکرر برای مشتری همراه است.', points: 0 },
      { value: 'B', label: 'تمام تلاشمان را میکنیم تا با عذرخواهی یا شرایطی مثل تخفیف، رضایت آن مشتری شاکی را جلب کنیم، اما تغییری در روش کارمان ایجاد نمیکنیم.', points: 1 },
      { value: 'C', label: 'انتقادها و مشکلات را یادداشت میکنیم، اما برنامه منظمی برای تغییر دادن ساختار و روش کارمان بر اساس این بازخوردها نداریم.', points: 2 },
      { value: 'D', label: 'شکایت‌ها را بهترین فرصت برای بهبود میدانیم؛ به سرعت آنها را تحلیل کرده و روش ارائه خدماتمان را اصلاح میکنیم.', points: 3 },
    ]
  },
  { 
    id: 'Q7', category: 'Prototyping & Testing', text: 'وقتی ایده جدیدی برای کارتان دارید (مثلاً یک روش جدید فروش و مارکتینگ یا یک خدمت جدید)، چطور آن را شروع میکنید؟',
    options: [
      { value: 'A', label: 'مستقیم روی کل کار پیاده میکنیم؛ ترجیح میدهیم زودتر خروجی واقعی کار را در ابعاد بزرگ ببینیم.', points: 0 },
      { value: 'B', label: 'ایده را در جلسات با مدیران بررسی میکنیم و اگر بپسندند، آن را کار اجرا میکنیم.', points: 1 },
      { value: 'C', label: 'قبل از اجرای نهایی، ایده را در ابعاد کوچکتر آماده میکنیم، اما آن را با مشتریان واقعی تست نمیکنیم و به حس و تجربه خودمان تکیه داریم.', points: 2 },
      { value: 'D', label: 'ابتدا ایده را به صورت بسیار ساده، ارزان و آزمایشی با چند مشتری قدیمی و صمیمی تست و اصلاح میکنیم، سپس سراغ اجرای کل میرویم.', points: 3 },
    ]
  },
  { 
    id: 'Q8', category: 'UX Metrics', text: 'اگر سایت یا فرآیند فروش آنلاین دارید، چطور متوجه می‌شوید مشتریان کجاها گیر میکنند یا خرید را نیمه‌کاره رها میکنند؟',
    options: [
      { value: 'A', label: 'ابزار خاصی برای رصد رفتار دیجیتال کاربر نداریم و فقط به آمار بازدید کلی سایت یا حساب بانکی نگاه میکنیم.', points: 0 },
      { value: 'B', label: 'آمارهایی داریم، اما فرصت تحلیل آنها را نداریم و دقیقاً نمیدانیم چرا مشتریان در میانه راه خرید منصرف میشوند.', points: 1 },
      { value: 'C', label: 'میدانیم مشتریان در کدام مرحله (مثلاً صفحه پرداخت یا پر کردن مشخصات) خارج میشوند، اما دلیل رفتاری و علت آن را بررسی نکرده‌ایم.', points: 2 },
      { value: 'D', label: 'رفتار مشتریان در سایت را به طور منظم تحلیل میکنیم و بر اساس دیتای واقعی رفتاری، مسیر خرید را برایشان راحتتر میکنیم.', points: 3 },
    ]
  },
  { 
    id: 'Q9', category: 'Scalability', text: 'اگر ناگهان تعداد مشتریان شما در یک روز ۳ برابر شود، چه اتفاقی برای کیفیت کار و رضایت مشتری میافتد؟',
    options: [
      { value: 'A', label: 'فرآیندها ظرفیت افزایش را ندارند؛ ممکن است سیستم دچار تاخیر شده و ناخواسته افت کیفیت کیفیت خدمات باعث نارضایتی مشتریان شود.', points: 0 },
      { value: 'B', label: 'با کارایی فرسایشی، اضافه‌کاری و استرس شدید تیم پاسخگو خواهیم بود، اما کیفیت کار برای همه مشتریان یکسان نخواهد بود.', points: 1 },
      { value: 'C', label: 'زیرساخت فنی آن را داریم، اما برای هماهنگ کردن کارمندان و تقسیم وظایف جدید در این ابعاد، دچار چالش جدی میشویم.', points: 2 },
      { value: 'D', label: 'کار ما به صورت ساختارمند و ماژولار طراحی شده است؛ افزایش ناگهانی تقاضا آسیبی به کیفیت خدمترسانی ما نمیزند.', points: 3 },
    ]
  },
  { 
    id: 'Q10', category: 'Agility', text: 'اگر بفهمید نیاز بازار یا رفتار مشتریان تغییر کرده، چقدر طول میکشد تا خدمات یا روش کارتان را با این تغییر هماهنگ کنید؟',
    options: [
      { value: 'A', label: 'تغییر در کار ما زمانبر و پرهزینه است؛ هر تغییر کوچک در روال کار ما ماه‌ها زمان میبرد و با مقاومت فنی یا داخلی مواجه میشود.', points: 0 },
      { value: 'B', label: 'تمایل به تغییر داریم، اما چون ساختار کارمان چندان منعطف نیست، تغییرات معمولاً در عمل نصفه و نیمه رها میشوند.', points: 1 },
      { value: 'C', label: 'تغییرات را اعمال میکنیم، اما فرآیند اجرای آن طولانی است و معمولاً زمانی آماده می‌شود که نیاز مشتری دوباره تغییر کرده است.', points: 2 },
      { value: 'D', label: 'به سرعت تغییرات بازار را رصد میکنیم و ساختار ما به شکلی است که میتوانیم در کوتاهترین زمان، روش کارمان را با نیاز جدید مشتری هماهنگ کنید.', points: 3 },
    ]
  },
];

export default function App() {
  const [step, setStep] = useState<'splash' | 'info' | 'questions' | 'loading' | 'report'>('splash');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({ name: '', email: '', role: '', industry: '', employees: '۱ تا ۱۰ نفر' });
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (finalResponses: Record<string, number>) => {
    setStep('loading');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessInfo, responses: finalResponses }),
      });
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      const data = await response.json();
      setReport(data);
      setStep('report');
    } catch (err) {
      setError('خطایی در تحلیل رخ داد. لطفاً دوباره تلاش کنید.');
      setStep('questions');
    }
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const validateName = (name: string) => /^[a-zA-Z\s\u0600-\u06FF]+$/.test(name.trim());

  const progress = ((currentQuestionIndex) / QUESTIONS.length) * 100;

  const [copied, setCopied] = useState(false);
  const cleanHtml = (html: string) => {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const copyToClipboard = () => {
    if (!report) return;
    const textToCopy = `📋 گزارش ارزیابی بلوغ طراحی خدمات

📊 امتیاز کل: ${report.total_score} از ۳۰
🏷️ سطح بلوغ: ${report.tier_label}

📝 خلاصه وضعیت:
${cleanHtml(report.greeting_summary)}

✨ تحلیل تفصیلی:
${cleanHtml(report.detailed_analysis)}

🎯 گام بعدی:
${cleanHtml(report.cta_message)}

📲 ارتباط و تنظیم جلسه در واتساپ:
https://wa.me/989120486852`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#fafafc] text-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center font-sans relative overflow-hidden print:bg-white print:p-0 print:block">
      <div className="w-full max-w-3xl bg-white sm:p-12 p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 relative z-10 my-8 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none">
        {step === 'splash' && (
          <div className="space-y-8 text-center py-6">
            <div className="flex justify-center mb-4">
              <span className="text-4xl sm:text-5xl font-black tracking-tighter">
                Beyond Delight
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-8">The McKinsey 7S Framework</h1>
            <p className="text-slate-500 leading-relaxed text-lg max-w-xl mx-auto">
            چارچوب 7S مکنزی یکی از مدل‌های شناخته‌شده برای بررسی وضعیت سازمان و ارتباط میان اجزای مختلف یک کسب‌وکار است. این چارچوب با بررسی هفت عنصر کلیدی مانند استراتژی، ساختار، سیستم‌ها، کارکنان، مهارت‌ها و ارزش‌های مشترک، کمک می‌کند مسائل کسب‌وکار را نه به‌صورت جداگانه، بلکه در بستر یک سیستم ببینیم.
             بسیاری از مشکلاتی که در ظاهر ساده به نظر می‌رسند، ریشه در تعامل میان فرایندها، افراد، ساختار و تصمیم‌های سازمان دارند. بنابراین قبل از اینکه به سراغ راه‌حل برویم، باید مسئله را درست ببینیم، سؤال‌های درستی بپرسیم و ریشه‌هایش را بهتر بشناسیم.
            این پرسشنامه با الهام از چارچوب 7S مکنزی طراحی شده تا نقطه شروعی برای همین فرایند باشد؛ فرصتی برای شناخت وضعیت فعلی، کشف ناهماهنگی‌ها و پیدا کردن مسائلی که ارزش بررسی و طراحی دارند.
            در Beyond، طراحی راه‌حل از فهم درست مسئله شروع می‌شود.
            </p>
            <button onClick={() => setStep('info')} className="mx-auto w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-2 bg-[#008CFF] text-white rounded-xl hover:bg-[#0073e6] transition-all font-semibold shadow-sm hover:shadow-md">
              <span>شروع ارزیابی</span>
              <ArrowLeft size={18} />
            </button>
          </div>
        )}
        {step === 'info' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-6 mb-6">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="text-[#008CFF]" size={24} />
                اطلاعات کسب‌وکار
              </h1>
              <p className="text-sm text-slate-500 mt-2">لطفاً برای دریافت گزارش، اطلاعات زیر را تکمیل کنید.</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                <User size={16} className="text-slate-400" />
                نام و نام خانوادگی / نام کسب‌وکار
              </label>
              <input type="text" value={businessInfo.name} onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})} className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#008CFF] focus:ring-2 focus:ring-[#008CFF]/20 transition-all placeholder:text-slate-400" placeholder="مثال: علی رضایی" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                <Mail size={16} className="text-slate-400" />
                آدرس ایمیل
              </label>
              <input type="email" dir="ltr" value={businessInfo.email} onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})} className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#008CFF] focus:ring-2 focus:ring-[#008CFF]/20 transition-all placeholder:text-slate-400 text-left" placeholder="example@domain.com" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                <UserCheck size={16} className="text-slate-400" />
                سمت سازمانی
              </label>
              <input type="text" value={businessInfo.role} onChange={(e) => setBusinessInfo({...businessInfo, role: e.target.value})} className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#008CFF] focus:ring-2 focus:ring-[#008CFF]/20 transition-all placeholder:text-slate-400" placeholder="مثال: مدیر محصول / هم‌بنیان‌گذار / مدیر ارشد" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                <Briefcase size={16} className="text-slate-400" />
                حوزه فعالیت
              </label>
              <select value={businessInfo.industry} onChange={(e) => setBusinessInfo({...businessInfo, industry: e.target.value})} className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#008CFF] focus:ring-2 focus:ring-[#008CFF]/20 transition-all">
                <option value="">انتخاب کنید...</option>
                <option value="فروش و خرده‌فروشی">فروش و خرده‌فروشی</option>
                <option value="تولید و صنعت">تولید و صنعت</option>
                <option value="خدمات حرفه‌ای و مشاوره">خدمات حرفه‌ای و مشاوره</option>
                <option value="فناوری و کسب‌وکارهای دیجیتال">فناوری و کسب‌وکارهای دیجیتال</option>
                <option value="غذا، رستوران و گردشگری">غذا، رستوران و گردشگری</option>
                <option value="سلامت و زیبایی">سلامت و زیبایی</option>
                <option value="آموزش و یادگیری">آموزش و یادگیری</option>
                <option value="مالی و سرمایه‌گذاری">مالی و سرمایه‌گذاری</option>
                <option value="املاک و ساختمان">املاک و ساختمان</option>
                <option value="حمل‌ونقل و لجستیک">حمل‌ونقل و لجستیک</option>
                <option value="کشاورزی و محصولات غذایی">کشاورزی و محصولات غذایی</option>
                <option value="سرگرمی و سبک زندگی">سرگرمی و سبک زندگی</option>
                <option value="سایر کسب‌وکارها">سایر کسب‌وکارها</option>
              </select>
              {businessInfo.industry === 'سایر کسب‌وکارها' && (
                <input type="text" value={businessInfo.otherIndustry || ''} onChange={(e) => setBusinessInfo({...businessInfo, otherIndustry: e.target.value})} className="w-full p-3.5 mt-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#008CFF] focus:ring-2 focus:ring-[#008CFF]/20 transition-all placeholder:text-slate-400" placeholder="لطفا حوزه فعالیت خود را بنویسید" />
              )}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                <Users size={16} className="text-slate-400" />
                تعداد پرسنل
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['۱ تا ۱۰ نفر', '۱۱ تا ۵۰ نفر', '۵۱ تا ۲۰۰ نفر', 'بیش از ۲۰۰ نفر'].map((opt) => (
                  <label key={opt} className={`flex items-center justify-center p-3.5 border rounded-xl cursor-pointer transition-all ${businessInfo.employees === opt ? 'border-[#008CFF] bg-[#008CFF]/5 ring-1 ring-[#008CFF]' : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'}`}>
                    <input type="radio" name="employees" value={opt} checked={businessInfo.employees === opt} onChange={(e) => setBusinessInfo({...businessInfo, employees: e.target.value})} className="hidden" />
                    <span className={`text-sm ${businessInfo.employees === opt ? 'text-[#008CFF] font-medium' : 'text-slate-600 font-medium'}`}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{error}</div>}
            
            <button 
              onClick={() => { 
                if(!validateName(businessInfo.name)) {
                  setError('نام معتبر وارد کنید.');
                } else if(!validateEmail(businessInfo.email)) {
                  setError('آدرس ایمیل معتبر وارد کنید.');
                } else if(!businessInfo.role.trim()) {
                  setError('لطفاً سمت سازمانی خود را وارد کنید.');
                } else if(!businessInfo.industry) {
                  setError('حوزه فعالیت را انتخاب کنید.');
                } else if(businessInfo.industry === 'سایر کسب‌وکارها' && !businessInfo.otherIndustry) {
                  setError('لطفا حوزه فعالیت خود را بنویسید.');
                } else {
                  setError('');
                  setStep('questions');
                }
              }} 
              className="w-full flex items-center justify-center gap-2 bg-[#008CFF] text-white p-4 rounded-xl hover:bg-[#0073e6] transition-all font-semibold mt-8 shadow-sm hover:shadow-md">
              <span>شروع پاسخگویی</span>
              <ArrowLeft size={20} />
            </button>
          </div>
        )}
        {step === 'questions' && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 mb-2">
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(currentQuestionIndex - 1);
                    } else {
                      setStep('info');
                    }
                  }}
                  className="text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors flex items-center gap-1.5 px-3 py-2 -mx-3 rounded-lg hover:bg-slate-50"
                >
                  <ArrowRight size={16} />
                  <span>بازگشت به قبل</span>
                </button>
                <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">سوال {currentQuestionIndex + 1} از {QUESTIONS.length}</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#008CFF] h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            <div className="space-y-3">
                <p className="text-[#008CFF] font-bold text-sm tracking-wide">{QUESTIONS[currentQuestionIndex].category}</p>
                <p className="text-slate-800 text-lg font-semibold leading-relaxed mb-6">{QUESTIONS[currentQuestionIndex].text}</p>
                <div className="grid gap-3 pt-2">
                  {QUESTIONS[currentQuestionIndex].options.map(opt => {
                    const currentQId = QUESTIONS[currentQuestionIndex].id;
                    const isSelected = responses[currentQId] === opt.points;
                    return (
                      <button 
                        key={`${currentQuestionIndex}-${opt.value}`} 
                        onClick={() => {
                          setResponses({...responses, [currentQId]: opt.points});
                        }} 
                        className={`w-full p-4 text-right rounded-xl border text-[15px] font-normal transition-all flex items-center justify-between gap-3 leading-relaxed ${
                          isSelected 
                            ? 'border-[#008CFF] bg-[#008CFF]/5 ring-2 ring-[#008CFF]/20 text-[#008CFF]' 
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <span className="flex-1 font-normal">{opt.label}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-[#008CFF] bg-[#008CFF] text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Next Question Button */}
                <div className="pt-6">
                  <button
                    disabled={responses[QUESTIONS[currentQuestionIndex].id] === undefined}
                    onClick={() => {
                      const currentQId = QUESTIONS[currentQuestionIndex].id;
                      if (responses[currentQId] === undefined) return;
                      if (currentQuestionIndex < QUESTIONS.length - 1) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                      } else {
                        handleAnalyze(responses);
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all shadow-sm ${
                      responses[QUESTIONS[currentQuestionIndex].id] !== undefined
                        ? 'bg-[#008CFF] text-white hover:bg-[#0073e6] hover:shadow-md cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    <span>
                      {currentQuestionIndex < QUESTIONS.length - 1 ? 'سوال بعدی' : 'ثبت و دریافت گزارش'}
                    </span>
                    <ArrowLeft size={20} />
                  </button>
                </div>
            </div>
          </div>
        )}
        {step === 'loading' && (
          <div className="text-center py-20 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="animate-spin text-[#008CFF]" size={48} strokeWidth={1.5} />
            <div className="text-slate-600 font-medium text-lg">در حال ارزیابی وضعیت سازمان شما...</div>
          </div>
        )}
        {step === 'report' && report && (
          <div className="space-y-6 text-slate-700">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BarChart className="text-[#008CFF]" size={32} />
              گزارش تحلیلی شما
            </h1>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-semibold text-slate-500">امتیاز نهایی: {report.total_score} از 30</p>
                  <p className="text-sm font-bold text-[#008CFF] bg-[#008CFF]/10 px-3 py-1 rounded-full">{report.tier_label}</p>
                </div>
                
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'شناخت مشتری', A: (report.scores_per_dimension.user_research_and_data / 6) * 100 },
                      { subject: 'تجربه خرید', A: (report.scores_per_dimension.customer_journey_and_ux / 9) * 100 },
                      { subject: 'هماهنگی تیم', A: (report.scores_per_dimension.service_operations_and_staff / 9) * 100 },
                      { subject: 'انعطاف‌پذیری', A: (report.scores_per_dimension.design_agility_and_testing / 6) * 100 },
                    ]}>
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="A" stroke="#008CFF" fill="#008CFF" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-[15px]">
              <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: report.greeting_summary }}></p>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Sparkles className="text-yellow-500" size={24} />
                تحلیل تفصیلی
              </h2>
              
              <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed text-[15px]" dangerouslySetInnerHTML={{ __html: report.detailed_analysis }}></div>
            </div>
            
            <div className="bg-[#008CFF]/5 p-6 sm:p-8 rounded-2xl border border-[#008CFF]/10 shadow-[0_2px_10px_rgba(0,140,255,0.02)]">
              <h2 className="text-xl font-bold text-[#008CFF] mb-3 flex items-center gap-2">
                <Target size={24} />
                گام بعدی
              </h2>
              <p className="text-[15px] leading-relaxed text-slate-800 mb-6" dangerouslySetInnerHTML={{ __html: report.cta_message }}></p>
              <a href="https://wa.me/989120486852" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 flex items-center justify-center gap-2.5 bg-[#008CFF] text-white p-4 rounded-xl hover:bg-[#0073e6] transition-all font-semibold shadow-sm hover:shadow-md mx-auto sm:mx-0">
                <MessageCircle size={20} />
                <span>ارتباط و تنظیم جلسه در واتساپ</span>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 print:hidden">
              <button onClick={copyToClipboard} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 p-4 rounded-xl hover:bg-slate-50 transition-all font-semibold shadow-sm hover:shadow-md">
                {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} className="text-slate-500" />}
                <span>{copied ? 'متن کپی شد!' : 'کپی متن گزارش'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
