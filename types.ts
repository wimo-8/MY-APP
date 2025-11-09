// Declarations for CDN libraries
declare global {
    const pdfjsLib: any;
    const mammoth: any;
}

export enum AppState {
    FILE_UPLOAD,
    PROCESSING,
    STUDY_TOPICS,
    QUIZ_IN_PROGRESS,
    QUIZ_RESULTS
}

// Based on the new specification
export interface Citation {
    page: number;
    quote: string;
}

export interface PrimaryStudyTopic {
    topic_id: string;
    objectives: string[];
    key_points: string[];
    examples: string[];
    citations: Citation[];
}

export interface SecondaryStudyTopic {
    topic_id: string;
    deep_explanations: string[];
    common_misconceptions: string[];
    advanced_notes: string[];
    citations: Citation[];
}

export interface GlossaryTerm {
    term: string;
    definition: string;
    page: number;
}

export interface ConceptMapLink {
    from: string;
    to: string;
    relation: string;
}

export interface QuizItem {
    qid: string;
    type: "mcq" | "short" | "truefalse";
    stem: string;
    choices?: string[];
    answer: string;
    explanation: string;
    citation: Citation;
    bloom: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
}

export interface MicroQuizTopic {
    topic_id: string;
    items: QuizItem[];
}

export interface FinalAssessment {
    items: QuizItem[];
    time_suggestion_minutes: number;
}

export interface StudyGuide {
    originalContent: string;
    quick_summary: string;
    primary_study: PrimaryStudyTopic[];
    secondary_study: SecondaryStudyTopic[];
    glossary: GlossaryTerm[];
    concept_map: ConceptMapLink[];
    micro_quizzes: MicroQuizTopic[];
    final_assessment: FinalAssessment;
}

export interface DomainCheckResult {
    detected_domain: "dentistry" | "medicine" | "computer_science" | "other";
    confidence: number;
    decision: "continue" | "stop_domain_mismatch";
}

// Keep old types for reference during transition if needed, but they are now legacy.
export enum UnderstandingLevel {
    HIGH = 'High',
    MEDIUM = 'Medium',
    LOW = 'Low'
}

export enum AiModel {
    GEMINI = 'Gemini Pro',
    GPT5 = 'GPT-5 (Simulated)',
}