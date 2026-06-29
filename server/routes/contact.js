import express from 'express';

const router = express.Router();

const CLINT_WEBHOOK = 'https://functions-api.clint.digital/endpoints/integration/webhook/6ae05bc2-054e-4edc-af58-18cccc0f81c6';

/* POST /api/contact — repassa para a Clint como application/x-www-form-urlencoded (igual ao exemplo que funciona) */
router.post('/', async (req, res) => {
  const { nome, email, telefone, pacote, origem_lead, data_lead } = req.body ?? {};

  if (!nome || !email || !telefone) {
    return res.status(400).json({ error: 'nome, email e telefone são obrigatórios.' });
  }

  try {
    // URLSearchParams — mesmo formato do exemplo que funciona na Clint
    const dadosClint = new URLSearchParams();
    dadosClint.append('nome', nome);
    dadosClint.append('email', email);
    dadosClint.append('telefone', telefone);
    dadosClint.append('pacote', pacote || '');
    dadosClint.append('origem_lead', origem_lead || '');
    dadosClint.append('data_lead', data_lead || '');

    console.log('[CLINT] enviando →', dadosClint.toString());

    const upstream = await fetch(CLINT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: dadosClint.toString(),
    });

    const text = await upstream.text();
    let data = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!upstream.ok) {
      console.error('[contact] Clint erro', upstream.status, text);
      return res.status(upstream.status).json({ error: 'Webhook retornou erro.', detail: data });
    }

    res.json({ ok: true, ...data });
  } catch (err) {
    console.error('[contact]', err.message);
    res.status(500).json({ error: 'Falha ao contatar o serviço de mensagens.' });
  }
});

export default router;
