const formidable = require('formidable');
import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  try {
    // Wrap form.parse in a Promise to handle it properly
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

 
    if (!files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    const filePath = uploadedFile.filepath || uploadedFile.path;

    if (!filePath) {
      return res.status(500).json({ 
        message: 'Filepath is undefined. Cannot process file.' 
      });
    }

    // Process Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      return res.status(400).json({ 
        message: 'No worksheets found in the uploaded file' 
      });
    }

    const worksheet = workbook.worksheets[0];
    
    if (!worksheet || worksheet.rowCount === 0) {
      return res.status(400).json({ 
        message: 'Worksheet is empty or invalid' 
      });
    }

    const yellowRGBs = ['FFFF00', 'FFFFFF00'];
    const headerRow = worksheet.getRow(1);

    const headers = [];
    const yellowColumns = [];

    // Process header row
    headerRow.eachCell((cell, colNumber) => {
      const fill = cell.fill;
      const isYellow =
        fill &&
        fill.type === 'pattern' &&
        fill.fgColor &&
        yellowRGBs.includes(fill.fgColor.argb?.toUpperCase());

      const headerName = cell.value;
      headers.push({ header: headerName, index: colNumber });

      if (isYellow) {
        yellowColumns.push(headerName);
      }
    });

    // Create file record first (outside of transaction)
    const fileRecord = await prisma.file.create({
      data: {
        name: uploadedFile.originalFilename || 'File name undetected',
      },
    });

    console.log('File record created:', fileRecord.id);

  
    await prisma.idSequence.upsert({
      where: { entity: 'MaterialRecord' },
      update: {},
      create: {
        entity: 'MaterialRecord',
        nextValue: 1,
      },
    });

   
    const rowsToProcess = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rowData = {};

      headers.forEach((col) => {
        const cellValue = row.getCell(col.index).value;
        rowData[col.header] = cellValue;
      });

      // Skip completely empty rows
      const hasData = Object.values(rowData).some(
        value => value !== null && value !== undefined && value !== ''
      );
      
      if (!hasData) {
        continue;
      }

      // Determine present yellow-marked fields for this row
      const presentMarkedFields = yellowColumns.filter(
        (field) => {
          const value = rowData[field];
          return value !== null && value !== undefined && value !== '';
        }
      );

      rowsToProcess.push({
        rowData,
        presentMarkedFields
      });
    }

    console.log(`Processing ${rowsToProcess.length} rows in batches...`);

  
    const BATCH_SIZE = 100;
    const allSavedRecords = [];
    
    for (let i = 0; i < rowsToProcess.length; i += BATCH_SIZE) {
      const batch = rowsToProcess.slice(i, i + BATCH_SIZE);
      
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rowsToProcess.length / BATCH_SIZE)}`);
      
     
      const batchResults = await prisma.$transaction(
        async (tx) => {
          const batchSaved = [];
          
          for (const { rowData, presentMarkedFields } of batch) {
         
            const sequence = await tx.idSequence.update({
              where: { entity: 'MaterialRecord' },
              data: { nextValue: { increment: 1 } },
            });

            const materialId = `MAT-${String(sequence.nextValue - 1).padStart(3, '0')}`;

            // Create material record
            const saved = await tx.materialRecord.create({
              data: {
                id: materialId,
                fileId: fileRecord.id,
                markedFields: presentMarkedFields,
                data: rowData,
              },
            });

            batchSaved.push(saved);
          }
          
          return batchSaved;
        },
        {
          timeout: 30000, 
        }
      );
      
      allSavedRecords.push(...batchResults);
    }

    console.log(`Successfully processed ${allSavedRecords.length} records`);

   
    return res.status(200).json({
      message: 'Upload and storage successful',
      yellowFields: yellowColumns,
      recordsStored: allSavedRecords.length,
      fileId: fileRecord.id,
      preview: allSavedRecords.slice(0, 5),
    });

  } catch (error) {
    console.error('Error processing file:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: 'Internal server error',
        error: error.message,
      });
    }
  } finally {
    
    await prisma.$disconnect();
  }
}