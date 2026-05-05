<script lang="ts">
    import i18nRes from "$lib/i18n_res/i18nRes";

    export let onFileDrop: (file: File) => void | Promise<void>;
    export let height: string = "240px";
    export let width: string = "360px";

    let isDragging: boolean = false;
    let dragCounter: number = 0;

    // Trigger file input click
    let inputField: HTMLInputElement;

    const handleClick = () => {
        inputField.click();
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
                await onFileDrop(file);
            } else {
                window.Toast?.show(i18nRes.parseFailure || 'Please select an Excel file (.xlsx or .xls)');
            }
        }
    }

    const handleInputChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            onFileDrop(file);
        }
    }
</script>

<div
    style="display: flex; flex-direction: row; width: 100%; height: 100%; align-items: center; justify-content: center;"
>
    <div
        on:dragenter={handleDragEnter}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop={handleDrop}
        style="height: {height}; width: {width}; display: flex; flex-direction: column; align-items: center; justify-content: center;
               border: 2px dashed {isDragging ? 'var(--uniface-primary-color, #007bff)' : 'var(--uniface-editor-border-color, #d0d7de)'};
               border-radius: 8px; background: {isDragging ? 'rgba(0, 123, 255, 0.05)' : '#f8f9fa'};
               transition: all 0.2s ease; cursor: pointer; padding: 40px;"
        on:click={handleClick}
    >
        <svg style="width: 64px; height: 64px; margin-bottom: 16px; color: var(--uniface-text-secondary-color, #6c757d);"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        <div style="font-size: 16px; font-weight: 500; color: var(--uniface-text-color, #212529); margin-bottom: 8px;">
            {i18nRes.dragDropText || 'Drag and drop your Excel file here'}
        </div>
        <div style="font-size: 14px; color: var(--uniface-text-secondary-color, #6c757d); margin-bottom: 16px;">
            {i18nRes.dragDropSubText || 'or click to browse'}
        </div>
        <div style="font-size: 12px; color: var(--uniface-text-secondary-color, #6c757d); padding: 4px 12px; background: #e9ecef; border-radius: 12px;">
            {i18nRes.dragDropFileType || 'Supports .xlsx and .xls files'}
        </div>
    </div>
</div>

<input
    type="file"
    bind:this={inputField}
    on:change={handleInputChange}
    style="display: none"
    accept=".xlsx,.xls"
>