import { GoogleGenAI, Type } from "@google/genai";
import { AiModel, StudyGuide, DomainCheckResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models;

const getModelPersona = (modelType: AiModel, task: 'detection' | 'generation'): string => {
    // The core persona is now fixed by the user spec.
    // The modelType can add a flavor to it.
    const basePersona = "أنت مساعد تعليمي متخصص في طب الأسنان فقط. المصدر الوحيد للمعرفة هو النص المرفق. أي ادعاء علمي يجب أن يُسنَد باقتباس. اللغة الافتراضية هي العربية الفصحى بنبرة أكاديمية وودودة.";
    
    if (task === 'detection') {
        return "You are an AI classifier. Your task is to identify the academic domain of a given text.";
    }

    if (modelType === AiModel.GPT5) {
        return `${basePersona} أنت GPT-5، النموذج الأكثر تطوراً، وتحليلك يجب أن يكون فائق الدقة والعمق.`;
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
        quick_summary: { type: Type.STRING, description: "6-10 جمل تلخص المحتوى مع الإشارة للصفحات." },
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
                items: { type: Type.ARRAY, items: { '$ref': '#/properties/micro_quizzes/items/properties/items/items' } }, // Re-use quiz item schema
                time_suggestion_minutes: { type: Type.NUMBER },
            },
            required: ["items", "time_suggestion_minutes"]
        }
    },
    required: ["quick_summary", "primary_study", "secondary_study", "glossary", "concept_map", "micro_quizzes", "final_assessment"]
};

// FIX: Added missing extractTextFromImage function to process image-based files.
export const extractTextFromImage = async (base64Data: string, mimeType: string, modelType: AiModel): Promise<string> => {
    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Data,
        },
    };
    const textPart = {
        text: "Extract any and all text from this image. The image is likely a page from a dental textbook or document. Return only the extracted text.",
    };

    // Note: modelType is not used here as gemini-2.5-flash is best for this specific multimodal task.
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
    
    مهمتك هي تحليل المستند التالي بشكل كامل وإنشاء دليل دراسة شامل باللغة العربية. يجب أن تلتزم بالقواعد التالية بدقة:
    1.  المصدر الوحيد للمعلومات هو النص المرفق. ممنوع استخدام معلومات خارجية.
    2.  كل معلومة أو نقطة دراسية يجب أن تكون مدعومة باقتباس مباشر من النص مع رقم الصفحة (افترض أن النص يبدأ من الصفحة 1).
    3.  المخرجات يجب أن تكون بصيغة JSON مطابقة تماماً للمخطط المحدد.

    المستند:
    ---
    ${fileContent}
    ---
    
    قم بإنشاء دليل الدراسة الآن.`;

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