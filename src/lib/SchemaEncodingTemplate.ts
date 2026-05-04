import BaseEncodingTemplate, {type ValidationResult} from "$lib/BaseEncodingTemplate";
import type {SheetSchema} from "$lib/schema/SheetSchema";
import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
import type DataColumn from "$lib/DataColumn";
import { encodeCellAddress, decodeRange } from "$lib/excelUtils";
import SchemaHelper from "$lib/schemaUtils";

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
 * Automatically handles dynamic column mapping from Excel headers
 * and options conversion (text to key)
 */
export default class SchemaEncodingTemplate extends BaseEncodingTemplate {

    private schema: SheetSchema;
    private helper: SchemaHelper;
    private columnMapping: Map<string, string> = new Map();
    private validateFunction?: SchemaValidateFun;
    private encodeFunction: SchemaEncodeFun;

    constructor(
        schema: SheetSchema,
        encodeFunction: SchemaEncodeFun,
        validateFunction?: SchemaValidateFun
    ) {
        super();
        this.schema = schema;
        this.helper = new SchemaHelper(schema);
        this.encodeFunction = encodeFunction;
        this.validateFunction = validateFunction;
    }

    /**
     * Get row offset from schema
     */
    protected getRowOffset(): number {
        return this.helper.getRowOffset();
    }

    /**
     * Get meta columns from schema
     * Implementation of abstract method from BaseTemplate
     */
    protected getMetaColumns(): Array<DataColumn> {
        return this.schema.columns.map(col => ({
            field: col.field,
            text: col.text,
            width: col.width,
            minWidth: col.minWidth,
            align: col.align,
            resizable: col.resizable !== false,
            ignore: col.ignore,
            dummy: col.dummy,
            parser: col.parser
        }));
    }

    /**
     * Extract sheet-level attributes after parsing
     */
    protected extractFormAttributes() {
        if (!this._workbook || !this._currentSheetName) {
            return;
        }

        // Extract attributes using helper
        this.helper.extractAttributes(this._workbook, this._currentSheetName);

        // Build column mapping after extracting attributes
        this.buildColumnMapping();
    }

    /**
     * Get extracted attributes
     */
    getAttributes(): Record<string, any> {
        return this.helper.getAttributes();
    }

    /**
     * Get a specific attribute value
     */
    getAttribute(name: string): any {
        return this.helper.getAttribute(name);
    }

    /**
     * Build dynamic column mapping from Excel headers
     * Maps header text to field names from schema
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
     * Get column mapping (header text -> field name)
     */
    getColumnMapping(): Map<string, string> {
        return new Map(this.columnMapping);
    }

    /**
     * Get field name for a given header text
     */
    getFieldName(headerText: string): string | undefined {
        return this.columnMapping.get(headerText);
    }

    /**
     * Check if a header text is mapped
     */
    hasMapping(headerText: string): boolean {
        return this.columnMapping.has(headerText);
    }


    /**
     * Validate data using the provided validate function
     */
    protected validateData(row: any): ValidationResult | Promise<ValidationResult> {
        if (this.validateFunction) {
            return Promise.resolve(this.validateFunction(row));
        }
        // Default implementation: always valid
        return { valid: true };
    }

    /**
     * Encode data using the provided encode function
     */
    protected encodeData(rows: Array<any>): Promise<Array<any>> {
        return this.encodeFunction(rows);
    }
}
