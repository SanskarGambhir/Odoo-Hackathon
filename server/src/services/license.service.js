import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});



const EXTRACTION_PROMPT = `
These are the front and back of the SAME driver's license.

Combine information from both images.

Return ONLY valid JSON, no markdown fences, matching exactly this shape:

{
  "name": "",
  "licenseNumber": "",
  "licenseCategory": [],
  "dateOfBirth": "",
  "issueDate": "",
  "licenseExpiry": "",
  "address": "",
  "issuingAuthority": "",
  "bloodGroup": ""
}

Dates must be in YYYY-MM-DD format. If a field cannot be read, leave it as an empty string (or empty array for licenseCategory).
`;

export async function extractLicenseDetails(frontBuffer, backBuffer, { frontMimeType = "image/jpeg", backMimeType = "image/jpeg" } = {}) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [
      {
        inlineData: {
          mimeType: frontMimeType,
          data: frontBuffer.toString("base64"),
        },
      },
      {
        inlineData: {
          mimeType: backMimeType,
          data: backBuffer.toString("base64"),
        },
      },
      { text: EXTRACTION_PROMPT },
    ],
  });

  const raw = response.text.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  return JSON.parse(raw);
}
