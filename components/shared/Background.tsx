
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
                    className="absolute inset-0 w-full h-full object-cover animate-fade-out"
                 />
            )}
            {imageUrl && (
                <img
                    key={imageUrl}
                    src={imageUrl}
                    alt="background"
                    className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                />
            )}
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-lg"></div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 1s ease-in-out forwards;
                }
                @keyframes fade-out {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .animate-fade-out {
                    animation: fade-out 1s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Background;
