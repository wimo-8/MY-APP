import { AiModel, StudyGuide, DomainCheckResult } from '../types';

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

export interface ModelConfig {
    apiKey: string;
    baseUrl?: string;
    modelName?: string;
}

export class ModelService {
    private provider: ModelProvider;

    constructor(config: ModelConfig) {
        this.provider = this.initializeProvider(config);
    }

    private initializeProvider(_config: ModelConfig): ModelProvider {
        throw new Error("Please implement a specific AI provider");
    }

    private getModelPersona(modelType: AiModel, task: 'detection' | 'generation'): string {
        const basePersona =
            "You are an English-first dental education coach. Keep answers concise, cite evidence, and focus on exam-ready clarity.";
        
        if (task === 'detection') {
            return "You are an AI classifier. Your task is to identify the academic domain of a given text.";
        }

        if (modelType === AiModel.GPT5) {
            return `${basePersona} Assume GPT-5 level depth: add light coaching guidance where useful.`;
        }
        return basePersona;
    }

    public async extractTextFromImage(_imageData: string, _mimeType: string): Promise<string> {
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
        
        Your task is to analyze the document below and produce a complete study guide in English. Follow these rules:
        1.  Use the provided text as your only source of truth.
        2.  Every fact must include a citation with a page number (assume pagination starts at 1 when absent).
        3.  Return valid JSON matching the schema exactly.

        Source document:
        ---
        ${fileContent}
        ---
        
        Respond with JSON only.`;

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

        const result = await this.provider.generateStructuredContent<Omit<StudyGuide, 'originalContent'>>({
            prompt,
            schema: studyGuideSchema,
            temperature: 0.3
        });

        return { ...result, originalContent: fileContent };
    }
}
