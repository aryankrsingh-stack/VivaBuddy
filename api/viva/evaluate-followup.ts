import {
  ApiRequestLike,
  ApiResponseLike,
  evaluateFollowUpService,
  formatApiError,
  getRequestBody,
} from '../../server/vivaService.ts';

export default async function handler(req: ApiRequestLike, res: ApiResponseLike) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end?.();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const data = await evaluateFollowUpService(getRequestBody(req));
    return res.status(200).json(data);
  } catch (err) {
    const formatted = formatApiError(err);
    return res.status(formatted.status).json({ error: formatted.message });
  }
}
