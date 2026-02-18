import type DataColumn from "./DataColumn";
import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
import * as XLSX from 'xlsx';
import utils from "./utils";

export default abstract class BaseTemplate {

    protected _list: Array<any> = [];

    /**
     *
     * @protected
     */
    protected constructor() {

    }

    protected abstract getMetaColumns(): Array<DataColumn>;

    protected getRowOffset(): number {
        return 1
    }

    /**
     * 整理数据，在子类可以通过重载完成数据的二次处理
     * @param rows
     * @protected
     */
    protected async consolidateData(rows: Array<any>): Promise<Array<any>> {
        return rows;
    }

    /**
     * 解析一个excel文件
     * @param file
     */
    async parseExcelFile(file: File): Promise<void> {
        const columns = this.getMetaColumns();
        const rowOffset = this.getRowOffset();
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, {type: 'array'});

            // 验证工作簿是否有工作表
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Excel file contains no worksheets');
            }

            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // 验证工作表是否存在且有数据
            if (!sheet || !sheet['!ref']) {
                throw new Error('Worksheet is empty or invalid');
            }

            const range = XLSX.utils.decode_range(sheet['!ref']); // 获取范围

            // 验证是否有足够的行数
            if (range.e.r < rowOffset) {
                throw new Error(`Not enough rows in file. Expected at least ${rowOffset + 1} rows`);
            }

            const rows: any[] = [];

            for (let rowIndex = range.s.r + rowOffset; rowIndex <= range.e.r; rowIndex++) {
                const rowObject: any = {};
                let dummyCount = 0;
                let hasData = false;

                for (let i = 0; i < columns.length; i++) {
                    const colDef = columns[i];
                    if (colDef.dummy) {
                        dummyCount++;
                    } else {
                        // 确保列索引不会为负数
                        const actualColIndex = i - dummyCount;
                        if (actualColIndex < 0) {
                            console.warn(`Invalid column index for ${colDef.field}: ${actualColIndex}`);
                            continue;
                        }

                        const cellAddress = {r: rowIndex, c: actualColIndex};
                        const cellRef = XLSX.utils.encode_cell(cellAddress);
                        const cell = sheet[cellRef];
                        const rawValue = cell?.v;

                        // 检查是否有实际数据
                        if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                            hasData = true;
                        }

                        try {
                            const formattedValue = colDef.parser ? colDef.parser(rawValue) : rawValue;
                            utils.setNestedValue(rowObject, colDef.field, formattedValue);
                        } catch (parseError) {
                            console.warn(`Failed to parse cell ${cellRef}:`, parseError);
                            utils.setNestedValue(rowObject, colDef.field, rawValue);
                        }
                    }
                }

                // 只添加有数据的行
                if (hasData) {
                    rows.push(this.wrapData(rowObject));
                }
            }

            if (rows.length === 0) {
                throw new Error('No valid data rows found in the file');
            }

            this._list = await this.consolidateData(rows);

        } catch (error) {
            console.error('Failed to parse Excel file:', error);
            throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * 获取实际待上传的数据
     * @param arr
     */
    protected extractData(arr: Array<any>) {
        let list = arr.map(item => {
            let result: any = {};
            for (let col of this.getMetaColumns()) {
                // 修复逻辑错误：ignore应该为true时才忽略，visible为false时才隐藏
                if (col.visible != false && col.ignore != true && !col.dummy) {
                    let data = item.data;
                    utils.setNestedValue(result, col.field, utils.getNestedValue(data, col.field));
                }
            }
            return result;
        });
        return list;
    }

    /**
     * 包裹数据
     * @param data
     * @protected
     */
    protected wrapData(data: any): any {
        return {data};
    }

    /**
     * 获取表格的列定义
     */
    get columns(): Array<TableColumn> {
        return this.getMetaColumns()
            .filter(col => col.visible !== false)
            .map(col => ({...col, field: `data.${col.field}`}));
    }

    /**
     * 获取数据
     */
    get list(): Array<any> {
        return [...this._list];
    }

    /**
     * 获取实际的数据列表
     */
    get dataList(): Array<any> {
        return this._list.map(row => row.data);
    }
}