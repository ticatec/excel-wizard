import BaseUploadTemplate, {type UploadFun} from "$lib/BaseUploadTemplate";
import type DataColumn from "$lib/DataColumn";
import type {SheetSchema} from "$lib/schema/SheetSchema";
import { BATCH_CONFIG } from "$lib/config";
import SchemaHelper from "$lib/schemaUtils";

/**
 * Upload function type for schema-based templates
 */
export type SchemaUploadFun = (rows: Array<any>) => Promise<Array<any>>;

/**
 * Generic upload template based on SheetSchema
 * Automatically handles column definition, options conversion, and attribute extraction
 */
export default class SchemaUploadTemplate extends BaseUploadTemplate {

    private schema: SheetSchema;
    private helper: SchemaHelper;
    private uploadFunction: SchemaUploadFun;

    constructor(schema: SheetSchema, uploadFunction: SchemaUploadFun, batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE) {
        super(batchSize);
        this.schema = schema;
        this.helper = new SchemaHelper(schema);
        this.uploadFunction = uploadFunction;
    }

    /**
     * Generate columns from schema
     */
    protected getMetaColumns(): Array<DataColumn> {
        return this.schema.columns.map(col => this.convertSchemaToDataColumn(col));
    }

    /**
     * Get row offset from schema
     */
    protected getRowOffset(): number {
        return this.helper.getRowOffset();
    }

    /**
     * Extract sheet-level attributes after parsing
     */
    protected extractFormAttributes() {
        if (!this._workbook || !this._currentSheetName) {
            return;
        }

        this.helper.extractAttributes(this._workbook, this._currentSheetName);
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
     * Convert ColumnSchema to DataColumn
     */
    private convertSchemaToDataColumn(colSchema: SheetSchema["columns"][0]): DataColumn {
        const column: DataColumn = {
            field: colSchema.field,
            text: colSchema.text,
            width: colSchema.width,
            minWidth: colSchema.minWidth,
            align: colSchema.align,
            resizable: colSchema.resizable !== false,
            ignore: colSchema.ignore,
            dummy: colSchema.dummy
        };

        // Add parser if optionsName is specified or custom parser provided
        if (colSchema.optionsName) {
            const parser = this.helper.createOptionsParser(colSchema.optionsName);
            if (parser) {
                column.parser = parser;
            }
        } else if (colSchema.parser) {
            column.parser = colSchema.parser;
        }

        return column;
    }

    /**
     * Upload data using the provided upload function
     */
    protected uploadData(list: Array<any>): Promise<Array<any>> {
        return this.uploadFunction(list);
    }
}