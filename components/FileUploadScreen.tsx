import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import Spinner from './shared/Spinner';

interface FileUploadScreenProps {
    onFileProcess: (file: File) => void;
    appState: AppState;
    processingMessage: string;
    error: string | null;
}

const FileUploadIcon: React.FC<{ accent?: boolean }> = ({ accent = false }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-14 w-14 ${accent ? 'text-emerald-300' : 'text-sky-300'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ onFileProcess, appState, processingMessage, error }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileProcess(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onFileProcess(file);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    if (appState === AppState.PROCESSING) {
        return (
            <div className="w-full max-w-2xl text-center bg-slate-900/70 backdrop-blur-lg rounded-3xl border border-white/5 p-10 shadow-2xl space-y-6">
                <div className="flex justify-center">
                    <Spinner />
                </div>
                <h2 className="text-3xl font-bold text-emerald-300">
                    {processingMessage || 'We are building your personalized study pack...'}
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                    The pipeline extracts text, validates the dental domain, and generates structured summaries with
                    adaptive quizzes.
                </p>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 animate-progress"></div>
                </div>
                <style>{`
                    @keyframes progressPulse {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    .animate-progress {
                        animation: progressPulse 1.4s ease-in-out infinite;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl space-y-8">
            <div className="rounded-3xl bg-slate-900/70 border border-white/5 p-8 shadow-2xl">
                <div className="flex flex-col gap-4 text-left">
                    <div className="flex items-center gap-4 justify-end">
                        <div>
                            <p className="text-sm text-emerald-300 font-semibold">Precision upload hub</p>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-sky-300 to-emerald-400">
                                Drop your document and let AI curate the rest
                            </h1>
                        </div>
                        <div className="hidden sm:flex">
                            <FileUploadIcon accent />
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        Turn lectures, clinical notes, or imaging sources into a fully organized English guide complete
                        with objectives, examples, and assessments.
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-slate-200">
                        <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                            Detects structure and headings automatically
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                            Works with bilingual/annotated documents
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                            Produces citations and quiz-ready content
                        </div>
                    </div>
                </div>
            </div>

            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`relative p-10 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center backdrop-blur-lg ${
                    dragActive
                        ? 'border-sky-400 bg-slate-800/80 shadow-emerald-500/30 shadow-2xl'
                        : 'border-white/10 bg-slate-900/60 hover:border-sky-400 hover:bg-slate-900/80'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf,.docx,image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-4">
                    <FileUploadIcon />
                    <div>
                        <p className="text-2xl font-semibold text-white">Drag & drop your file, or click to browse</p>
                        <p className="text-sm text-slate-300 mt-2">PDF | DOCX | Medical imagery | Markdown/TXT</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-200">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Domain detection</span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Noise cleaning</span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Summaries & quizzes</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    {
                        title: 'Ingest intelligently',
                        body: 'We scan the document for structure, embedded annotations, and visual references.',
                        badge: '1'
                    },
                    {
                        title: 'Curate the guide',
                        body: 'Key objectives, explanations, and glossaries are organized for fast review.',
                        badge: '2'
                    },
                    {
                        title: 'Assess & coach',
                        body: 'Adaptive quizzes with instant insight reinforce every concept you just reviewed.',
                        badge: '3'
                    }
                ].map((card) => (
                    <div key={card.title} className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">Phase {card.badge}</span>
                            <span className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-300 font-semibold">
                                {card.badge}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed">{card.body}</p>
                    </div>
                ))}
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};

export default FileUploadScreen;
