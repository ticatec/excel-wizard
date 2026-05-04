import {i18nUtils} from "@ticatec/i18n";

const langRes = {
    status: {
        pending: "To upload",
        uploading: "Uploading...",
        successful: "Success",
        fail: "Failure"
    },
    parsing: "Parsing file...",
    parseFailure: "Cannot parse file: {{name}}",
    waitUploading: "Cannot exit during uploading!",
    button: {
        upload: "Upload",
        save: "Save error data",
        open: "Open",
        confirm: "Confirm"
    },
    titleChooseSheet: 'Choose a sheet',
    errorTitle: "Error",
    sheetName: "Abnormal data",
    labelStatus: "Status",
    labelValid: "Validity",
    textValid: "Yes",
    textInvalid: "No",
    labelHint: "Hint",
    uploadStatText: "Total: {{total}}, Success: {{success}}, Failed: {{failed}}",
    buttonExportException: "Error report",
    buttonExportFull: "Full report",
    buttonReset: "Reset"
}

const i18nRes = i18nUtils.createResourceProxy(langRes, 'batchUploading');

export default i18nRes;