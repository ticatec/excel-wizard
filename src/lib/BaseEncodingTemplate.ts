
import BaseTemplate from "$lib/BaseTemplate";
import type DataColumn from "$lib/DataColumn";
import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
import i18nRes from "$lib/i18n_res";

const ValidData = `<span style="color: #76FF03">${i18nRes.textValid}</span>`;
const InvalidData = `<span style="color: #ff3e00">${i18nRes.textInvalid.key}</span>`;

export interface ValidationResult {
    valid: boolean;
    hint?: string;
    error?: string;
}

export default abstract class BaseEncodingTemplate extends BaseTemplate {

    private hintColumn: TableColumn = {
        text: i18nRes.labelHint,
        field: "hint",
        width: 150,
        resizable: true
    }

    private validColumn: TableColumn = {
        text: i18nRes.labelValid,
        field: "valid",
        width: 90,
        align: 'center',
        escapeHTML: false, // 修复：需要渲染HTML
        formatter: valid => valid ? ValidData : InvalidData
    }

    protected constructor(columns: Array<DataColumn>, rowOffset: number = 1) {
        super(columns, rowOffset);
    }

    /**
     *
     * @param rows
     * @protected
     */
    protected abstract encodeData(rows: Array<any>): Promise<Array<any>>;

    /**
     * 检查数据
     * @param row
     * @protected
     */
    protected abstract validateData(row: any): ValidationResult | Promise<ValidationResult>;

    /**
     * 数据集是否有效
     */
    get valid(): boolean {
        return this._list.filter(row => !row.valid).length == 0;
    }

    /**
     * 获取无效数据的数量
     */
    get invalidCount(): number {
        return this._list.filter(row => row.valid !== true).length;
    }

    /**
     * 从服务器抓取数据，然后根据主键进行数据合并
     * @param rows
     * @protected
     */
    protected async consolidateData(rows: Array<any>): Promise<Array<any>> {
        try {
            let list = await this.encodeData(this.extractData(rows));

            // 验证返回数据长度是否匹配
            if (list.length !== rows.length) {
                console.warn(`Encoded data length (${list.length}) doesn't match input length (${rows.length})`);
            }

            // 并行处理验证以提高性能
            const validationPromises = rows.map(async (item: any, idx: number) => {
                if (list[idx]) {
                    let data = list[idx];
                    item.data = {...item.data, ...data}

                    try {
                        let result: ValidationResult = await Promise.resolve(this.validateData(data));
                        item.valid = result.valid;
                        item.hint = result.hint || '';
                        item.error = result.error;
                    } catch (validationError) {
                        console.error(`Validation error for row ${idx}:`, validationError);
                        item.valid = false;
                        item.hint = 'Validation failed';
                        item.error = validationError instanceof Error ? validationError.message : 'Unknown validation error';
                    }
                } else {
                    // 没有对应的编码数据
                    item.valid = false;
                    item.hint = 'No encoded data available';
                    item.error = 'Missing encoded data';
                }

                return item;
            });

            return await Promise.all(validationPromises);

        } catch (error) {
            console.error('Error during data consolidation:', error);

            // 标记所有行为无效
            return rows.map(item => ({
                ...item,
                valid: false,
                hint: 'Encoding failed',
                error: error instanceof Error ? error.message : 'Unknown encoding error'
            }));
        }
    }

    get columns(): Array<TableColumn> {
        return [...super.columns, this.hintColumn, this.validColumn];
    }

    /**
     * 获取所有有效的数据
     */
    get validDataList(): Array<any> {
        return this._list
            .filter(row => row.valid === true)
            .map(row => row.data);
    }

    /**
     * 获取所有无效的数据
     */
    get invalidDataList(): Array<any> {
        return this._list
            .filter(row => row.valid !== true)
            .map(row => ({...row.data, _error: row.error, _hint: row.hint}));
    }
}