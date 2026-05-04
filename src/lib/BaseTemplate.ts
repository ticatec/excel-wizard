import type DataColumn from "./DataColumn";
import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
import * as XLSX from 'xlsx';
import utils from "./utils";
import {EXCEL_DATE} from "$lib/config";

export default abstract class BaseTemplate {

    protected _list: Array<any> = [];
    protected _file: File | null = null;
    protected _workbook: XLSX.WorkBook | null = null;
    protected _currentSheetName: string | null = null;

    protected abstract getMetaColumns(): Array<DataColumn>;

    protected getRowOffset(): number {
        return 1;
    }

    /**
     * Consolidate data, can be overridden in subclasses for post-processing
     */
    protected async consolidateData(rows: Array<any>): Promise<Array<any>> {
        return rows;
    }

    /**
     * Set the Excel file to parse
     * @param file - The Excel file to parse
     */
    async setFile(file: File): Promise<string[]> {
        this._file = file;
        this._workbook = null;
        this._currentSheetName = null;
        this._list = [];

        try {
            const buffer = await file.arrayBuffer();
            this._workbook = XLSX.read(buffer, {type: 'array', cellNF: true});

            if (!this._workbook.SheetNames || this._workbook.SheetNames.length === 0) {
                throw new Error('Excel file contains no worksheets');
            }
            return [...this._workbook.SheetNames];
        } catch (error) {
            console.error('Failed to load Excel file:', error);
            throw new Error(`Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }


    /**
     * Parse the specified worksheet
     * @param sheetName - The worksheet name to parse (uses first sheet if not provided)
     */
    async parseSheet(sheetName?: string): Promise<void> {
        if (!this._workbook) {
            throw new Error('No Excel file has been set. Call setFile() first.');
        }

        const targetSheetName = sheetName || this._workbook.SheetNames[0];

        if (!this._workbook.SheetNames.includes(targetSheetName)) {
            throw new Error(`Sheet "${targetSheetName}" not found in the workbook`);
        }

        const sheet = this._workbook.Sheets[targetSheetName];
        if (!sheet || !sheet['!ref']) {
            throw new Error(`Sheet "${targetSheetName}" is empty or invalid`);
        }

        this._currentSheetName = targetSheetName;
        this._list = [];

        try {
            const columns = this.getMetaColumns();
            const rowOffset = this.getRowOffset();
            const range = XLSX.utils.decode_range(sheet['!ref']);

            if (range.e.r < rowOffset) {
                throw new Error(`Not enough rows in sheet "${targetSheetName}". Expected at least ${rowOffset + 1} rows`);
            }

            this.extractFormAttributes();

            const rows: any[] = [];

            for (let rowIndex = range.s.r + rowOffset; rowIndex <= range.e.r; rowIndex++) {
                const rowObject: any = {};
                let dummyCount = 0;
                let hasData = false;

                for (let i = 0; i < columns.length; i++) {
                    const colDef = columns[i];
                    if (colDef.dummy) {
                        dummyCount++;
                        continue;
                    }

                    const actualColIndex = i - dummyCount;
                    if (actualColIndex < 0) {
                        console.warn(`Invalid column index for ${colDef.field}: ${actualColIndex}`);
                        continue;
                    }

                    const cellAddress = {r: rowIndex, c: actualColIndex};
                    const cellRef = XLSX.utils.encode_cell(cellAddress);
                    const cell = sheet[cellRef];
                    const rawValue = cell?.v;

                    if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                        hasData = true;
                    }

                    try {
                        const formattedValue = colDef.parser ? colDef.parser(rawValue) : rawValue;
                        if (colDef.setValue) {
                            colDef.setValue(rowObject, formattedValue);
                        } else {
                            utils.setNestedValue(rowObject, colDef.field, formattedValue);
                        }
                    } catch (parseError) {
                        console.warn(`Failed to parse cell ${cellRef} in sheet "${targetSheetName}":`, parseError);
                        utils.setNestedValue(rowObject, colDef.field, rawValue);
                    }
                }

                if (hasData) {
                    rows.push(this.wrapData(rowObject));
                }
            }

            if (rows.length === 0) {
                throw new Error(`No valid data rows found in sheet "${targetSheetName}"`);
            }

            this._list = await this.consolidateData(rows);
        } catch (error) {
            console.error(`Failed to parse sheet "${targetSheetName}":`, error);
            throw new Error(`Failed to parse sheet "${targetSheetName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Helper function: Get cell value by row and column index (0-based)
     * @param r - Row index (0 means first row)
     * @param c - Column index (0 means first column)
     */
    protected getCellValue(r: number, c: number): any {
        if (!this._workbook || !this._currentSheetName) {
            return null;
        }
        const sheet = this._workbook.Sheets[this._currentSheetName];
        if (!sheet) return null;

        const cellAddress = { r, c };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        const cell = sheet[cellRef];

        if (!cell || cell.v === undefined) return null;

        if (cell.t === 'n' && cell.z && /y|m|d|h|s/i.test(cell.z)) {
            return new Date(Math.round((cell.v - EXCEL_DATE.EPOCH) * EXCEL_DATE.MS_PER_DAY));
        }
        return cell.v;
    }

    /**
     * Parse form-level variables
     * @protected
     */
    protected extractFormAttributes() {

    }

    /**
     * Add more fields
     * @param rowData - The row data object
     * @param data - The data to append
     * @protected
     */
    protected appendMoreFields(rowData: any, data: any) {

    }


    /**
     * Parse data
     * @param arr - The array to parse
     * @protected
     */
    protected extractData(arr: Array<any>) {
        return  arr.map(item => {
            let result: any = {};
            for (let col of this.getMetaColumns()) {
                if (col.ignore != true) {
                    let data = item.data;
                    utils.setNestedValue(result, col.field, utils.getNestedValue(data, col.field));
                }
            }
            this.appendMoreFields(item.data, result);
            return result;
        });
    }

    protected wrapData(data: any): any {
        return {data};
    }

    get columns(): Array<TableColumn> {
        return this.getMetaColumns()
            .map(col => ({...col, field: `data.${col.field}`}));
    }

    get list(): Array<any> {
        return [...this._list];
    }

    get dataList(): Array<any> {
        return this._list.map(row => row.data);
    }

    /**
     * Get the name of the current parsed worksheet
     */
    get currentSheetName(): string | null {
        return this._currentSheetName;
    }
}