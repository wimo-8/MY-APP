import React, { useState, useMemo, useEffect } from 'react';
import { AppState, QuizItem } from '../types';
import Spinner from './shared/Spinner';

interface QuizScreenProps {
    appState: AppState;
    quiz: QuizItem[] | null;
    quizTitle: string;
    onQuizFinish: (score: number, answers: Record<number, string>) => void;
    onBackToStudy: () => void;
    currentQuestionIndex: number;
    setCurrentQuestionIndex: (update: React.SetStateAction<number>) => void;
    score: number;
    setScore: (update: React.SetStateAction<number>) => void;
    userAnswers: Record<number, string>;
    setUserAnswers: (update: React.SetStateAction<Record<number, string>>) => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({
    appState,
    quiz,
    quizTitle,
    onQuizFinish,
    onBackToStudy,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    score,
    setScore,
    userAnswers,
    setUserAnswers
}) => {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);

    const currentQuestion = useMemo(() => quiz?.[currentQuestionIndex], [quiz, currentQuestionIndex]);

    useEffect(() => {
        if (appState === AppState.QUIZ_IN_PROGRESS) {
            const previouslyAnswered = userAnswers[currentQuestionIndex];
            if (previouslyAnswered) {
                setSelectedAnswer(previouslyAnswered);
                setShowResult(true);
            } else {
                setSelectedAnswer(null);
                setShowResult(false);
            }
        }
    }, [currentQuestionIndex, appState, userAnswers]);


    const handleAnswerSelect = (option: string) => {
        if (showResult) return;
        setSelectedAnswer(option);
    };

    const handleCheckAnswer = () => {
        if (!selectedAnswer || !currentQuestion) return;

        setShowResult(true);
        setUserAnswers(prev => ({...prev, [currentQuestionIndex]: selectedAnswer}));

        const isCorrect = selectedAnswer === currentQuestion.answer;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
    };
    
    const handleNextQuestion = () => {
        if (currentQuestionIndex < (quiz?.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            onQuizFinish(score, userAnswers);
        }
    };

    if (appState === AppState.QUIZ_RESULTS) {
        if (!quiz) return null;
        const scorePercentage = (score / quiz.length) * 100;
        const incorrectAnswers = quiz
            .map((q, index) => ({ q, index, userAnswer: userAnswers[index] }))
            .filter(item => item.userAnswer !== item.q.answer);

        return (
             <div className="w-full max-w-4xl bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl p-8 animate-fade-in">
                <h1 className="text-4xl font-bold text-center text-sky-300">اكتمل الاختبار!</h1>
                <p className="text-center text-2xl font-semibold mt-2">نتيجتك: <span className={scorePercentage >= 50 ? 'text-emerald-400' : 'text-red-400'}>{scorePercentage.toFixed(0)}%</span> ({score}/{quiz.length})</p>
                
                {incorrectAnswers.length > 0 ? (
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold text-white mb-4">تحليل الإجابات الخاطئة</h2>
                        <div className="space-y-4 max-h-80 overflow-y-auto pl-2">
                           {incorrectAnswers.map(({ q, userAnswer }, i) => (
                               <div key={i} className="p-4 bg-slate-900/50 rounded-lg">
                                   <p className="font-semibold">{q.stem}</p>
                                   <p className="mt-2 text-red-400">إجابتك: {userAnswer || "لا توجد إجابة"}</p>
                                   <p className="text-emerald-400">الإجابة الصحيحة: {q.answer}</p>
                                   <p className="mt-2 text-slate-300"><span className="font-semibold text-emerald-400">التوضيح:</span> {q.explanation}</p>
                               </div>
                           ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-xl text-emerald-300 mt-8">علامة كاملة! لقد أجبت على جميع الأسئلة بشكل صحيح!</p>
                )}

                 <div className="mt-8 text-center">
                    <button onClick={onBackToStudy} className="px-8 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg text-white font-bold transition-transform transform hover:scale-105">
                        العودة للدراسة
                    </button>
                 </div>
             </div>
        )
    }

    if (!quiz || !currentQuestion) {
        return (
            <div className="text-center p-8 bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl">
                <Spinner />
                <h2 className="text-2xl font-bold text-sky-300 mt-4">جارٍ تحميل الاختبار...</h2>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl bg-slate-800/60 backdrop-blur-md rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-sky-300 mb-2">{quizTitle}</h1>
                <p className="text-slate-400">السؤال {currentQuestionIndex + 1} من {quiz.length}</p>
                <h2 className="text-2xl font-semibold text-white mt-2">{currentQuestion.stem}</h2>
            </div>

            <div className="space-y-3">
                {currentQuestion.choices?.map((option, index) => {
                    const isCorrect = option === currentQuestion.answer;
                    const isSelected = option === selectedAnswer;

                    let buttonClass = "w-full text-right p-4 rounded-lg border-2 border-slate-600 hover:bg-slate-700/50 transition-all";
                    if (showResult) {
                        if (isCorrect) buttonClass += " bg-green-500/50 border-green-400";
                        else if (isSelected) buttonClass += " bg-red-500/50 border-red-400";
                    } else {
                        if (isSelected) buttonClass += " bg-sky-600/50 border-sky-400";
                    }

                    return (
                        <button key={index} onClick={() => handleAnswerSelect(option)} className={buttonClass} disabled={showResult}>
                            {option}
                        </button>
                    );
                })}
            </div>

            <div className="mt-8 text-left">
                {showResult ? (
                    <button onClick={handleNextQuestion} className="px-8 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg text-white font-bold transition-transform transform hover:scale-105">
                        {currentQuestionIndex === quiz.length - 1 ? "إنهاء الاختبار" : "السؤال التالي"}
                    </button>
                ) : (
                    <button onClick={handleCheckAnswer} disabled={!selectedAnswer} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                        تحقق من الإجابة
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizScreen;