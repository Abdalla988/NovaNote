import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface FlashcardData {
    front: string;
    back: string;
    difficulty: number;
}

export interface GenerationProgress {
    step: string;
    progress: number;
}

@Injectable({
    providedIn: 'root'
})
export class AIGenerationService {
    private openai: OpenAI;

    constructor() {
        // Move API key to environment variable in production
        const apiKey = this.getApiKey();
        
        this.openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // TODO: Move to backend in production
        });
    }

    private getApiKey(): string {
        // In production, this should come from a secure backend
        // For now, keeping it functional for development
        return 'YOUR_OPENAI';
    }

    async generateFlashcards(
        file: File, 
        subject: string,
        progressCallback?: (progress: GenerationProgress) => void
    ): Promise<FlashcardData[]> {
        try {
            // Step 0: Basic validation
            this.validateInput(file, subject);
            
            // Step 1: Extract text from file
            progressCallback?.({ step: 'Extracting text from document...', progress: 20 });
            const extractedText = await this.extractTextFromFile(file);

            if (!extractedText || extractedText.trim().length < 50) {
                throw new Error('Could not extract sufficient text from the document. Please ensure the file contains readable text.');
            }

            // Step 2: Sanitize content
            const sanitizedText = this.sanitizeText(extractedText);
            const sanitizedSubject = this.sanitizeSubject(subject);

            // Step 3: Generate flashcards using OpenAI
            progressCallback?.({ step: 'Generating flashcards with AI...', progress: 60 });
            const flashcards = await this.generateFlashcardsFromText(sanitizedText, sanitizedSubject);

            progressCallback?.({ step: 'Finalizing flashcards...', progress: 90 });

            // Step 4: Validate and format results
            const validatedFlashcards = this.validateFlashcards(flashcards);

            progressCallback?.({ step: 'Complete!', progress: 100 });
            return validatedFlashcards;

        } catch (error) {
            console.error('Error generating flashcards:', error);
            throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async extractTextFromFile(file: File): Promise<string> {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();

        try {
            if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
                return await this.extractTextFromPDF(file);
            } else if (fileType.includes('text') || fileName.endsWith('.txt')) {
                return await this.extractTextFromText(file);
            } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
                return await this.extractTextFromWord(file);
            } else if (fileType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|bmp)$/)) {
                // For images, we'll use OCR via OpenAI Vision API
                return await this.extractTextFromImage(file);
            } else {
                // Try as text file
                return await this.extractTextFromText(file);
            }
        } catch (error) {
            console.error('Error extracting text:', error);
            throw new Error('Could not extract text from this file format. Please try a PDF, Word document, or text file.');
        }
    }

    private async extractTextFromPDF(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    }

    private async extractTextFromText(file: File): Promise<string> {
        return await file.text();
    }

    private async extractTextFromWord(file: File): Promise<string> {
        // For Word documents, we'll need to use a different approach
        // Since mammoth doesn't work in browser, we'll try to read as text
        try {
            const arrayBuffer = await file.arrayBuffer();
            // Try to extract text using basic parsing
            const text = new TextDecoder().decode(arrayBuffer);
            // Clean up the text to remove binary data
            const cleanText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (cleanText.length < 50) {
                throw new Error('Could not extract readable text from Word document');
            }
            
            return cleanText;
        } catch (error) {
            throw new Error('Could not process Word document. Please convert to PDF or text format.');
        }
    }

    private async extractTextFromImage(file: File): Promise<string> {
        try {
            // Convert image to base64
            const base64 = await this.fileToBase64(file);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Extract all text content from this image. Return only the text without any additional commentary."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            });

            return response.choices[0].message.content || '';
        } catch (error) {
            throw new Error('Could not extract text from image. Please ensure the image contains clear, readable text.');
        }
    }

    private async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private async generateFlashcardsFromText(text: string, subject: string): Promise<FlashcardData[]> {
        // Truncate text if too long (OpenAI has token limits)
        const maxTextLength = 8000; // Conservative limit
        const truncatedText = text.length > maxTextLength ? text.substring(0, maxTextLength) + '...' : text;

        const prompt = `You are an expert educator creating flashcards for ${subject}. 

Based on the following content, create exactly 5 high-quality flashcards that cover the most important concepts, definitions, formulas, or facts.

Content:
${truncatedText}

Instructions:
- Create exactly 5 flashcards
- Focus on the most important and testable concepts
- Make questions clear and specific
- Provide complete, accurate answers
- Vary difficulty levels (1-5 scale)
- Ensure questions test understanding, not just memorization
- Format your response as valid JSON

Return a JSON array with exactly 5 objects, each having this structure:
{
  "front": "Clear, specific question",
  "back": "Complete, accurate answer",
  "difficulty": 1-5 (1=very easy, 5=very hard)
}

Example for Mathematics:
[
  {
    "front": "What is the quadratic formula?",
    "back": "x = (-b ± √(b²-4ac)) / 2a, where ax² + bx + c = 0",
    "difficulty": 3
  }
]

Generate the flashcards now:`;

        const response = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert educator who creates high-quality educational flashcards. Always respond with valid JSON containing exactly 5 flashcard objects."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('No response from AI');
        }

        try {
            // Try to parse the JSON response
            let jsonContent = content.trim();
            
            // Remove any markdown code block formatting
            if (jsonContent.startsWith('```')) {
                jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            }
            
            const flashcards = JSON.parse(jsonContent);
            
            if (!Array.isArray(flashcards)) {
                throw new Error('Response is not an array');
            }

            return flashcards;
        } catch (parseError) {
            console.error('Failed to parse AI response:', content);
            throw new Error('AI returned invalid response format');
        }
    }

    private validateFlashcards(flashcards: any[]): FlashcardData[] {
        const validated: FlashcardData[] = [];

        for (const card of flashcards) {
            if (card.front && card.back && typeof card.front === 'string' && typeof card.back === 'string') {
                validated.push({
                    front: card.front.trim(),
                    back: card.back.trim(),
                    difficulty: this.validateDifficulty(card.difficulty)
                });
            }
        }

        if (validated.length === 0) {
            throw new Error('No valid flashcards could be generated from the content');
        }

        return validated;
    }

    private validateDifficulty(difficulty: any): number {
        const num = parseInt(difficulty);
        if (isNaN(num) || num < 1 || num > 5) {
            return 3; // Default to medium difficulty
        }
        return num;
    }

    detectSubjectFromFile(fileName: string): string {
        const name = fileName.toLowerCase();
        
        // Math-related keywords
        if (name.includes('math') || name.includes('calculus') || name.includes('algebra') || 
            name.includes('geometry') || name.includes('statistics') || name.includes('trigonometry')) {
            return 'Mathematics';
        }
        
        // Science-related keywords
        if (name.includes('physics') || name.includes('mechanics') || name.includes('quantum')) {
            return 'Physics';
        }
        
        if (name.includes('chemistry') || name.includes('organic') || name.includes('inorganic') || 
            name.includes('biochemistry')) {
            return 'Chemistry';
        }
        
        if (name.includes('biology') || name.includes('anatomy') || name.includes('genetics') || 
            name.includes('molecular')) {
            return 'Biology';
        }
        
        // History-related keywords
        if (name.includes('history') || name.includes('historical') || name.includes('war') || 
            name.includes('civilization')) {
            return 'History';
        }
        
        // Language-related keywords
        if (name.includes('english') || name.includes('literature') || name.includes('writing') || 
            name.includes('grammar')) {
            return 'English';
        }
        
        // Computer Science
        if (name.includes('programming') || name.includes('computer') || name.includes('software') || 
            name.includes('algorithm') || name.includes('code')) {
            return 'Computer Science';
        }
        
        // Economics/Business
        if (name.includes('economics') || name.includes('business') || name.includes('finance') || 
            name.includes('accounting')) {
            return 'Economics';
        }
        
        // Psychology
        if (name.includes('psychology') || name.includes('cognitive') || name.includes('behavior')) {
            return 'Psychology';
        }
        
        return 'General Studies';
    }

    // Basic validation methods for improved security
    private validateInput(file: File, subject: string): void {
        // File size validation (10MB limit)
        const maxFileSize = 10485760;
        if (file.size > maxFileSize) {
            throw new Error(`File size must be less than ${maxFileSize / 1024 / 1024}MB`);
        }

        // File type validation
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.ppt', '.pptx'];
        const fileName = file.name.toLowerCase();
        const isAllowedType = allowedTypes.some(type => 
            fileName.endsWith(type) || file.type.includes(type.replace('.', ''))
        );

        if (!isAllowedType) {
            throw new Error(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
        }

        // Subject validation
        if (!subject || subject.trim().length === 0) {
            throw new Error('Subject is required');
        }
    }

    private sanitizeText(text: string): string {
        // Remove potentially malicious content and limit length
        let sanitized = text
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
            .replace(/javascript:/gi, '') // Remove javascript: protocols
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();

        // Limit text length for API limits
        const maxTextLength = 8000;
        if (sanitized.length > maxTextLength) {
            sanitized = sanitized.substring(0, maxTextLength) + '...';
        }

        return sanitized;
    }

    private sanitizeSubject(subject: string): string {
        return subject
            .replace(/[<>\"']/g, '') // Remove HTML/script chars
            .replace(/[^\w\s-]/g, '') // Keep only alphanumeric, spaces, hyphens
            .trim()
            .substring(0, 50); // Limit length
    }
}
