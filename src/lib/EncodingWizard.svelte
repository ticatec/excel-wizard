<script lang="ts">
    import Dialog from "@ticatec/uniface-element/Dialog";
    import type {ButtonAction, ButtonActions} from "@ticatec/uniface-element/ActionBar";
    import DataTable, {type DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";
    import Box from "@ticatec/uniface-element/Box"
    import {onMount} from "svelte";
    import type BaseEncodingTemplate from "$lib/BaseEncodingTemplate";
    import i18nRes from "$lib/i18n_res/i18nRes";
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
    export let template: BaseEncodingTemplate;
    export let confirmCallback: any;

    let uploadField: HTMLInputElement;
    let list: Array<any> = [];
    let isDragging: boolean = false;
    let dragCounter: number = 0;

    const btnChoose = createChooseButton(() => uploadField);

    const btnConfirm: ButtonAction = {
        label: i18nRes.button.confirm,
        type: 'primary',
        disabled: true,
        handler: async () => {
            let result = await confirmCallback?.(template.dataList);
            console.log("Processing result", result);
            return true;
        }
    }

    let actions: ButtonActions = [btnChoose, btnConfirm];

    $: {
        btnConfirm.disabled = list.length == 0;
        actions = [...actions]
    }

    const handleFileChange = async (excelFile: File) => {
        await parseExcelFile(template, excelFile, (newList) => {
            list = newList;
        });
    }

    const handleInputChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            handleFileChange(file);
        }
    }

    // Drag and drop handlers
    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        dragCounter++;
        isDragging = true;
    }

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    }

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            isDragging = false;
        }
    }

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        dragCounter = 0;
        isDragging = false;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            // Check file type
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                await handleFileChange(file);
            } else {
                window.Toast?.show(i18nRes.parseFailure || 'Please select an Excel file (.xlsx or .xls)');
            }
        }
    }

    let columns: Array<TableColumn>;

    onMount(async () => {
        columns = template.columns;
    });

    const indicatorColumn = getIndicatorColumn();
</script>

<Dialog {title} {actions}
        content$style="width: {width}; height: {height}; padding: 12px;">

    {#if list.length === 0}
        <!-- Drag and Drop Zone -->
        <DropZone onFileDrop={handleFileChange} height="240px" width="360px" />
    {:else}
        <!-- Data Table -->
        <Box style="border: 1px solid var(--uniface-editor-border-color, #F8FAFC); width: 100%; height: 100%; "
             round>
            <DataTable style="width: 100%; height: 100%" {list} {indicatorColumn} {columns}>

            </DataTable>
        </Box>
    {/if}

    <input
        type="file"
        bind:this={uploadField}
        on:change={handleInputChange}
        style="display: none"
        accept={FILE_ACCEPT}
    >

</Dialog>
