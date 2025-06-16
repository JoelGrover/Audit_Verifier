import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  try {
    const files = await prisma.file.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true
      },
    });

    return res.status(200).json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
