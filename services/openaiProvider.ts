import { ModelProvider, ModelConfig } from './modelService';

export class OpenAIProvider implements ModelProvider {
    private apiKey: string;
    private baseUrl: string;
    private modelName: string;

    constructor(config: ModelConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        this.modelName = config.modelName || 'gpt-4-turbo-preview';
    }

    private async makeRequest(endpoint: string, body: any) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        return await response.json();
    }

    async generateContent(options: {
        prompt: string;
        temperature?: number;
        maxTokens?: number;
        responseFormat?: string;
    }): Promise<{ text: string }> {
        const response = await this.makeRequest('/chat/completions', {
            model: this.modelName,
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: options.prompt }
            ],
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens,
            response_format: options.responseFormat ? { type: options.responseFormat } : undefined
        });

        return { text: response.choices[0].message.content };
    }

    async generateStructuredContent<T>(options: {
        prompt: string;
        schema: any;
        temperature?: number;
    }): Promise<T> {
        const response = await this.makeRequest('/chat/completions', {
            model: this.modelName,
            messages: [
                { role: 'system', content: 'You are a helpful assistant that responds with valid JSON.' },
                { role: 'user', content: options.prompt }
            ],
            temperature: options.temperature ?? 0.7,
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content) as T;
    }

    async generateImageDescription(imageData: string): Promise<string> {
        const response = await this.makeRequest('/chat/completions', {
            model: 'gpt-4-vision-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Please describe the text content in this image.' },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${imageData}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        });

        return response.choices[0].message.content;
    }
}