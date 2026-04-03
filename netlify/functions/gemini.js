exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { text } = JSON.parse(event.body);

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Text is required' }),
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    const GEMINI_MODEL = "gemini-3-flash-preview";
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const prompt = `Eres un analista experto. Extrae los 10 temas más importantes del contenido siguiente, en formato enumerado:

${text}

- No hagas conteo de frecuencia de palabras.
- No hagas explicaciones innecesarias.
- Responde solo los temas, uno por línea.
- ¿Cuáles son los temas centrales, los tópicos principales en este documento?`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${res.statusText} - ${errText}`);
    }

    const data = await res.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || data?.candidates?.[0]?.content?.[0]?.text
      || '';

    return {
      statusCode: 200,
      body: JSON.stringify({ result: textOutput.trim() }),
    };
  } catch (error) {
    console.error('Error in function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};