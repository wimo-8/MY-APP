
import React, { useState, useEffect } from 'react';

interface BackgroundProps {
    topic: string;
}

const Background: React.FC<BackgroundProps> = ({ topic }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [prevImageUrl, setPrevImageUrl] = useState('');

    useEffect(() => {
        const newUrl = `https://picsum.photos/1920/1080?random=${encodeURIComponent(topic)}`;
        setPrevImageUrl(imageUrl);
        setImageUrl(newUrl);
    }, [topic]);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {prevImageUrl && (
                <img
                    key={prevImageUrl}
                    src={prevImageUrl}
                    alt="background"
                    className="absolute inset-0 w-full h-full object-cover animate-fade-out scale-105"
                />
            )}
            {imageUrl && (
                <img
                    key={imageUrl}
                    src={imageUrl}
                    alt="background"
                    className="absolute inset-0 w-full h-full object-cover animate-fade-in scale-105"
                />
            )}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"></div>
            <div
                className="absolute inset-0 opacity-70 mix-blend-screen animate-glow"
                style={{
                    background: 'radial-gradient(circle at 20% 20%, rgba(14,165,233,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(16,185,129,0.35), transparent 40%), radial-gradient(circle at 50% 80%, rgba(59,130,246,0.25), transparent 35%)'
                }}
            ></div>
            <div className="absolute inset-0 opacity-20">
                <svg
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid slice"
                >
                    <defs>
                        <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 1.2s ease-in-out forwards;
                }
                @keyframes fade-out {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .animate-fade-out {
                    animation: fade-out 1s ease-in-out forwards;
                }
                @keyframes glow {
                    0% { transform: scale(1); opacity: 0.55; }
                    50% { transform: scale(1.05); opacity: 0.85; }
                    100% { transform: scale(1); opacity: 0.55; }
                }
                .animate-glow {
                    animation: glow 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Background;
