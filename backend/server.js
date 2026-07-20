import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import apiRouter from './src/routes/api.js';
import mindbridgeApp from './src/mindbridge/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env.local file or local .env
dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Main API routing mount
app.use('/api', apiRouter);

// Mount Mindbridge (Student Portal) API under /api/portal
app.use('/api/portal', mindbridgeApp);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Unified Backend API Server running on port ${PORT}`);
});
