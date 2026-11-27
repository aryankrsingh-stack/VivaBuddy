import { ApiRequestLike, ApiResponseLike } from '../server/vivaService.ts';

export default function handler(req: ApiRequestLike, res: ApiResponseLike) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end?.();
  }
  return res.status(200).json({ ok: true });
}
