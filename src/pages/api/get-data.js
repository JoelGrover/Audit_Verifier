import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests allowed' });
    }

    const { fileId, materialNumber } = req.query;

    if (!fileId || !materialNumber) {
        return res.status(400).json({ message: 'fileId and materialNumber are required' });
    }

    try {

        const record = await prisma.materialRecord.findFirst({
            where: {
                fileId: String(fileId),
                AND: [
                    {
                        data: {
                            path: ['Material Number'],
                            equals: materialNumber,
                        },
                    },
                ],
            },
        });

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        const responseData =
            record.markedFields.length > 0
                ? Object.fromEntries(
                     record.markedFields.map((field) => [field, record.data[field]])
                )
                : record.data; // fallback to full data if nothing was marked

        return res.status(200).json({
            Id: record.id,
            fileId: record.fileId,
            data: responseData,
            createdAt: record.createdAt,
        });
    } catch (error) {
        console.error('Error fetching material record:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}
