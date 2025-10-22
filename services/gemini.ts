import { GoogleGenAI, Modality } from "@google/genai";

// It's recommended to initialize the AI client once and reuse it.
// Ensure your API_KEY is available as an environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Generates the IVR audio using Gemini's text-to-speech model.
 * @param companyName The name of the company for the welcome message.
 * @returns A base64 encoded string of the raw audio data.
 */
export async function generateIVRAudio(companyName: string): Promise<string> {
    const ivrScript = `
        Thank you for calling ${companyName}. 
        Your call is important to us. Please hold the line while we connect you to one of our agents or representatives.
        For English, press one.
        For Turkish, press two.
        To book, or for inquiries, press one.
        For flight and cancellation, press two.
        For complaints, press three.
        For other special needs, press four.
        To talk to a representative, press zero.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ivrScript }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A neutral, professional voice for IVR
                    },
                },
            },
        });
        
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
            throw new Error("No audio data received from Gemini TTS API.");
        }
        return audioData;

    } catch (error) {
        console.error("Error generating IVR audio:", error);
        throw new Error("Failed to generate IVR audio.");
    }
}

// Export the 'ai' instance if you need to use it for other API calls, like the Live API.
export { ai };
