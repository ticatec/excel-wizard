import SchemaUploadTemplate from "$lib/SchemaUploadTemplate";
import employeeSheetSchema from "./EmployeeSheetSchema";

/**
 * Employee upload template using Schema
 */
export default class EmployeeSchemaTemplate extends SchemaUploadTemplate {
    constructor() {
        // Pass schema and upload function to constructor
        super(employeeSheetSchema, async (rows: Array<any>) => {
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
        });
    }
}