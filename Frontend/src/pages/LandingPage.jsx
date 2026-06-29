import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, Brain, BarChart3, Users, CalendarCheck,
  DollarSign, Bell, ArrowRight, Check, Building2, UserCheck,
  Menu, X, Star, Sparkles, ChevronDown, Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import StudentRegisterForm from "./auth/StudentRegisterForm";
import OwnerRegisterForm from "./auth/OwnerRegisterForm";

/* -------------------------------------------------------------------------- */
/*                                 Static data                                */
/* -------------------------------------------------------------------------- */
const stats = [
  { value: "2,400+", label: "Students Enrolled" },
  { value: "180+", label: "Active Academies" },
  { value: "94%", label: "Retention Rate" },
  { value: "38k+", label: "Sessions Tracked" },
];

const features = [
  {
    icon: Brain,
    title: "AI Retention Intelligence",
    description:
      "Weekly automated scans score every student's dropout risk using attendance, grades, and payment history. High-risk alerts surface automatically — with a WhatsApp message draft ready to send.",
    badge: "New", iconBg: "bg-sky/10", highlight: true,
  },
  {
    icon: CalendarCheck,
    title: "Attendance Tracking",
    description: "Mark attendance session by session with one tap. Track per-student trends, class averages, and 28-day rollups in real time.",
    badge: null, iconBg: "bg-blue/10", highlight: false,
  },
  {
    icon: BarChart3,
    title: "Grade & Performance Analytics",
    description: "Log scores per session, visualise grade trends over time, and spot students falling behind before the semester ends.",
    badge: null, iconBg: "bg-blue/10", highlight: false,
  },
  {
    icon: DollarSign,
    title: "Payment & Finance",
    description: "Collect monthly fees, track overdue balances, and send automated payment reminders at day 0, 3, and 7 — with AI-written messages in Arabic.",
    badge: null, iconBg: "bg-blue/10", highlight: false,
  },
  {
    icon: Users,
    title: "Student Management",
    description: "Full student profiles with enrollment history, attendance records, grade summaries, and a generated AI report card — all in one place.",
    badge: null, iconBg: "bg-blue/10", highlight: false,
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Automated Emails alerts keep parents informed. Every notification is logged with delivery status so nothing falls through the cracks.",
    badge: null, iconBg: "bg-blue/10", highlight: false,
  },
];

const ownerSteps = [
  { step: "01", title: "Register your academy", desc: "Set up your academy profile in under two minutes." },
  { step: "02", title: "Create classes & enroll students", desc: "Add subjects, assign teachers, and onboard students with their parent contact." },
  { step: "03", title: "Track every session", desc: "Mark attendance, record grades, and collect payments — all from one dashboard." },
  { step: "04", title: "Let AI guard retention", desc: "The weekly AI scan surfaces at-risk students and drafts parent messages for you." },
];

const studentSteps = [
  { step: "01", title: "Find your academy", desc: "Select the academy you're enrolled in from the list." },
  { step: "02", title: "Create your student account", desc: "Provide your name and parent contact details to get started." },
  { step: "03", title: "Track your progress", desc: "View your attendance, grades, and upcoming session schedule." },
  { step: "04", title: "Stay connected", desc: "Receive updates directly through the parent contact channel." },
];

const mockAlerts = [
  { name: "Ahmed Mohamed", risk: "high", score: 75, type: "Combined Risk", initials: "AM" },
  { name: "Sara Khaled", risk: "high", score: 65, type: "Low Attendance", initials: "SK" },
  { name: "Omar Hassan", risk: "medium", score: 48, type: "Grade Decline", initials: "OH" },
];

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */
export default function LandingPage() {
  const { t } = useTranslation(["landing", "common"])
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeReg, setActiveReg] = useState("owner");
  const [openModal, setOpenModal] = useState(null);
  const navigate = useNavigate();
  const regRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToReg = (mode) => {
    setActiveReg(mode);
    regRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* -------------------------------------------------------------------------- */
/*                                   NavBar                                   */
/* -------------------------------------------------------------------------- */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? "bg-navy/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-sky/20 border border-sky/30 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sky" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Academi<span className="text-sky">Q</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: t("nav.features"), action: () => scrollTo("features") },
              { label: t("nav.how_it_works"), action: () => scrollTo("how-it-works") },
              { label: t("nav.for_academies"), action: () => scrollToReg("owner") },
              { label: t("nav.for_students"), action: () => scrollToReg("student") },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="text-sm text-white/70 hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2 rounded-lg border border-white/10 hover:border-white/30">
              {t("nav.sign_in")}
            </Link>
            <button onClick={() => scrollToReg("owner")} className="text-sm font-semibold bg-sky text-navy px-4 py-2 rounded-lg hover:bg-white transition-colors">
              {t("nav.get_started_free")}
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-navy/97 backdrop-blur-md border-t border-white/10 px-6 py-5 space-y-4">
            <button onClick={() => scrollToReg("owner")} className="block w-full text-start text-sm text-white/80 hover:text-white py-2">{t("nav.for_academies")}</button>
            <button onClick={() => scrollToReg("student")} className="block w-full text-start text-sm text-white/80 hover:text-white py-2">{t("for_students")}</button>
            <hr className="border-white/10" />
            <Link to="/login" className="block text-sm text-white/80 hover:text-white py-2">{t("nav.sign_in")}</Link>
            <button onClick={() => scrollToReg("owner")} className="block w-full text-sm font-semibold bg-sky text-navy px-4 py-2.5 rounded-lg text-center">
              {t("nav.get_started_free")}
            </button>
          </div>
        )}
      </header>
      {/* -------------------------------------------------------------------------- */
/*                                    HERO                                    */
/* -------------------------------------------------------------------------- */}
      <section className="relative bg-navy min-h-screen flex flex-col justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #4988C4 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 -left-32 w-[500px] h-[500px] rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #BDE8F5 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(#BDE8F5 1px, transparent 1px), linear-gradient(90deg, #BDE8F5 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-sky/10 border border-sky/25 text-sky text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              {t("hero.badge")}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t("hero.headline_1")}{" "}
              <span style={{ background: "linear-gradient(135deg, #BDE8F5 0%, #4988C4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {t("hero.headline_2")}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 leading-relaxed mb-10 max-w-2xl">
              {t("hero.subheadline")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => scrollToReg("owner")}
                className="group flex items-center justify-center gap-3 bg-sky text-navy font-bold px-8 py-4 rounded-xl hover:bg-white transition-all text-base shadow-lg shadow-sky/20">
                <Building2 className="w-5 h-5" />
                {t("hero.cta_owner")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => scrollToReg("student")}
                className="group flex items-center justify-center gap-3 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 hover:border-white/40 transition-all text-base">
                <UserCheck className="w-5 h-5 text-sky" />
                {t("hero.cta_student")}
              </button>
            </div>

            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["AM", "SK", "MH", "FA"].map((init) => (
                  <div key={init} className="w-8 h-8 rounded-full bg-navy-mid border-2 border-navy flex items-center justify-center text-xs font-semibold text-white">
                    {init}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-white/50">
                <div className="flex">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-sky text-sky" />)}
                </div>
                <span>{t("hero.social_proof")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs">{t("hero.scroll_hint")}</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>
      {/* -------------------------------------------------------------------------- */
/*                                    STATS                                   */
/* -------------------------------------------------------------------------- */}
      <section className="bg-navy-mid border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
                <p className="text-sm text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* -------------------------------------------------------------------------- */
/*                                  FEATURES                                  */
/* -------------------------------------------------------------------------- */}
      <section id="features" className="bg-surface py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue uppercase tracking-widest mb-3">{t("section_label")}</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-navy mb-4 leading-tight">
              {t("headline_1")}<br className="hidden md:block" /> {("headline_2")}
            </h2>
            <p className="text-lg text-blue max-w-2xl mx-auto">
              {t("subheadline")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, badge, iconBg, highlight }) => (
              <div key={title}
                className={`relative bg-white border rounded-2xl p-6 hover:-translate-y-1 transition-all duration-200 ${highlight ? "border-sky/40 ring-1 ring-sky/20 shadow-[--shadow-modal]" : "border-border hover:shadow-[--shadow-modal]"}`}>
                {badge && (
                  <span className="absolute top-4 right-4 text-[11px] font-bold bg-sky text-navy px-2 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-navy-mid" />
                </div>
                <h3 className="text-base font-bold text-navy mb-2">{title}</h3>
                <p className="text-sm text-blue leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* -------------------------------------------------------------------------- */
/*                                HOW IT WORKS                                */
/* -------------------------------------------------------------------------- */}
      <section id="how-it-works" className="bg-navy py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-sky uppercase tracking-widest mb-3">Simple to get started</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">Up and running in minutes</h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Whether you're an academy owner or a student, getting started takes under 5 minutes.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-sky/15 border border-sky/25 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-sky" />
                </div>
                <div>
                  <p className="text-xs text-sky font-semibold uppercase tracking-wide">For academy owners</p>
                  <h3 className="text-base font-bold text-white">Set up your academy</h3>
                </div>
              </div>
              <div className="space-y-6">
                {ownerSteps.map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sky/10 border border-sky/20 text-sky text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                      <p className="text-xs text-white/50">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => scrollToReg("owner")}
                className="mt-8 w-full bg-sky text-navy font-bold py-3 rounded-xl hover:bg-white transition-colors text-sm">
                Register my academy →
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue/20 border border-blue/30 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue" />
                </div>
                <div>
                  <p className="text-xs text-blue font-semibold uppercase tracking-wide">For students</p>
                  <h3 className="text-base font-bold text-white">Join your academy</h3>
                </div>
              </div>
              <div className="space-y-6">
                {studentSteps.map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue/10 border border-blue/20 text-blue text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                      <p className="text-xs text-white/50">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => scrollToReg("student")}
                className="mt-8 w-full border border-blue/40 text-blue font-bold py-3 rounded-xl hover:bg-blue/10 transition-colors text-sm">
                Join as a student →
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* -------------------------------------------------------------------------- */
/*                                AI HIGHLIGHT                                */
/* -------------------------------------------------------------------------- */}
      <section className="bg-surface py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-navy rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-sky/15 border border-sky/25 text-sky text-xs font-semibold px-3 py-1.5 rounded-full mb-6 w-fit">
                  <Brain className="w-3.5 h-3.5" />
                  Retention Intelligence — AI Sprint
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-5">
                  Know who's about to drop out — before they do.
                </h2>
                <p className="text-white/60 leading-relaxed mb-8">
                  Our AI agent runs every Monday, scoring every student on three risk signals — attendance below 70%, overdue fees over 14 days, and grade decline. High-risk students surface in your Alert Inbox with a WhatsApp message already drafted in Arabic.
                </p>
                <ul className="space-y-3 mb-8">
                  {["Automated weekly retention scan", "AI-drafted parent messages in Egyptian Arabic", "AI-generated report cards per student", "Real-time payment reminder pipeline"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                      <div className="w-5 h-5 rounded-full bg-sky/15 border border-sky/30 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-sky" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <button onClick={() => scrollToReg("owner")}
                  className="flex items-center gap-2 bg-sky text-navy font-bold px-6 py-3 rounded-xl hover:bg-white transition-colors w-fit text-sm">
                  <Zap className="w-4 h-4" />
                  Start with AI enabled
                </button>
              </div>

              <div className="relative bg-navy-mid/40 border-l border-white/10 p-8 lg:p-10 flex flex-col justify-center gap-4">
                {mockAlerts.map((alert, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                    style={{ transform: `translateX(${i * 4}px)`, opacity: 1 - i * 0.15 }}>
                    <div className="w-10 h-10 rounded-full bg-navy-mid text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {alert.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{alert.name}</p>
                      <p className="text-xs text-white/50">{alert.type}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${alert.risk === "high" ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning"}`}>
                      {alert.risk === "high" ? "High" : "Medium"} · {alert.score}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex items-center gap-2 bg-success-bg border border-success/20 rounded-full px-4 py-2 w-fit mx-auto">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-xs text-success font-semibold">Weekly scan complete — 3 alerts generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* -------------------------------------------------------------------------- */
/*                                REGISTRATION                                */
/* -------------------------------------------------------------------------- */}
      <section ref={regRef} id="register" className="bg-navy py-24 px-6 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-sky uppercase tracking-widest mb-3">Get started today — it's free</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">Join AcademiQ</h2>
            <p className="text-lg text-white/50">Choose your path below and be running in under 5 minutes.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button onClick={() => setOpenModal("owner")} className="reg-option-card">
              <Building2 className="w-6 h-6 text-sky mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Academy Owner</h3>
              <p className="text-xs text-white/50">Register your academy and get started in minutes</p>
            </button>
            <button onClick={() => setOpenModal("student")} className="reg-option-card">
              <UserCheck className="w-6 h-6 text-blue mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Student</h3>
              <p className="text-xs text-white/50">Join an academy already registered on AcademiQ</p>
            </button>
          </div>
        </div>

        {openModal && (
          <div className="modal-backdrop" onClick={() => setOpenModal(null)}>
            <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header h-15 pt-5 pb-0">
                <h2 className="modal-title">
                  {openModal === "owner"
                    ?
                    <div className="flex items-center gap-3 mb-7">
                      <div className="w-10 h-10 bg-blue/15 border border-blue/90 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-black">Register your academy</h3>
                        <p className="text-xs text-black/40">Free — no credit card required</p>
                      </div>
                    </div>
                    :
                    <div className="flex items-center gap-3 mb-7">
                      <div className="w-10 h-10 bg-blue/15 border border-blue/90 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-black">Join your academy</h3>
                        <p className="text-xs text-black/40">Your academy must already be registered on AcademiQ</p>
                      </div>
                    </div>
                  }
                </h2>
                <button className="modal-close" onClick={() => setOpenModal(null)} aria-label="Close">
                  <X className="w-5 h-5 text-blue" />
                </button>
              </div>
              <div className="modal-body bg-gray-200 py-2">
                {openModal === "owner"
                  ? <OwnerRegisterForm onSuccess={() => { setOpenModal(null); navigate("/dashboard"); }} />
                  : <StudentRegisterForm submit={t("common:join_academy")} onSuccess={() => { setOpenModal(null); navigate("/login"); }} />}
              </div>
            </div>
          </div>
        )}
      </section>
      {/* -------------------------------------------------------------------------- */
/*                                   FOOTER                                   */
/* -------------------------------------------------------------------------- */}
      <footer className="bg-navy border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-sky/15 border border-sky/25 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-sky" />
                </div>
                <span className="text-base font-bold text-white">Academi<span className="text-sky">Q</span></span>
              </div>
              <p className="text-sm text-white/40 max-w-xs">AI-powered academy management for Egyptian education centres.</p>
            </div>

            <div className="flex flex-wrap gap-8 text-sm text-white/40">
              <div className="space-y-2">
                <p className="font-semibold text-white/60 text-xs uppercase tracking-wide">Platform</p>
                <button onClick={() => scrollToReg("owner")} className="block hover:text-white transition-colors">For Academies</button>
                <button onClick={() => scrollToReg("student")} className="block hover:text-white transition-colors">For Students</button>
                <Link to="/login" className="block hover:text-white transition-colors">Sign in</Link>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-white/60 text-xs uppercase tracking-wide">Product</p>
                <button onClick={() => scrollTo("features")} className="block hover:text-white transition-colors">Features</button>
                <button onClick={() => scrollTo("how-it-works")} className="block hover:text-white transition-colors">How it works</button>
                <button onClick={() => scrollTo("register")} className="block hover:text-white transition-colors">Get started</button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/25">
            <p>© {new Date().getFullYear()} AcademiQ. Built for Egyptian academies.</p>
            <p>Team Edvora — Mahdy · Yahya · Aly · Kandeel</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
