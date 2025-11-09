import React, { useState, useEffect, useRef } from 'react';
import { AppState, StudyGuide, AiModel, QuizItem } from './types';
import { detectDomain, generateStudyGuide } from './services/geminiService';
import { processFile } from './services/fileProcessor';
import FileUploadScreen from './components/FileUploadScreen';
import StudyScreen from './components/StudyScreen';
import QuizScreen from './components/QuizScreen';
import Background from './components/shared/Background';
import Spinner from './components/shared/Spinner';
import ModelSelector from './components/shared/ModelSelector';
import SplashScreen from './components/SplashScreen';

const LOCAL_STORAGE_KEY = 'dentalStudyAI_progress_v3';

const STAGE_TIMELINE = [
    {
        id: AppState.FILE_UPLOAD,
        label: 'Upload & prepare',
        description: 'Select the source file or medical image you want the AI to explore.'
    },
    {
        id: AppState.PROCESSING,
        label: 'Intelligent analysis',
        description: 'We clean the text, confirm the academic domain, and map every section.'
    },
    {
        id: AppState.STUDY_TOPICS,
        label: 'Guided study',
        description: 'Navigate summaries, objectives, glossary entries, and concept links.'
    },
    {
        id: AppState.QUIZ_IN_PROGRESS,
        label: 'Interactive exams',
        description: 'Validate your understanding with adaptive quizzes and instant feedback.'
    },
    {
        id: AppState.QUIZ_RESULTS,
        label: 'Results & insights',
        description: 'Inspect your accuracy, review explanations, and plan the next review.'
    }
] as const;

const ONBOARDING_TIPS = [
    'Prefer PDF or DOCX exports (or clear medical imagery) for the cleanest extraction.',
    'Switch the AI model before uploading if you want a different voice or level of depth.',
    'Keep headings and annotations in the document—the engine indexes them automatically.'
] as const;

const SUPPORTED_FORMATS = ['PDF', 'DOCX', 'Medical imagery', 'Markdown/TXT'] as const;

const NEXT_STEP_HINTS = [
    'Start with the quick summary to prime your understanding before drilling into details.',
    'Use the concept map section to see which topics deserve extra reinforcement.',
    'Finish with the micro-quizzes before attempting the full final assessment.'
] as const;

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.FILE_UPLOAD);
    const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string>('');
    const [backgroundTopic, setBackgroundTopic] = useState<string>('abstract dental technology');
    const [selectedModel, setSelectedModel] = useState<AiModel>(AiModel.GEMINI);

    const [activeQuiz, setActiveQuiz] = useState<QuizItem[] | null>(null);
    const [activeQuizTitle, setActiveQuizTitle] = useState<string>('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isInitializing, setIsInitializing] = useState<boolean>(true);
    const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsInitializing(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isInitializing) return;
        try {
            const savedProgress = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedProgress) {
                const parsed = JSON.parse(savedProgress);
                setStudyGuide(parsed.studyGuide);
                setActiveQuiz(parsed.activeQuiz);
                setActiveQuizTitle(parsed.activeQuizTitle);
                setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
                setScore(parsed.score || 0);
                setQuizAnswers(parsed.quizAnswers || {});
                setBackgroundTopic(parsed.backgroundTopic || 'abstract dental technology');
                setSelectedModel(parsed.selectedModel || AiModel.GEMINI);
                setAppState(parsed.appState || AppState.FILE_UPLOAD);
            }
        } catch (err) {
            console.error('Failed to load saved progress.', err);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    }, [isInitializing]);

    useEffect(() => {
        if (isLoading || isInitializing || appState === AppState.FILE_UPLOAD) return;
        const progress = {
            appState,
            studyGuide,
            activeQuiz,
            activeQuizTitle,
            currentQuestionIndex,
            score,
            quizAnswers,
            backgroundTopic,
            selectedModel
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
    }, [
        appState,
        studyGuide,
        activeQuiz,
        activeQuizTitle,
        currentQuestionIndex,
        score,
        quizAnswers,
        backgroundTopic,
        selectedModel,
        isLoading,
        isInitializing
    ]);

    useEffect(() => {
        if (appState === AppState.STUDY_TOPICS) {
            setBackgroundTopic('detailed dental diagram');
        } else if (appState >= AppState.QUIZ_IN_PROGRESS) {
            setBackgroundTopic('dental examination room');
        } else if (appState === AppState.FILE_UPLOAD) {
            setBackgroundTopic('abstract dental technology');
        }
    }, [appState]);

    useEffect(() => {
        return () => {
            if (processingTimeoutRef.current) {
                clearTimeout(processingTimeoutRef.current);
            }
        };
    }, []);

    const handleFileProcess = async (file: File) => {
        setAppState(AppState.PROCESSING);
        setError(null);
        handleResetQuizState();

        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
        }

        try {
            setProcessingMessage(`Processing "${file.name}"...`);
            const fileContent = await processFile(file, selectedModel);
            if (!fileContent || fileContent.trim().length === 0) {
                throw new Error('The file does not contain readable text. Please upload a document with clear content.');
            }

            setProcessingMessage('Verifying that the material matches the dental domain...');
            const domainResult = await detectDomain(fileContent, selectedModel);
            if (domainResult.decision !== 'continue') {
                throw new Error('The uploaded content is not recognized as dentistry or a related medical topic.');
            }

            setProcessingMessage('Building a structured study guide, glossary, and quiz bank...');
            const guide = await generateStudyGuide(fileContent, selectedModel);

            setStudyGuide(guide);
            setProcessingMessage('Finalizing the interface...');
            processingTimeoutRef.current = setTimeout(() => {
                setAppState(AppState.STUDY_TOPICS);
            }, 900);
        } catch (err) {
            console.error(err);
            const message =
                err instanceof Error
                    ? err.message
                    : 'An unexpected error occurred while processing the file. Please try again.';
            setError(message);
            setAppState(AppState.FILE_UPLOAD);
        }
    };

    const handleStartQuiz = (items: QuizItem[], title: string) => {
        handleResetQuizState();
        setActiveQuiz(items);
        setActiveQuizTitle(title);
        setAppState(AppState.QUIZ_IN_PROGRESS);
    };

    const handleQuizFinish = (finalScore: number, finalAnswers: Record<number, string>) => {
        setScore(finalScore);
        setQuizAnswers(finalAnswers);
        setAppState(AppState.QUIZ_RESULTS);
    };

    const handleReset = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setAppState(AppState.FILE_UPLOAD);
        setStudyGuide(null);
        setError(null);
        setProcessingMessage('');
        handleResetQuizState();
        setSelectedModel(AiModel.GEMINI);
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
        }
    };

    const handleResetQuizState = () => {
        setActiveQuiz(null);
        setActiveQuizTitle('');
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizAnswers({});
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center p-8 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl">
                    <Spinner />
                    <h2 className="text-2xl font-bold text-sky-300 mt-4">Loading your last workspace...</h2>
                </div>
            );
        }

        switch (appState) {
            case AppState.FILE_UPLOAD:
            case AppState.PROCESSING:
                return (
                    <FileUploadScreen
                        onFileProcess={handleFileProcess}
                        appState={appState}
                        processingMessage={processingMessage}
                        error={error}
                    />
                );
            case AppState.STUDY_TOPICS:
                return (
                    studyGuide && <StudyScreen studyGuide={studyGuide} onStartQuiz={handleStartQuiz} />
                );
            case AppState.QUIZ_IN_PROGRESS:
            case AppState.QUIZ_RESULTS:
                return (
                    <QuizScreen
                        appState={appState}
                        quiz={activeQuiz}
                        quizTitle={activeQuizTitle}
                        onQuizFinish={handleQuizFinish}
                        onBackToStudy={() => {
                            handleResetQuizState();
                            setAppState(AppState.STUDY_TOPICS);
                        }}
                        currentQuestionIndex={currentQuestionIndex}
                        setCurrentQuestionIndex={setCurrentQuestionIndex}
                        score={score}
                        setScore={setScore}
                        userAnswers={quizAnswers}
                        setUserAnswers={setQuizAnswers}
                    />
                );
            default:
                return (
                    <FileUploadScreen
                        onFileProcess={handleFileProcess}
                        appState={AppState.FILE_UPLOAD}
                        processingMessage=""
                        error="The application is in an unknown state. Please refresh and try again."
                    />
                );
        }
    };

    const renderInsightsPanel = () => {
        if (!studyGuide) {
            return (
                <div className="space-y-4">
                    <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                        <h3 className="text-lg font-semibold text-white mb-3">Kick-off checklist</h3>
                        <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
                            {ONBOARDING_TIPS.map((tip) => (
                                <li key={tip} className="flex items-start gap-2">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                        <p className="text-sm text-slate-300 mb-2">Supported formats</p>
                        <div className="flex flex-wrap gap-2">
                            {SUPPORTED_FORMATS.map((format) => (
                                <span
                                    key={format}
                                    className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-100 border border-white/5"
                                >
                                    {format}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        const totalPrimaryTopics = studyGuide.primary_study.length;
        const totalSecondaryTopics = studyGuide.secondary_study.length;
        const glossaryCount = studyGuide.glossary.length;
        const conceptLinks = studyGuide.concept_map.length;
        const microQuizCount = studyGuide.micro_quizzes.length;
        const microQuizItems = studyGuide.micro_quizzes.reduce((sum, topic) => sum + topic.items.length, 0);
        const finalAssessmentItems = studyGuide.final_assessment.items.length;
        const recommendedMinutes = Math.max(
            studyGuide.final_assessment.time_suggestion_minutes,
            totalPrimaryTopics * 6
        );
        const trimmedSummary =
            studyGuide.quick_summary?.length > 220
                ? `${studyGuide.quick_summary.slice(0, 220)}…`
                : studyGuide.quick_summary;

        const metricCards = [
            { label: 'Core topics', value: totalPrimaryTopics },
            { label: 'Advanced dives', value: totalSecondaryTopics },
            { label: 'Glossary items', value: glossaryCount },
            { label: 'Concept links', value: conceptLinks },
            { label: 'Micro-quizzes', value: `${microQuizCount} / ${microQuizItems} questions` },
            { label: 'Final assessment', value: `${finalAssessmentItems} Q • ${recommendedMinutes} min` }
        ];

        return (
            <div className="space-y-4">
                <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                    <p className="text-sm text-slate-400 mb-2">Instant summary</p>
                    <p className="text-sm text-slate-100 leading-relaxed">{trimmedSummary}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {metricCards.map((card) => (
                        <div key={card.label} className="bg-slate-900/60 rounded-2xl border border-white/5 p-4 shadow">
                            <p className="text-xs text-slate-400">{card.label}</p>
                            <p className="text-lg font-semibold text-white mt-1">{card.value}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                    <p className="text-sm font-semibold text-white mb-3">Next step suggestions</p>
                    <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
                        {NEXT_STEP_HINTS.map((tip) => (
                            <li key={tip} className="flex items-start gap-2">
                                <span className="mt-1 h-2 w-2 rounded-full bg-sky-400"></span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    if (isInitializing) {
        return <SplashScreen />;
    }

    const currentStageIndex = Math.max(
        0,
        STAGE_TIMELINE.findIndex((stage) => stage.id === appState)
    );

    return (
        <div className="relative min-h-screen w-full bg-slate-950 text-white">
            <Background topic={backgroundTopic} />
            <div className="relative z-10 min-h-screen px-4 py-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <header className="flex flex-col gap-4 text-left">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/40 to-sky-400/40 border border-white/10 flex items-center justify-center text-xl font-black tracking-tight">
                                    AI
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">
                                        Intelligent study workspace
                                    </p>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-emerald-300 to-sky-400">
                                        Augmented Dental Companion
                                    </h1>
                                    <p className="text-sm text-slate-300">
                                        Advanced analysis, guided study flows, and adaptive assessments in English.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {appState === AppState.FILE_UPLOAD && (
                                    <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
                                )}
                                {appState !== AppState.FILE_UPLOAD && (
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        Start over
                                    </button>
                                )}
                            </div>
                        </div>
                        {appState === AppState.PROCESSING && (
                            <div className="flex justify-end">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-100 text-sm">
                                    <Spinner small />
                                    <span>{processingMessage || 'Processing file...'}</span>
                                </div>
                            </div>
                        )}
                    </header>

                    <section className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl">
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {STAGE_TIMELINE.map((stage, index) => {
                                const isActive = stage.id === appState;
                                const isDone = currentStageIndex > index;
                                const width = isDone ? '100%' : isActive ? '65%' : '35%';
                                const statusLabel = isActive ? 'In progress' : isDone ? 'Completed' : 'Queued';
                                return (
                                    <div
                                        key={stage.id}
                                        className={`min-w-[220px] rounded-2xl p-4 border transition-all duration-300 ${
                                            isActive
                                                ? 'bg-gradient-to-l from-emerald-500/20 to-sky-500/20 border-white/30'
                                                : 'bg-slate-900/70 border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-xs text-slate-300">
                                            <span className="font-semibold text-slate-100">{`0${index + 1}`}</span>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[11px] ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : isDone
                                                            ? 'bg-emerald-500/20 text-emerald-100'
                                                            : 'bg-slate-800 text-slate-300'
                                                }`}
                                            >
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <p className="text-lg font-semibold mt-2">{stage.label}</p>
                                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{stage.description}</p>
                                        <div className="mt-4 h-1.5 rounded-full bg-slate-800/80">
                                            <div
                                                className={`h-full rounded-full ${
                                                    isActive || isDone
                                                        ? 'bg-gradient-to-l from-emerald-400 to-sky-400'
                                                        : 'bg-slate-600'
                                                }`}
                                                style={{ width }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="flex items-start justify-center">{renderContent()}</div>
                        <aside className="space-y-4">{renderInsightsPanel()}</aside>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default App;
