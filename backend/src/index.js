import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import recipesRouter from './routes/recipes.js';
import cookbooksRouter from './routes/cookbooks.js';
import searchRouter from './routes/search.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/recipes', recipesRouter);
app.use('/api/cookbooks', cookbooksRouter);
app.use('/api/search', searchRouter);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
