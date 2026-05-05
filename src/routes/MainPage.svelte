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
    import SchemaUploadTemplate from "$lib/schema/SchemaUploadTemplate";
    import SchemaEncodingTemplate from "$lib/schema/SchemaEncodingTemplate";
    import employeeSheetSchema from "./EmployeeSheetSchema";
    import productSheetSchema from "./ProductSheetSchema";
    import EmployeeSchemaTemplate from "./EmployeeSchemaTemplate";
    import ProductSchemaTemplate from "./ProductSchemaTemplate";

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

    // Note: Direct instantiation is no longer supported.
    // SchemaUploadTemplate and SchemaEncodingTemplate are now abstract classes.
    // Please use inheritance (see EmployeeSchemaTemplate and ProductSchemaTemplate).

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
            <h3>Schema模板说明</h3>
            <p style="color: #666; font-size: 14px; margin-top: 10px; line-height: 1.6;">
                SchemaUploadTemplate 和 SchemaEncodingTemplate 现在是抽象类，需要通过继承来实现。
                请参考 EmployeeSchemaTemplate 和 ProductSchemaTemplate 的实现方式。
            </p>
        </div>
    </div>
</div>
<DialogBoard></DialogBoard>
<IndicatorBoard></IndicatorBoard>
<ToastBoard></ToastBoard>
<MessageBoxBoard></MessageBoxBoard>