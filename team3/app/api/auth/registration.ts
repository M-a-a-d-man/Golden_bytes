// pages/api/auth/register.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { hash } from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const usersDir = path.join(process.cwd(), 'data/users');
  if (!fs.existsSync(usersDir)) {
    fs.mkdirSync(usersDir, { recursive: true });
  }

  const userFilePath = path.join(usersDir, `${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`);

  // Check if user already exists
  if (fs.existsSync(userFilePath)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Hash password
  const hashedPassword = await hash(password, 12);

  // Create user
  const userData = {
    id: email,
    email,
    name,
    password: hashedPassword,
    provider: "credentials",
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(userFilePath, JSON.stringify(userData));

  return res.status(201).json({ message: 'User created successfully' });
}
