import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type {SheetSchema} from "$lib/schema/SheetSchema";
import type {OptionsList, CellValueType, TemplateDecoration} from "$lib/schema/SheetSchema";
import {encodeCellAddress} from "$lib/excelUtils";
import type DataColumn from "$lib/DataColumn";

/**
 * Default key name if not specified in OptionsList
 */
export const DEFAULT_KEY_NAME = 'code';

/**
 * Default text name if not specified in OptionsList
 */
export const DEFAULT_TEXT_NAME = 'text';

/**
 * Utility class for schema-based operations
 *
 * Provides shared functionality for SchemaUploadTemplate and SchemaEncodingTemplate:
 * - Attribute extraction from Excel sheets
 * - Options text/key conversion
 * - Excel template generation with dropdown validation
 * - Schema-related queries and utilities
 *
 * @example
 * ```typescript
 * const helper = new SchemaHelper(mySheetSchema);
 *
 * // Extract attributes from Excel
 * helper.extractAttributes(workbook, 'Sheet1');
 * const batchId = helper.getAttribute('batchId');
 *
 * // Convert between text and key
 * const key = helper.textToKey('Active', 'status'); // 'ACTIVE'
 * const text = helper.keyToText('ACTIVE', 'status'); // 'Active'
 *
 * // Generate Excel template
 * await helper.downloadTemplate('my-template');
 * ```
 */
export class SchemaHelper {
    /** The SheetSchema definition */
    readonly schema: SheetSchema;

    /** Extracted attribute values */
    private attributes: Record<string, any> = {};

    /**
     * Creates a new SchemaHelper instance
     * @param schema - The SheetSchema definition to use
     */
    constructor(schema: SheetSchema) {
        this.schema = schema;
    }

    getMetaColumns(): Array<DataColumn> {
        return this.schema.columns.map(colSchema => {
            const column: DataColumn = {
                field: colSchema.field,
                text: colSchema.text,
                width: colSchema.width,
                minWidth: colSchema.minWidth,
                align: colSchema.align,
                resizable: colSchema.resizable !== false,
                ignore: colSchema.ignore,
                dummy: colSchema.dummy,
                setValue: colSchema.setValue,
                formatter: colSchema.formatter
            };

            // Add parser if optionsName is specified or custom parser provided
            if (colSchema.optionsName) {
                const parser = this.createOptionsParser(colSchema.optionsName);
                if (parser) {
                    column.parser = parser;
                }
            } else if (colSchema.parser) {
                column.parser = colSchema.parser;
            }

            return column;
        });
    }


    /**
     * Extract sheet-level attributes from Excel sheet
     * @param workbook - XLSX workbook object
     * @param sheetName - Name of the sheet to extract attributes from
     * @returns Object containing extracted attributes
     */
    extractAttributes(workbook: XLSX.WorkBook, sheetName: string): Record<string, any> {
        if (!this.schema.attributes || !workbook || !sheetName) {
            return {};
        }

        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return {};

        this.attributes = {};

        for (const [attrName, attrDef] of Object.entries(this.schema.attributes)) {
            try {
                const cellAddress = {r: attrDef.row, c: attrDef.col};
                const cellRef = XLSX.utils.encode_cell(cellAddress);
                const cell = sheet[cellRef];

                if (!cell || cell.v === undefined) {
                    console.warn(`Attribute ${attrName} not found at ${cellRef}`);
                    continue;
                }

                let value = cell.v;

                // Type conversion based on type definition
                if (attrDef.type) {
                    value = this.convertValueType(value, attrDef.type);
                }

                this.attributes[attrName] = value;
            } catch (error) {
                console.error(`Failed to extract attribute ${attrName}:`, error);
            }
        }

        return this.attributes;
    }

    /**
     * Get all extracted attributes
     */
    getAttributes(): Record<string, any> {
        return {...this.attributes};
    }

    /**
     * Get a specific attribute value
     */
    getAttribute(name: string): any {
        return this.attributes[name];
    }

    /**
     * Get data row offset from schema
     *
     * Calculates the data start row based on headerRowNum and showHint:
     * - Without hint: headerRowNum + 1
     * - With hint: headerRowNum + 2
     */
    getRowOffset(): number {
        const showHint = this.schema.showHint || false;
        return this.schema.headerRowNum + (showHint ? 2 : 1);
    }

    /**
     * Get header row number from schema
     */
    getHeaderRowNum(): number {
        return this.schema.headerRowNum;
    }

    /**
     * Create a parser function for options-based conversion
     *
     * Converts text value to key value with priority:
     * 1. Uses OptionsList.parser if provided (highest priority)
     * 2. Falls back to default text-to-key lookup via textName field
     *
     * This parser is used by ColumnSchema when optionsName is specified.
     * The OptionsList.parser takes priority over ColumnSchema.parser.
     *
     * @param optionsName - Name of the options in schema
     * @returns Parser function or null if options not found
     *
     * @example
     * ```typescript
     * // OptionsList with parser
     * const optionsList = {
     *     list: [{code: 'ELEC', text: 'Electronics'}],
     *     parser: (value) => value.split(' - ')[0]
     * };
     *
     * const parser = helper.createOptionsParser('categories');
     * parser('ELEC - Electronics');  // Returns: 'ELEC' (uses OptionsList.parser)
     *
     * // ColumnSchema usage:
     * // When column.optionsName is set, this parser is used
     * // instead of column.parser (higher priority)
     * ```
     */
    createOptionsParser(optionsName: string): ((value: any) => any) | null {
        if (!this.schema.options || !this.schema.options[optionsName]) {
            return null;
        }

        const optionsList = this.schema.options[optionsName];
        if (!optionsList) return null;

        // Priority 1: Use OptionsList.parser if provided (highest priority)
        if (optionsList.parser) {
            return optionsList.parser;
        }

        // Priority 2: Fall back to default text-to-key lookup via textName field
        const keyName = optionsList.keyName || DEFAULT_KEY_NAME;
        const textName = optionsList.textName || DEFAULT_TEXT_NAME;

        // Build a map from text to key for fast lookup
        const textToKeyMap = new Map<string, string>();
        for (const item of optionsList.list) {
            const text = String(item[textName] || '').trim();
            const key = item[keyName];
            if (text) {
                textToKeyMap.set(text, key);
            }
        }

        return (value: any) => {
            if (value === undefined || value === null || value === '') {
                return value;
            }

            const textValue = String(value).trim();
            return textToKeyMap.get(textValue) ?? value;
        };
    }

    /**
     * Convert display text to key value
     *
     * Uses the parser function if provided in OptionsList,
     * otherwise falls back to text-to-key lookup via textName field.
     *
     * @param text - Display text from dropdown
     * @param optionsName - Name of the options in schema
     * @returns Key value or original text if not found
     *
     * @example
     * ```typescript
     * // With custom parser
     * helper.textToKey('ELEC - Electronics', 'categories');
     * // Returns: 'ELEC' (parsed by custom parser)
     *
     * // Without parser (default behavior)
     * helper.textToKey('Electronics', 'categories');
     * // Returns: 'ELEC' (looked up via textName field)
     * ```
     */
    textToKey(text: string, optionsName: string): string | undefined {
        if (!this.schema.options || !this.schema.options[optionsName]) {
            return text;
        }

        const optionsList = this.schema.options[optionsName];

        // Use custom parser if provided
        if (optionsList.parser) {
            return optionsList.parser(text);
        }

        // Fall back to default text-to-key lookup
        const keyName = optionsList.keyName || DEFAULT_KEY_NAME;
        const textName = optionsList.textName || DEFAULT_TEXT_NAME;

        const match = optionsList.list.find(
            item => String(item[textName] || '').trim() === String(text).trim()
        );

        return match ? match[keyName] : text;
    }

    /**
     * Convert key value to display text
     *
     * Performs key-to-text lookup via textName field.
     *
     * @param key - Key value from data
     * @param optionsName - Name of the options in schema
     * @returns Display text or original key if not found
     *
     * @example
     * ```typescript
     * helper.keyToText('ELEC', 'categories');
     * // Returns: 'Electronics' (looked up via textName field)
     * ```
     */
    keyToText(key: any, optionsName: string): string {
        if (!this.schema.options || !this.schema.options[optionsName]) {
            return String(key ?? '');
        }

        if (key === undefined || key === null || key === '') {
            return '';
        }

        const optionsList = this.schema.options[optionsName];
        const keyStr = String(key);

        // Key-to-text lookup via textName field
        const keyName = optionsList.keyName || DEFAULT_KEY_NAME;
        const textName = optionsList.textName || DEFAULT_TEXT_NAME;

        const match = optionsList.list.find(item => item[keyName] === keyStr);
        return match ? (match[textName] || keyStr) : keyStr;
    }

    /**
     * Convert value based on type
     * @param value - Value to convert
     * @param type - Target type
     * @returns Converted value
     */
    convertValueType(value: any, type: CellValueType | undefined): any {
        if (value === undefined || value === null || value === '') {
            return value;
        }

        switch (type) {
            case 'string':
                return String(value);
            case 'number':
                const num = Number(value);
                return isNaN(num) ? value : num;
            case 'boolean':
                if (typeof value === 'boolean') return value;
                const str = String(value).toLowerCase();
                return str === 'true' || str === 'yes' || str === '1';
            case 'date':
            case 'datetime':
                if (value instanceof Date) return value;
                return new Date(value);
            default:
                return value;
        }
    }

    /**
     * Get the schema
     */
    getSchema(): SheetSchema {
        return this.schema;
    }

    /**
     * Get dropdown options for a column
     *
     * Returns the dropdown option strings for Excel validation.
     * Uses the toOptions function if provided in OptionsList,
     * otherwise returns the textName field values.
     *
     * @param optionsName - Name of the options in schema
     * @returns Array of dropdown option strings
     *
     * @example
     * ```typescript
     * // With custom toOptions
     * helper.getDropdownOptions('categories');
     * // Returns: ['ELEC - Electronics', 'CLOT - Clothing', 'FOOD - Food']
     *
     * // Without toOptions (default behavior)
     * helper.getDropdownOptions('categories');
     * // Returns: ['Electronics', 'Clothing', 'Food']
     * ```
     */
    getDropdownOptions(optionsName: string): string[] {
        if (!this.schema.options || !this.schema.options[optionsName]) {
            return [];
        }

        const optionsList = this.schema.options[optionsName];

        // If toOptions is provided, use it to generate dropdown options
        if (optionsList.toOptions) {
            return optionsList.toOptions(optionsList.list);
        }

        // Fall back to returning textName field values
        const textName = optionsList.textName || DEFAULT_TEXT_NAME;
        return optionsList.list.map(item => String(item[textName] || ''));
    }

    /**
     * Generate and download Excel template with dropdown validation
     * @param filename - Name of the file to download (without .xlsx extension)
     * @param sampleData - Optional sample data rows to include
     */
    async downloadTemplate(filename: string = 'template', sampleData: Array<any> = []): Promise<void> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');

        // Calculate data start row based on showHint
        const showHint = this.schema.showHint || false;
        const dataStartRow = this.schema.headerRowNum + (showHint ? 2 : 1);

        // Set column widths - use decoration.width if specified, otherwise use col.width
        // Always include key for data mapping, but only include header when headerRowNum === 0
        const useAutoHeader = this.schema.headerRowNum === 0;
        worksheet.columns = this.schema.columns.map((col) => {
            const excelWidth = col.decoration?.width || col.width;
            const columnDef: any = {
                key: col.field,  // Always include key for addRow to work
                width: excelWidth / 8  // Convert pixels to Excel width units (approximate)
            };

            // Only add header when using automatic header creation
            if (useAutoHeader) {
                columnDef.header = col.text;
            }

            return columnDef;
        });

        // Add header row with styling (only if not using worksheet.columns automatic header)
        if (!useAutoHeader) {
            const headerRowIndex = this.schema.headerRowNum + 1; // Convert to 1-based
            this.schema.columns.forEach((col, index) => {
                const cell = worksheet.getCell(headerRowIndex, index + 1);
                cell.value = col.text;
                cell.font = {bold: true};
                cell.alignment = {vertical: 'middle', horizontal: 'center'};
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {argb: 'FFE0E0E0'}
                };
            });
        } else {
            // Apply styling to the automatic header row created by worksheet.columns
            const headerRow = worksheet.getRow(1);
            headerRow.font = {bold: true};
            headerRow.alignment = {vertical: 'middle', horizontal: 'center'};
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'FFE0E0E0'}
            };
        }

        // Add hint row if showHint is true
        if (showHint) {
            const hintRowNum = this.schema.headerRowNum + 2; // Row after header (1-based)

            // Only apply hint styling to defined columns
            this.schema.columns.forEach((col, index) => {
                const cell = worksheet.getCell(hintRowNum, index + 1);
                cell.value = col.hint || '';

                // Apply hint styling to each cell individually
                cell.font = {italic: true, size: 10};
                cell.alignment = {wrapText: true, vertical: 'top', horizontal: 'left'};
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: {argb: 'FFFFF9E7'}  // Light yellow for hints
                };
            });
        }

        // Add sample data if provided
        if (sampleData.length > 0) {
            // Manually add data to ensure correct row placement
            sampleData.forEach((dataRow, rowIndex) => {
                const row = this.createRowFromData(dataRow);
                const rowNum = dataStartRow + rowIndex + 1; // Convert to 1-based

                this.schema.columns.forEach((col, colIndex) => {
                    const cell = worksheet.getCell(rowNum, colIndex + 1);
                    cell.value = row[col.field] || '';
                });
            });
        }

        // Apply column decorations to data cells
        this.applyColumnDecorations(worksheet, dataStartRow);

        // Add dropdown validation to columns with options
        this.schema.columns.forEach((col, index) => {
            if (col.optionsName && this.schema.options) {
                const optionsList = this.schema.options[col.optionsName];
                if (optionsList && optionsList.list.length > 0) {
                    // Get dropdown options (uses toOptions if provided, otherwise textName values)
                    const dropdownOptions = this.getDropdownOptions(col.optionsName);

                    // Apply validation to all data rows
                    // ExcelJS is 1-based, so add 1 to dataStartRow
                    const startRow = dataStartRow + 1;
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
                            formulae: [`"${dropdownOptions.join(',')}"`]
                        };
                    }
                }
            }
        });

        // Apply decorations (text, styling, and merging)
        this.applyDecorations(worksheet);

        // Generate and download
        const buffer = await workbook.xlsx.writeBuffer();
        this.triggerDownload(buffer, filename);
    }

    /**
     * Create a row object from data
     *
     * Converts data values to appropriate types based on column decoration.
     * Handles number formatting by ensuring numeric values are properly typed.
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
                value = this.keyToText(value, col.optionsName);
            }

            // If column has decoration with format, ensure numeric values are properly typed
            if (col.decoration && col.decoration.format && value !== undefined && value !== null && value !== '') {
                // Check if the format suggests a number format
                const format = col.decoration.format;
                if (this.isNumberFormat(format)) {
                    // Try to convert to number
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                        value = numValue;
                    }
                }
            }

            row[col.field] = value ?? '';
        });

        return row;
    }

    /**
     * Check if a format string is a number format
     * @param format - Excel format string
     * @returns true if the format is for numbers
     * @private
     */
    private isNumberFormat(format: string): boolean {
        // Common indicators of number formats
        const numberFormatIndicators = ['0', '#', '.', '%', '$', '€', '£', '¥'];
        return numberFormatIndicators.some(indicator => format.includes(indicator));
    }

    /**
     * Apply column decorations to data cells
     *
     * Applies styling from ColumnSchema.decoration to all data cells in each column.
     * Only affects data rows, not header or hint rows.
     *
     * @param worksheet - The ExcelJS worksheet
     * @param dataStartRow - The row number where data starts (1-based)
     * @private
     */
    private applyColumnDecorations(worksheet: ExcelJS.Worksheet, dataStartRow: number) {
        // Apply to all future data rows (next 1000 rows)
        const startRow = dataStartRow + 1;
        const endRow = startRow + 1000;

        this.schema.columns.forEach((col, colIndex) => {
            const decoration = col.decoration;

            // If no decoration defined, check if column has alignment
            const hasDecoration = decoration && (
                decoration.bold ||
                decoration.italic ||
                decoration.color ||
                decoration.fontSize ||
                decoration.fillColor ||
                decoration.align ||
                decoration.verticalAlign ||
                decoration.wrapText ||
                decoration.format
            );

            // Skip if no decoration and no column alignment
            if (!hasDecoration && !col.align) {
                return;
            }

            // Apply styling to all data cells in this column
            for (let row = startRow; row <= endRow; row++) {
                const cell = worksheet.getCell(row, colIndex + 1); // colIndex + 1 for 1-based ExcelJS

                // Build font object
                const font: Partial<ExcelJS.Font> = {};
                if (decoration?.bold) font.bold = true;
                if (decoration?.italic) font.italic = true;
                if (decoration?.color) {
                    font.color = {argb: this.ensureARGB(decoration.color)};
                }
                if (decoration?.fontSize) font.size = decoration.fontSize;
                if (Object.keys(font).length > 0) {
                    cell.font = font as ExcelJS.Font;
                }

                // Build fill object
                if (decoration?.fillColor) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: {argb: this.ensureARGB(decoration.fillColor)}
                    };
                }

                // Build alignment object
                const alignment: Partial<ExcelJS.Alignment> = {};
                // Use decoration.align if specified, otherwise fall back to col.align
                alignment.horizontal = decoration?.align || col.align || 'left';
                // Use decoration.verticalAlign if specified, otherwise default to middle
                alignment.vertical = decoration?.verticalAlign || 'middle';
                // Use decoration.wrapText if specified
                if (decoration?.wrapText) alignment.wrapText = true;

                cell.alignment = alignment as ExcelJS.Alignment;

                // Apply number format
                if (decoration?.format) {
                    cell.numFmt = decoration.format;
                }
            }
        });
    }

    /**
     * Ensure color is in ARGB format (8-digit hex)
     * Converts RGB (6-digit) to ARGB (8-digit) by adding FF prefix
     * @param color - Color in RGB or ARGB format
     * @returns Color in ARGB format
     * @private
     */
    private ensureARGB(color: string): string {
        // Remove # if present
        let colorValue = color.replace('#', '');

        // If already 8 digits (ARGB), return as is
        if (colorValue.length === 8) {
            return colorValue.toUpperCase();
        }

        // If 6 digits (RGB), add FF prefix for opaque
        if (colorValue.length === 6) {
            return `FF${colorValue}`.toUpperCase();
        }

        // If 3 digits (short hex), expand and add FF prefix
        if (colorValue.length === 3) {
            const expanded = colorValue.split('').map(c => c + c).join('');
            return `FF${expanded}`.toUpperCase();
        }

        // Default to black if invalid format
        return 'FF000000';
    }

    /**
     * Apply decorations (text, styling, and merging) to the worksheet
     * Only processes TemplateDecoration, not AttributesSchema
     */
    private applyDecorations(worksheet: ExcelJS.Worksheet) {
        // Apply template decorations
        if (this.schema.decorations && this.schema.decorations.length > 0) {
            for (const decoration of this.schema.decorations) {
                // ExcelJS uses 1-based indexing
                const cell = worksheet.getCell(decoration.row + 1, decoration.col + 1);

                // Set text
                if (decoration.text !== undefined) {
                    cell.value = decoration.text;
                }

                // Build font object
                const font: Partial<ExcelJS.Font> = {};
                if (decoration.bold) font.bold = true;
                if (decoration.italic) font.italic = true;
                if (decoration.color) {
                    // Convert RGB to ARGB if needed (add FF prefix for opaque)
                    font.color = {argb: this.ensureARGB(decoration.color)};
                }
                if (decoration.fontSize) font.size = decoration.fontSize;
                if (Object.keys(font).length > 0) {
                    cell.font = font as ExcelJS.Font;
                }

                // Build fill object
                if (decoration.fillColor) {
                    // Convert RGB to ARGB if needed (add FF prefix for opaque)
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: {argb: this.ensureARGB(decoration.fillColor)}
                    };
                }

                // Build alignment object
                const alignment: Partial<ExcelJS.Alignment> = {};
                if (decoration.align) alignment.horizontal = decoration.align;
                if (decoration.verticalAlign) alignment.vertical = decoration.verticalAlign;
                if (decoration.wrapText) alignment.wrapText = true;
                if (Object.keys(alignment).length > 0) {
                    cell.alignment = alignment as ExcelJS.Alignment;
                }

                // Apply cell merging if colSpan or rowSpan > 1
                const colSpan = decoration.colSpan ?? 1;
                const rowSpan = decoration.rowSpan ?? 1;
                if (colSpan > 1 || rowSpan > 1) {
                    const endCol = decoration.col + colSpan - 1;
                    const endRow = decoration.row + rowSpan - 1;

                    worksheet.mergeCells(
                        decoration.row + 1,
                        decoration.col + 1,
                        endRow + 1,
                        endCol + 1
                    );
                }
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
}

/**
 * Create a SchemaHelper instance
 */
export function createSchemaHelper(schema: SheetSchema): SchemaHelper {
    return new SchemaHelper(schema);
}

export default SchemaHelper;