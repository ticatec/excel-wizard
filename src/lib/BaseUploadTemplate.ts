// 改进的BaseUploadTemplate.ts - 完全清理元数据相关代码
import BaseTemplate from "$lib/BaseTemplate";
import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
import type DataColumn from "$lib/DataColumn";
import utils from "$lib/utils";
import * as XLSX from 'xlsx';
import i18nRes from "$lib/i18n_res/i18nRes";

export type UploadFun = (arr: Array<any>) => Promise<Array<any>>;
export type UpdateProgressStatus = () => void;

export interface UploadResult {
    error?: any;
    errorText?: string;
    success?: boolean;
}

// 导出选项
export interface ExportErrorOptions {
    includeAllData?: boolean;    // 是否包含所有数据（成功+失败）
    separateSheets?: boolean;    // 是否分成多个工作表
    originalFormat?: boolean;    // 是否保持原始格式（可重新导入）
}

const statusColumn: TableColumn = {
    text: i18nRes.labelStatus,
    width: 240,
    resizable: true,
    formatter: row => {
        if (row.status == 'P') {
            return i18nRes.status.pending
        } else if (row.status == 'U') {
            return i18nRes.status.uploading
        } else {
            if (row.error) {
                return row.errorText
            } else {
                return i18nRes.status.successful
            }
        }
    }
}

export default abstract class BaseUploadTemplate extends BaseTemplate {

    protected batchSize: number;
    protected updateProgressStatus: UpdateProgressStatus | null = null;
    private _uploadAborted: boolean = false;

    protected constructor(batchSize: number = 50) {
        super();
        this.batchSize = Math.max(1, batchSize);
    }

    /**
     * 状态更新的监听器
     * @param value
     */
    setProgressStatusListener(value: UpdateProgressStatus) {
        this.updateProgressStatus = value;
    }

    protected abstract uploadData(list: Array<any>): Promise<Array<any>>;

    /**
     * 中止上传
     */
    abortUpload() {
        this._uploadAborted = true;
    }

    /**
     * 重置上传状态
     */
    resetUploadStatus() {
        this._uploadAborted = false;
        this._list.forEach(item => {
            if (item.status !== 'D') {
                item.status = 'P';
                delete item.error;
                delete item.errorText;
            }
        });
    }

    /**
     * 上传数据
     */
    async upload() {
        this._uploadAborted = false;

        for (let i = 0; i < this._list.length; i += this.batchSize) {
            // 检查是否需要中止
            if (this._uploadAborted) {
                console.log('Upload aborted by user');
                break;
            }

            const chunk = this._list.slice(i, i + this.batchSize);
            chunk.forEach(item => {
                if (item.status !== 'D') { // 不重复处理已完成的项目
                    item.status = 'U';
                    delete item.error;
                    delete item.errorText;
                }
            });
            this.updateProgressStatus?.();

            try {
                // 只上传未完成的项目
                const pendingItems = chunk.filter(item => item.status === 'U');
                if (pendingItems.length === 0) {
                    continue; // 跳过已完成的批次
                }

                let list = await this.uploadData(this.extractData(pendingItems));

                // 验证结果长度是否匹配
                if (list.length !== pendingItems.length) {
                    console.warn(`Upload results length (${list.length}) doesn't match pending items (${pendingItems.length})`);
                }

                for (let j = 0; j < pendingItems.length; j++) {
                    const item = pendingItems[j];
                    item.status = 'D';
                    if (list[j]) {
                        if (list[j].error) {
                            item.error = list[j].error;
                            item.errorText = list[j].errorText;
                        }
                    }
                }
            } catch (batchError) {
                console.error(`Batch upload error for items ${i}-${i + this.batchSize - 1}:`, batchError);

                // 标记整个批次为失败
                chunk.forEach(item => {
                    if (item.status === 'U') {
                        item.status = 'D';
                        item.error = batchError;
                        item.errorText = batchError instanceof Error ? batchError.message : 'Batch upload failed';
                    }
                });
            }

            this.updateProgressStatus?.();

            // 添加小延迟以避免过快的请求
            if (i + this.batchSize < this._list.length && !this._uploadAborted) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    /**
     * 将数据包裹着一个对象里面
     * @param data
     * @protected
     */
    protected wrapData(data: any): any {
        return {data, status: 'P'}
    }

    /**
     * 获取表格的列定义
     */
    get columns(): Array<TableColumn> {
        return [...super.columns, statusColumn];
    }

    /**
     * 获取上传统计信息
     */
    get uploadStats() {
        const pending = this._list.filter(item => item.status === 'P').length;
        const uploading = this._list.filter(item => item.status === 'U').length;
        const completed = this._list.filter(item => item.status === 'D').length;
        const success = this._list.filter(item => item.status === 'D' && !item.error).length;
        const failed = this._list.filter(item => item.status === 'D' && item.error).length;

        return {
            total: this._list.length,
            pending,
            uploading,
            completed,
            success,
            failed
        };
    }

    /**
     * 导出处理异常的数据 - 基础版本（保持向后兼容）
     * @param filename
     */
    exportErrorRowsToExcel(filename: string) {
        this.exportErrorData(filename, { originalFormat: false });
    }

    /**
     * 导出错误数据 - 增强版本
     * @param filename
     * @param options 导出选项
     */
    exportErrorData(filename: string, options: ExportErrorOptions = {}) {
        const {
            includeAllData = false,
            separateSheets = true, // 默认分离工作表
            originalFormat = true
        } = options;

        try {
            const workbook = XLSX.utils.book_new();

            // 第一页：重传数据（原始格式）- 用户可以直接修改和重新导入
            if (originalFormat) {
                this._exportOriginalFormat(workbook, includeAllData);
            }

            // 第二页：异常详情 - 用于查看错误信息
            if (separateSheets) {
                this._exportErrorDetails(workbook, includeAllData);
            }

            const wbout = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });

            // 创建 Blob 并触发下载
            const blob = new Blob([wbout], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Failed to export error data:', error);
            throw new Error(`Failed to export error data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * 导出原始格式 - 可以重新导入和上传
     * @private
     */
    private _exportOriginalFormat(workbook: XLSX.WorkBook, includeAllData: boolean) {
        // 获取需要导出的数据
        const dataToExport = includeAllData
            ? this._list
            : this._list.filter(row => row.status === 'D' && row.error);

        if (dataToExport.length === 0) {
            console.warn('No data to export in original format');
            return;
        }

        // 获取可见且非虚拟的列
        const exportColumns = this.getMetaColumns().filter(col =>
            col.visible !== false && !col.dummy && !col.ignore
        );

        // 创建标题行（与原始导入格式一致）
        const headers = exportColumns.map(col => col.text || col.field);

        // 创建数据行
        const rows = dataToExport.map(item => {
            return exportColumns.map(col => {
                const value = utils.getNestedValue(item.data, col.field);
                // 如果有格式化函数的逆向操作，在这里处理
                return this._formatValueForExport(value, col);
            });
        });

        const worksheetData = [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // 设置列宽
        this._setColumnWidths(worksheet, [headers, ...rows]);

        // 添加到工作簿 - 重传数据作为第一个工作表
        const sheetName = includeAllData ? '全部数据重传' : '失败数据重传';

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    /**
     * 导出错误详情 - 作为第二个工作表
     * @private
     */
    private _exportErrorDetails(workbook: XLSX.WorkBook, includeAllData: boolean) {
        const errorRows = includeAllData
            ? this._list
            : this._list.filter(row => row.status === 'D' && row.error);

        if (errorRows.length === 0) return;

        const visibleColumns = this.getMetaColumns().filter(col => col.visible !== false && !col.dummy);
        const headers = [
            '行号',
            ...visibleColumns.map(col => col.text || col.field),
            '结果',
            '错误原因'
        ];

        const rows = errorRows.map((row, index) => {
            const values = visibleColumns.map(col => {
                return utils.getNestedValue(row.data, col.field);
            });

            // 简化状态：只有成功或失败
            const result = row.error ? '✗ 失败' : '✓ 成功';

            return [
                index + 1, // 行号
                ...values,
                result,
                row.errorText || row.error || ''
            ];
        });

        const worksheetData = [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // 设置列宽 - 错误原因列设置更宽
        const colWidths = headers.map((header, colIndex) => {
            let maxLength = header.length;

            // 计算该列的最大长度
            rows.forEach(row => {
                const cellValue = String(row[colIndex] || '');
                maxLength = Math.max(maxLength, cellValue.length);
            });

            // 错误原因列设置更宽
            if (header === '错误原因') {
                return { wch: Math.min(Math.max(maxLength, 20), 60) };
            }

            return { wch: Math.min(Math.max(maxLength + 2, 10), 30) };
        });

        worksheet['!cols'] = colWidths;

        const sheetName = includeAllData ? '上传详情' : '异常详情';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    /**
     * 格式化值用于导出
     * @private
     */
    private _formatValueForExport(value: any, column: DataColumn): any {
        // 如果列有解析器，可能需要逆向格式化
        // 这里可以根据具体的parser类型进行逆向处理
        if (value === null || value === undefined) {
            return '';
        }

        // 日期格式化
        if (value instanceof Date) {
            return value.toISOString().split('T')[0]; // YYYY-MM-DD格式
        }

        // 数字格式化
        if (typeof value === 'number') {
            return value;
        }

        // 布尔值格式化
        if (typeof value === 'boolean') {
            return value ? '是' : '否';
        }

        return String(value);
    }

    /**
     * 设置列宽
     * @private
     */
    private _setColumnWidths(worksheet: XLSX.WorkSheet, data: any[][]) {
        const colWidths = data[0]?.map((_, colIndex) => {
            const maxLength = Math.max(
                ...data.map(row => {
                    const cellValue = row[colIndex];
                    return String(cellValue || '').length;
                })
            );
            return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
        }) || [];

        worksheet['!cols'] = colWidths;
    }

    /**
     * 快速导出错误数据用于重新上传
     * @param filename
     */
    exportErrorsForReupload(filename: string) {
        this.exportErrorData(filename, {
            includeAllData: false,
            separateSheets: false,
            originalFormat: true
        });
    }

    /**
     * 导出完整报告（包含所有数据和详情）
     * @param filename
     */
    exportFullReport(filename: string) {
        this.exportErrorData(filename, {
            includeAllData: true,
            separateSheets: true,
            originalFormat: true
        });
    }
}