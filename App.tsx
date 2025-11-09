import React, { useState, useEffect, useCallback } from 'react';
import { AppState, StudyGuide, UnderstandingLevel, AiModel, QuizItem } from './types';
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
        label: 'رفع وتحضير المحتوى',
        description: 'اختَر الملف المصدري أو الصورة التي سيتعامل معها الذكاء الاصطناعي.'
    },
    {
        id: AppState.PROCESSING,
        label: 'تحليل ذكي متعدد المراحل',
        description: 'يتم تنظيف النص، كشف المجال الأكاديمي، ثم إعداد المخرجات.'
    },
    {
        id: AppState.STUDY_TOPICS,
        label: 'دليل دراسة غني',
        description: 'تصفّح الملخصات، الخرائط المفاهيمية، والمصطلحات المتخصصة.'
    },
    {
        id: AppState.QUIZ_IN_PROGRESS,
        label: 'اختبارات تفاعلية',
        description: 'عزز فهمك عبر امتحانات متدرجة الصعوبة وبطاقات شرح فورية.'
    },
    {
        id: AppState.QUIZ_RESULTS,
        label: 'قراءة النتائج',
        description: 'اطّلع على دقة الإجابات وتوصيات المراجعة الموجهة.'
    }
] as const;

const ONBOARDING_TIPS = [
    'استخدم ملفات بصيغة PDF أو DOCX أو صور عالية الدقة للحصول على فهم أدق.',
    'يمكنك تبديل نموذج الذكاء قبل الرفع لتجربة طبقات مختلفة من العمق.',
    'أضف ملاحظاتك داخل الملف الأصلي؛ المحرك يلتقط العناوين والوسوم تلقائياً.'
] as const;

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.FILE_UPLOAD);
    const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processingMessage, setProcessingMessage] = useState<string>('');
    const [backgroundTopic, setBackgroundTopic] = useState<string>('abstract dental technology');
    const [selectedModel, setSelectedModel] = useState<AiModel>(AiModel.GEMINI);
    
    // Quiz-related state
    const [activeQuiz, setActiveQuiz] = useState<QuizItem[] | null>(null);
    const [activeQuizTitle, setActiveQuizTitle] = useState<string>('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isInitializing, setIsInitializing] = useState<boolean>(true);

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
            console.error("Failed to load saved progress.", err);
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
    }, [appState, studyGuide, activeQuiz, activeQuizTitle, currentQuestionIndex, score, quizAnswers, backgroundTopic, selectedModel, isLoading, isInitializing]);

    useEffect(() => {
        if (appState === AppState.STUDY_TOPICS) {
            setBackgroundTopic('detailed dental diagram');
        } else if (appState >= AppState.QUIZ_IN_PROGRESS) {
            setBackgroundTopic('dental examination room');
        } else if (appState === AppState.FILE_UPLOAD) {
            setBackgroundTopic('abstract dental technology');
        }
    }, [appState]);

    const handleFileProcess = async (file: File) => {
        setAppState(AppState.PROCESSING);
        setError(null);
        handleResetQuizState();

        try {
            setProcessingMessage(`استخلاص النص من ${file.name}...`);
            const fileContent = await processFile(file, selectedModel);
            if (!fileContent || fileContent.trim().length === 0) {
                throw new Error("لم يتمكن النظام من استخلاص أي نص من الملف. الرجاء المحاولة بملف مختلف.");
            }

            setProcessingMessage("التحقق من مجال المستند...");
            const domainResult = await detectDomain(fileContent, selectedModel);
            if (domainResult.decision !== "continue") {
                 throw new Error("التطبيق متخصص في طب الأسنان فقط. الرجاء رفع مستند متعلق بهذا المجال.");
            }

            setProcessingMessage("إعداد دليل الدراسة المخصص لك...");
            const guide = await generateStudyGuide(fileContent, selectedModel);
            
            setStudyGuide(guide);
            setProcessingMessage("اكتمل التحليل!");
            setTimeout(() => setAppState(AppState.STUDY_TOPICS), 1000);
        } catch (err) {
            console.error(err);
            const errorMessage = (err instanceof Error) ? err.message : 'حدث خطأ غير متوقع أثناء معالجة الملف.';
            setError(errorMessage);
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
    };

    const handleResetQuizState = () => {
        setActiveQuiz(null);
        setActiveQuizTitle('');
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizAnswers({});
    }
    
    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="text-center p-8 bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl">
                    <Spinner />
                    <h2 className="text-2xl font-bold text-sky-300 mt-4">جارٍ تحميل الجلسة السابقة...</h2>
                </div>
            );
        }
        switch (appState) {
            case AppState.FILE_UPLOAD:
            case AppState.PROCESSING:
                return <FileUploadScreen onFileProcess={handleFileProcess} appState={appState} processingMessage={processingMessage} error={error} />;
            case AppState.STUDY_TOPICS:
                return studyGuide && <StudyScreen studyGuide={studyGuide} onStartQuiz={handleStartQuiz} />;
            case AppState.QUIZ_IN_PROGRESS:
            case AppState.QUIZ_RESULTS:
                return <QuizScreen 
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
                        />;
            default:
                return <FileUploadScreen onFileProcess={handleFileProcess} appState={AppState.FILE_UPLOAD} processingMessage="" error="حدث خطأ غير معروف." />;
        }
    };
    
    if (isInitializing) {
        return <SplashScreen />;
    }

    return (
        <div className="relative min-h-screen w-full bg-slate-900 text-white">
            <Background topic={backgroundTopic} />
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 overflow-y-auto">
                <div className="absolute top-4 left-4 flex items-center space-x-4 z-20">
                    {appState === AppState.FILE_UPLOAD && (
                         <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
                    )}
                    {appState !== AppState.FILE_UPLOAD && (
                         <button onClick={handleReset} className="px-4 py-2 bg-red-500/50 hover:bg-red-500/80 rounded-lg backdrop-blur-sm transition-colors">
                            البدء من جديد
                        </button>
                    )}
                </div>
                <div className="w-full h-full flex items-center justify-center">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default App;