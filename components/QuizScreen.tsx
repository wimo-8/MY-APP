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
    const totalQuestions = quiz?.length || 0;

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
        setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: selectedAnswer }));

        const isCorrect = selectedAnswer === currentQuestion.answer;
        if (isCorrect) {
            setScore((prev) => prev + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            return;
        }
        onQuizFinish(score, userAnswers);
    };

    const progressPercent = totalQuestions
        ? ((currentQuestionIndex + (showResult ? 1 : 0)) / totalQuestions) * 100
        : 0;

    if (appState === AppState.QUIZ_RESULTS && quiz) {
        const scorePercentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
        const incorrectAnswers = quiz
            .map((question, index) => ({
                question,
                index,
                userAnswer: userAnswers[index]
            }))
            .filter(({ userAnswer, question }) => userAnswer !== question.answer);

        return (
            <div className="w-full max-w-4xl bg-slate-900/80 border border-white/5 rounded-3xl shadow-2xl p-6 space-y-6">
                <div className="text-center space-y-3">
                    <p className="text-sm text-slate-400">Assessment results</p>
                    <h1 className="text-4xl font-bold text-white">{scorePercentage}%</h1>
                    <p className="text-slate-300">
                        You answered {score} out of {totalQuestions} questions correctly.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-4 text-right">
                        <p className="text-xs text-slate-400">Correct answers</p>
                        <p className="text-2xl font-semibold text-emerald-300 mt-1">{score}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-4 text-right">
                        <p className="text-xs text-slate-400">Incorrect answers</p>
                        <p className="text-2xl font-semibold text-red-300 mt-1">{incorrectAnswers.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-4 text-right">
                        <p className="text-xs text-slate-400">Accuracy</p>
                        <p className="text-2xl font-semibold text-sky-300 mt-1">{scorePercentage}%</p>
                    </div>
                </div>
                {incorrectAnswers.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-white">Focus on the questions below for targeted review:</p>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                            {incorrectAnswers.map(({ question, index, userAnswer }) => (
                                <div key={question.qid} className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>Question {index + 1}</span>
                                        <span className="text-emerald-300 uppercase tracking-[0.2em]">{question.bloom}</span>
                                    </div>
                                    <p className="text-white font-semibold">{question.stem}</p>
                                    <p className="text-sm text-red-300">Your answer: {userAnswer || 'Not answered'}</p>
                                    <p className="text-sm text-emerald-300">Correct answer: {question.answer}</p>
                                    <p className="text-sm text-slate-200 leading-relaxed">
                                        <span className="font-semibold text-emerald-400">Explanation:</span> {question.explanation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="text-center">
                    <button
                        onClick={onBackToStudy}
                        className="px-8 py-3 rounded-2xl bg-gradient-to-l from-sky-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/30"
                    >
                        Back to study view
                    </button>
                </div>
            </div>
        );
    }

    if (!quiz || !currentQuestion) {
        return (
            <div className="text-center p-8 bg-slate-900/70 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl">
                <Spinner />
                <h2 className="text-2xl font-bold text-sky-300 mt-4">Preparing the interactive assessment...</h2>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl bg-slate-900/80 border border-white/5 rounded-3xl shadow-2xl p-6 space-y-6">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between text-sm text-slate-300">
                    <span className="font-semibold text-white">{quizTitle || 'Interactive quiz'}</span>
                    <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-l from-emerald-400 to-sky-400"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{currentQuestion.bloom}</p>
                <h2 className="text-2xl font-semibold text-white leading-relaxed">{currentQuestion.stem}</h2>
                {showResult && (
                    <p
                        className={`text-sm font-semibold ${
                            selectedAnswer === currentQuestion.answer ? 'text-emerald-300' : 'text-red-300'
                        }`}
                    >
                        {selectedAnswer === currentQuestion.answer
                            ? 'Correct!'
                            : 'Not quite — review the explanation below.'}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {currentQuestion.choices?.map((option, index) => {
                    const isCorrect = option === currentQuestion.answer;
                    const isSelected = option === selectedAnswer;
                    let className = 'w-full text-right p-4 rounded-2xl border transition-colors text-sm';

                    if (showResult) {
                        if (isCorrect) {
                            className += ' border-emerald-400 bg-emerald-500/10 text-white';
                        } else if (isSelected) {
                            className += ' border-red-400 bg-red-500/10 text-white';
                        } else {
                            className += ' border-white/5 bg-slate-900/40 text-slate-200';
                        }
                    } else {
                        className += isSelected
                            ? ' border-sky-400 bg-sky-500/10 text-white'
                            : ' border-white/10 bg-slate-900/40 hover:border-sky-400 text-slate-200';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            className={className}
                            disabled={showResult}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-400 mb-1">Explanation</p>
                <p className="text-sm text-slate-200 leading-relaxed">
                    {showResult ? currentQuestion.explanation : 'Choose an answer and hit “Check answer” to reveal the explanation.'}
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-300">
                    Progress: {currentQuestionIndex + 1} / {totalQuestions}
                </div>
                {showResult ? (
                    <button
                        onClick={handleNextQuestion}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-l from-sky-500 to-emerald-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/30"
                    >
                        {currentQuestionIndex === totalQuestions - 1 ? 'Show results' : 'Next question'}
                    </button>
                ) : (
                    <button
                        onClick={handleCheckAnswer}
                        disabled={!selectedAnswer}
                        className={`px-6 py-3 rounded-2xl font-semibold text-white transition-colors ${
                            selectedAnswer
                                ? 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-600 cursor-not-allowed text-slate-200'
                        }`}
                    >
                        Check answer
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizScreen;
