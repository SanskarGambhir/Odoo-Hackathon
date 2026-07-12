import { GoogleGenAI } from "@google/genai";
import fs from "fs";

import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});



async function extractLicense(frontPath, backPath) {
  const frontImage = fs.readFileSync(frontPath);
  const backImage = fs.readFileSync(backPath);
  const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-lite",
  contents: [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: frontImage.toString("base64"),
      },
    },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: backImage.toString("base64"),
      },
    },
    {
      text: `
These are the front and back of the SAME driver's license.

Combine information from both images.

Return ONLY valid JSON.

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
`,
    },
  ],
});

  console.log(response.text);
}

extractLicense("./DriversLicense.jpeg", "./DriversLicenseBack.jpeg");