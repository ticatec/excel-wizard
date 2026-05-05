import BaseUploadTemplate from "$lib/BaseUploadTemplate";
import type DataColumn from "$lib/DataColumn";
import type {SheetSchema} from "$lib/schema/SheetSchema";
import { BATCH_CONFIG } from "$lib/config";
import SchemaHelper from "$lib/schema/SchemaHelper";

/**
 * Upload function type for schema-based templates
 */
export type SchemaUploadFun = (rows: Array<any>) => Promise<Array<any>>;

/**
 * Generic upload template based on SheetSchema
 *
 * Extends BaseUploadTemplate to provide:
 * - Automatic column definition from schema
 * - Automatic options text/key conversion during parsing (when optionsName is specified)
 * - Sheet-level attribute extraction
 * - Excel template generation with dropdown validation and hint rows
 *
 * @example
 * ```typescript
 * import SchemaUploadTemplate from '@ticatec/excel-wizard';
 * import type {SheetSchema} from '@ticatec/excel-wizard';
 *
 * class UserUploadTemplate extends SchemaUploadTemplate {
 *     constructor() {
 *         super(userSheetSchema);
 *     }
 *
 *     protected getSheetSchema() {
 *         return userSheetSchema;
 *     }
 *
 *     protected async uploadData(rows) {
 *         const response = await fetch('/api/users/batch', {
 *             method: 'POST',
 *             body: JSON.stringify(rows)
 *         });
 *         return response.json();
 *     }
 * }
 *
 * const template = new UserUploadTemplate();
 *
 * // Generate template with hint row
 * await template.downloadTemplate('users-template');
 * ```
 */
export default abstract class SchemaUploadTemplate extends BaseUploadTemplate {

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
     * Creates a new SchemaUploadTemplate instance
     * @param schema - The SheetSchema definition to use
     * @param batchSize
     */
    protected constructor(schema: SheetSchema, batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE) {
        super(batchSize);
        this.schema = schema;
        this.helper = new SchemaHelper(schema);
    }


    /**
     * Generate columns from schema
     *
     * Converts SheetSchema columns to DataColumn format,
     * adding parsers for columns with dropdown options
     *
     * @returns Array of DataColumn definitions
     * @private
     */
    protected getMetaColumns(): Array<DataColumn> {
        return this.helper.getMetaColumns();
    }


    /**
     * Get row offset from schema
     * @returns The data row number from schema
     */
    protected getRowOffset(): number {
        return this.helper.getRowOffset();
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
     * const uploadDate = template.getAttribute('uploadDate');
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
     * await template.downloadTemplate('users');
     *
     * // Download with sample data
     * await template.downloadTemplate('users', [
     *     { username: 'john', email: 'john@example.com', status: 'ACTIVE' }
     * ]);
     * ```
     */
    async downloadTemplate(filename: string = 'template', sampleData: Array<any> = []): Promise<void> {
        return this.helper.downloadTemplate(filename, sampleData);
    }
}
