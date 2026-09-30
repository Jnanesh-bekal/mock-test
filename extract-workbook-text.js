const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const workbookPath = 'C:\\Users\\jnane\\Downloads\\Securities Operations & Risk Management\\Set 1\\Workbooks';
const outputPath = path.join(__dirname, 'public', 'data', 'workbook-reference.json');

async function extractTextFromDocx(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: buffer });
        return result.value;
    } catch (error) {
        console.error(`Error extracting text from ${filePath}:`, error.message);
        return '';
    }
}

async function main() {
    console.log('Extracting text from NISM workbooks...');
    
    const sormWorkbook = path.join(workbookPath, 'Series-VII-SORM WB_Version_July 2026.docx');
    const eqWorkbook = path.join(workbookPath, '12 NISM-Series-VIII Equity Derivatives Certification Examination_March 2026.docx');
    
    const workbookData = {
        sorm: {
            filename: 'Series-VII-SORM WB_Version_July 2026.docx',
            text: '',
            extracted: false
        },
        equityDerivatives: {
            filename: '12 NISM-Series-VIII Equity Derivatives Certification Examination_March 2026.docx',
            text: '',
            extracted: false
        }
    };
    
    // Extract SORM workbook text
    if (fs.existsSync(sormWorkbook)) {
        console.log('Extracting SORM workbook...');
        workbookData.sorm.text = await extractTextFromDocx(sormWorkbook);
        workbookData.sorm.extracted = true;
        console.log(`SORM workbook extracted: ${workbookData.sorm.text.length} characters`);
    } else {
        console.log('SORM workbook not found');
    }
    
    // Extract Equity Derivatives workbook text
    if (fs.existsSync(eqWorkbook)) {
        console.log('Extracting Equity Derivatives workbook...');
        workbookData.equityDerivatives.text = await extractTextFromDocx(eqWorkbook);
        workbookData.equityDerivatives.extracted = true;
        console.log(`Equity Derivatives workbook extracted: ${workbookData.equityDerivatives.text.length} characters`);
    } else {
        console.log('Equity Derivatives workbook not found');
    }
    
    // Save to file
    fs.writeFileSync(outputPath, JSON.stringify(workbookData, null, 2), 'utf8');
    console.log(`Workbook text saved to: ${outputPath}`);
    
    console.log('\nExtraction complete!');
    console.log(`SORM: ${workbookData.sorm.extracted ? '✓' : '✗'}`);
    console.log(`Equity Derivatives: ${workbookData.equityDerivatives.extracted ? '✓' : '✗'}`);
}

main().catch(console.error);