import React, { useState } from 'react';
import { StudyGuide, QuizItem } from '../types';

interface StudyScreenProps {
    studyGuide: StudyGuide;
    onStartQuiz: (items: QuizItem[], title: string) => void;
}

const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
    title,
    description,
    children
}) => (
    <div className="rounded-3xl bg-slate-900/60 border border-white/5 p-5 shadow-xl space-y-4">
        <div>
            <h3 className="text-xl font-semibold text-sky-300">{title}</h3>
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        </div>
        {children}
    </div>
);

const Pill: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-right">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-white mt-1">{value}</p>
    </div>
);

const CitationBadge: React.FC<{ page?: number; quote?: string }> = ({ page, quote }) => {
    if (!page && !quote) return null;
    return (
        <span
            className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1"
            title={quote}
        >
            p.{page ?? '–'}
        </span>
    );
};

const StudyScreen: React.FC<StudyScreenProps> = ({ studyGuide, onStartQuiz }) => {
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

    const totalObjectives = studyGuide.primary_study.reduce((sum, topic) => sum + topic.objectives.length, 0);
    const totalKeyPoints = studyGuide.primary_study.reduce((sum, topic) => sum + topic.key_points.length, 0);
    const totalExamples = studyGuide.primary_study.reduce((sum, topic) => sum + (topic.examples?.length || 0), 0);
    const microQuizCount = studyGuide.micro_quizzes.length;
    const glossaryCount = studyGuide.glossary.length;
    const conceptLinks = studyGuide.concept_map.length;

    const statCards = [
        { label: 'Learning objectives', value: totalObjectives },
        { label: 'Key points', value: totalKeyPoints },
        { label: 'Clinical examples', value: totalExamples },
        { label: 'Glossary terms', value: glossaryCount },
        { label: 'Concept links', value: conceptLinks },
        { label: 'Micro-quizzes', value: microQuizCount }
    ];

    const renderQuizModal = () => {
        if (!isQuizModalOpen) return null;
        return (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="relative w-full max-w-2xl bg-slate-900/90 border border-white/5 rounded-3xl shadow-2xl p-6 space-y-5">
                    <h2 className="text-2xl font-bold text-white">Choose a quiz experience</h2>
                    <p className="text-sm text-slate-300">
                        Start with focused topic quizzes or jump straight into the final assessment.
                    </p>
                    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
                        {studyGuide.micro_quizzes.map((mq) => {
                            const topic = studyGuide.primary_study.find((t) => t.topic_id === mq.topic_id);
                            return (
                                <button
                                    key={mq.topic_id}
                                    onClick={() => {
                                        onStartQuiz(mq.items, topic ? `Quiz • ${topic.topic_id}` : 'Topic quiz');
                                        setIsQuizModalOpen(false);
                                    }}
                                    className="w-full text-right p-4 rounded-2xl bg-slate-800/70 border border-white/5 hover:border-emerald-400/60 hover:bg-slate-800 transition-colors"
                                >
                                    <p className="text-lg font-semibold text-white">{topic ? topic.topic_id : mq.topic_id}</p>
                                    <p className="text-sm text-slate-300 mt-1">{mq.items.length} adaptive questions</p>
                                </button>
                            );
                        })}
                        <div className="border-t border-white/5 pt-4 mt-2">
                            <button
                                onClick={() => {
                                    onStartQuiz(
                                        studyGuide.final_assessment.items,
                                        `Final assessment (${studyGuide.final_assessment.time_suggestion_minutes} min suggested)`
                                    );
                                    setIsQuizModalOpen(false);
                                }}
                                className="w-full p-4 rounded-2xl bg-gradient-to-l from-emerald-500/80 to-sky-500/80 text-white font-bold shadow-lg hover:opacity-95"
                            >
                                Launch full assessment ({studyGuide.final_assessment.items.length} questions)
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsQuizModalOpen(false)}
                        className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-5xl h-full p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col space-y-5 border border-white/5">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-400">Study guide</p>
                        <h1 className="text-3xl font-bold text-white">Personalized learning map</h1>
                    </div>
                    <button
                        onClick={() => setIsQuizModalOpen(true)}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-l from-emerald-500 to-sky-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/30 transition-transform hover:-translate-y-0.5"
                    >
                        Open quiz launcher
                    </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    {statCards.map((stat) => (
                        <Pill key={stat.label} label={stat.label} value={stat.value} />
                    ))}
                </div>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1">
                <SectionCard title="Quick summary" description="Use this snapshot to establish context before deep dives.">
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{studyGuide.quick_summary}</p>
                </SectionCard>

                <SectionCard title="Primary learning tracks" description="Objectives, key points, and practical examples.">
                    <div className="space-y-4">
                        {studyGuide.primary_study.map((topic) => (
                            <div key={topic.topic_id} className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="text-lg font-semibold text-white">{topic.topic_id}</h4>
                                    <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                                        <span className="px-2 py-1 rounded-full bg-slate-900/70">
                                            Objectives: {topic.objectives.length}
                                        </span>
                                        <span className="px-2 py-1 rounded-full bg-slate-900/70">
                                            Key points: {topic.key_points.length}
                                        </span>
                                        {topic.examples?.length ? (
                                            <span className="px-2 py-1 rounded-full bg-slate-900/70">
                                                Examples: {topic.examples.length}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">Learning objectives</p>
                                        <ul className="list-disc list-inside text-slate-200 space-y-1 pr-4">
                                            {topic.objectives.map((obj, index) => (
                                                <li key={index}>{obj}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">Key points</p>
                                        <ul className="list-disc list-inside text-slate-200 space-y-1 pr-4">
                                            {topic.key_points.map((point, index) => (
                                                <li key={index}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                {topic.examples?.length ? (
                                    <div>
                                        <p className="text-sm text-slate-400 mb-1">Clinical examples</p>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {topic.examples.map((example, index) => (
                                                <div key={index} className="rounded-2xl bg-slate-900/60 border border-white/5 p-3 text-sm text-slate-200">
                                                    {example}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                <div className="flex flex-wrap gap-2">
                                    {topic.citations?.map((citation, index) => (
                                        <CitationBadge key={`${topic.topic_id}-cit-${index}`} page={citation.page} quote={citation.quote} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                <SectionCard title="Secondary explorations" description="Deep explanations, misconceptions, and advanced notes.">
                    <div className="space-y-4">
                        {studyGuide.secondary_study.map((topic) => (
                            <div key={topic.topic_id} className="rounded-2xl bg-slate-900/60 border border-white/5 p-4 space-y-3">
                                <h4 className="text-lg font-semibold text-emerald-300">{topic.topic_id}</h4>
                                <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-200">
                                    <div>
                                        <p className="text-slate-400 mb-1">Deep explanations</p>
                                        <ul className="list-disc list-inside space-y-1 pr-4">
                                            {topic.deep_explanations.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 mb-1">Misconceptions</p>
                                        <ul className="list-disc list-inside space-y-1 pr-4">
                                            {topic.common_misconceptions.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 mb-1">Advanced notes</p>
                                        <ul className="list-disc list-inside space-y-1 pr-4">
                                            {topic.advanced_notes.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {topic.citations?.map((citation, index) => (
                                        <CitationBadge key={`${topic.topic_id}-sec-${index}`} page={citation.page} quote={citation.quote} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <SectionCard title="Glossary" description="Precise terminology with source references.">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {studyGuide.glossary.map((term) => (
                                <div key={term.term} className="rounded-2xl bg-slate-900/60 border border-white/5 p-3">
                                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                        <span>p.{term.page}</span>
                                    </div>
                                    <p className="text-lg font-semibold text-white">{term.term}</p>
                                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">{term.definition}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="Concept map" description="Key relationships to keep in mind.">
                        <div className="space-y-3 text-sm text-slate-200">
                            {studyGuide.concept_map.map((concept, index) => (
                                <div key={`${concept.from}-${concept.to}-${index}`} className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
                                    <p className="font-semibold text-white">{concept.from}</p>
                                    <p className="text-emerald-300 text-xs my-1">{concept.relation}</p>
                                    <p className="font-semibold text-white">{concept.to}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>

            {renderQuizModal()}
        </div>
    );
};

export default StudyScreen;
