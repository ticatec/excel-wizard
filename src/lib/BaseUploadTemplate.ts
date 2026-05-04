// Improved BaseUploadTemplate.ts - Completely clean metadata-related code
import BaseTemplate from "$lib/BaseTemplate";
import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
import type DataColumn from "$lib/DataColumn";
import utils from "$lib/utils";
import * as XLSX from 'xlsx';
import i18nRes from "$lib/i18n_res/i18nRes";
import {BATCH_CONFIG} from "$lib/config";

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

    protected constructor(batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE) {
        super();
        this.batchSize = Math.max(BATCH_CONFIG.MIN_BATCH_SIZE, batchSize);
    }

    /**
     * Listener for status updates
     * @param value - The callback function to invoke on status update
     */
    setProgressStatusListener(value: UpdateProgressStatus) {
        this.updateProgressStatus = value;
    }

    protected abstract uploadData(list: Array<any>): Promise<Array<any>>;

    /**
     * Abort upload process
     */
    abortUpload() {
        this._uploadAborted = true;
    }

    /**
     * Reset upload status
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
     * Upload data
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

            // Add small delay to avoid rapid requests
            if (i + this.batchSize < this._list.length && !this._uploadAborted) {
                await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.BATCH_DELAY_MS));
            }
        }
    }

    /**
     * Wrap data in an object with status
     * @param data - The data to wrap
     * @protected
     */
    protected wrapData(data: any): any {
        return {data, status: 'P'}
    }

    /**
     * Get table column definitions
     */
    get columns(): Array<TableColumn> {
        return [...super.columns, statusColumn];
    }

    /**
     * Get upload statistics
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
     * Export error data for re-upload - Base version (maintains backward compatibility)
     * @param filename - The filename for the exported file
     */
    exportErrorRowsToExcel(filename: string) {
        this.exportErrorData(filename, { originalFormat: false });
    }

    /**
     * Export error data - Enhanced version with options
     * @param filename - The filename for the exported file
     * @param options - Export options
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
     * Export in original format - can be re-imported and uploaded
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

        // 获取非虚拟和非忽略的列
        const exportColumns = this.getMetaColumns().filter(col =>
            !col.dummy && !col.ignore
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

        // Add to workbook - re-upload data as first sheet
        const sheetName = includeAllData ? 'All Data Re-upload' : 'Failed Data Re-upload';

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    /**
     * Export error details - As second worksheet
     * @private
     */
    private _exportErrorDetails(workbook: XLSX.WorkBook, includeAllData: boolean) {
        const errorRows = includeAllData
            ? this._list
            : this._list.filter(row => row.status === 'D' && row.error);

        if (errorRows.length === 0) return;

        const exportColumns = this.getMetaColumns().filter(col => !col.dummy);
        const headers = [
            'Row No.',
            ...exportColumns.map(col => col.text || col.field),
            'Result',
            'Error'
        ];

        const rows = errorRows.map((row, index) => {
            const values = exportColumns.map(col => {
                return utils.getNestedValue(row.data, col.field);
            });

            // Simplified status: success or failure only
            const result = row.error ? '✗ Failed' : '✓ Success';

            return [
                index + 1, // Row number
                ...values,
                result,
                row.errorText || row.error || ''
            ];
        });

        const worksheetData = [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths - error column wider
        const colWidths = headers.map((header, colIndex) => {
            let maxLength = header.length;

            // Calculate maximum length for this column
            rows.forEach(row => {
                const cellValue = String(row[colIndex] || '');
                maxLength = Math.max(maxLength, cellValue.length);
            });

            // Error column wider
            if (header === 'Error') {
                return { wch: Math.min(Math.max(maxLength, 20), 60) };
            }

            return { wch: Math.min(Math.max(maxLength + 2, 10), 30) };
        });

        worksheet['!cols'] = colWidths;

        const sheetName = includeAllData ? 'Upload Details' : 'Error Details';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    /**
     * Format value for export
     * @private
     */
    private _formatValueForExport(value: any, column: DataColumn): any {
        // If column has a parser, may need reverse formatting
        // Can implement reverse processing based on specific parser type here
        if (value === null || value === undefined) {
            return '';
        }

        // Date formatting
        if (value instanceof Date) {
            return value.toISOString().split('T')[0]; // YYYY-MM-DD format
        }

        // Number formatting
        if (typeof value === 'number') {
            return value;
        }

        // Boolean formatting
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        return String(value);
    }

    /**
     * Set column widths
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
     * Quick export error data for re-upload
     * @param filename - The filename for the exported file
     */
    exportErrorsForReupload(filename: string) {
        this.exportErrorData(filename, {
            includeAllData: false,
            separateSheets: false,
            originalFormat: true
        });
    }

    /**
     * Export full report (includes all data and details)
     * @param filename - The filename for the exported file
     */
    exportFullReport(filename: string) {
        this.exportErrorData(filename, {
            includeAllData: true,
            separateSheets: true,
            originalFormat: true
        });
    }
}