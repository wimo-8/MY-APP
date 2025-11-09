import { AiModel, StudyGuide, DomainCheckResult } from '../types';

// Interface for any AI model provider
export interface ModelProvider {
    generateContent: (options: {
        prompt: string;
        temperature?: number;
        maxTokens?: number;
        responseFormat?: string;
    }) => Promise<{ text: string }>;
    generateStructuredContent: <T>(options: {
        prompt: string;
        schema: any;
        temperature?: number;
    }) => Promise<T>;
}

// Configuration interface for model providers
export interface ModelConfig {
    apiKey: string;
    baseUrl?: string;
    modelName?: string;
}

// Class to handle different model providers
export class ModelService {
    private provider: ModelProvider;

    constructor(config: ModelConfig) {
        // You can extend this to support different providers (OpenAI, Anthropic, etc.)
        this.provider = this.initializeProvider(config);
    }

    private initializeProvider(config: ModelConfig): ModelProvider {
        // Implement your chosen AI provider here
        // This is just a placeholder - you'll need to implement the actual provider
        throw new Error("Please implement a specific AI provider");
    }

    private getModelPersona(modelType: AiModel, task: 'detection' | 'generation'): string {
        const basePersona = "أنت مساعد تعليمي متخصص في طب الأسنان فقط. المصدر الوحيد للمعرفة هو النص المرفق. أي ادعاء علمي يجب أن يُسنَد باقتباس. اللغة الافتراضية هي العربية الفصحى بنبرة أكاديمية وودودة.";
        
        if (task === 'detection') {
            return "You are an AI classifier. Your task is to identify the academic domain of a given text.";
        }

        if (modelType === AiModel.GPT5) {
            return `${basePersona} أنت GPT-5، النموذج الأكثر تطوراً، وتحليلك يجب أن يكون فائق الدقة والعمق.`;
        }
        return basePersona;
    }

    public async extractTextFromImage(imageData: string, mimeType: string): Promise<string> {
        // Implement image-to-text using your chosen provider or a specialized OCR service
        throw new Error("Please implement image-to-text functionality");
    }

    public async detectDomain(fileContent: string, modelType: AiModel): Promise<DomainCheckResult> {
        const persona = this.getModelPersona(modelType, 'detection');
        const prompt = `${persona}
        Analyze the following text and determine its academic domain. Your response must be in JSON format.
        The 'decision' should be 'continue' if confidence for 'dentistry' is >= 0.7, otherwise it should be 'stop_domain_mismatch'.

        Text to analyze:
        ---
        ${fileContent.substring(0, 4000)}
        ---
        `;

        return await this.provider.generateStructuredContent<DomainCheckResult>({
            prompt,
            schema: {
                type: "object",
                properties: {
                    detected_domain: { type: "string", enum: ["dentistry", "medicine", "computer_science", "other"] },
                    confidence: { type: "number" },
                    evidence: {
                        type: "array",
                        items: { type: "string" }
                    },
                    decision: { type: "string", enum: ["continue", "stop_domain_mismatch"] }
                },
                required: ["detected_domain", "confidence", "decision"]
            }
        });
    }

    public async generateStudyGuide(fileContent: string, modelType: AiModel): Promise<StudyGuide> {
        const persona = this.getModelPersona(modelType, 'generation');
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

        const studyGuideSchema = {
            type: "object",
            properties: {
                quick_summary: { type: "string" },
                primary_study: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            topic_id: { type: "string" },
                            objectives: { type: "array", items: { type: "string" } },
                            key_points: { type: "array", items: { type: "string" } },
                            examples: { type: "array", items: { type: "string" } },
                            citations: { type: "array", items: { type: "object", properties: { page: { type: "number" }, quote: { type: "string" } } } },
                        }
                    }
                },
                secondary_study: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            topic_id: { type: "string" },
                            deep_explanations: { type: "array", items: { type: "string" } },
                            common_misconceptions: { type: "array", items: { type: "string" } },
                            advanced_notes: { type: "array", items: { type: "string" } },
                            citations: { type: "array", items: { type: "object", properties: { page: { type: "number" }, quote: { type: "string" } } } },
                        }
                    }
                },
                glossary: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            term: { type: "string" },
                            definition: { type: "string" },
                            page: { type: "number" },
                        }
                    }
                },
                concept_map: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            from: { type: "string" },
                            to: { type: "string" },
                            relation: { type: "string" },
                        }
                    }
                },
                micro_quizzes: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            topic_id: { type: "string" },
                            items: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        qid: { type: "string" },
                                        type: { type: "string", enum: ["mcq", "short", "truefalse"] },
                                        stem: { type: "string" },
                                        choices: { type: "array", items: { type: "string" } },
                                        answer: { type: "string" },
                                        explanation: { type: "string" },
                                        citation: { type: "object", properties: { page: { type: "number" }, quote: { type: "string" } } },
                                        bloom: { type: "string", enum: ["remember", "understand", "apply", "analyze", "evaluate", "create"] },
                                    }
                                }
                            }
                        }
                    }
                },
                final_assessment: {
                    type: "object",
                    properties: {
                        items: { type: "array" },
                        time_suggestion_minutes: { type: "number" },
                    }
                }
            }
        };

        const result = await this.provider.generateStructuredContent<Omit<StudyGuide, 'originalContent'>>(
            {
                prompt,
                schema: studyGuideSchema,
                temperature: 0.3
            }
        );

        return { ...result, originalContent: fileContent };
    }
}