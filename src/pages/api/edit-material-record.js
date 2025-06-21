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

  // Helper function to find record by materialNumber or oracleNumber
  const findRecord = async (fileId, materialNumber, oracleNumber) => {
    const conditions = [];
    
    if (materialNumber) {
      conditions.push({
        data: {
          path: ['Material Number'],
          equals: materialNumber,
        },
      });
    }
    
    if (oracleNumber) {
      conditions.push({
        data: {
          path: ['Oracle Number'],
          equals: oracleNumber,
        },
      });
    }

    if (conditions.length === 0) {
      return null;
    }

    // Try exact string match first
    let record = await prisma.materialRecord.findFirst({
      where: {
        fileId: String(fileId),
        OR: conditions,
      },
    });

    // If not found, try with parsed integers
    if (!record) {
      const intConditions = [];
      
      if (materialNumber) {
        const parsedMaterial = parseInt(materialNumber, 10);
        if (!isNaN(parsedMaterial)) {
          intConditions.push({
            data: {
              path: ['Material Number'],
              equals: parsedMaterial,
            },
          });
        }
      }
      
      if (oracleNumber) {
        const parsedOracle = parseInt(oracleNumber, 10);
        if (!isNaN(parsedOracle)) {
          intConditions.push({
            data: {
              path: ['Oracle Number'],
              equals: parsedOracle,
            },
          });
        }
      }

      if (intConditions.length > 0) {
        record = await prisma.materialRecord.findFirst({
          where: {
            fileId: String(fileId),
            OR: intConditions,
          },
        });
      }
    }

    return record;
  };

  for (const update of updates) {
    const { materialNumber, oracleNumber, data } = update;
    const identifier = materialNumber || oracleNumber;

    if ((!materialNumber && !oracleNumber) || typeof data !== 'object') {
      results.push({
        identifier,
        status: 'skipped',
        reason: 'Missing materialNumber/oracleNumber or invalid data',
      });
      continue;
    }

    try {
      const record = await findRecord(fileId, materialNumber, oracleNumber);

      if (!record) {
        results.push({ 
          identifier, 
          status: 'not found',
          searchedFor: { materialNumber, oracleNumber }
        });
        continue;
      }

      const existingData = record.data || {};
      const existingMarked = record.markedFields || [];

      const editedFields = Object.keys(data);

      const updatedMarkedFields = Array.from(
        new Set([...existingMarked, ...editedFields])
      );
      const mergedData = {
        ...existingData,
        ...data,
      };

      const updated = await prisma.materialRecord.update({
        where: { id: record.id },
        data: {
          data: mergedData,
          markedFields: updatedMarkedFields,
        }
      });

      const existingModifiedField = await prisma.modifiedFields.findFirst({
        where: { recordId: updated.id }
      });

      if (!existingModifiedField) {
        await prisma.modifiedFields.create({
          data: {
            recordId: updated.id
          }
        });
      }

      results.push({ 
        identifier, 
        materialId: record.id,
        status: 'updated', 
        updated 
      });

    } catch (err) {
      console.error(`Error updating record with identifier ${identifier}:`, err);
      results.push({
        identifier,
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