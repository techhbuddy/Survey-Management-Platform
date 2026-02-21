/**
 * AI survey analysis using Google Gemini API.
 * Uses process.env.GOOGLE_API_KEY (do not hardcode).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

function getApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('GOOGLE_API_KEY is not configured');
  }
  return apiKey.trim();
}

/**
 * Build a structured prompt from text-based survey responses and request analysis.
 * @param {string} surveyTitle - Survey title
 * @param {Array<{ questionText: string, answers: string[] }>} textResponses - Collected text answers per question
 * @returns {Promise<{ summary: string, sentiment: string, insights: string[] }>}
 */
async function analyzeSurveyResponses(surveyTitle, textResponses) {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  // ✅ SAFE MODEL SELECTION (free-tier compatible)
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  const combinedText = textResponses
    .map(({ questionText, answers }) => {
      const answerList = answers.filter(Boolean).join('\n  - ');
      return `Question: ${questionText}\nAnswers:\n  - ${answerList || '(no text)'}`;
    })
    .join('\n\n');

  if (!combinedText || combinedText.trim() === '') {
    return {
      summary: 'No text-based responses to analyze.',
      sentiment: 'Neutral',
      insights: ['Add more short text or long text questions to get AI insights.'],
    };
  }

  const systemInstruction = `You are an expert at analyzing survey feedback. 
You must respond with valid JSON only (no markdown, no code block), with exactly these keys:
- "summary": string (2–4 sentences overall summary)
- "sentiment": string, exactly one of: "Positive", "Neutral", "Negative"
- "insights": array of 3 to 5 actionable recommendations`;

  const userPrompt = `Survey title: ${surveyTitle}

Text responses:
${combinedText}

Respond with JSON only:`;

  const prompt = `${systemInstruction}\n\n${userPrompt}`;

  const result = await model.generateContent(prompt);
  const response = result.response;

  if (!response) {
    throw new Error('Empty response from analysis API');
  }

  const rawContent =
    (typeof response.text === 'function' ? response.text() : response.text)?.trim?.() || '';

  if (!rawContent) {
    throw new Error('Empty response from analysis API');
  }

  // Strip optional markdown code block if model adds it
  let jsonStr = rawContent;
  const codeBlock = /^```(?:json)?\s*([\s\S]*?)```$/;
  const match = rawContent.match(codeBlock);
  if (match) jsonStr = match[1].trim();

  const parsed = JSON.parse(jsonStr);

  const summary =
    typeof parsed.summary === 'string' ? parsed.summary : 'Summary unavailable.';

  const sentiment =
    ['Positive', 'Neutral', 'Negative'].includes(parsed.sentiment)
      ? parsed.sentiment
      : 'Neutral';

  const insights = Array.isArray(parsed.insights)
    ? parsed.insights.filter((i) => typeof i === 'string').slice(0, 5)
    : [];

  return { summary, sentiment, insights };
}

module.exports = {
  getApiKey,
  analyzeSurveyResponses,
};
