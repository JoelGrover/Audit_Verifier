import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests allowed' });
    }

    const { fileId, materialNumber, oracleNumber } = req.query;

    if (!fileId || (!materialNumber && !oracleNumber)) {
        return res.status(400).json({ message: 'fileId and at least one of materialNumber or oracleNumber are required' });
    }

    console.log('Query params:', { fileId, materialNumber, oracleNumber });
    console.log('materialNumber type:', typeof materialNumber, 'value:', materialNumber);
    console.log('oracleNumber type:', typeof oracleNumber, 'value:', oracleNumber);

    try {
        let records = [];

       
        const buildConditions = (materialNum, oracleNum, operation = 'equals') => {
            const conditions = [];
            
            if (materialNum) {
                conditions.push({
                    data: {
                        path: ['Material Number'],
                        [operation]: materialNum,
                    },
                });
            }
            
            if (oracleNum) {
                conditions.push({
                    data: {
                        path: ['Oracle Number'],
                        [operation]: oracleNum,
                    },
                });
            }
            
            return conditions;
        };

        
        let conditions = buildConditions(materialNumber, oracleNumber, 'equals');
        if (conditions.length > 0) {
            records = await prisma.materialRecord.findMany({
                where: {
                    fileId: String(fileId),
                    OR: conditions,
                },
            });
        }

        console.log('First query results:', records.length);

        
        if (records.length === 0) {
            const parsedMaterialNumber = materialNumber ? parseInt(materialNumber, 10) : null;
            const parsedOracleNumber = oracleNumber ? parseInt(oracleNumber, 10) : null;
            
            conditions = buildConditions(parsedMaterialNumber, parsedOracleNumber, 'equals');
            if (conditions.length > 0) {
                records = await prisma.materialRecord.findMany({
                    where: {
                        fileId: String(fileId),
                        OR: conditions,
                    },
                });
            }
        }

        console.log('Second query results:', records.length);

        if (records.length === 0) {
            conditions = buildConditions(materialNumber, oracleNumber, 'string_contains');
            if (conditions.length > 0) {
                records = await prisma.materialRecord.findMany({
                    where: {
                        fileId: String(fileId),
                        OR: conditions,
                    },
                });
            }
        }

        console.log('Third query results:', records.length);
        console.log('Found records:', records.length);

        if (records.length === 0) {
            return res.status(404).json({ message: 'No records found' });
        }

       
        const processedRecords = records.map(record => {
            const responseData =
                record.markedFields && record.markedFields.length > 0
                    ? Object.fromEntries(
                        record.markedFields.map((field) => [field, record.data[field]])
                    )
                    : record.data;

            return {
                Id: record.id,
                fileId: record.fileId,
                data: responseData,
                createdAt: record.createdAt,
            };
        });

        return res.status(200).json({
            count: records.length,
            records: processedRecords,
        });
    } catch (error) {
        console.error('Error fetching material records:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}