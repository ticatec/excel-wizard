<!-- 更新的FileUploadWizard.svelte - 彻底清理includeMetadata -->
<script lang="ts">
    import Dialog from "@ticatec/uniface-element/Dialog";
    import type {ButtonAction, ButtonActions} from "@ticatec/uniface-element/ActionBar";
    import DataTable, {type IndicatorColumn} from "@ticatec/uniface-element/DataTable";
    import Box from "@ticatec/uniface-element/Box"
    import {onMount} from "svelte";
    import type DataColumn from "./DataColumn";
    import type BaseUploadTemplate from "$lib/BaseUploadTemplate.js";
    import i18nRes from "$lib/i18n_resources/i18nRes";
    import {i18nUtils} from "@ticatec/i18n";

    export let title: string;
    export let width: string = "800px";
    export let height: string = "600px"
    export let closeHandler: any;
    export let template: BaseUploadTemplate;
    export let afterUploaded: ()=>Promise<void>;

    type ProcessStatus = 'Init' | 'Pending' | 'Uploading' | 'Done';  //初始状态，待上传，上传中，处理完成

    let status: ProcessStatus = 'Init';

    const btnChoose: ButtonAction = {
        label: i18nRes.button.open,
        type: 'primary',
        handler: () => {
            uploadField.value = '';
            uploadField.click();
        }
    }

    const btnUpload: ButtonAction = {
        label: i18nRes.button.upload,
        type: 'primary',
        handler: async ()=> {
            status = 'Uploading';
            try {
                await template.upload();
                await afterUploaded?.();
            } finally {
                status = 'Done';
            }
        }
    }

    // 原有的保存按钮（向后兼容）
    const btnSave: ButtonAction = {
        label: i18nRes.button.save,
        type: 'primary',
        handler: async ()=> {
            const baseFilename = filename.replace(/\.[^/.]+$/, ""); // 移除扩展名
            template.exportErrorRowsToExcel(`error-${baseFilename}.xlsx`);
        }
    }

    // 新增：导出用于重新上传的数据
    const btnExportForReupload: ButtonAction = {
        label: '导出失败数据',
        type: 'secondary',
        handler: async ()=> {
            const baseFilename = filename.replace(/\.[^/.]+$/, ""); // 移除扩展名
            template.exportErrorData(`重传-${baseFilename}.xlsx`, {
                includeAllData: false,
                separateSheets: true,
                originalFormat: true
            });
        }
    }

    // 新增：导出完整报告
    const btnExportFullReport: ButtonAction = {
        label: '导出完整报告',
        type: 'secondary',
        handler: async ()=> {
            const baseFilename = filename.replace(/\.[^/.]+$/, ""); // 移除扩展名
            template.exportErrorData(`报告-${baseFilename}.xlsx`, {
                includeAllData: true,
                separateSheets: true,
                originalFormat: true
            });
        }
    }

    // 新增：重置失败数据状态
    const btnResetErrors: ButtonAction = {
        label: '重置失败数据',
        type: 'secondary',
        handler: async ()=> {
            template.resetUploadStatus();
            list = template.list;
            status = 'Pending';
        }
    }

    let actions: ButtonActions = [btnChoose];
    let uploadField: any;
    let list: Array<any> = [];
    let filename: string;

    const parseExcelFile = async (excelFile: File) => {
        if (excelFile) {
            filename = excelFile.name;
            window.Indicator.show(i18nRes.parsing);
            try {
                await template.parseExcelFile(excelFile);
                list = template.list;
                status = list.length > 0 ? 'Pending' : 'Init';
            } catch (ex) {
                console.error('Parse file error:', ex);
                window.Toast.show(i18nUtils.formatText(i18nRes.parseFailure, {name: excelFile.name}));
                status = 'Init'; // 确保解析失败时重置状态
            } finally {
                window.Indicator.hide();
            }
        }
    }

    let columns: Array<DataColumn>;

    onMount(async () => {
        columns = template.columns;
        template.setProgressStatusListener(()=> {
            list = template.list;
        })
    });

    const indicatorColumn: IndicatorColumn = {
        width: 40,
        selectable: false,
        displayNo: true
    }

    $: {
        switch (status) {
            case 'Init':
                actions = [btnChoose];
                break;
            case 'Pending':
                actions = [btnUpload, btnChoose];
                break;
            case 'Uploading':
                btnUpload.disabled = true;
                btnChoose.disabled = true;
                actions = [...actions];
                break;
            case 'Done':
                btnUpload.disabled = false;
                btnChoose.disabled = false;

                // 只有在Done状态时才获取统计信息并判断按钮显示
                const stats = template.uploadStats;
                const hasError = stats.failed > 0;
                const hasSuccess = stats.success > 0;

                // 根据上传结果提供不同的操作选项
                if (hasError && hasSuccess) {
                    // 部分成功：提供重传错误数据、导出报告等选项
                    actions = [
                        btnExportForReupload,
                        btnExportFullReport,
                        btnResetErrors,
                        btnSave, // 保持向后兼容
                        btnChoose
                    ];
                } else if (hasError && !hasSuccess) {
                    // 全部失败：提供重传和导出选项
                    actions = [
                        btnExportForReupload,
                        btnSave,
                        btnChoose
                    ];
                } else if (hasSuccess && !hasError) {
                    // 全部成功：只提供导出报告和重新上传
                    actions = [btnExportFullReport, btnChoose];
                } else {
                    // 没有数据或其他情况
                    actions = [btnChoose];
                }
                break;
        }
    }

    const confirmCloseDialog = async ():Promise<boolean> => {
        if (status == 'Uploading') {
            window.Toast.show(i18nRes.waitUploading);
            return false;
        } else {
            return true;
        }
    }

    // 显示上传统计信息
    $: uploadStatsText = (() => {
        if (status === 'Done' && list.length > 0) {
            const stats = template.uploadStats;
            return `总计: ${stats.total}, 成功: ${stats.success}, 失败: ${stats.failed}`;
        }
        return '';
    })();

</script>

<Dialog {title} {closeHandler} {actions} closeConfirm={confirmCloseDialog}
        content$style="width: {width}; height: {height}; padding: 12px;">

    <!-- 添加状态信息显示 -->
    {#if uploadStatsText}
        <div style="margin-bottom: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 14px;">
            {uploadStatsText}
        </div>
    {/if}

    <Box style="border: 1px solid var(--uniface-editor-border-color, #F8FAFC); width: 100%; height: 100%; cursor: {status == 'Uploading' ? 'progress' : 'default'}" round>
        <DataTable style="width: 100%; height: 100%" {list} {indicatorColumn} {columns}>
        </DataTable>
    </Box>

    <input type="file" bind:this={uploadField} on:change={(e) => parseExcelFile(e.target.files?.[0])} style="display: none"
           accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">

</Dialog>