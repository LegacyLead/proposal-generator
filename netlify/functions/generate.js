export default async (request, context) => {
    // Only permit secure POST requests
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        const { title, client, budget, timeline, goals, deliverables } = await request.json();
        
        // Securely fetch our environment variable from Netlify cloud panel
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "API Key Configuration Missing on Server." }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Build a hyper-focused executive prompt framework to guide the AI output
        const systemPrompt = `
You are an expert enterprise project management and legal engineering contractor. 
Your job is to generate a comprehensive, highly professional Statement of Work (SOW) based on the parameters provided.

Please structure the output using clean, semantic HTML elements (such as <h1>, <h2>, <p>, <ul>, <li>, and <strong>). Do not wrap the output in markdown code blocks (\`\`\`html) or raw markdown text. Output only valid inline HTML body content. Use clean spacings.

The document must contain these exact corporate sections:
1. EXECUTIVE SUMMARY: A highly executive overview outlining the critical business objectives, the relationship between the provider and ${client}, and why this project is vital.
2. CORE PROJECT GOALS: Clearly itemize the targets and high-level milestones based on these inputs: ${goals}.
3. DETAILED DELIVERABLES: Breakdown each item provided here into a measurable engineering unit: ${deliverables}.
4. PROJECT TIMELINE & ESTIMATED SCHEDULE: Map out phase boundaries using this timeframe framework: ${timeline}.
5. OUT-OF-SCOPE ITEMS: Clearly define boundaries to prevent scope creep (explicitly list things NOT covered like ongoing cloud hosting costs, post-launch maintenance packages, or massive design revisions unless specified).
6. FINANCIAL TERMS & PAYMENT SCHEDULE: Detail an investment scheme using a total calculation sum of $${budget}. Lay down a safe standard payment schedule milestone structure (e.g., 40% initial deposit, 40% halfway milestone approval, 20% final sign-off transfer).

Make the tone professional, authoritative, and legally defensive.
`;

        // Request package payload mapped directly to Gemini API requirements
        const requestBody = {
            contents: [{
                parts: [{ text: systemPrompt }]
            }],
            generationConfig: {
                temperature: 0.3
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.text();
            return new Response(JSON.stringify({ error: `Gemini Engine Error: ${errData}` }), {
                status: response.status,
                headers: { "Content-Type": "application/json" }
            });
        }

        const data = await response.json();
        const aiResponseText = data.candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({ html: aiResponseText }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};