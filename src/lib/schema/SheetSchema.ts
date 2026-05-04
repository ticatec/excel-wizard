export interface OptionsList {

    list: Array<Record<string, string>>;

    keyName?: string;

    textName?: string;

}

export interface ColumnSchema {
    /**
     * 对应的字段
     */
    field: string;

    /**
     * 是否忽略，上传的时候不采用，仅用于前台显示
     */
    ignore?: boolean;

    /**
     * 伪列，不解析，仅用于回显
     */
    dummy?: boolean;

    /**
     * 列标题文本
     */
    text: string;

    /**
     * 对齐方式
     */
    align?: 'left' | 'center' | 'right';

    /**
     * 列宽度
     */
    width: number;

    /**
     * 最小列宽度
     */
    minWidth?: number;

    /**
     * 是否可以换行，默认为false
     */
    wrap?: boolean;

    /**
     * 是否可调整大小
     */
    resizable?: boolean;

    /**
     * 关联的选项列表名称（在 SheetSchema.options 中定义）
     * 用于文本到key值的转换和下拉列表生成
     */
    optionsName?: string;

    /**
     * 自定义解析函数（可选）
     * 如果提供了此函数，将覆盖默认的 options 转换逻辑
     */
    parser?: (value: any) => any;
}

export type CellValueType = "string" | "number" | "boolean" | "date" | "datetime";

export interface AttributesSchema {
    /**
     * 属性值所在的列索引（0-based）
     */
    col: number;

    /**
     * 属性值所在的行索引（0-based）
     */
    row: number;

    /**
     * 属性标签文本所在的列索引（0-based）
     * 如果未指定，使用 labelText 作为标签
     */
    labelCol?: number;

    /**
     * 属性标签文本所在的行索引（0-based）
     * 如果未指定，使用 labelText 作为标签
     */
    labelRow?: number;

    /**
     * 固定的属性标签文本
     * 如果 labelCol 和 labelRow 都未指定，使用此文本作为标签
     */
    labelText?: string;

    /**
     * 属性值类型，用于类型转换
     */
    type?: CellValueType;

    /**
     * 属性值的列跨度（仅用于导出）
     * 从 col 开始，跨越的列数（>=1）
     * 例如：colSpan=3 表示合并 col, col+1, col+2 三列
     */
    colSpan?: number;

    /**
     * 属性值的行跨度（仅用于导出）
     * 从 row 开始，跨越的行数（>=1）
     * 例如：rowSpan=2 表示合并 row, row+1 两行
     */
    rowSpan?: number;
}

export interface SheetSchema {
    /**
     * 选项列表字典
     * Key 是 optionsName，Value 是选项列表定义
     * 用于列的下拉验证和文本-key转换
     */
    options?: Record<string, OptionsList>;

    /**
     * 表头行号（0-based）
     * 例如：表头在第1行，值为 0
     */
    headerRowNum: number;

    /**
     * 数据开始行号（0-based）
     * 例如：数据从第2行开始，值为 1
     */
    dataRowNum: number;

    /**
     * 列定义数组
     */
    columns: ColumnSchema[];

    /**
     * Sheet级别的属性定义
     * Key 是属性名称，Value 是属性在表格中的位置信息
     */
    attributes?: Record<string, AttributesSchema>;
}