<script lang="ts">
    import  DialogBoard  from "@ticatec/uniface-element/DialogBoard";
    import IndicatorBoard from "@ticatec/uniface-element/IndicatorBoard";
    import MessageBoxBoard from "@ticatec/uniface-element/MessageBoxBoard";
    import ToastBoard from "@ticatec/uniface-element/ToastBoard";
    import Button from "@ticatec/uniface-element/Button";
    import {onMount} from "svelte";
    import FileUploadWizard from "$lib";
    import EmployeesTemplate from "./EmployeesTemplate";
    import ProductTemplate from "./ProductTemplate";
    import EncodingWizard from "$lib/EncodingWizard.svelte";
    import {RoutePriceTemplate} from "./RoutePriceTemplate";

    // Schema-based classes
    import SchemaUploadTemplate from "$lib/SchemaUploadTemplate";
    import SchemaEncodingTemplate from "$lib/SchemaEncodingTemplate";
    import employeeSheetSchema from "./EmployeeSheetSchema";
    import productSheetSchema from "./ProductSheetSchema";

    const uploadData = () => {
        let template = new RoutePriceTemplate([45, 100, 300, 500, 1000]);
        window.Dialog.showModal(FileUploadWizard, {template, width: "1240px",  title: '批量上传员工'})
    }

    const loadData = () => {
        let template = new ProductTemplate();
        window.Dialog.showModal(EncodingWizard, {template, width: "1240px",  title: '批量新增产品', confirmCallback: (list: any) => {console.log('解析数据', list); return true}})
    }

    // Test Schema-based templates using inheritance
    const testEmployeeSchemaUpload = () => {
        const template = new EmployeeSchemaTemplate();
        window.Dialog.showModal(FileUploadWizard, {
            template,
            width: "1240px",
            title: '批量上传员工 (Schema继承版)'
        });
    }

    const testProductSchemaEncoding = () => {
        const template = new ProductSchemaTemplate();
        window.Dialog.showModal(EncodingWizard, {
            template,
            width: "1240px",
            title: '批量新增产品 (Schema继承版)',
            confirmCallback: (list: any) => {
                console.log('解析数据 (Schema)', list);
                return true;
            }
        });
    }

    // Test Schema-based templates directly (without inheritance)
    const testSchemaUploadDirect = () => {
        const template = new SchemaUploadTemplate(
            employeeSheetSchema,
            async (rows) => {
                console.log("直接使用 SchemaUploadTemplate 上传", rows);
                return new Promise((resolve) => {
                    const list = rows.map(() => ({}));
                    for (let i = 0; i < rows.length; i++) {
                        const code = Math.round(Math.random() * 1000);
                        if (code > 800) {
                            list[i].error = code;
                        }
                    }
                    setTimeout(() => resolve(list), 1000);
                });
            }
        );
        window.Dialog.showModal(FileUploadWizard, {
            template,
            width: "1240px",
            title: 'Schema上传 (直接使用)'
        });
    }

    const testSchemaEncodingDirect = () => {
        const template = new SchemaEncodingTemplate(
            productSheetSchema,
            // encodeFunction
            async (rows) => {
                return new Promise((resolve) => {
                    const list = rows.map(item => {
                        const tmp = JSON.parse(JSON.stringify(item));
                        if (Math.random() > 0.1) {
                            tmp.code = ((new Date()).getTime() * 10000 + Math.floor(Math.random() * 10000)).toString(36);
                        }
                        return tmp;
                    });
                    setTimeout(() => resolve(list), 1000);
                });
            },
            // validateFunction
            (row) => ({ valid: true })
        );
        window.Dialog.showModal(EncodingWizard, {
            template,
            width: "1240px",
            title: 'Schema编码 (直接使用)',
            confirmCallback: (list: any) => {
                console.log('解析数据', list);
                return true;
            }
        });
    }

    onMount(async () => {

    })

</script>

<div style="width: 100%; height: 100%; box-sizing: border-box">
    <div style="padding: 20px; display: flex; flex-direction: column; gap: 20px;">
        <div>
            <h3>传统模板测试</h3>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <Button label="上传" type="primary" onclick={uploadData}/>
                <Button label="读取产品" type="primary" onclick={loadData}/>
            </div>
        </div>

        <div>
            <h3>Schema模板测试（继承方式）</h3>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <Button label="员工上传 (Schema继承)" type="success" onclick={testEmployeeSchemaUpload}/>
                <Button label="产品编码 (Schema继承)" type="success" onclick={testProductSchemaEncoding}/>
            </div>
        </div>

        <div>
            <h3>Schema模板测试（直接使用）</h3>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <Button label="Schema上传 (直接)" type="warning" onclick={testSchemaUploadDirect}/>
                <Button label="Schema编码 (直接)" type="warning" onclick={testSchemaEncodingDirect}/>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 5px;">
                无需继承类，直接通过构造函数传入处理函数
            </p>
        </div>
    </div>
</div>
<DialogBoard></DialogBoard>
<IndicatorBoard></IndicatorBoard>
<ToastBoard></ToastBoard>
<MessageBoxBoard></MessageBoxBoard>