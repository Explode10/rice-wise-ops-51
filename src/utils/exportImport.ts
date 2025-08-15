// Export/Import utilities for Rice Report data
export interface ExportableData {
  [key: string]: any[];
}

// Convert array of objects to CSV string
export const arrayToCSV = (data: any[], filename: string): string => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Export multiple sheets as separate CSV files
export const exportMultipleSheets = (sheets: { [sheetName: string]: any[] }): void => {
  Object.entries(sheets).forEach(([sheetName, data]) => {
    if (data.length > 0) {
      const csvContent = arrayToCSV(data, sheetName);
      downloadCSV(csvContent, `${sheetName}_${new Date().toISOString().split('T')[0]}.csv`);
    }
  });
};

// Parse CSV content to array of objects
export const parseCSV = (csvContent: string): any[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  const data = lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    const row: any = {};
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      // Try to parse numbers
      if (!isNaN(Number(value)) && value !== '') {
        row[header] = Number(value);
      } else if (value.toLowerCase() === 'true') {
        row[header] = true;
      } else if (value.toLowerCase() === 'false') {
        row[header] = false;
      } else {
        row[header] = value;
      }
    });
    
    return row;
  });
  
  return data;
};

// Handle file import
export const handleFileImport = (
  file: File,
  onSuccess: (data: any[]) => void,
  onError: (error: string) => void
): void => {
  if (!file) {
    onError('No file selected');
    return;
  }
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    onError('Please select a CSV file');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const csvContent = e.target?.result as string;
      const data = parseCSV(csvContent);
      onSuccess(data);
    } catch (error) {
      onError('Error parsing CSV file');
    }
  };
  
  reader.onerror = () => {
    onError('Error reading file');
  };
  
  reader.readAsText(file);
};

// Export data for Google Sheets compatible format
export const exportForGoogleSheets = (data: any[], sheetName: string): void => {
  const csvContent = arrayToCSV(data, sheetName);
  downloadCSV(csvContent, `${sheetName}_GoogleSheets_${new Date().toISOString().split('T')[0]}.csv`);
};

// Create a complete Rice Report export with all sheets
export const exportCompleteRiceReport = (allData: ExportableData): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Export each sheet separately
  Object.entries(allData).forEach(([sheetName, data]) => {
    if (data && data.length > 0) {
      exportForGoogleSheets(data, `RiceReport_${sheetName}`);
    }
  });
};