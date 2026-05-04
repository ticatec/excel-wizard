import * as XLSX from 'xlsx';
import type {SheetSchema} from "$lib/schema/SheetSchema";
import type { OptionsList, CellValueType } from "$lib/schema/SheetSchema";

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
 * Provides shared functionality for SchemaUploadTemplate and SchemaEncodingTemplate
 */
export class SchemaHelper {
    private schema: SheetSchema;
    private attributes: Record<string, any> = {};

    constructor(schema: SheetSchema) {
        this.schema = schema;
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
     * Get row offset from schema
     */
    getRowOffset(): number {
        return this.schema.dataRowNum;
    }

    /**
     * Get header row number from schema
     */
    getHeaderRowNum(): number {
        return this.schema.headerRowNum;
    }

    /**
     * Create a parser function for options-based conversion
     * Converts text value to key value
     * @param optionsName - Name of the options in schema
     * @returns Parser function or null if options not found
     */
    createOptionsParser(optionsName: string): ((value: any) => any) | null {
        if (!this.schema.options || !this.schema.options[optionsName]) {
            return null;
        }

        const optionsList = this.schema.options[optionsName];
        if (!optionsList) return null;

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
     * @param text - Display text from dropdown
     * @param optionsName - Name of the options in schema
     * @returns Key value or original text if not found
     */
    textToKey(text: string, optionsName: string): string | undefined {
        if (!this.schema.options || !this.schema.options[optionsName]) {
            return text;
        }

        const optionsList = this.schema.options[optionsName];
        const keyName = optionsList.keyName || DEFAULT_KEY_NAME;
        const textName = optionsList.textName || DEFAULT_TEXT_NAME;

        const match = optionsList.list.find(
            item => String(item[textName] || '').trim() === String(text).trim()
        );

        return match ? match[keyName] : text;
    }

    /**
     * Convert key value to display text
     * @param key - Key value from data
     * @param optionsName - Name of the options in schema
     * @returns Display text or original key if not found
     */
    keyToText(key: any, optionsName: string): string {
        if (!this.schema.options || !this.schema.options[optionsName]) {
            return String(key ?? '');
        }

        if (key === undefined || key === null || key === '') {
            return '';
        }

        const optionsList = this.schema.options[optionsName];
        const keyName = optionsList.keyName || DEFAULT_KEY_NAME;
        const textName = optionsList.textName || DEFAULT_TEXT_NAME;

        // Find matching option
        const match = optionsList.list.find(item => item[keyName] === key);
        return match ? (match[textName] || String(key)) : String(key);
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
}

/**
 * Create a SchemaHelper instance
 */
export function createSchemaHelper(schema: SheetSchema): SchemaHelper {
    return new SchemaHelper(schema);
}

export default SchemaHelper;