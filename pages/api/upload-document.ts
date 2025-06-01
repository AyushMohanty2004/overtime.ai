import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const { fields, files } = await parseForm(req);
    
    // Extract text from the uploaded document
    const extractedText = await extractTextFromDocument(files.document);
    
    // Process the text with Gemini AI to extract key information
    const processedContent = await processDocumentContent(extractedText);
    
    return res.status(200).json({
      message: 'Document uploaded and processed successfully',
      fileName: files.document.originalFilename,
      fileSize: files.document.size,
      extractedText: extractedText.substring(0, 500) + '...', // Send a preview
      processedContent
    });
  } catch (error) {
    console.error('Error processing document upload:', error);
    return res.status(500).json({ error: 'Failed to process document' });
  }
}

// Define custom interface for parsed files
interface ParsedFiles {
  document: File;
  [key: string]: File | File[];
}

// Parse form data with formidable
const parseForm = async (req: NextApiRequest): Promise<{ fields: Fields; files: ParsedFiles }> => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Cast files to our custom interface that expects a document file
      const parsedFiles = files as unknown as ParsedFiles;
      
      if (!parsedFiles.document) {
        reject(new Error('No document file uploaded'));
        return;
      }
      
      resolve({ fields, files: parsedFiles });
    });
  });
};

// Extract text from the uploaded document
const extractTextFromDocument = async (file: File): Promise<string> => {
  // Read the file content
  const fileContent = fs.readFileSync(file.filepath);
  
  // For simplicity, we're assuming text files for now
  // In a production app, you would use libraries like pdf-parse for PDFs,
  // mammoth for DOCX, etc.
  
  // Basic text extraction based on file type
  const fileName = file.originalFilename || 'unknown';
  const fileExt = path.extname(fileName).toLowerCase();
  
  if (fileExt === '.txt') {
    return fileContent.toString('utf-8');
  } else if (fileExt === '.pdf' || fileExt === '.docx' || fileExt === '.doc') {
    // For demo purposes, we'll return a placeholder
    // In a real app, use appropriate libraries for each file type
    return `[Extracted content from ${fileExt} file: ${fileName}]\n\n` +
           `This is a simulated extraction. In a production environment, we would use:\n` +
           `- pdf-parse for PDF files\n` +
           `- mammoth for DOCX files\n` +
           `- other specialized libraries for different file formats\n\n` +
           `For now, we're simulating syllabus content extraction.`;
  } else {
    throw new Error(`Unsupported file type: ${fileExt}`);
  }
};

// Process document content with Gemini AI
const processDocumentContent = async (text: string): Promise<any> => {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Prompt for extracting structured information
    const prompt = `
      You are an AI assistant helping to extract key information from a syllabus or job description.
      Please analyze the following document and extract:
      
      1. Main topics/requirements (as a list)
      2. Key concepts that need to be understood
      3. Important dates or deadlines (if any)
      4. Prerequisites or assumed knowledge
      5. Recommended resources or references
      
      Format the response as a structured JSON object with these fields.
      
      Document content:
      ${text}
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Try to parse the response as JSON
    try {
      // Extract JSON from the text (in case the model wraps it in markdown code blocks)
      const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        textResponse.match(/```\n([\s\S]*?)\n```/) || 
                        [null, textResponse];
      
      const jsonStr = jsonMatch[1] || textResponse;
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Error parsing JSON from model response:', parseError);
      // Return the text response if JSON parsing fails
      return { rawContent: textResponse };
    }
  } catch (error) {
    console.error('Error processing with Gemini:', error);
    throw error;
  }
};
