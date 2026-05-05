import SchemaUploadTemplate from "$lib/schema/SchemaUploadTemplate";
import employeeSheetSchema from "./EmployeeSheetSchema";
import type {SheetSchema} from "$lib/schema/SheetSchema";

/**
 * Employee upload template using Schema
 */
export default class EmployeeSchemaTemplate extends SchemaUploadTemplate {

    constructor() {
        super(employeeSheetSchema as SheetSchema);
    }

    protected getSheetSchema() {
        return employeeSheetSchema;
    }

    protected uploadData(rows: Array<any>): Promise<Array<any>> {
        console.log("开始上传数据（Schema版本）", rows);
        return new Promise((resolve) => {
            const list: Array<any> = rows.map(item => ({}));
            for (let i = 0; i < rows.length; i++) {
                const code = Math.round(Math.random() * 1000);
                if (code > 800) {
                    list[i].error = code;
                }
            }
            setTimeout(() => {
                resolve(list);
            }, 1000);
        });
    }
}