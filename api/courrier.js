module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { mode, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Texte manquant' });
  }

  const systemPrompts = {
    resume: `Tu es un assistant bienveillant qui aide des personnes âgées ou peu à l'aise avec l'administratif à comprendre un courrier officiel français.
On te donne le texte d'un courrier reçu. Réponds en français très simple, sans jargon, avec cette structure exacte :

Ce courrier vient de : [organisme, en une ligne]
Ce qu'il faut comprendre : [1-2 phrases simples]
Ce qu'il faut faire : [liste numérotée d'actions concrètes, 1. 2. 3.]
Avant quelle date : [délai si mentionné, sinon "Aucun délai précis indiqué"]

Reste concis : 150 mots maximum. Ne donne jamais de conseil juridique ou fiscal engageant.`,
    reponse: `Tu es un assistant qui rédige des courriers de réponse administratifs simples et polis en français.
On te donne le texte d'un courrier reçu. Rédige une lettre de réponse courte et neutre (format courrier classique : Madame, Monsieur, / Objet / corps / Cordialement / [Votre prénom et nom]) qui demande des explications, un délai, ou accuse réception, selon ce qui est le plus approprié au contenu du courrier.
Reste général et neutre, sans engager la personne sur des faits qu'elle n'a pas donnés. 180 mots maximum.`
  };

  const systemPrompt = systemPrompts[mode] || systemPrompts.resume;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.4,
        max_tokens: 500
      })
    });

    const data = await groqRes.json();
    const result = data.choices?.[0]?.message?.content || null;

    if (!result) {
      return res.status(500).json({
        error: 'Réponse indisponible',
        debug: JSON.stringify(data).slice(0, 500)
      });
    }

    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: 'Service indisponible', debug: e.message });
  }
};
