import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EXTRACTION_PROMPT = `
These images are documents for the SAME vehicle — any mix of Registration Certificate (RC),
Insurance policy, and PUC (Pollution Under Control) certificate. There may be 1 to several images.

Combine information across all images.

Return ONLY valid JSON, no markdown fences, matching exactly this shape:

{
  "rcNumber": "",
  "insuranceNumber": "",
  "insuranceExpiry": "",
  "pucNumber": "",
  "pucExpiry": ""
}

Dates must be in YYYY-MM-DD format. If a field cannot be read or the relevant document wasn't provided, leave it as an empty string.
`;

export async function extractVehicleDocumentDetails(files) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      ...files.map((file) => ({
        inlineData: {
          mimeType: file.mimetype || "image/jpeg",
          data: file.buffer.toString("base64"),
        },
      })),
      { text: EXTRACTION_PROMPT },
    ],
  });

  const raw = response.text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  return JSON.parse(raw);
}
