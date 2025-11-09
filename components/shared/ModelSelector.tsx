import React, { useState, useRef, useEffect } from 'react';
import { AiModel } from '../../types';

interface ModelSelectorProps {
    selectedModel: AiModel;
    onModelChange: (model: AiModel) => void;
}

const BrainIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C9.25 2 7 4.25 7 7C7 8.67 7.84 10.13 9 11V12.5C9 13.05 8.55 13.5 8 13.5C7.45 13.5 7 13.05 7 12.5V11.82C6.39 11.43 6 10.77 6 10C6 8.9 6.9 8 8 8C9.1 8 10 8.9 10 10C10 10.77 9.61 11.43 9 11.82V12.5C9.83 13.19 10.84 13.7 12 13.92V14H8C6.9 14 6 14.9 6 16V17C6 17.55 6.45 18 7 18H17C17.55 18 18 17.55 18 17V16C18 14.9 17.1 14 16 14H12V13.92C13.16 13.7 14.17 13.19 15 12.5V11.82C14.39 11.43 14 10.77 14 10C14 8.9 14.9 8 16 8C17.1 8 18 8.9 18 10C18 10.77 17.61 11.43 17 11.82V12.5C17 13.05 16.55 13.5 16 13.5C15.45 13.5 15 13.05 15 12.5V11C16.16 10.13 17 8.67 17 7C17 4.25 14.75 2 12 2Z" />
    </svg>
);


const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const models = Object.values(AiModel);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    const handleSelect = (model: AiModel) => {
        onModelChange(model);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/80 rounded-lg backdrop-blur-sm transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <BrainIcon className="w-5 h-5 text-sky-300" />
                <span className="font-medium text-sm">{selectedModel}</span>
                <svg className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 animate-fade-in-fast" role="menu">
                    <ul className="py-1">
                        {models.map(model => (
                            <li key={model} role="none">
                                <button
                                    onClick={() => handleSelect(model)}
                                    className={`w-full text-right px-4 py-2 text-sm transition-colors ${selectedModel === model ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                    role="menuitem"
                                >
                                    {model}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ModelSelector;