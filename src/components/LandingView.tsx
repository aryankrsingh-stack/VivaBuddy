import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  FileText,
  Globe,
  Mic,
  Volume2,
  ClipboardCheck,
  MessageSquare,
} from 'lucide-react';
import { DEMO_SUBJECTS } from '../data/demoNotes';
import { DemoSubject } from '../types/viva';

interface LandingViewProps {
  onStartViva: () => void;
  onStartWithDemo: (subject: DemoSubject) => void;
}

const FEATURES = [
  {
    icon: FileText,
    title: 'Strictly From Your Notes',
    description:
      'Upload lecture PDFs, text files, or pasted revision sheets. Every viva question stays grounded in your own syllabus.',
    accent: 'text-[#2563EB]',
  },
  {
    icon: Volume2,
    title: 'Indian Voice Virtual Examiner',
    description:
      'Listen to crisp, under-20-word oral questions spoken aloud in a composed Indian English or Hindi voice.',
    accent: 'text-[#14B8A6]',
  },
  {
    icon: Globe,
    title: 'English, हिन्दी & Hinglish',
    description:
      'Pick the examiner language you prefer and reply freely in English, Hindi, or natural classroom Hinglish.',
    accent: 'text-[#8B5CF6]',
  },
  {
    icon: Mic,
    title: 'Speak or Type Your Answer',
    description:
      'Practice talking aloud with built-in Indian English and Hindi voice recognition, or type fast when in the library.',
    accent: 'text-[#14B8A6]',
  },
  {
    icon: MessageSquare,
    title: 'Instant Feedback & Follow-ups',
    description:
      'See what you nailed, what you missed, concept and clarity scores, plus a realistic follow-up probe on every answer.',
    accent: 'text-[#2563EB]',
  },
  {
    icon: ClipboardCheck,
    title: 'Honest Viva Score Report',
    description:
      'Review real accuracy metrics, question-by-question scores, explanations for missed points, and exact topics to revise.',
    accent: 'text-[#8B5CF6]',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Add Study Material',
    description:
      'Drop a PDF or TXT file from any college subject, paste your notes, or load a ready-made demo sheet in one click.',
  },
  {
    step: '02',
    title: 'Choose Viva Language',
    description:
      'Select English, हिन्दी, or Hinglish for the examiner and optionally turn on a per-question response timer.',
  },
  {
    step: '03',
    title: 'Face 5 Progressive Questions',
    description:
      'Move from Definition and Why/How to Formula, Application, and What-if scenarios—answering aloud or by text.',
  },
  {
    step: '04',
    title: 'Review Report & Revise',
    description:
      'Inspect your real score breakdown, answer follow-ups, and walk into your lab or semester viva without hesitation.',
  },
];

export function LandingView({ onStartViva, onStartWithDemo }: LandingViewProps) {
  const [heroImgError, setHeroImgError] = useState(false);

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-24">
      {/* Hero Section */}
      <section className="pt-10 pb-16 sm:pt-14 sm:pb-24">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Hero Copy */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-6"
          >
            <p className="font-display text-sm sm:text-base font-semibold tracking-wide text-[#14B8A6]">
              Viva ka darr, ab hoga Choomantarrr!
            </p>

            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.12] tracking-tight text-[#F8FAFC] text-balance">
              Practice Every Oral Exam Before You Face the Panel
            </h1>

            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-300 max-w-xl">
              <span className="font-medium text-[#F8FAFC]">Your Personal Viva Practice Partner.</span>{' '}
              Upload notes from any subject, answer five progressive oral questions in English,
              Hindi, or Hinglish, and get structured feedback in minutes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onStartViva}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1D4ED8] active:scale-[0.98] whitespace-nowrap cursor-pointer min-h-[48px]"
              >
                <span>Start Your Viva</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={scrollToFeatures}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm sm:text-base font-medium text-slate-200 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] hover:text-white whitespace-nowrap cursor-pointer min-h-[48px]"
              >
                Explore Features
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-400">
              <span>Any College Subject</span>
              <span aria-hidden="true">·</span>
              <span>PDF &amp; TXT Notes</span>
              <span aria-hidden="true">·</span>
              <span>English, हिन्दी &amp; Hinglish</span>
              <span aria-hidden="true">·</span>
              <span>Voice &amp; Text Answers</span>
            </div>
          </motion.div>

          {/* Right Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex"
          >
            <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#162135] shadow-2xl shadow-black/50 min-h-[300px] lg:min-h-[420px]">
              {!heroImgError ? (
                <img
                  src="/src/assets/images/hero_viva_studio_1795754349453.jpg"
                  alt="College student calmly preparing for an oral viva exam with engineering notebooks and laptop"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgError(true)}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#162135] via-[#101827] to-[#1e1b4b] p-8 text-center">
                  <BookOpen className="h-12 w-12 text-[#14B8A6] mb-3" />
                  <p className="font-display text-lg font-semibold text-white">VivaBuddy Studio</p>
                  <p className="text-sm text-slate-400 mt-1">Your Personal Viva Practice Partner</p>
                </div>
              )}

              {/* Measured scrim with crisp bottom caption */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101827]/90 via-[#101827]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-xs font-medium text-[#14B8A6]">5-Question Progressive Drill</p>
                <p className="mt-1 font-display text-base sm:text-lg font-semibold text-[#F8FAFC]">
                  Definition · Why / How · Formula · Application · What-if
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Subject Tryout Bar */}
      <section id="subjects" className="scroll-mt-24 border-y border-white/[0.08] py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F8FAFC]">
              Want to try right away?
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Jump straight in with sample college notes, or upload your own PDF on the next screen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {DEMO_SUBJECTS.map((subj) => (
              <button
                key={subj.id}
                type="button"
                onClick={() => onStartWithDemo(subj)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition-all duration-200 hover:border-[#2563EB]/60 hover:bg-[#2563EB]/15 hover:text-white whitespace-nowrap cursor-pointer min-h-[42px]"
              >
                <span>{subj.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="scroll-mt-24 pt-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[#8B5CF6]">Built for Real College Vivas</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC] text-balance">
            Everything you need to sound prepared under pressure
          </h2>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Designed around how Indian university lab vivas and internal assessments actually work—short
            spoken questions, follow-up cross-questioning, and clear scoring.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="glass-panel rounded-2xl p-6 transition-colors duration-200 hover:border-white/20"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10">
                  <Icon className={`h-5 w-5 ${feature.accent}`} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-[#F8FAFC]">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="scroll-mt-24 pt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#14B8A6]">How It Works</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC] text-balance">
              From lecture notes to viva confidence in four steps
            </h2>
          </div>
          <button
            type="button"
            onClick={onStartViva}
            className="inline-flex items-center gap-2 self-start sm:self-auto text-sm font-semibold text-[#2563EB] hover:text-blue-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>Begin a practice session</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className="glass-subtle rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-2xl font-semibold text-[#14B8A6] tabular-nums">
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-[#F8FAFC]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Closing Callout */}
        <div className="mt-16 glass-panel rounded-3xl p-8 sm:p-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[#14B8A6]">Ready for your next practical or seminar?</p>
            <h3 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              Viva ka darr, ab hoga Choomantarrr!
            </h3>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Upload your syllabus notes now and complete a full five-question mock viva with voice
              evaluation in under five minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartViva}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#2563EB] px-7 py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-[#2563EB]/25 transition-all duration-200 hover:bg-[#1D4ED8] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer min-h-[50px]"
          >
            <span>Start Your Viva</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
