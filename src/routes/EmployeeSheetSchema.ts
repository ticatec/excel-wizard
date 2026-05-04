import type {SheetSchema} from "$lib/schema/SheetSchema";

/**
 * Schema for employee batch upload
 */
const employeeSheetSchema: SheetSchema = {
    headerRowNum: 0,
    dataRowNum: 1,
    columns: [
        {
            field: 'merchantName',
            text: '商户名称',
            width: 150,
            ignore: true  // Don't upload this field
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
            align: 'right'
        },
        {
            field: 'length',
            text: '长(CM)',
            width: 75,
            align: 'right'
        },
        {
            field: 'width',
            text: '宽(CM)',
            width: 75,
            align: 'right'
        },
        {
            field: 'height',
            text: '高(CM)',
            width: 75,
            align: 'right'
        },
        {
            field: 'batchTracking',
            text: '批次管理',
            width: 80,
            align: 'center'
        },
        {
            field: 'expiryTracking',
            text: '有效期管理',
            width: 80,
            align: 'center'
        }
    ]
};

export default employeeSheetSchema;