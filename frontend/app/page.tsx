"use client";

import { useEffect, useState, useRef } from "react";

interface Job {
  company: string;
  role: string;
  skills: string[];
  url: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  potentialScore: number;
  matchReason: string;
  isNew: boolean;
}

type SkillGap = {
  skill: string;
  count: number;
};

type LearningResource = {
  skill: string;
  resource: string;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minimumScore, setMinimumScore] = useState(0);
  const [targetRole, setTargetRole] = useState("AI Engineer");
  const [roadmap, setRoadmap] = useState("");
  const [marketScore, setMarketScore] = useState(0);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [careerInsights, setCareerInsights] = useState<any>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  
  // Premium UI UX additions (Non-breaking)
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const refreshJobs = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/refresh-jobs",
        {
          method: "POST"
        }
      );

      const data = await response.json();
      showToast(`Successfully synced and loaded ${data.jobs_loaded} job roles!`, "success");
      console.log(targetRole);
      const jobsResponse = await fetch(
        `http://127.0.0.1:8000/filtered-jobs?target_role=${encodeURIComponent(targetRole)}`
      );

      const updatedJobs = await jobsResponse.json();
      setJobs(updatedJobs);
    } catch (err) {
      showToast("Error syncing live jobs. Please check if FastAPI is active.", "info");
    } finally {
      setIsRefreshing(false);
    }
  };

  const bestJob =
    jobs.length > 0
      ? jobs.reduce((a, b) => (a.score > b.score ? a : b))
      : null;

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScore = job.score >= minimumScore;

    return matchesSearch && matchesScore;
  });

  useEffect(() => {
    refreshJobs();
  }, [targetRole]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast("Analyzing resume with Gemini AI...", "info");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/upload-resume",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log(data);
      setResumeAnalysis(data);

      // Jobs
      const jobsResponse = await fetch(
        `http://127.0.0.1:8000/filtered-jobs?target_role=${targetRole}`
      );

      const updatedJobs = await jobsResponse.json();

      setJobs(updatedJobs);

      // Insights
      const insightsResponse = await fetch(
        "http://127.0.0.1:8000/career-insights"
      );
      const insights = await insightsResponse.json();
      setCareerInsights(insights);

      // Score
      const scoreResponse = await fetch(
        "http://127.0.0.1:8000/market-score"
      );
      const scoreData = await scoreResponse.json();
      setMarketScore(scoreData.score);

      // Resources
      const resourceResponse = await fetch(
        "http://127.0.0.1:8000/learning-resources"
      );
      const resourceData = await resourceResponse.json();
      setResources(resourceData);

      // Skill Gaps
      const skillResponse = await fetch(
        "http://127.0.0.1:8000/skill-gaps"
      );
      const skillData = await skillResponse.json();
      setSkillGaps(skillData);

      // Roadmap
      const roadmapResponse = await fetch(
        `http://127.0.0.1:8000/roadmap?target_role=${encodeURIComponent(targetRole)}`
      );
      const roadmapData = await roadmapResponse.json();
      setRoadmap(roadmapData.roadmap);

      showToast("Career profile analysis fully populated!", "success");
    } catch (err) {
      showToast("Error processing upload structure.", "info");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black pb-24 relative overflow-hidden">
      
      {/* Custom Styles & Animation Layer */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.02); }
        }
        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 12s ease-in-out 4s infinite;
        }
        .scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(to right, transparent, #10b981, transparent);
          box-shadow: 0 0 15px #10b981, 0 0 30px #10b981;
          animation: scan 2.5s linear infinite;
          z-index: 10;
        }
      `}</style>

      {/* Decorative High-End Background Ambient Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[55%] bg-emerald-950/20 rounded-full blur-[140px] pointer-events-none animate-float" />
      <div className="absolute top-[45%] right-[-10%] w-[55%] h-[60%] bg-blue-950/20 rounded-full blur-[160px] pointer-events-none animate-float-delayed" />

      {/* Custom Floating Status Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl shadow-emerald-950/30 max-w-sm transition-all duration-300 transform scale-100">
          <span className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-400 animate-pulse" : "bg-blue-400"}`} />
          <p className="text-sm font-semibold text-zinc-200">{toast.message}</p>
        </div>
      )}

      {/* Primary Layout Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
        
        {/* Navigation & Header Panel */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-zinc-900 pb-8 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Anakin Holocron Integrated
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2 bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              GhostScout
            </h1>
            <p className="text-zinc-400 text-base font-medium max-w-xl">
              AI Career Copilot &amp; Real-Time Internship Intelligence Platform
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex gap-3">
            <button
              onClick={refreshJobs}
              disabled={isRefreshing}
              className="flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-850 active:scale-95 border border-zinc-800 text-zinc-300 hover:text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-black/40"
            >
              <svg className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 19l-1.21-1.21M19.24 10a8 8 0 11-1.21-1.21L19.24 10zM19.24 10h-5V5" />
              </svg>
              {isRefreshing ? "Syncing..." : "Refresh Live Jobs"}
            </button>
          </div>
        </header>

        {/* SECTION 1: RESUME INGESTION ENGINE */}
        <section className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 sm:p-8 mb-10 transition-all shadow-xl hover:border-zinc-800 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Resume Parsing Terminal
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Upload your profile to map immediate compatibility ratios across global indexes</p>
            </div>
            {isUploading && (
              <span className="text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1 rounded-md animate-pulse font-mono">
                Gemini-2.5-Flash Executing...
              </span>
            )}
          </div>

          {/* Interactive File Drop Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`group cursor-pointer border-2 border-dashed ${isUploading ? 'border-emerald-500/60 bg-emerald-950/10' : 'border-zinc-800 hover:border-emerald-500/30 bg-zinc-950/40 hover:bg-zinc-900/10'} p-8 rounded-2xl transition-all duration-300 text-center mb-6 flex flex-col items-center justify-center relative overflow-hidden`}
          >
            {isUploading && <div className="scan-line" />}
            
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
            />
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-all mb-4 ${isUploading ? 'bg-emerald-950/40 border-emerald-500/40 scale-105' : 'bg-zinc-900 border-zinc-850 group-hover:bg-emerald-950/20 group-hover:border-emerald-500/20'}`}>
              <svg className={`h-6 w-6 transition-colors ${isUploading ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors relative z-10">
              {isUploading ? "Constructing Vector Representation..." : "Upload Resume PDF to Generate Analytics"}
            </p>
            <p className="text-xs text-zinc-500 mt-1 relative z-10">Formats accepted: Single or multi-page PDF up to 10MB</p>
          </div>

          {resumeAnalysis && (
            <div className="mt-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              
              {/* Profile Metrics Summary */}
              <div className="bg-zinc-950/80 border border-zinc-900 p-6 rounded-2xl">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
                  Extracted Profile Vectors
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Indexed Skills</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {resumeAnalysis.skills?.length || 0}
                    </p>
                  </div>

                  <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Identified Strengths</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {resumeAnalysis.strengths?.length || 0}
                    </p>
                  </div>

                  <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Improvement Areas</p>
                    <p className="text-2xl font-black text-white mt-1">
                      {resumeAnalysis.improvements?.length || 0}
                    </p>
                  </div>

                  <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Apex Candidate Fit</p>
                    <p className="text-xs font-bold text-emerald-400 truncate mt-2">
                      {bestJob ? `${bestJob.company} (${bestJob.score}%)` : "Uncalculated"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary and Overview Narrative */}
              <div className="bg-zinc-950/50 border border-zinc-900 p-6 rounded-2xl">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Professional Narrative Summary</h3>
                <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">
                  {resumeAnalysis.summary}
                </p>
              </div>

              {/* Skills Spectrum Block */}
              <div className="bg-zinc-950/50 border border-zinc-900 p-6 rounded-2xl">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Extracted Technical Competency</h3>
                <div className="flex flex-wrap gap-2">
                  {resumeAnalysis.skills?.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="bg-zinc-900 border border-zinc-850 text-zinc-300 px-3 py-1.5 rounded-lg text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths and Dev Imperatives Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-950/50 border border-zinc-900 p-6 rounded-2xl">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="h-1 w-2.5 bg-emerald-400 rounded-full" /> Highlighted Edge Advantages
                  </h3>
                  <ul className="space-y-3">
                    {resumeAnalysis.strengths?.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs text-zinc-350">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-900 p-6 rounded-2xl">
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="h-1 w-2.5 bg-amber-500 rounded-full" /> Career Growth Catalysts
                  </h3>
                  <ul className="space-y-3">
                    {resumeAnalysis.improvements?.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2.5 text-xs text-zinc-350">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">!</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: THE METRICS & EXECUTIVE DASHBOARD PANEL */}
        <section className="grid md:grid-cols-12 gap-8 mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          
          {/* Market Readiness Gauge Component */}
          <div className="md:col-span-5 bg-zinc-900/40 backdrop-blur-md border border-zinc-900 p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Market Readiness Index
              </h2>
              <p className="text-zinc-500 text-xs leading-relaxed">Composite percentile match across dynamic target listings</p>
            </div>
            
            <div className="my-6">
              {resumeAnalysis ? (
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black tracking-tight ${
                    marketScore >= 70 ? "text-emerald-400" : marketScore >= 40 ? "text-amber-400" : "text-rose-400"
                  }`}>
                    {marketScore}
                  </span>
                  <span className="text-zinc-500 font-bold text-lg">/ 100</span>
                </div>
              ) : (
                <div className="py-4 text-left">
                  <p className="text-zinc-500 text-sm font-semibold italic">Awaiting Profile Analysis</p>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    Upload a resume to generate your career intelligence report.
                  </p>
                </div>
              )}

              {/* Progress Slider Track with glowing ambient indicators */}
              <div className="w-full bg-zinc-950 rounded-full h-2.5 mt-4 overflow-hidden border border-zinc-900">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    marketScore >= 70 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" : marketScore >= 40 ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                  }`}
                  style={{ width: `${resumeAnalysis ? marketScore : 0}%` }}
                />
              </div>
            </div>

            <div className="text-[10px] font-mono text-zinc-500">
              Computed index score based on vector gap overlaps
            </div>
          </div>

          {/* Quick Stats Bento Panel */}
          <div className="md:col-span-7 grid grid-cols-2 gap-4">
            
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Jobs Scoped</p>
                <p className="text-3xl font-black text-white mt-1">
                  {resumeAnalysis ? jobs.length : "—"}
                </p>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">Active tracking database</span>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Core Gap</p>
                <p className="text-base font-black text-rose-400 mt-2 truncate">
                  {resumeAnalysis && skillGaps[0] ? skillGaps[0].skill : "—"}
                </p>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">Top developmental overlap</span>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Matched Partner</p>
                <p className="text-base font-black text-emerald-400 mt-2 truncate">
                  {resumeAnalysis && jobs[0] ? jobs[0].company : "—"}
                </p>
              </div>
              <span className="text-[10px] text-emerald-500/80 font-mono">Highest matching ratio</span>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Integration Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-zinc-300">Synchronized</span>
                </div>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">Anakin Wire API</span>
            </div>

          </div>
        </section>

        {/* Dynamic Telemetry Insights Subcard */}
        {careerInsights && resumeAnalysis && (
          <section className="bg-zinc-900/40 border border-zinc-900 p-6 rounded-2xl mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Insights Engine Telemetry
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Target Objective</p>
                <p className="text-sm font-bold text-zinc-200 mt-1">{careerInsights.best_match_role}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Apex Match Company</p>
                <p className="text-sm font-bold text-zinc-200 mt-1">{careerInsights.best_match_company}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Urgent Learning Objective</p>
                <p className="text-sm font-bold text-rose-400 mt-1">{careerInsights.top_skill_gap}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Scope Depth</p>
                <p className="text-sm font-bold text-emerald-400 mt-1">{careerInsights.jobs_analyzed} Vectors Analyzed</p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: PRIORITY SKILL GAPS PANEL */}
        <section className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 sm:p-8 mb-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Priority Skill Gaps
          </h2>
          <p className="text-xs text-zinc-400 mb-6">Skills highly demanded by active market targets that are missing on your candidate profile</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {resumeAnalysis ? (
              skillGaps.map((item, index) => (
                <div
                  key={index}
                  className="bg-zinc-950/60 border border-zinc-900 hover:border-rose-950 px-4 py-3.5 rounded-xl flex items-center justify-between transition-all"
                >
                  <span className="font-semibold text-zinc-200 text-sm truncate">{item.skill}</span>
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10">
                    {item.count} jobs
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full py-4 text-center text-zinc-500 text-sm italic">
                Awaiting Resume Ingestion
              </div>
            )}
            {resumeAnalysis && skillGaps.length === 0 && (
              <div className="col-span-full py-4 text-center text-zinc-500 text-sm italic">
                No deficiencies found! Profile matches the entire target scope perfectly.
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: AI CAREER ROADMAP PANEL */}
        <section className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 sm:p-8 mb-10 relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Gemini Adaptive Engine</span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Interactive Learning Path
          </h2>
          <p className="text-zinc-400 text-xs mb-6">Chronological multi-week developmental roadmap constructed dynamically for your objective</p>

          <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-6 shadow-inner relative max-h-[450px] overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
            {resumeAnalysis ? (
              roadmap ? roadmap : "Generating timeline strategy sequence..."
            ) : (
              <div className="text-center py-12 text-zinc-600 italic">
                System standing by. Please upload a profile to design the learning track.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">The downloadable PDF includes additional detailed action logs and code execution steps.</p>
            <a
              href="http://127.0.0.1:8000/download-report"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Export Report (.PDF)
            </a>
          </div>
        </section>

        {/* SECTION 5: CURATED LEARNING SYLLABUS PANEL */}
        <section className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 sm:p-8 mb-10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Syllabus Core Assets
          </h2>
          <p className="text-xs text-zinc-400 mb-6">Direct access to official documentation and targeted tutorials corresponding to missing credentials</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumeAnalysis ? (
              resources.map((item, index) => (
                <a
                  key={index}
                  href={item.resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-900 hover:border-blue-500/30 p-5 rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                        Focus: {item.skill}
                      </span>
                      <h3 className="text-zinc-200 group-hover:text-white font-bold mt-2 text-sm">
                        Curated Guide
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Deep dive tutorial specifically targeting key prerequisites in this engineering track.
                      </p>
                    </div>
                    <div className="h-7 w-7 bg-zinc-900 group-hover:bg-blue-950 rounded-lg flex items-center justify-center border border-zinc-850 transition-colors">
                      <svg className="h-4 w-4 text-zinc-400 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-zinc-500 text-sm italic">
                Awaiting Resume Ingestion
              </div>
            )}
            {resumeAnalysis && resources.length === 0 && (
              <div className="col-span-full py-8 text-center text-zinc-500 text-sm italic">
                All matching core assets unlocked! You are qualified for all analyzed opportunities.
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: SEARCH & CONTROLS INTERACTION PANEL */}
        <section className="grid md:grid-cols-3 gap-6 mb-10 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          
          <div className="md:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Search &amp; Score Threshold Filters
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by company or job role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950/80 text-zinc-100 placeholder-zinc-600 p-3 pl-10 rounded-xl border border-zinc-900 focus:border-emerald-500/40 focus:outline-none text-xs transition-all"
                />
                <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={minimumScore}
                onChange={(e) => setMinimumScore(Number(e.target.value))}
                className="w-full bg-zinc-950/80 text-zinc-300 p-3 rounded-xl border border-zinc-900 focus:border-emerald-500/40 focus:outline-none text-xs cursor-pointer transition-all"
              >
                <option value={0}>Threshold: All Scores</option>
                <option value={25}>Match Accuracy: 25% +</option>
                <option value={50}>Match Accuracy: 50% +</option>
                <option value={75}>Match Accuracy: 75% +</option>
              </select>
            </div>
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Target Engineering Path
              </h3>
              <p className="text-[10px] text-zinc-500">Configure target pipeline trajectory</p>
            </div>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-zinc-950/80 text-zinc-200 p-3 rounded-xl border border-zinc-900 focus:border-blue-500/40 focus:outline-none text-xs cursor-pointer transition-all mt-4"
            >
              <option>AI Engineer</option>
              <option>Backend Developer</option>
              <option>Frontend Developer</option>
              <option>Data Scientist</option>
              <option>Cybersecurity Engineer</option>
            </select>
          </div>
        </section>

        {/* SECTION 7: DETAILED JOBS INDEX FEED */}
        <section className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-900 pb-6 mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                Internship Matching Index
              </h2>
              <p className="text-zinc-500 text-xs mt-1">
                Real-time opportunities mapped dynamically to candidate constraints
              </p>
            </div>
            <div className="text-xs font-mono text-zinc-500 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-900">
              Filtered: {resumeAnalysis ? filteredJobs.length : 0} positions
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumeAnalysis ? (
              filteredJobs.map((job, index) => (
                <div
                  key={index}
                  className="group bg-zinc-900/30 backdrop-blur-md border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                  style={{ animationDelay: `${0.9 + (index * 0.05)}s` }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="text-base font-bold text-zinc-300 group-hover:text-white transition-colors truncate">
                        {job.company}
                      </h3>
                      {job.isNew && (
                        <span className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors mb-4 line-clamp-1">
                      {job.role}
                    </p>

                    {/* Score Progress Gauge */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1.5">
                        <span>Relevance Match Score</span>
                        <span className="font-bold text-emerald-400">{job.score}%</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${job.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Metadata Skills Mapping */}
                    <div className="space-y-4 pt-4 border-t border-zinc-900/60">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Matched Competencies</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.matchedSkills?.map((skill, i) => (
                            <span
                              key={i}
                              className="bg-emerald-950/20 text-emerald-300 text-[10px] font-medium px-2 py-0.5 rounded border border-emerald-900/20"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                          {(!job.matchedSkills || job.matchedSkills.length === 0) && (
                            <span className="text-[10px] text-zinc-600 italic">None yet matching</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Missing Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.missingSkills?.map((skill, i) => (
                            <span
                              key={i}
                              className="bg-rose-950/20 text-rose-300 text-[10px] font-medium px-2 py-0.5 rounded border border-rose-900/20"
                            >
                              ✗ {skill}
                            </span>
                          ))}
                          {(!job.missingSkills || job.missingSkills.length === 0) && (
                            <span className="text-[10px] text-emerald-400 font-semibold">✓ Perfect Alignment</span>
                          )}
                        </div>
                      </div>

                      {/* AI Recommender Steps display */}
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Next Priority Step</p>
                        <ul className="space-y-1">
                          {job.missingSkills?.slice(0, 2).map((skill, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-center gap-1.5">
                              <span className="h-1 w-1 bg-blue-400 rounded-full" />
                              Learn {skill}
                            </li>
                          ))}
                          {(!job.missingSkills || job.missingSkills.length === 0) && (
                            <li className="text-xs text-zinc-500 italic flex items-center gap-1.5">
                              <span className="h-1 w-1 bg-zinc-550 rounded-full" /> Qualified to Submit
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Match Optimization Metrics */}
                      <div className="bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-900 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-550 font-medium">Post-Learning Alignment:</span>
                        <span className="font-bold text-emerald-400">
                          {job.score}% → {job.potentialScore}%
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed italic bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-900">
                        💡 {job.matchReason}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-900/60">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-zinc-900 hover:bg-emerald-500 group-hover:border-emerald-500/20 text-zinc-300 group-hover:text-zinc-950 px-4 py-2.5 rounded-xl text-xs font-bold text-center border border-zinc-850 transition-all block"
                    >
                      Apply Now →
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-24 bg-zinc-900/20 border border-zinc-900 rounded-3xl">
                <svg className="h-12 w-12 text-zinc-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
                <p className="text-zinc-400 font-bold text-lg">No Matching Positions Found</p>
                <p className="text-zinc-500 text-sm mt-1">Upload a resume to generate your career intelligence report.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}