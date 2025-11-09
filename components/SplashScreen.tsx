import React from 'react';

const ToothIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-sky-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 21c-1.42 0-2.8-1.02-3-2.5c-.2-1.48.8-2.5 2-2.5h1.22c.62 0 1.22-.38 1.51-.95L10 13h4l1.27 2.05c.29.57.89.95 1.51.95H18c1.2 0 2.2 1.02 2 2.5c-.2 1.48-1.58 2.5-3 2.5H7M9.25 10a1.25 1.25 0 0 1 0-2.5h5.5a1.25 1.25 0 0 1 0 2.5h-5.5M12 2a4 4 0 0 1 4 4v2h-2V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2H8V6a4 4 0 0 1 4-4Z"/>
    </svg>
);

const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50 animate-fade-out-delay">
            <div className="animate-pulse-slow">
                <ToothIcon />
            </div>
            <h1 className="text-4xl font-bold mt-4 text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-400">
                مساعد طب الأسنان الذكي
            </h1>
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
            `}</style>
        </div>
    );
};

export default SplashScreen;