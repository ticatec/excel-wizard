<!-- Refactored FileUploadWizard.svelte - Using shared utilities -->
<script lang="ts">
    import Dialog from "@ticatec/uniface-element/Dialog";
    import type {ButtonAction, ButtonActions} from "@ticatec/uniface-element/ActionBar";
    import DataTable, {type DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
    import Box from "@ticatec/uniface-element/Box"
    import {onMount} from "svelte";
    import type BaseUploadTemplate from "$lib/BaseUploadTemplate.js";
    import i18nRes from "$lib/i18n_res/i18nRes";
    import {i18nUtils} from "@ticatec/i18n";
    import {ProcessStatus} from "$lib/ProcessStatus";
    import {
        getIndicatorColumn,
        createChooseButton,
        parseExcelFile,
        FILE_ACCEPT
    } from "$lib/wizardUtils";
    import DropZone from "$lib/DropZone.svelte";

    export let title: string;
    export let width: string = "800px";
    export let height: string = "600px"
    export let template: BaseUploadTemplate;
    export let afterUploaded: () => Promise<void>;

    let status: ProcessStatus = ProcessStatus.Init;
    let uploadField: HTMLInputElement;
    let list: Array<any> = [];
    let filename: string;
    let columns: Array<TableColumn>;

    const btnChoose = createChooseButton(() => uploadField);

    const btnUpload: ButtonAction = {
        label: i18nRes.button.upload,
        type: 'primary',
        handler: async () => {
            status = ProcessStatus.Uploading;
            try {
                await template.upload();
                await afterUploaded?.();
            } finally {
                status = ProcessStatus.Done;
            }
        }
    }

    const btnSave: ButtonAction = {
        label: i18nRes.button.save,
        type: 'primary',
        handler: async () => {
            const baseFilename = filename.replace(/\.[^/.]+$/, "");
            template.exportErrorRowsToExcel(`error-${baseFilename}.xlsx`);
        }
    }

    const btnExportForReupload: ButtonAction = {
        label: i18nRes.buttonExportException,
        type: 'secondary',
        handler: async () => {
            const baseFilename = filename.replace(/\.[^/.]+$/, "");
            template.exportErrorData(`${baseFilename}.xlsx`, {
                includeAllData: false,
                separateSheets: true,
                originalFormat: true
            });
        }
    }

    const btnExportFullReport: ButtonAction = {
        label: i18nRes.buttonExportFull,
        type: 'secondary',
        handler: async () => {
            const baseFilename = filename.replace(/\.[^/.]+$/, "");
            template.exportErrorData(`report-${baseFilename}.xlsx`, {
                includeAllData: true,
                separateSheets: true,
                originalFormat: true
            });
        }
    }

    const btnResetErrors: ButtonAction = {
        label: i18nRes.buttonReset,
        type: 'secondary',
        handler: async () => {
            template.resetUploadStatus();
            list = template.list;
            status = ProcessStatus.Pending;
        }
    }

    let actions: ButtonActions = [btnChoose];

    const handleFileChange = async (excelFile: File) => {
        if (!excelFile) return;

        filename = excelFile.name;
        await parseExcelFile(template, excelFile, (newList) => {
            list = newList;
            status = newList.length > 0 ? ProcessStatus.Pending : ProcessStatus.Init;
        });
    }

    onMount(async () => {
        columns = template.columns;
        template.setProgressStatusListener(() => {
            list = template.list;
        })
    });

    const indicatorColumn = getIndicatorColumn();

    const invalidateStatus = (ps: ProcessStatus) => {
        switch (ps) {
            case ProcessStatus.Init:
                actions = [btnChoose];
                break;
            case ProcessStatus.Pending:
                actions = [btnUpload, btnChoose];
                break;
            case ProcessStatus.Uploading:
                btnUpload.disabled = true;
                btnChoose.disabled = true;
                actions = [...actions];
                break;
            case ProcessStatus.Done:
                btnUpload.disabled = false;
                btnChoose.disabled = false;

                const stats = template.uploadStats;
                const hasError = stats.failed > 0;
                const hasSuccess = stats.success > 0;

                if (hasError && hasSuccess) {
                    actions = [
                        btnExportForReupload,
                        btnExportFullReport,
                        btnResetErrors,
                        btnSave,
                        btnChoose
                    ];
                } else if (hasError && !hasSuccess) {
                    actions = [
                        btnExportForReupload,
                        btnSave,
                        btnChoose
                    ];
                } else if (hasSuccess && !hasError) {
                    actions = [btnExportFullReport, btnChoose];
                } else {
                    actions = [btnChoose];
                }
                break;
        }
    }

    $: invalidateStatus(status);

    const confirmCloseDialog = async (): Promise<boolean> => {
        if (status == ProcessStatus.Uploading) {
            window.Toast.show(i18nRes.waitUploading);
            return false;
        } else {
            return true;
        }
    }

    $: uploadStatsText = (() => {
        if (status === ProcessStatus.Done && list.length > 0) {
            const stats = template.uploadStats;
            return i18nUtils.formatText(i18nRes.uploadStatText, stats);
        }
        return '';
    })();
</script>

<Dialog {title} {actions} closeConfirm={confirmCloseDialog}
        content$style="width: {width}; height: {height}; padding: 12px; display: flex; flex-direction: column;">

    <!-- 添加状态信息显示 -->
    {#if uploadStatsText}
        <div style="margin-bottom: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 14px; flex: 0 0 auto">
            {uploadStatsText}
        </div>
    {/if}

    {#if status === ProcessStatus.Init}
        <!-- Drag and Drop Zone -->
        <DropZone onFileDrop={handleFileChange} height="240px" width="360px" />
    {:else}
        <!-- Data Table -->
        <Box style="flex: 1 1 auto; border: 1px solid var(--uniface-editor-border-color, #F8FAFC); width: 100%; height: 100%; cursor: {status == ProcessStatus.Uploading ? 'progress' : 'default'}"
             round>
            <DataTable style="width: 100%; height: 100%" {list} {indicatorColumn} {columns}>
            </DataTable>
        </Box>
    {/if}

    <input
            type="file"
            bind:this={uploadField}
            on:change={(e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                handleFileChange(file);
            }
        }}
            style="display: none"
            accept={FILE_ACCEPT}
    >

</Dialog>