exports.handler = async (event, context) => {
    // Only permit secure POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" })
        };
    }

    try {
        // Parse the incoming details from the frontend form
        const { title, client, budget, timeline, goals, deliverables } = JSON.parse(event.body);
        
        // Grab your Gemini key securely from your Netlify dashboard environment variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "API Key Configuration Missing on Server." })
            };
        }

        // The prompt blueprint fed into the AI
        const systemPrompt = `
You are an expert enterprise project management and legal engineering contractor. 
Your job is to generate a comprehensive, highly professional Statement of Work (SOW) based on the parameters provided.

Please structure the output using clean, semantic HTML elements (such as <h1>, <h2>, <p>, <ul>, <li>, and <strong>). Do not wrap the output in markdown code blocks (\`\`\`html) or raw markdown text. Output only valid inline HTML body content.

The document must contain these exact corporate sections:
1. EXECUTIVE SUMMARY: A highly executive overview outlining the critical business objectives, the relationship between the provider and ${client}.
2. CORE PROJECT GOALS: ${goals}.
3. DETAILED DELIVERABLES: ${deliverables}.
4. PROJECT TIMELINE & ESTIMATED SCHEDULE: ${timeline}.
5. OUT-OF-SCOPE ITEMS: Scope creep prevention.
6. FINANCIAL TERMS & PAYMENT SCHEDULE: Detail an investment scheme using a total calculation sum of $${budget}.
`;

        const requestBody = {
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { temperature: 0.3 }
        };

        // Ping the Google Gemini endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.text();
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Gemini Engine Error: ${errData}` })
            };
        }

        const data = await response.json();
        const aiResponseText = data.candidates[0].content.parts[0].text;

        // Return the clean HTML layout safely back to your UI
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html: aiResponseText })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};