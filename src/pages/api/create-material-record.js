import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests allowed' });
    }

    try {
        const { fileId, data, markedFields } = req.body;

        // Validate required fields
        if (!fileId) {
            return res.status(400).json({ message: 'fileId is required' });
        }

        // Verify that the file exists
        const fileExists = await prisma.file.findUnique({
            where: { id: fileId },
            select: { id: true }
        });

        if (!fileExists) {
            return res.status(404).json({ message: 'File not found' });
        }

        console.log(`Generating ID and creating material record for fileId: ${fileId}`);

      
        const generateNextId = async () => {
            const entity = 'MaterialRecord';

           
            const sequence = await prisma.idSequence.upsert({
                where: { entity: entity },
                update: {
                    nextValue: {
                        increment: 1
                    }
                },
                create: {
                    entity: entity,
                    nextValue: 1
                }
            });

            // Generate the ID in format MAT-{nextValue}
            return `MAT-${sequence.nextValue}`;
        };

        // Generate the unique ID
        const generatedId = await generateNextId();

        console.log(`Generated ID: ${generatedId}`);

        // Prepare the data for creation
        const materialRecordData = {
            id: generatedId,
            fileId: fileId,
            data: data || {}, // Default to empty object if no data provided
            markedFields: markedFields || [] // Default to empty array
        };

        // Create the material record
        const createdRecord = await prisma.materialRecord.create({
            data: materialRecordData
        });

        await prisma.modifiedFields.create({
            data: {
                recordId: createdRecord.id
            }
        });

        return res.status(201).json({
            message: 'Material record created successfully',
            record: createdRecord,
            generatedId: generatedId
        });

    } catch (error) {
        console.error('Error creating material record:', error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
            return res.status(409).json({
                message: 'Record with this ID already exists',
                error: 'Duplicate record ID'
            });
        }

        if (error.code === 'P2003') {
            return res.status(400).json({
                message: 'Invalid file reference',
                error: 'File does not exist'
            });
        }

        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    } finally {
        await prisma.$disconnect();
    }
}