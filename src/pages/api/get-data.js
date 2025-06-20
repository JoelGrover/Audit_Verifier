import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests allowed' });
    }

    const { fileId, materialNumber, oracleNumber } = req.query;

    if (!fileId || (!materialNumber && !oracleNumber)) {
        return res.status(400).json({ message: 'fileId and materialNumber are required' });
    }
    console.log('Query params:', { fileId, materialNumber, oracleNumber });
    console.log('materialNumber type:', typeof materialNumber, 'value:', materialNumber);
    console.log('oracleNumber type:', typeof oracleNumber, 'value:', oracleNumber);

    try {

        let records = await prisma.materialRecord.findMany({
            where: {
                fileId: String(fileId),
                OR: [
                    {
                        data: {
                            path: ['Material Number'],
                            equals: materialNumber,
                        },
                    },
                    {
                        data: {
                            path: ['Oracle Number'],
                            equals: oracleNumber,
                        },
                    },
                ],
            },
        });

        console.log(records)

        if (records.length === 0) {

            records = await prisma.materialRecord.findMany({
                where: {
                    fileId: String(fileId),
                    OR: [
                        {
                            data: {
                                path: ['Material Number'],
                                equals: parseInt(materialNumber, 10),
                            },
                        },
                        {
                            data: {
                                path: ['Oracle Number'],
                                equals: parseInt(oracleNumber, 10)
                            }
                        }
                    ]
                },
            });
        }

        if (records.length === 0) {

            records = await prisma.materialRecord.findMany({
                where: {
                    fileId: String(fileId),
                    OR: [
                        {
                            data: {
                                path: ['Material Number'],
                                string_contains: materialNumber,
                            },
                        },
                        {
                            data: {
                                path: ['Oracle Number'],
                                string_contains: oracleNumber,
                            },
                        }
                    ]
                },
            });
        }

        console.log('Found records:', records.length);


        if (records.length === 0) {
            return res.status(404).json({ message: 'No records found' });
        }
        // Process each record
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