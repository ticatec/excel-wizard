import SchemaEncodingTemplate from "$lib/schema/SchemaEncodingTemplate";
import {type ValidationResult, type SchemaEncodeFun} from "$lib/schema/SchemaEncodingTemplate";
import productSheetSchema from "./ProductSheetSchema";
import type {SheetSchema} from "$lib/schema/SheetSchema";

/**
 * Product encoding template using Schema
 */
export default class ProductSchemaTemplate extends SchemaEncodingTemplate {

    constructor() {
        super(productSheetSchema as SheetSchema);
    }

    protected getSheetSchema() {
        return productSheetSchema;
    }

    protected getEncodeFunction(): SchemaEncodeFun {
        return async (rows: Array<any>) => {
            return new Promise((resolve) => {
                const list = rows.map(item => {
                    const tmp = JSON.parse(JSON.stringify(item));
                    if (Math.random() > 0.1) {
                        tmp.code = ((new Date()).getTime() * 10000 + Math.floor(Math.random() * 10000)).toString(36);
                    }
                    return tmp;
                });
                setTimeout(() => {
                    resolve(list);
                }, 1000);
            });
        };
    }

    protected getValidateFunction(): (row: any) => ValidationResult {
        return (row: any): ValidationResult => {
            // Add validation logic here
            return { valid: true };
        };
    }

    get valid(): boolean {
        return this._list.filter(item => item.code == null).length == 0;
    }
}