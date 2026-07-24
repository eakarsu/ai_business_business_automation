import express from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

router.post('/procurement-advice', async (req: AuthRequest, res, next) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ success: false, message: 'prompt is required' });
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.OPENROUTER_BASE_URL;
    const model = process.env.OPENROUTER_MODEL;
    if (!apiKey || !baseUrl || !model) throw new Error('OpenRouter is not configured');
    const providerResponse = await fetch(baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [
        { role: 'system', content: 'Provide concise, auditable procurement automation advice with risks and next actions.' },
        { role: 'user', content: prompt },
      ], temperature: 0.2 }),
    });
    if (!providerResponse.ok) throw new Error('OpenRouter returned ' + providerResponse.status);
    const payload = await providerResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('OpenRouter returned empty content');
    const record = await (prisma as any).aIResult.create({ data: {
      analysisType: 'runtime-procurement-advice', userId: req.user!.id,
      inputData: { prompt, tenantId: req.user!.tenantId },
      result: { content, provider: 'openrouter' }, model,
    } });
    return res.json({ success: true, content, provider: 'openrouter', model, persistedId: record.id });
  } catch (error) { return next(error); }
});

export default router;
