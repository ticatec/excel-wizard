<!-- 更新的FileUploadWizard.svelte - 彻底清理includeMetadata -->
<script lang="ts">
    import CommonDialog from "@ticatec/uniface-element/CommonDialog";
    import Box from "@ticatec/uniface-element/Box"
    import i18nRes from "$lib/i18n_res/i18nRes";
    import ListBox from "@ticatec/uniface-element/ListBox";
    import SheetNameViewRender from "$lib/SheetNameViewRender.svelte";


    export let confirmCallback: any;

    export let sheets: Array<string>;

    export let onClose: any;

    let selectedSheet: any;

    let width: string = "360px";
    let height: string = "480px";

    const confirmSelection = () => {
        confirmCallback?.(selectedSheet);
        return true;
    }


</script>

<CommonDialog title={i18nRes.titleChooseSheet} {onClose} confirmHandler={confirmSelection} enableConfirm={selectedSheet != null}
              content$style="width: {width}; height: {height}; padding: 12px;">
    <Box style="border: 1px solid var(--uniface-editor-border-color, #F8FAFC); width: 100%; height: 100%;" round>
        <ListBox style="width: 100%; height: 100%" list={sheets} selectMode="single" bind:selectedItem={selectedSheet}
                 itemRender={SheetNameViewRender}/>
    </Box>
</CommonDialog>