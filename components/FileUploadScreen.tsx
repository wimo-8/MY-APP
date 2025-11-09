import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import Spinner from './shared/Spinner';

interface FileUploadScreenProps {
    onFileProcess: (file: File) => void;
    appState: AppState;
    processingMessage: string;
    error: string | null;
}

const FileUploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
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
            <div className="text-center p-8 bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl">
                <Spinner />
                <h2 className="text-2xl font-bold text-sky-300 mt-4 animate-pulse">{processingMessage}</h2>
                <p className="text-slate-400 mt-2">يقوم الذكاء الاصطناعي بإعداد دليلك الدراسي المخصص...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl text-center">
            <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-400">
                مساعد طب الأسنان الذكي
            </h1>
            <p className="text-lg text-slate-300 mb-8">
                ارفع ملف طب الأسنان الخاص بك لبدء جلسة تعلم مدعومة بالذكاء الاصطناعي.
            </p>
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`p-10 border-4 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${dragActive ? 'border-sky-400 bg-sky-900/50' : 'border-slate-600 hover:border-sky-500 hover:bg-slate-800/50'}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf,.docx,image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <FileUploadIcon />
                    <p className="text-slate-300">
                        <span className="font-semibold text-sky-400">انقر للرفع</span> أو قم بسحب الملف وإفلاته
                    </p>
                    <p className="text-xs text-slate-500">الملفات المدعومة: TXT, MD, PDF, DOCX, صور</p>
                </div>
            </div>
            {error && <p className="mt-4 text-red-400 bg-red-900/50 px-4 py-2 rounded-lg">{error}</p>}
        </div>
    );
};

export default FileUploadScreen;