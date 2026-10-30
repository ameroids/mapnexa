import { useEffect, useState } from 'react';
import { Code2 } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade-out after ~1.8s
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1800);

    // Call onFinish after 2.1s (allowing smooth fade transition)
    const endTimer = setTimeout(() => {
      onFinish();
    }, 2100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#090D16] transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background radial ambient glow matching theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/25 via-cyan-500/15 to-transparent rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Brand Logo Symbol */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-glow-brand animate-scale-in">
            <div className="w-full h-full bg-[#0F172A] rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30 animate-pulse" />
              <Code2 size={36} className="text-white relative z-10 stroke-[2.2]" />
            </div>
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
          </span>
        </div>

        {/* Studio Branding */}
        <div className="space-y-1.5 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Ameroids Tech Studio
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Next-Gen Location & Enterprise Software
          </p>
        </div>

        {/* Elegant Animated Loading Bar */}
        <div className="mt-8 w-44 h-1 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 rounded-full animate-[progress_1.8s_ease-in-out_forwards]" />
        </div>
      </div>
    </div>
  );
}

