import BaseEncodingTemplate, {type ValidationResult} from "$lib/BaseEncodingTemplate";
import type {SheetSchema} from "$lib/schema/SheetSchema";
import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
import type DataColumn from "$lib/DataColumn";
import {encodeCellAddress, decodeRange} from "$lib/excelUtils";
import SchemaHelper from "$lib/schema/SchemaHelper";

// Re-export ValidationResult for use in validate functions
export type {ValidationResult} from "$lib/BaseEncodingTemplate";

/**
 * Validation function type for schema-based templates
 */
export type SchemaValidateFun = (row: any) => ValidationResult | Promise<ValidationResult>;

/**
 * Encoding function type for schema-based templates
 */
export type SchemaEncodeFun = (rows: Array<any>) => Promise<Array<any>>;

/**
 * Generic encoding template based on SheetSchema
 *
 * Extends BaseEncodingTemplate to provide:
 * - Automatic dynamic column mapping from Excel headers
 * - Options conversion (display text to key value)
 * - Sheet-level attribute extraction
 * - Excel template generation
 * - Schema-based validation and encoding
 *
 * @example
 * ```typescript
 * class MyEncodingTemplate extends SchemaEncodingTemplate {
 *     protected getSheetSchema() {
 *         return mySheetSchema;
 *     }
 *
 *     protected getEncodeFunction() {
 *         return async (rows) => {
 *             // Process and encode rows
 *             return processedRows;
 *         };
 *     }
 *
 *     protected getValidateFunction() {
 *         return (row) => {
 *             // Validate row
 *             return { valid: true };
 *         };
 *     }
 * }
 *
 * const template = new MyEncodingTemplate();
 *
 * // Generate template
 * await template.downloadTemplate('my-template');
 *
 * // Check column mapping
 * if (template.hasMapping('Username')) {
 *     const field = template.getFieldName('Username');
 * }
 * ```
 */
export default abstract class SchemaEncodingTemplate extends BaseEncodingTemplate {

    /** Dynamic mapping from Excel header text to field names */
    private columnMapping: Map<string, string> = new Map();

    /** Helper instance for schema operations */
    private readonly helper: SchemaHelper;

    /** The SheetSchema definition */
    private readonly schema: SheetSchema;

    /**
     * Extracted attributes from Excel sheet
     *
     * Properties are extracted based on the key name in the attributes object.
     * Access directly as template.attrs.batchId, template.attrs.uploadDate, etc.
     *
     * @example
     * ```typescript
     * // Schema definition
     * attributes: {
     *     batchId: {  // Key name 'batchId' becomes attrs.batchId
     *         col: 1,
     *         row: 0
     *     }
     * }
     *
     * // After parsing
     * console.log(template.attrs.batchId);  // Access extracted value
     * ```
     */
    attrs: Record<string, any> = {};

    /**
     * Creates a new SchemaEncodingTemplate instance
     * @param schema - The SheetSchema definition to use
     */
    protected constructor(schema: SheetSchema) {
        super();
        this.schema = schema;
        this.helper = new SchemaHelper(schema);
    }

    /**
     * Generate and download Excel template with dropdown validation
     *
     * Creates an Excel file with:
     * - Predefined headers based on schema
     * - Column widths from schema
     * - Dropdown validation for columns with options
     * - Optional sample data
     *
     * @param filename - Name of the file to download (without .xlsx extension)
     * @param sampleData - Optional sample data rows to include in template
     *
     * @example
     * ```typescript
     * // Download empty template
     * await template.downloadTemplate('user-import');
     *
     * // Download with sample data
     * await template.downloadTemplate('user-import', [
     *     { username: 'john', email: 'john@example.com' }
     * ]);
     * ```
     */
    async downloadTemplate(filename: string = 'template', sampleData: Array<any> = []): Promise<void> {
        return this.helper.downloadTemplate(filename, sampleData);
    }

    /**
     * Abstract method to provide the encoding function
     *
     * Must be implemented by subclasses to define how data should be encoded/processed
     *
     * @returns Function that processes and encodes rows of data
     */
    protected abstract getEncodeFunction(): SchemaEncodeFun;

    /**
     * Optional method to provide validation function
     *
     * Override this method to add custom validation logic
     *
     * @returns Validation function, or undefined to skip validation
     *
     * @example
     * ```typescript
     * protected getValidateFunction() {
     *     return (row) => {
     *         if (!row.email || !row.email.includes('@')) {
     *             return {
     *                 valid: false,
     *                 hint: 'Invalid email format'
     *             };
     *         }
     *         return { valid: true };
     *     };
     * }
     * ```
     */
    protected getValidateFunction(): SchemaValidateFun | undefined {
        return undefined;
    }


    /**
     * Get row offset from schema
     * @returns The data row number from schema
     */
    protected getRowOffset(): number {
        return this.helper.getRowOffset();
    }

    /**
     * Get meta columns from schema
     *
     * Converts SheetSchema columns to DataColumn format for internal processing
     *
     * @returns Array of DataColumn definitions
     */
    protected getMetaColumns(): Array<DataColumn> {
        return this.helper.getMetaColumns();
    }

    /**
     * Extract sheet-level attributes after parsing
     *
     * Called automatically after Excel file is parsed.
     * Extracts metadata from specific cells defined in schema and stores them in attrs.
     *
     * @example
     * ```typescript
     * // After parsing
     * const batchId = template.getAttribute('batchId');
     * const department = template.getAttribute('department');
     *
     * // Or access directly via attrs object
     * const batchId = template.attrs.batchId;
     * ```
     */
    protected extractFormAttributes() {
        if (!this._workbook || !this._currentSheetName) {
            return;
        }

        // Extract attributes and populate attrs object using attrName as key
        const attributes = this.helper.extractAttributes(this._workbook, this._currentSheetName);

        // Build attrs object - attrName (the key in attributes object) becomes the key in attrs
        this.attrs = {};
        if (this.schema.attributes) {
            for (const attrName of Object.keys(this.schema.attributes)) {
                if (attributes[attrName] !== undefined) {
                    this.attrs[attrName] = attributes[attrName];
                }
            }
        }

        // Build column mapping after extracting attributes
        this.buildColumnMapping();
    }

    /**
     * Get all extracted attributes
     * @returns Object containing all extracted attribute values
     */
    getAttributes(): Record<string, any> {
        return this.helper.getAttributes();
    }

    /**
     * Get a specific attribute value
     * @param name - Name of the attribute to retrieve
     * @returns The attribute value, or undefined if not found
     */
    getAttribute(name: string): any {
        return this.helper.getAttribute(name);
    }

    /**
     * Build dynamic column mapping from Excel headers
     *
     * Maps Excel header text to field names from schema.
     * Enables flexible column ordering in uploaded files.
     *
     * @private
     */
    private buildColumnMapping() {
        if (!this._workbook || !this._currentSheetName) {
            return;
        }

        const sheet = this._workbook.Sheets[this._currentSheetName];
        if (!sheet || !sheet['!ref']) {
            return;
        }

        // Build mapping from header text to field name
        const headerRow = this.helper.getHeaderRowNum();
        const range = decodeRange(sheet['!ref']);

        if (headerRow > range.e.r) {
            console.warn(`Header row ${headerRow} is beyond sheet range`);
            return;
        }

        // Create reverse mapping: text -> field
        const textToFieldMap = new Map<string, string>();
        for (const col of this.schema.columns) {
            textToFieldMap.set(col.text.trim(), col.field);
        }

        // Read headers from Excel and build mapping
        this.columnMapping.clear();
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = {row: headerRow, col: col};
            const cellRef = encodeCellAddress(cellAddress);
            const cell = sheet[cellRef];

            if (cell && cell.v !== undefined) {
                const headerText = String(cell.v).trim();
                const fieldName = textToFieldMap.get(headerText);
                if (fieldName) {
                    this.columnMapping.set(headerText, fieldName);
                }
            }
        }
    }

    /**
     * Get dynamic columns based on Excel headers
     *
     * Returns columns that match the Excel file's header order.
     * Falls back to schema columns if no file is loaded.
     *
     * @returns Array of TableColumn definitions for display
     */
    get columns(): Array<TableColumn> {
        let columns: TableColumn[] = [];

        // If Excel file is loaded, use dynamic column mapping from headers
        if (this._workbook && this._currentSheetName) {
            const sheet = this._workbook.Sheets[this._currentSheetName];
            if (sheet && sheet['!ref']) {
                const headerRow = this.helper.getHeaderRowNum();
                const range = decodeRange(sheet['!ref']);

                if (headerRow <= range.e.r) {
                    // Read columns from Excel headers
                    for (let col = range.s.c; col <= range.e.c; col++) {
                        const cellAddress = {row: headerRow, col: col};
                        const cellRef = encodeCellAddress(cellAddress);
                        const cell = sheet[cellRef];

                        if (cell && cell.v !== undefined) {
                            const headerText = String(cell.v).trim();
                            const fieldName = this.columnMapping.get(headerText);

                            if (fieldName) {
                                // Find column schema for this field
                                const colSchema = this.schema.columns.find(c => c.field === fieldName);
                                if (colSchema) {
                                    columns.push({
                                        field: `data.${fieldName}`,
                                        text: headerText,
                                        width: colSchema.width,
                                        minWidth: colSchema.minWidth,
                                        align: colSchema.align,
                                        resizable: colSchema.resizable !== false
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // If no columns from Excel (file not loaded or empty sheet), use schema columns
        if (columns.length === 0) {
            columns = this.schema.columns.map(col => ({
                field: `data.${col.field}`,
                text: col.text,
                width: col.width,
                minWidth: col.minWidth,
                align: col.align,
                resizable: col.resizable !== false
            }));
        }

        // Add hint and valid columns from parent
        const parentColumns = super.columns;
        const hintAndValidColumns = parentColumns.slice(-2); // Get last 2 columns (hint and valid)

        return [...columns, ...hintAndValidColumns];
    }

    /**
     * Get the column mapping
     *
     * Returns a copy of the header text to field name mapping
     *
     * @returns Map of header text to field names
     */
    getColumnMapping(): Map<string, string> {
        return new Map(this.columnMapping);
    }

    /**
     * Get field name for a given header text
     *
     * @param headerText - The header text from Excel
     * @returns The field name, or undefined if not mapped
     *
     * @example
     * ```typescript
     * const field = template.getFieldName('User Name');
     * // Returns: 'username'
     * ```
     */
    getFieldName(headerText: string): string | undefined {
        return this.columnMapping.get(headerText);
    }

    /**
     * Check if a header text is mapped
     *
     * @param headerText - The header text to check
     * @returns true if the header is mapped to a field
     *
     * @example
     * ```typescript
     * if (template.hasMapping('Email')) {
     *     const field = template.getFieldName('Email');
     * }
     * ```
     */
    hasMapping(headerText: string): boolean {
        return this.columnMapping.has(headerText);
    }


    /**
     * Validate data using the provided validate function
     *
     * Called for each row during the validation phase
     *
     * @param row - The row data to validate
     * @returns Validation result with valid flag and optional hint/error
     */
    protected validateData(row: any): ValidationResult | Promise<ValidationResult> {
        const validateFn = this.getValidateFunction();
        if (validateFn) {
            return Promise.resolve(validateFn(row));
        }
        // Default implementation: always valid
        return {valid: true};
    }

    /**
     * Encode data using the provided encode function
     *
     * Called after validation to process and encode all valid rows
     *
     * @param rows - Array of valid rows to encode
     * @returns Promise resolving to encoded rows
     */
    protected encodeData(rows: Array<any>): Promise<Array<any>> {
        return this.getEncodeFunction()(rows);
    }
}
