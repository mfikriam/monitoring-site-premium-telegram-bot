import xlsx from 'xlsx';
import path from 'path';

async function excelHandler(filename) {
  try {
    // Resolve the file path
    const filePath = path.resolve('config', filename);

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Parse the sheet into JSON
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Return the parsed data
    return data;
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    return [];
  }
}

export default excelHandler;
