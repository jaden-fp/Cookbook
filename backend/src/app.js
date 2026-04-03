import express from 'express';
import cors from 'cors';
import recipesRouter from './routes/recipes.js';
import cookbooksRouter from './routes/cookbooks.js';
import searchRouter from './routes/search.js';
import pantryRouter from './routes/pantry.js';
import nutritionRouter from './routes/nutrition.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/recipes', recipesRouter);
app.use('/api/cookbooks', cookbooksRouter);
app.use('/api/search', searchRouter);
app.use('/api/pantry', pantryRouter);
app.use('/api/nutrition', nutritionRouter);

export default app;
