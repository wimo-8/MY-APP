import React from 'react';

const ToothIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-sky-300 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 21c-1.42 0-2.8-1.02-3-2.5c-.2-1.48.8-2.5 2-2.5h1.22c.62 0 1.22-.38 1.51-.95L10 13h4l1.27 2.05c.29.57.89.95 1.51.95H18c1.2 0 2.2 1.02 2 2.5c-.2 1.48-1.58 2.5-3 2.5H7M9.25 10a1.25 1.25 0 0 1 0-2.5h5.5a1.25 1.25 0 0 1 0 2.5h-5.5M12 2a4 4 0 0 1 4 4v2h-2V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2H8V6a4 4 0 0 1 4-4Z" />
    </svg>
);

const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 animate-fade-out-delay overflow-hidden">
            <div className="absolute inset-0 opacity-60 blur-3xl bg-gradient-to-br from-emerald-500/40 via-sky-500/30 to-indigo-500/30"></div>
            <div className="relative flex flex-col items-center text-center px-6">
                <div className="animate-pulse-slow">
                    <ToothIcon />
                </div>
                <h1 className="text-4xl font-bold mt-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-sky-400">
                    Augmented Dental Companion
                </h1>
                <p className="text-slate-300 mt-3 text-sm sm:text-base max-w-md leading-relaxed">
                    We craft an English-first study experience with precise medical analysis, curated summaries, and
                    adaptive quizzes.
                </p>
                <div className="mt-8 w-56 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="loading-bar h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"></div>
                </div>
            </div>
            <style>{`
                @keyframes fade-out-delay {
                    0%, 70% { opacity: 1; }
                    100% { opacity: 0; visibility: hidden; }
                }
                .animate-fade-out-delay {
                    animation: fade-out-delay 2.5s ease-in-out forwards;
                }
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s infinite ease-in-out;
                }
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .loading-bar {
                    animation: loading 1.6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
