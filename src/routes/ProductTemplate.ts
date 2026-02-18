import BaseEncodingTemplate, { type ValidationResult } from "$lib/BaseEncodingTemplate";
import type DataColumn from "$lib/DataColumn";

let columns: Array<DataColumn> = [
    {
        field: 'merchantName',
        text: '商户名称',
        width: 20,
        visible: false
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
        parser: (text: string) => text == '是' || text.toLowerCase().trim() == 'yes' || text.toLowerCase().trim() == 'y',
        align: "center"
    },
    {
        field: 'expiryTracking',
        text: '有效期管理',
        width: 80,
        align: "center",
        parser: (text: string) => text == '是' || text.toLowerCase().trim() == 'yes' || text.toLowerCase().trim() == 'y',
        formatter: (value) => value ? 'Yes' : 'No'
    }
]

export default class ProductTemplate extends BaseEncodingTemplate {
    protected validateData(row: any): ValidationResult | Promise<ValidationResult> {
        throw new Error("Method not implemented.");
    }

    constructor() {
        super(columns);
    }

    protected isDataValid(row: any): boolean {
        return row.code != null;
    }
    protected encodeData(rows: Array<any>): Promise<Array<any>> {
        return new Promise((resolve) => {
            let list = rows.map(item=> {
                let tmp = JSON.parse(JSON.stringify(item));
                if (Math.random() > 0.1) {
                    tmp.code = ((new Date()).getTime() * 10000 + Math.floor(Math.random() * 10000)).toString(36);
                }
                return tmp;
            });
            setTimeout(()=> {resolve(list)}, 1000);
        })
    }

    get valid(): boolean {
        return this._list.filter(item=>item.code==null).length == 0;
    }

}