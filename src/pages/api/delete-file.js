import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Only DELETE requests allowed' });
  }

  const verifyPin = process.env.DELETE_PIN

  const { id } = req.query;
  const { deletePin } = req.body
  
  if(deletePin != verifyPin){
    return res.status(405).json({ message: 'Wrong DELETE PIN Provided' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid file ID' });
  }

  try {
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    await prisma.file.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'File and related records deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ message: 'Failed to delete file', error });
  }
}
