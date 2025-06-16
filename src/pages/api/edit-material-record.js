import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Only PUT requests allowed' });
  }

  const { fileId, updates } = req.body;

  if (!fileId || !Array.isArray(updates)) {
    return res.status(400).json({ message: 'Invalid input format' });
  }

  const results = [];

  for (const update of updates) {
    const { materialId, materialNumber, data } = update;

    if (!materialId || !materialNumber || typeof data !== 'object') {
      results.push({
        materialId,
        status: 'skipped',
        reason: 'Missing fields or invalid data',
      });
      continue;
    }

    try {
      const record = await prisma.materialRecord.findFirst({
        where: {
          id: materialId,
          fileId: fileId,
          data: {
            path: ['Material Number'],
            equals: materialNumber,
          },
        },
      });

      if (!record) {
        results.push({
          materialId,
          status: 'not found',
        });
        continue;
      }

      const updated = await prisma.materialRecord.update({
        where: { id: materialId },
        data: {
          data: {
            ...record.data,
            ...data,
          },
        },
      });

      results.push({
        materialId,
        status: 'updated',
        updated,
      });

    } catch (err) {
      results.push({
        materialId,
        status: 'error',
        error: err.message,
      });
    }
  }

  return res.status(200).json({
    message: 'update processed',
    results,
  });
}
