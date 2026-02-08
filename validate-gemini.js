
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  console.log("Checking API Key:", process.env.GOOGLE_GEMINI_API_KEY ? "Present" : "Missing");
  
  try {
    // There isn't a direct listModels method on the main class in some versions,
    // but typically we can try to Generate Content on a basic model to valid key.
    // However, let's try to fetch a model info if possible or just try standard models.
    
    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
        'gemini-pro',
        'gemini-pro-vision'
    ];

    for (const modelName of modelsToTest) {
        console.log(`Testing model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ ${modelName} WORKED!`);
            console.log(await result.response.text());
            return; // We found one!
        } catch (e) {
            console.log(`❌ ${modelName} failed:`, e.message.split('\n')[0]);
        }
    }
  } catch (error) {
    console.error("Fatal Error:", error);
  }
}

listModels();
