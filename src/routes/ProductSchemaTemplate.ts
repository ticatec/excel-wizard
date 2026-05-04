import SchemaEncodingTemplate from "$lib/SchemaEncodingTemplate";
import {type ValidationResult} from "$lib/SchemaEncodingTemplate";
import productSheetSchema from "./ProductSheetSchema";

/**
 * Product encoding template using Schema
 */
export default class ProductSchemaTemplate extends SchemaEncodingTemplate {
    constructor() {
        // Pass schema and functions to constructor
        super(
            productSheetSchema,
            // encodeFunction
            async (rows: Array<any>) => {
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
            },
            // validateFunction (optional)
            (row: any): ValidationResult => {
                // Add validation logic here
                return { valid: true };
            }
        );
    }

    get valid(): boolean {
        return this._list.filter(item => item.code == null).length == 0;
    }
}