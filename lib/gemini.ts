import { GoogleGenAI, Type } from '@google/genai';
import { StructuredIncident, Recommendation, getFallbackIncident, getFallbackRecommendations } from './decisionEngine';

const useEnterprise = process.env.GOOGLE_GENAI_USE_ENTERPRISE === 'true' || !process.env.GEMINI_API_KEY;

// Initialize GoogleGenAI client
// If using Enterprise mode, it picks up Google Cloud Application Default Credentials (ADC)
const ai = new GoogleGenAI(
  useEnterprise
    ? {
        project: process.env.GOOGLE_CLOUD_PROJECT || 'hack2skill-a226e',
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      }
    : { apiKey: process.env.GEMINI_API_KEY }
);

// We use gemini-2.5-flash as the default fast and efficient reasoning model
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Extracts structured data from a plain-text reporter submission.
 */
export async function extractIncident(text: string): Promise<StructuredIncident> {
  try {
    const prompt = `
Analyze the following text reported by ground staff at a football stadium (FIFA World Cup context).
Extract the structured incident details exactly matching the schema.

Guidelines:
- Match location to the most specific gate or stand mentioned. If not mentioned, set to 'Unknown'.
- Categories:
  - 'Crowd' for crowd flow, bottlenecks, queues, and congestion.
  - 'Medical' for health, injuries, faintings, etc.
  - 'Security' for fights, threats, security breaches, weapons, suspicious behavior.
  - 'Facility' for water leaks, power failures, broken seats, toilet issues.
  - 'Lost Person' for lost children or missing companions.
  - 'Other' if it doesn't fit any above.
- Severity levels: Low, Medium, High, Critical. Critical is only for direct threats to life or immediate structural/operational collapse (e.g. fire, unconscious person, active riot).

Input Report:
"${text}"
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: {
              type: Type.STRING,
              enum: ['Gate A', 'Gate B', 'Gate C', 'Gate D', 'North Stand', 'South Stand', 'East Stand', 'West Stand', 'Pitch', 'Unknown'],
              description: 'The stadium zone or gate where the incident is occurring.'
            },
            category: {
              type: Type.STRING,
              enum: ['Crowd', 'Medical', 'Security', 'Facility', 'Lost Person', 'Other'],
              description: 'The classification of the incident.'
            },
            severity: {
              type: Type.STRING,
              enum: ['Low', 'Medium', 'High', 'Critical'],
              description: 'The severity level.'
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score of the extraction between 0.0 and 1.0.'
            },
            description: {
              type: Type.STRING,
              description: 'A brief, clear 1-sentence summary of the incident.'
            },
            suggested_teams: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'The team or personnel suggested to respond (e.g. Stewards, Medical, Security, Maintenance).'
            }
          },
          required: ['location', 'category', 'severity', 'confidence', 'description', 'suggested_teams']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini API');
    }

    return JSON.parse(resultText) as StructuredIncident;
  } catch (error) {
    console.error('Failed to extract incident using Gemini:', error);
    // Fall back to rule-based parser if LLM fails (ensuring robustness)
    return getFallbackIncident(text);
  }
}

/**
 * Generates ranked action recommendations with reasoning for the Ops Manager.
 */
export async function generateRecommendations(
  incident: Omit<StructuredIncident, 'confidence'>,
  recentIncidents: Array<{ category: string; location: string; timestamp: any }>
): Promise<Recommendation[]> {
  try {
    const recentContext = recentIncidents.length > 0
      ? recentIncidents.map(inc => `- Category: ${inc.category}, Location: ${inc.location}`).join('\n')
      : 'None';

    const prompt = `
You are the AI Operations Copilot at a FIFA World Cup Stadium.
Given a new incident and the recent operational context, recommend exactly 2-3 ranked actions for the Ops Manager.
Provide clear, actionable, one-sentence reasoning for each recommendation.
The reasoning should justify why this action is ranked at this level of priority based on standard operating procedures (SOP).

New Incident:
- Location: ${incident.location}
- Category: ${incident.category}
- Severity: ${incident.severity}
- Description: ${incident.description}

Recent Incident History (past 15-30 minutes):
${recentContext}

Match Status:
- Live: Second Half (Minute 72, Score: 1-1, high-tension match)

Recommend action list ordered by priority (1 = highest).
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: {
                    type: Type.STRING,
                    description: 'The recommended action to take (e.g., Deploy 2 additional stewards).'
                  },
                  reasoning: {
                    type: Type.STRING,
                    description: 'One-line reasoning for this action, referencing current incident details and history context.'
                  },
                  priority: {
                    type: Type.INTEGER,
                    description: 'Ranked priority starting from 1 (highest priority).'
                  }
                },
                required: ['action', 'reasoning', 'priority']
              }
            }
          },
          required: ['recommendations']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini API');
    }

    const result = JSON.parse(resultText) as { recommendations: Recommendation[] };
    return result.recommendations.sort((a, b) => a.priority - b.priority);
  } catch (error) {
    console.error('Failed to generate recommendations using Gemini:', error);
    // Fall back to rule-based recommendations if LLM fails
    return getFallbackRecommendations(incident.category, incident.location);
  }
}
