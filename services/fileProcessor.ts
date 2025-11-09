import { AiModel } from '../types';
import { extractTextFromImage } from './geminiService';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]); // remove base64 prefix
        reader.onerror = error => reject(error);
    });
};

const processTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target?.result as string);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

const processImageFile = async (file: File, modelType: AiModel): Promise<string> => {
    const base64Data = await fileToBase64(file);
    return extractTextFromImage(base64Data, file.type, modelType);
};

const processPdfFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (!event.target?.result) {
                    return reject(new Error("Failed to read PDF file."));
                }
                const pdfData = new Uint8Array(event.target.result as ArrayBuffer);
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                let textContent = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text = await page.getTextContent();
                    textContent += text.items.map((item: any) => item.str).join(' ');
                    textContent += '\n';
                }
                resolve(textContent);
            } catch (error) {
                console.error("PDF processing error:", error);
                reject(new Error("Could not process the PDF file. It might be corrupted or protected."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

const processDocxFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (!event.target?.result) {
                    return reject(new Error("Failed to read DOCX file."));
                }
                const arrayBuffer = event.target.result as ArrayBuffer;
                const result = await mammoth.extractRawText({ arrayBuffer });
                resolve(result.value);
            } catch (error) {
                console.error("DOCX processing error:", error);
                reject(new Error("Could not process the DOCX file. It might be corrupted."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};


export const processFile = async (file: File, modelType: AiModel): Promise<string> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType.startsWith('image/')) {
        return processImageFile(file, modelType);
    }
    if (fileType === 'application/pdf') {
        return processPdfFile(file);
    }
    if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return processDocxFile(file);
    }
    if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileType === 'text/plain') {
        return processTextFile(file);
    }
    
    throw new Error(`Unsupported file format: ${fileName}. Please upload a supported document or image.`);
};