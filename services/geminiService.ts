import { GoogleGenAI, Type } from "@google/genai";
import { AiModel, StudyGuide, DomainCheckResult } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set. Please add it to your .env.local file.");
}

const ai = new GoogleGenAI({ apiKey });
const model = ai.models;

const getModelPersona = (modelType: AiModel, task: 'detection' | 'generation'): string => {
    const basePersona =
        "You are an English-speaking dental education expert. You cite evidence whenever possible and focus on actionable guidance for students preparing for clinics or exams.";

    if (task === 'detection') {
        return "You are an AI classifier. Your task is to identify the academic domain of a given text.";
    }

    if (modelType === AiModel.GPT5) {
        return `${basePersona} Assume GPT-5 level reasoning: deliver concise coaching remarks and emphasize decision points.`;
    }
    return basePersona;
};

const domainCheckSchema = {
    type: Type.OBJECT,
    properties: {
        detected_domain: { type: Type.STRING, enum: ["dentistry", "medicine", "computer_science", "other"] },
        confidence: { type: Type.NUMBER },
        evidence: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        decision: { type: Type.STRING, enum: ["continue", "stop_domain_mismatch"] }
    },
    required: ["detected_domain", "confidence", "decision"]
};

const studyGuideSchema = {
    type: Type.OBJECT,
    properties: {
        quick_summary: { type: Type.STRING, description: "6-10 English sentences that summarize the entire document." },
        primary_study: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    topic_id: { type: Type.STRING },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
                    examples: { type: Type.ARRAY, items: { type: Type.STRING } },
                    citations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { page: { type: Type.NUMBER }, quote: { type: Type.STRING } }, required: ['page', 'quote'] } },
                },
                required: ["topic_id", "objectives", "key_points", "citations"]
            }
        },
        secondary_study: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    topic_id: { type: Type.STRING },
                    deep_explanations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    common_misconceptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    advanced_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    citations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { page: { type: Type.NUMBER }, quote: { type: Type.STRING } }, required: ['page', 'quote'] } },
                },
                required: ["topic_id", "deep_explanations", "citations"]
            }
        },
        glossary: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING },
                    page: { type: Type.NUMBER },
                },
                required: ["term", "definition", "page"]
            }
        },
        concept_map: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    from: { type: Type.STRING },
                    to: { type: Type.STRING },
                    relation: { type: Type.STRING },
                },
                required: ["from", "to", "relation"]
            }
        },
        micro_quizzes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    topic_id: { type: Type.STRING },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                qid: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ["mcq", "short", "truefalse"] },
                                stem: { type: Type.STRING },
                                choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                                answer: { type: Type.STRING },
                                explanation: { type: Type.STRING },
                                citation: { type: Type.OBJECT, properties: { page: { type: Type.NUMBER }, quote: { type: Type.STRING } }, required: ['page', 'quote'] },
                                bloom: { type: Type.STRING, enum: ["remember", "understand", "apply", "analyze", "evaluate", "create"] },
                            },
                            required: ["qid", "type", "stem", "answer", "explanation", "citation", "bloom"]
                        }
                    }
                },
                required: ["topic_id", "items"]
            }
        },
        final_assessment: {
            type: Type.OBJECT,
            properties: {
                items: { type: Type.ARRAY, items: { '$ref': '#/properties/micro_quizzes/items/properties/items/items' } },
                time_suggestion_minutes: { type: Type.NUMBER },
            },
            required: ["items", "time_suggestion_minutes"]
        }
    },
    required: ["quick_summary", "primary_study", "secondary_study", "glossary", "concept_map", "micro_quizzes", "final_assessment"]
};

export const extractTextFromImage = async (base64Data: string, mimeType: string, _modelType: AiModel): Promise<string> => {
    const imagePart = {
        inlineData: {
            mimeType,
            data: base64Data,
        },
    };
    const textPart = {
        text: "Extract all legible text from this image. Return text only, no commentary.",
    };

    const response = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
};

export const detectDomain = async (fileContent: string, modelType: AiModel): Promise<DomainCheckResult> => {
    const persona = getModelPersona(modelType, 'detection');
    const prompt = `${persona}
    Analyze the following text and determine its academic domain. Your response must be in JSON format.
    The 'decision' should be 'continue' if confidence for 'dentistry' is >= 0.7, otherwise it should be 'stop_domain_mismatch'.

    Text to analyze:
    ---
    ${fileContent.substring(0, 4000)}
    ---
    `;
    
    const result = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: domainCheckSchema
        }
    });

    return JSON.parse(result.text) as DomainCheckResult;
};

export const generateStudyGuide = async (fileContent: string, modelType: AiModel): Promise<StudyGuide> => {
    const persona = getModelPersona(modelType, 'generation');
    const prompt = `${persona}
    
Your job is to deeply analyze the material below and craft a complete study guide in English. Strict rules:
1. Use only the provided text as your knowledge source.
2. Support every fact with a citation containing a page number (assume the document starts at page 1 when not given).
3. Output must be valid JSON that matches the provided schema exactly.

Source material:
---
${fileContent}
---

Return JSON only.`;

    const result = await model.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: studyGuideSchema
        }
    });
    
    const jsonString = result.text;
    const parsed = JSON.parse(jsonString) as Omit<StudyGuide, 'originalContent'>;

    return { ...parsed, originalContent: fileContent };
};
