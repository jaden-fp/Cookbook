export default function handler(req, res) {
  res.json({ path: req.url, ok: true });
}
