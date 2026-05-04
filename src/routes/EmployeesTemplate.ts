import type DataColumn from "$lib/DataColumn";
import BaseUploadTemplate, {type UploadFun} from "$lib/BaseUploadTemplate";


let columns: Array<DataColumn> = [
    {
        field: 'merchantName',
        text: '商户名称',
        width: 20,
        visible: false
    },
    {
        field: 'code',
        text: '商品编码',
        width: 120,
        resizable: true
    },
    {
        field: 'barcode',
        text: 'SKU',
        width: 180
    },
    {
        field: 'name',
        text: '商品名称',
        width: 240,
        resizable: true
    },
    {
        field: 'weight',
        text: '商品毛重(KG)',
        width: 100,
        align: "right"
    },
    {
        field: 'length',
        text: '长(CM)',
        width: 75,
        align: "right"
    },
    {
        field: 'width',
        text: '宽(CM)',
        width: 75,
        align: "right"
    },
    {
        field: 'height',
        text: '高(CM)',
        width: 75,
        align: "right"
    },
    {
        field: 'batchTracking',
        text: '批次管理',
        width: 80,
        //parser: (text: string) => text != null &&  (text == '是' || text.toLowerCase().trim() == 'yes' || text.toLowerCase().trim() == 'y'),
        align: "center"
    },
    {
        field: 'expiryTracking',
        text: '有效期管理',
        width: 80,
        align: "center",
        //parser: (text: string) => text != null && (text == '是' || text.toLowerCase().trim() == 'yes' || text.toLowerCase().trim() == 'y')
    }
]
export default class EmployeesTemplate extends BaseUploadTemplate {
    protected uploadData(rows: Array<any>): Promise<Array<any>> {
        console.log("开始上传数据", rows);
        return new Promise((resolve) => {
            let list: Array<any> = rows.map(item => ({}));
            for (let i = 0; i < rows.length; i++) {
                let code = Math.round(Math.random() * 1000)
                if (code > 800) {
                    list[i].error = code
                }
            }
            setTimeout(() => {
                resolve(list)
            }, 1000)
        });

    }

    protected getMetaColumns(): Array<DataColumn> {
        return columns;
    }

    constructor(batchSize: number = 50) {
        super(batchSize);
    }

}