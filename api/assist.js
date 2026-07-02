module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question manquante' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant bienveillant qui aide des personnes âgées ou peu à l'aise avec le numérique à comprendre leurs démarches administratives françaises.
Règles strictes :
- Réponds en français simple, sans jargon administratif.
- Utilise des phrases courtes.
- Structure ta réponse en étapes numérotées claires (1. 2. 3.).
- Précise les documents nécessaires si pertinent.
- Précise où aller (en ligne, en mairie, en préfecture, France Services...) si pertinent.
- Ne donne jamais de conseil juridique ou fiscal engageant ; reste informatif et général.
- Termine toujours en rappelant qu'en cas de doute, on peut se rendre dans un point France Services ou appeler l'organisme concerné.
- Reste concis : 150 mots maximum.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      })
    });

    const data = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content || null;

    if (!answer) {
      return res.status(500).json({
        error: 'Réponse indisponible',
        debug: JSON.stringify(data).slice(0, 500)
      });
    }

    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: 'Service indisponible', debug: e.message });
  }
};
