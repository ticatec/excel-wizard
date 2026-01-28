import {i18nUtils} from "@ticatec/i18n";

const langRes = {
    batchUploading: {
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
        errorTitle: "Error",
        sheetName: "Abnormal data",
        labelStatus: "Status",
        labelValid: "Validity",
        textValid: "Yes",
        textInvalid: "No",
        labelHint: "Hint"
    }
}

const i18nRes = i18nUtils.createResourceProxy(langRes, 'omni');

export default i18nRes;