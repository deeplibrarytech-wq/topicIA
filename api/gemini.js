const GEMINI_MODEL = "gemini-3-flash-preview";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

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

    const apiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Gemini API error: ${apiRes.status} ${errText}`);
    }

    const data = await apiRes.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || data?.candidates?.[0]?.content?.[0]?.text
      || '';

    return res.status(200).json({ result: textOutput.trim() });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
