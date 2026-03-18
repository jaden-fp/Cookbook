import express from 'express';
import cors from 'cors';
import { ready } from './db.js';
import recipesRouter from './routes/recipes.js';
import cookbooksRouter from './routes/cookbooks.js';
import searchRouter from './routes/search.js';
import pantryRouter from './routes/pantry.js';

const app = express();

app.use(cors());
app.use(express.json());

// Ensure DB schema is initialized before handling any request
app.use((_req, _res, next) => { ready.then(() => next()).catch(next); });

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/recipes', recipesRouter);
app.use('/api/cookbooks', cookbooksRouter);
app.use('/api/search', searchRouter);
app.use('/api/pantry', pantryRouter);

export default app;
