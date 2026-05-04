import ExcelJS from 'exceljs';
import type {SheetSchema} from "$lib/schema/SheetSchema";
import { encodeCellAddress } from "$lib/excelUtils";
import SchemaHelper, { DEFAULT_TEXT_NAME } from "$lib/schemaUtils";

/**
 * Utility class for generating Excel templates based on SheetSchema
 * Creates downloadable Excel files with dropdown validation lists
 */
export class SchemaExporter {

    private schema: SheetSchema;
    private helper: SchemaHelper;

    constructor(schema: SheetSchema) {
        this.schema = schema;
        this.helper = new SchemaHelper(schema);
    }

    /**
     * Generate and download Excel template with dropdown validation
     * @param filename - Name of the file to download (without .xlsx extension)
     * @param sampleData - Optional sample data rows to include
     */
    async downloadTemplate(filename: string = 'template', sampleData: Array<any> = []): Promise<void> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        // Set column widths
        worksheet.columns = this.schema.columns.map(col => ({
            header: col.text,
            key: col.field,
            width: col.width / 8  // Convert pixels to Excel width units (approximate)
        }));

        // Add header row with styling
        const headerRow = worksheet.getRow(this.schema.headerRowNum + 1);
        headerRow.font = {bold: true};
        headerRow.alignment = {vertical: 'middle', horizontal: 'center'};
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {argb: 'FFE0E0E0'}
        };

        // Add sample data if provided
        if (sampleData.length > 0) {
            sampleData.forEach(dataRow => {
                const row = this.createRowFromData(dataRow);
                worksheet.addRow(row);
            });
        }

        // Add dropdown validation to columns with options
        this.schema.columns.forEach((col, index) => {
            if (col.optionsName && this.schema.options) {
                const optionsList = this.schema.options[col.optionsName];
                if (optionsList && optionsList.list.length > 0) {
                    const textName = optionsList.textName || DEFAULT_TEXT_NAME;
                    const options = optionsList.list.map(item => String(item[textName] || ''));

                    // Apply validation to all data rows (from dataRowNum to end)
                    const startRow = this.schema.dataRowNum + 2; // +2 because ExcelJS is 1-based and we want data row
                    const endRow = startRow + 1000; // Apply to next 1000 rows

                    for (let row = startRow; row <= endRow; row++) {
                        const cell = worksheet.getCell(row, index + 1);
                        cell.dataValidation = {
                            type: 'list',
                            allowBlank: true,
                            showErrorMessage: true,
                            errorStyle: 'error',
                            errorTitle: 'Invalid Value',
                            error: 'Please select a value from the dropdown list',
                            formulae: [`"${options.join(',')}"`]
                        };
                    }
                }
            }
        });

        // Add attributes as comments or in a separate area
        if (this.schema.attributes) {
            this.addAttributesToSheet(worksheet);
        }

        // Apply cell merging
        this.applyCellMerging(worksheet);

        // Generate and download
        const buffer = await workbook.xlsx.writeBuffer();
        this.triggerDownload(buffer, filename);
    }

    /**
     * Create a row object from data
     */
    private createRowFromData(data: any): Record<string, any> {
        const row: Record<string, any> = {};

        this.schema.columns.forEach(col => {
            if (col.dummy || col.ignore) {
                return;
            }

            let value = data[col.field];

            // Convert key to text if options are defined
            if (col.optionsName) {
                value = this.helper.keyToText(value, col.optionsName);
            }

            row[col.field] = value ?? '';
        });

        return row;
    }

    /**
     * Add attributes information to the sheet
     * Adds as a note in the first cell or in a separate area
     */
    private addAttributesToSheet(worksheet: ExcelJS.Worksheet) {
        if (!this.schema.attributes) {
            return;
        }

        // Add attributes as a note in cell A1
        const attrNotes: string[] = [];
        for (const [attrName, attrDef] of Object.entries(this.schema.attributes)) {
            const label = attrDef.labelText || attrName;
            attrNotes.push(`${label}: [Cell ${encodeCellAddress(attrDef)}]`);
        }

        if (attrNotes.length > 0) {
            const cell = worksheet.getCell('A1');
            cell.note = attrNotes.join('\n');
        }
    }

    /**
     * Apply cell merging based on schema definitions
     * Handles attribute-level merging
     */
    private applyCellMerging(worksheet: ExcelJS.Worksheet) {
        if (!this.schema.attributes) {
            return;
        }

        for (const attrDef of Object.values(this.schema.attributes)) {
            // Check if this attribute has merge definitions
            const colSpan = attrDef.colSpan ?? 1;
            const rowSpan = attrDef.rowSpan ?? 1;

            // Only merge if span > 1
            if (colSpan > 1 || rowSpan > 1) {
                // Calculate end position (0-based, inclusive)
                const endCol = attrDef.col + colSpan - 1;
                const endRow = attrDef.row + rowSpan - 1;

                // ExcelJS uses 1-based indexing
                worksheet.mergeCells(
                    attrDef.row + 1,
                    attrDef.col + 1,
                    endRow + 1,
                    endCol + 1
                );
            }
        }
    }

    /**
     * Trigger browser download
     */
    private triggerDownload(buffer: ExcelJS.Buffer, filename: string) {
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Get dropdown options for a column
     * @param optionsName - Name of the options in schema
     * @returns Array of display text values
     */
    getDropdownOptions(optionsName: string): string[] {
        if (!this.schema.options || !this.schema.options[optionsName]) {
            return [];
        }

        const optionsList = this.schema.options[optionsName];
        const textName = optionsList.textName || DEFAULT_TEXT_NAME;

        return optionsList.list.map(item => String(item[textName] || ''));
    }

    /**
     * Convert display text to key value
     * @param text - Display text from dropdown
     * @param optionsName - Name of the options in schema
     * @returns Key value
     */
    textToKey(text: string, optionsName: string): string | undefined {
        return this.helper.textToKey(text, optionsName);
    }
}

/**
 * Convenience function to create a SchemaExporter instance
 */
export function createSchemaExporter(schema: SheetSchema): SchemaExporter {
    return new SchemaExporter(schema);
}

export default SchemaExporter;