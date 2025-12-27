// src/api/dummy.routes.ts
import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  await new Promise(r => setTimeout(r, 2000)); // simulate delay
  res.status(200).json({ message: 'Dummy API success' });
});

export default router;
