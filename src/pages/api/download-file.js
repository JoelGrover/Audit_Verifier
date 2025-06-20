import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hasValue(value) {
    return value !== null && value !== undefined;
}

function getValue(obj, key, defaultValue = '') {
    if (!obj || typeof obj !== 'object') return defaultValue;
    return hasValue(obj[key]) ? obj[key] : defaultValue;
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Only GET requests allowed' });
    }

    try {
        const { fileId, filters, exportType = 'all' } = req.query;

        if (!fileId) {
            return res.status(400).json({ message: 'fileId is required' });
        }

        // Validate exportType parameter
        if (!['all', 'modified'].includes(exportType)) {
            return res.status(400).json({ 
                message: 'exportType must be either "all" or "modified"' 
            });
        }

        console.log(`Starting ${exportType} export for fileId: ${fileId}`);

        let whereClause = { fileId: fileId };

        // Only add modifiedFields filter if exportType is 'modified'
        if (exportType === 'modified') {
            whereClause.modifiedFields = {
                some: {}
            };
        }

        if (filters) {
            try {
                const parsedFilters = JSON.parse(filters);
                //Will add custom filters here if required in future
            } catch (e) {
                console.log('Invalid filters, ignoring:', e.message);
            }
        }

        const BATCH_SIZE = 5000;
        let allRecords = [];
        let skip = 0;
        let hasMore = true;

        const recordTypeText = exportType === 'modified' ? 'records with modified fields' : 'records';
        console.log(`Fetching ${recordTypeText} in batches...`);

        while (hasMore) {
            const batch = await prisma.materialRecord.findMany({
                where: whereClause,
                skip: skip,
                take: BATCH_SIZE,
                select: {
                    id: true,
                    data: true,
                    markedFields: true,
                    createdAt: true,
                    ...(exportType === 'modified' && {
                        modifiedFields: {
                            select: {
                                id: true
                            }
                        }
                    })
                },
                orderBy: {
                    id: 'asc'
                }
            });

            if (batch.length === 0) {
                hasMore = false;
            } else {
                allRecords.push(...batch);
                skip += BATCH_SIZE;
                console.log(`Fetched ${allRecords.length} ${recordTypeText} so far...`);
            }
        }

        if (allRecords.length === 0) {
            const noRecordsMessage = exportType === 'modified' 
                ? 'No modified records found for the given fileId'
                : 'No records found for the given fileId';
            return res.status(404).json({ message: noRecordsMessage });
        }

        console.log(`Total ${recordTypeText} fetched: ${allRecords.length}`);

        const fileInfo = await prisma.file.findUnique({
            where: { id: fileId },
            select: { name: true }
        });

       
        const workbook = new ExcelJS.Workbook();
        
        
        workbook.creator = 'Export System';
        workbook.created = new Date();
        
        const worksheetName = exportType === 'modified' ? 'Modified Data' : 'All Data';
        const worksheet = workbook.addWorksheet(worksheetName, {
            properties: {
                defaultRowHeight: 20,
            }
        });

        const allHeaders = new Set();
        const markedFieldsSet = new Set();

        allRecords.forEach(record => {
            if (record.data && typeof record.data === 'object') {
                Object.keys(record.data).forEach(key => allHeaders.add(key));
            }
            if (record.markedFields && Array.isArray(record.markedFields)) {
                record.markedFields.forEach(field => markedFieldsSet.add(field));
            }
        });

        const headers = Array.from(allHeaders);
        const markedFields = Array.from(markedFieldsSet);

      
        const specialFields = ['Material Number', 'updatedAt', 'Verified By'];
        const dataHeaders = headers.filter(header => !specialFields.includes(header));
        
        const systemHeaders = ['Record ID', 'Material Number'];
        const endHeaders = ['Verified By', 'Updated At', 'Created At'];
        const allColumnsHeaders = [...systemHeaders, ...dataHeaders, ...endHeaders];

        console.log(`Creating Excel with ${allColumnsHeaders.length} columns for ${exportType} records...`);

       
        const cleanCellValue = (value) => {
            if (!hasValue(value)) {
                return '';
            }
            
         
            if (typeof value === 'number') {
                return value;
            }
            
            if (typeof value === 'boolean') {
                return value; 
            }
            
            const str = String(value).trim();
            
          
            if (str.match(/^[=+\-@#]/) || str.includes('=')) {
                return ` ${str}`;
            }
            
            return str;
        };

       
        for (let i = 0; i < allColumnsHeaders.length; i++) {
            const cell = worksheet.getCell(1, i + 1);
            cell.value = allColumnsHeaders[i];
            cell.font = { bold: true };
        }

        console.log(`Adding ${exportType} records data rows...`);

        let currentRow = 2;  
        for (let recordIndex = 0; recordIndex < allRecords.length; recordIndex++) {
            const record = allRecords[recordIndex];
            
         
            worksheet.getCell(currentRow, 1).value = cleanCellValue(record.id);
            worksheet.getCell(currentRow, 2).value = cleanCellValue(getValue(record.data, 'Material Number'));

            let currentCol = 3;
            for (const header of dataHeaders) {
                const value = getValue(record.data, header);
                worksheet.getCell(currentRow, currentCol).value = cleanCellValue(value);
                currentCol++;
            }

            worksheet.getCell(currentRow, currentCol).value = cleanCellValue(getValue(record.data, 'Verified By'));
            
            const updatedAtValue = getValue(record.data, 'updatedAt');
            worksheet.getCell(currentRow, currentCol + 1).value = updatedAtValue ? new Date(updatedAtValue).toLocaleString() : '';
            
            worksheet.getCell(currentRow, currentCol + 2).value = record.createdAt ? new Date(record.createdAt).toLocaleString() : '';

            currentRow++;

            if (recordIndex % 1000 === 0) {
                console.log(`Processed ${recordIndex + 1}/${allRecords.length} ${exportType} records for Excel...`);
            }
        }

        console.log(`Processed all ${allRecords.length} ${exportType} records for Excel...`);

        for (let i = 1; i <= allColumnsHeaders.length; i++) {
            const column = worksheet.getColumn(i);
            const headerLength = allColumnsHeaders[i - 1] ? allColumnsHeaders[i - 1].length : 10;
            column.width = Math.min(Math.max(headerLength + 2, 12), 50);
        }

        if (allColumnsHeaders.length > 0) {
            worksheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: 1, column: allColumnsHeaders.length }
            };
        }

        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        console.log('Generating Excel buffer...');

        const buffer = await workbook.xlsx.writeBuffer();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const originalName = fileInfo?.name ? fileInfo.name.replace(/\.[^/.]+$/, '') : 'export';
        const exportTypeText = exportType === 'modified' ? 'modified' : 'all';
        const filename = `${originalName}_${exportTypeText}_export_${timestamp}.xlsx`;

        console.log(`Excel export complete: ${filename} (${buffer.length} bytes) - ${exportType} records`);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.end(buffer);

    } catch (error) {
        console.error('Error exporting records to Excel:', error);

        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Error generating Excel export',
                error: error.message,
            });
        }
    } finally {
        await prisma.$disconnect();
    }
}