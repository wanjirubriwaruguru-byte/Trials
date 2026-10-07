import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Native Android Project Download endpoint
app.get('/api/download-android-project', (_req, res) => {
  const archivePath = path.resolve(process.cwd(), 'Pulse75-Android-Native.tar.gz');
  if (fs.existsSync(archivePath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="Pulse75-Android-Native.tar.gz"');
    res.setHeader('Content-Type', 'application/gzip');
    return res.sendFile(archivePath);
  } else {
    return res.status(404).json({ error: 'Android native project archive not found' });
  }
});

// Intelligent File Detection API using Gemini 3.8 Flash
app.post('/api/analyze-file', async (req, res) => {
  try {
    const { fileData, mimeType, fileName, textContent } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured in environment secrets.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are Pulse75 AI Data Engine. Your job is to extract fitness, habit, workout, body measurement, and profile data from uploaded files (fitness logs, workout sheets, body composition slips, coaching PDFs/images, progress spreadsheets, or habit checklists).
Return ONLY a valid JSON object matching this TypeScript structure:
{
  "summary": "Brief 1-2 sentence description of what was detected in the file",
  "confidenceScore": number (0 to 100),
  "detectedProfile": {
    "weight": number (optional, in kg),
    "height": number (optional, in cm),
    "age": number (optional),
    "sex": "male" | "female" | "other" (optional),
    "goalWeight": number (optional, in kg),
    "activityLevel": "sedentary" | "light" | "moderate" | "active" | "very_active" (optional)
  },
  "detectedMeasurements": [
    {
      "date": "YYYY-MM-DD",
      "weight": number (optional, in kg),
      "waist": number (optional, in cm),
      "hips": number (optional, in cm),
      "chest": number (optional, in cm),
      "arms": number (optional, in cm),
      "thighs": number (optional, in cm),
      "bodyFat": number (optional, percentage),
      "notes": string (optional)
    }
  ],
  "detectedWorkouts": [
    {
      "title": string,
      "categories": string[] (from: ["Legs","Glutes","Abs","Core","Arms","Back","Full Body","Cardio","HIIT","Stretching","Mobility","Strength","Pilates","Dance","Walking","Running"]),
      "durationMinutes": number,
      "exercises": [
        {
          "name": string,
          "category": string,
          "targetSets": number,
          "targetReps": string,
          "targetWeight": number (optional, in kg),
          "restSeconds": number,
          "notes": string (optional)
        }
      ],
      "notes": string (optional)
    }
  ],
  "detectedHabits": [
    {
      "title": string,
      "description": string,
      "category": "fitness" | "nutrition" | "mindset" | "wellness" | "custom",
      "frequency": "daily" | "weekdays" | "weekends",
      "targetValue": number (optional),
      "unit": string (optional)
    }
  ],
  "detectedNotes": string (optional general fitness advice, coach comment, or observation from the file)
}
CRITICAL: Do not invent false data. If certain sections are not in the file, omit them or provide empty arrays. All numbers must be clean decimals without units (e.g. 74.5 not "74.5kg").`;

    let contents: any[] = [];

    if (fileData && mimeType && mimeType.startsWith('image/')) {
      const base64Data = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      contents = [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nAnalyze this attached fitness/health file named "${fileName}":` },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ];
    } else {
      const contentToAnalyze = textContent || (fileData ? Buffer.from(fileData.split('base64,')[1] || fileData, 'base64').toString('utf-8') : '');
      contents = [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nFile Name: ${fileName}\n\nFile Content:\n${contentToAnalyze.slice(0, 40000)}` }
          ]
        }
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('File analysis error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze file with AI'
    });
  }
});

// Setup static serving or Vite middleware
async function startServer() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distDir, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(distIndex);

  if (isProduction && fs.existsSync(distDir)) {
    console.log(`Pulse75 serving static production build from ${distDir}`);
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    console.log('Pulse75 starting in development mode with Vite middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, host, () => {
    console.log(`Pulse75 server running on http://${host}:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
