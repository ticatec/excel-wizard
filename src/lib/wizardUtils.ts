/**
 * Shared utilities for wizard components
 *
 * @module wizardUtils
 * @description
 * A collection of reusable utility functions that eliminate code duplication
 * between FileUploadWizard and EncodingWizard components. These utilities handle
 * common operations like Excel file parsing, sheet selection dialogs, and
 * button creation.
 *
 * @features
 * - Excel file parsing with error handling
 * - Multi-sheet selection dialogs
 * - File input management
 * - Indicator column configuration
 *
 * @example
 * ```typescript
 * import { parseExcelFile, getIndicatorColumn, createChooseButton } from './wizardUtils';
 * import BaseTemplate from './BaseTemplate';
 *
 * const template = new BaseTemplate();
 * const uploadField: HTMLInputElement;
 *
 * // Create file choose button
 * const btnChoose = createChooseButton(() => uploadField);
 *
 * // Parse Excel file
 * await parseExcelFile(template, file, (list) => {
 *   console.log('Parsed', list.length, 'rows');
 * });
 *
 * // Get indicator column config
 * const indicatorColumn = getIndicatorColumn();
 * ```
 *
 * @since 0.2.0
 */

import type BaseTemplate from "$lib/BaseTemplate";
import i18nRes from "$lib/i18n_res/i18nRes";
import {i18nUtils} from "@ticatec/i18n";
import SheetPickupDialog from "$lib/SheetPickupDialog.svelte";
import type {ButtonAction} from "@ticatec/uniface-element/ActionBar";

/**
 * Get common indicator column configuration for wizard data tables
 *
 * @description
 * Returns a standardized indicator column configuration used by both
 * FileUploadWizard and EncodingWizard. The indicator column displays
 * row numbers in the data table.
 *
 * @returns {Object} Indicator column configuration object
 * @returns {number} returns.width - Column width in pixels (default: 40)
 * @returns {boolean} returns.selectable - Whether rows can be selected (default: false)
 * @returns {boolean} returns.displayNo - Whether to display row numbers (default: true)
 *
 * @example
 * ```typescript
 * import { getIndicatorColumn } from './wizardUtils';
 *
 * const indicatorColumn = getIndicatorColumn();
 * // { width: 40, selectable: false, displayNo: true }
 *
 * <DataTable {indicatorColumn} />
 * ```
 */
export const getIndicatorColumn = () => ({
    width: 40,
    selectable: false,
    displayNo: true
});

/**
 * Show sheet selection dialog for Excel files with multiple sheets
 *
 * @description
 * Displays a modal dialog allowing the user to select which sheet to parse
 * when an Excel file contains multiple sheets. Returns the selected sheet name
 * or null if the user cancels the dialog.
 *
 * @param {string[]} sheetNames - Array of sheet names to display in the dialog
 * @returns {Promise<string | null>} Promise that resolves with selected sheet name or null if cancelled
 *
 * @throws {Error} If dialog cannot be displayed
 *
 * @example
 * ```typescript
 * const sheetNames = ['Sheet1', 'Sheet2', 'Data'];
 * const selectedSheet = await showSheetChooseDialog(sheetNames);
 *
 * if (selectedSheet) {
 *   console.log('User selected:', selectedSheet);
 * } else {
 *   console.log('User cancelled');
 * }
 * ```
 */
export const showSheetChooseDialog = (sheetNames: string[]): Promise<string | null> => {
    return new Promise((resolve) => {
        window.Dialog.showModal(SheetPickupDialog, {
            confirmCallback: (sheet: string) => {
                resolve(sheet);
            },
            onClose: () => {
                resolve(null);
            },
            sheets: sheetNames
        });
    });
};

/**
 * Open and parse Excel file, returning sheet names
 *
 * @description
 * Parses an Excel file and returns the list of sheet names found in the workbook.
 * Shows a loading indicator during parsing and displays error messages if parsing fails.
 *
 * @param {BaseTemplate} template - BaseTemplate instance to handle file parsing
 * @param {File} excelFile - Excel file to parse (.xls or .xlsx)
 * @returns {Promise<string[]>} Promise that resolves with array of sheet names
 *
 * @throws {Error} If file cannot be parsed or is not a valid Excel file
 *
 * @example
 * ```typescript
 * const file = event.target.files[0];
 *
 * try {
 *   const sheetNames = await openExcelFile(template, file);
 *   console.log('Found sheets:', sheetNames);
 * } catch (error) {
 *   console.error('Failed to parse file:', error);
 * }
 * ```
 */
export const openExcelFile = async (
    template: BaseTemplate,
    excelFile: File
): Promise<string[]> => {
    window.Indicator.show(i18nRes.parsing.toString());
    try {
        return await template.setFile(excelFile);
    } catch (ex) {
        console.error('Parse file error:', ex);
        window.Toast.show(i18nUtils.formatText(i18nRes.parseFailure, {name: excelFile.name}));
        throw ex;
    } finally {
        window.Indicator.hide();
    }
};

/**
 * Parse Excel file and extract data from selected sheet
 *
 * @description
 * Complete Excel file parsing workflow:
 * 1. Opens the file and gets sheet names
 * 2. Shows sheet selection dialog if multiple sheets exist
 * 3. Parses the selected sheet
 * 4. Extracts data and calls the update callback
 *
 * This function handles the entire parsing flow with proper error handling
 * and user feedback through loading indicators and toast messages.
 *
 * @param {BaseTemplate} template - BaseTemplate instance to handle parsing
 * @param {File} excelFile - Excel file to parse
 * @param {(list: any[]) => void} [onUpdate] - Optional callback invoked when data is extracted
 * @returns {Promise<void>} Promise that resolves when parsing is complete
 *
 * @throws {Error} If file cannot be parsed, sheet is invalid, or data extraction fails
 *
 * @example
 * ```typescript
 * const handleFileUpload = async (file: File) => {
 *   try {
 *     await parseExcelFile(template, file, (parsedData) => {
 *       console.log('Parsed', parsedData.length, 'records');
 *       list = parsedData;
 *     });
 *   } catch (error) {
 *     console.error('Upload failed:', error);
 *   }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // With state management
 * await parseExcelFile(template, file, (newList) => {
 *   list = newList;
 *   status = newList.length > 0 ? 'ready' : 'empty';
 * });
 * ```
 */
export const parseExcelFile = async (
    template: BaseTemplate,
    excelFile: File,
    onUpdate?: (list: any[]) => void
): Promise<void> => {
    if (!excelFile) return;

    const sheetNames = await openExcelFile(template, excelFile);
    let sheetName: string | null = sheetNames[0];

    if (sheetNames.length > 1) {
        sheetName = await showSheetChooseDialog(sheetNames);
    }

    if (sheetName) {
        window.Indicator.show(i18nRes.parsing.toString());
        try {
            await template.parseSheet(sheetName);
            const list = template.list;
            onUpdate?.(list);
        } catch (ex) {
            console.error('Parse file error:', ex);
            window.Toast.show(i18nUtils.formatText(i18nRes.parseFailure, {name: excelFile.name}));
            throw ex;
        } finally {
            window.Indicator.hide();
        }
    }
};

/**
 * Create file choose button action for wizard components
 *
 * @description
 * Creates a standardized button action configuration for opening file selection dialogs.
 * Uses a lazy getter function to access the file input element, avoiding initialization
 * order issues.
 *
 * The button handler:
 * 1. Clears any previous file selection
 * 2. Triggers the native file picker dialog
 *
 * @param {() => HTMLInputElement} getUploadField - Function that returns the file input element reference
 * @returns {ButtonAction} Button action configuration object
 * @returns {string} returns.label - Button label text
 * @returns {'primary'} returns.type - Button type
 * @returns {Function} returns.handler - Click event handler
 *
 * @example
 * ```typescript
 * let uploadField: HTMLInputElement;
 *
 * // Create button using a getter function
 * const btnChoose = createChooseButton(() => uploadField);
 *
 * // Use in action bar
 * const actions: ButtonActions = [btnChoose];
 * ```
 *
 * @example
 * ```svelte
 * <script>
 *   import { createChooseButton } from './wizardUtils';
 *
 *   let uploadField: HTMLInputElement;
 *   const btnChoose = createChooseButton(() => uploadField);
 * </script>
 *
 * <input type="file" bind:this={uploadField} style="display:none">
 * <button on:click={btnChoose.handler}>Choose File</button>
 * ```
 */
export const createChooseButton = (getUploadField: () => HTMLInputElement): ButtonAction => ({
    label: i18nRes.button.open,
    type: 'primary' as const,
    handler: async () => {
        const uploadField = getUploadField();
        uploadField.value = '';
        uploadField.click();
    }
});

/**
 * File input accept attribute value for Excel files
 *
 * @description
 * Standard HTML accept attribute string for Excel file inputs.
 * Supports both legacy (.xls) and modern (.xlsx) Excel formats,
 * as well as their MIME types.
 *
 * @constant {string}
 * @default ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
 *
 * @example
 * ```svelte
 * <input
 *   type="file"
 *   accept={FILE_ACCEPT}
 *   on:change={handleFileChange}
 * />
 * ```
 *
 * @example
 * ```typescript
 * import { FILE_ACCEPT } from './wizardUtils';
 *
 * const fileInput = document.createElement('input');
 * fileInput.type = 'file';
 * fileInput.accept = FILE_ACCEPT;
 * ```
 */
export const FILE_ACCEPT = ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";