import xlsx from 'xlsx';
import path from 'path';

// Function to transform keys to snake_case
const transformKeys = (obj) => {
  const snakeCase = (key) =>
    key
      .toLowerCase()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^\w_]/g, '_'); // Remove non-alphanumeric characters except underscores

  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [snakeCase(key), value]));
};

async function excelHandler(filename) {
  try {
    // Resolve the file path
    const filePath = path.resolve('data', filename);

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Parse the sheet into JSON
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Transform keys to snake_case
    const transformedData = data.map(transformKeys);

    return transformedData;
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    return [];
  }
}

export default excelHandler;
