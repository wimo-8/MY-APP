import React, { useState, useEffect } from 'react';
import { StudyGuide, QuizItem, MicroQuizTopic } from '../types';
import Spinner from './shared/Spinner';

interface StudyScreenProps {
    studyGuide: StudyGuide;
    onStartQuiz: (items: QuizItem[], title: string) => void;
}

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 shadow-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-right p-4 flex justify-between items-center bg-slate-800/80 hover:bg-slate-700/80 transition-colors">
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                <h3 className="text-xl font-semibold text-sky-300">{title}</h3>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-slate-700 animate-fade-in-fast">
                    {children}
                </div>
            )}
        </div>
    );
};

const Citation: React.FC<{ page?: number; quote?: string }> = ({ page, quote }) => {
    if (!page && !quote) return null;
    return (
        <span className="text-xs text-emerald-400/80 mr-2" title={quote ? `"${quote}"` : ''}>
            (ص. {page || 'غير محدد'})
        </span>
    );
};


const StudyScreen: React.FC<StudyScreenProps> = ({ studyGuide, onStartQuiz }) => {
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

    const getTopicTitle = (topicId: string) => {
        // A simple lookup to find the title from the primary study data
        const topic = studyGuide.primary_study.find(t => t.topic_id === topicId);
        return topic ? `اختبار قصير: ${topic.topic_id}` : 'اختبار قصير';
    }

    return (
        <div className="w-full max-w-5xl h-full p-2 sm:p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-2xl animate-fade-in flex flex-col">
            <div className="flex-shrink-0 flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-4">
                 <h1 className="text-3xl font-bold text-sky-300">دليل الدراسة</h1>
                <button onClick={() => setIsQuizModalOpen(true)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold transition-transform transform hover:scale-105">
                    اختبر معلوماتك
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pl-2 space-y-4">
                <AccordionItem title="ملخص سريع" defaultOpen>
                    <p className="text-slate-300 whitespace-pre-wrap">{studyGuide.quick_summary}</p>
                </AccordionItem>
                
                <AccordionItem title="المحتوى الدراسي الأساسي">
                    <div className="space-y-6">
                        {studyGuide.primary_study.map(topic => (
                            <div key={topic.topic_id} className="p-4 bg-slate-900/50 rounded-lg">
                                <h4 className="font-bold text-lg text-emerald-300 mb-3">{topic.topic_id}</h4>
                                <div className="space-y-2">
                                    <h5 className="font-semibold text-sky-400">الأهداف:</h5>
                                    <ul className="list-disc list-inside pr-4 space-y-1 text-slate-300">
                                        {topic.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                    </ul>
                                    <h5 className="font-semibold text-sky-400 pt-2">النقاط الرئيسية:</h5>
                                    <ul className="list-disc list-inside pr-4 space-y-1 text-slate-300">
                                        {topic.key_points.map((pt, i) => <li key={i}>{pt}</li>)}
                                    </ul>
                                    {topic.examples && topic.examples.length > 0 && <>
                                        <h5 className="font-semibold text-sky-400 pt-2">أمثلة:</h5>
                                        <ul className="list-disc list-inside pr-4 space-y-1 text-slate-300">
                                            {topic.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                        </ul>
                                    </>}
                                    <div className="pt-2">
                                        {topic.citations.map((cit, i) => <Citation key={i} page={cit.page} quote={cit.quote} />)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </AccordionItem>

                {studyGuide.glossary.length > 0 && (
                     <AccordionItem title="مسرد المصطلحات">
                        <div className="space-y-3">
                            {studyGuide.glossary.map((item, index) => (
                                <div key={index}>
                                    <span className="font-semibold text-emerald-300">{item.term}</span>
                                    <Citation page={item.page} />:
                                    <span className="text-slate-300 mr-1">{item.definition}</span>
                                </div>
                            ))}
                        </div>
                    </AccordionItem>
                )}
                 {studyGuide.concept_map.length > 0 && (
                     <AccordionItem title="خريطة المفاهيم">
                        <div className="space-y-2 font-mono text-sky-300">
                            {studyGuide.concept_map.map((item, index) => (
                                <div key={index}>
                                    [{item.from}] --({item.relation})--> [{item.to}]
                                </div>
                            ))}
                        </div>
                    </AccordionItem>
                )}
            </div>
            
            {isQuizModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-fast"
                    onClick={() => setIsQuizModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-700"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex-shrink-0 p-4 border-b border-slate-700">
                            <h2 className="text-xl font-bold text-sky-300 text-center">اختر اختباراً</h2>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto space-y-3">
                            {studyGuide.micro_quizzes.map(mq => (
                                <button
                                    key={mq.topic_id}
                                    onClick={() => {
                                        onStartQuiz(mq.items, getTopicTitle(mq.topic_id));
                                        setIsQuizModalOpen(false);
                                    }}
                                    className="w-full p-3 bg-slate-700 hover:bg-sky-700 rounded-lg text-white font-semibold transition-colors text-right"
                                >
                                    {getTopicTitle(mq.topic_id)} ({mq.items.length} أسئلة)
                                </button>
                            ))}
                            <hr className="border-slate-600 my-3" />
                             <button
                                onClick={() => {
                                    onStartQuiz(studyGuide.final_assessment.items, `الاختبار النهائي (${studyGuide.final_assessment.time_suggestion_minutes} دقيقة مقترحة)`);
                                    setIsQuizModalOpen(false);
                                }}
                                className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold transition-colors text-center"
                            >
                                الاختبار النهائي الشامل ({studyGuide.final_assessment.items.length} سؤالاً)
                            </button>
                        </div>
                        <div className="flex-shrink-0 p-3 border-t border-slate-700 text-center">
                            <button onClick={() => setIsQuizModalOpen(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-semibold transition-colors">
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

             <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default StudyScreen;
