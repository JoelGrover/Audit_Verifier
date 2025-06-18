const formidable = require('formidable');
import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

function isEmpty(value) {
  return value === null || value === undefined || value === '';
}

function hasValue(value) {
  return !isEmpty(value);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
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


    const fileRecord = await prisma.file.create({
      data: {
        name: uploadedFile.originalFilename || 'File name undetected',
      },
    });

    console.log('File record created:', fileRecord.id);

    const currentSequence = await prisma.idSequence.upsert({
      where: { entity: 'MaterialRecord' },
      update: {},
      create: {
        entity: 'MaterialRecord',
        nextValue: 1,
      },
    });

    const recordsToInsert = [];
    let sequenceCounter = currentSequence.nextValue;

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rowData = {};

      headers.forEach((col) => {
        const cellValue = row.getCell(col.index).value;
        rowData[col.header] = cellValue;
      });

      // Skip completely empty rows - now properly handles 0 values
      const hasData = Object.values(rowData).some(value => hasValue(value));
      
      if (!hasData) {
        continue;
      }

      // Determine present yellow-marked fields for this row - now properly handles 0 values
      const presentMarkedFields = yellowColumns.filter(
        (field) => hasValue(rowData[field])
      );

      const materialId = `MAT-${String(sequenceCounter).padStart(3, '0')}`;
      
      recordsToInsert.push({
        id: materialId,
        fileId: fileRecord.id,
        markedFields: presentMarkedFields,
        data: rowData,
      });

      sequenceCounter++;
    }

    console.log(`Bulk inserting ${recordsToInsert.length} records...`);

    const BATCH_SIZE = 5000; 
    let totalInserted = 0;

    for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
      const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
      
      console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(recordsToInsert.length / BATCH_SIZE)}`);
      
      await prisma.$transaction(async (tx) => {
        // Bulk insert using createMany
        await tx.materialRecord.createMany({
          data: batch,
          skipDuplicates: true, 
        });
        
        totalInserted += batch.length;
      }, {
        timeout: 90000, 
      });
    }

    await prisma.idSequence.update({
      where: { entity: 'MaterialRecord' },
      data: { nextValue: sequenceCounter },
    });

    console.log(`Successfully inserted ${totalInserted} records`);

    return res.status(200).json({
      message: 'Upload and storage successful',
      yellowFields: yellowColumns,
      recordsStored: totalInserted,
      fileId: fileRecord.id,
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