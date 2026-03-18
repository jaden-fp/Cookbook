import { Router } from 'express';
import axios from 'axios';

const router = Router();

// GET /api/search?q=...
router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q?.trim()) return res.status(400).json({ error: 'Query is required' });

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || apiKey === 'your_key_here' || !cx || cx === 'your_cx_here') {
    return res.status(503).json({ error: 'Search is not configured' });
  }

  // Append "recipe" to bias results if not already present
  const query = q.toLowerCase().includes('recipe') ? q : `${q} recipe`;

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: { key: apiKey, cx, q: query, num: 10 },
    });

    const items = response.data.items || [];
    const results = items.map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet?.replace(/\n/g, ' ') || '',
      displayUrl: item.displayLink,
    }));

    res.json(results);
  } catch (err) {
    const status = err?.response?.status;
    const reason = err?.response?.data?.error?.errors?.[0]?.reason;

    if (status === 429 || reason === 'rateLimitExceeded' || reason === 'dailyLimitExceeded') {
      return res.status(429).json({ error: 'Search quota exceeded' });
    }
    if (status === 403) {
      return res.status(403).json({ error: 'Search quota exceeded' });
    }
    console.error('Search error:', err?.response?.data || err.message);
    res.status(500).json({ error: err?.response?.data?.error?.message || err.message });
  }
});

export default router;
