import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";

export type ParserText = (text: string) => any;

export default interface DataColumn extends TableColumn {

    /**
     * 字段名
     */
    field: string;

    /**
     * 是否忽略，上传的时候不采用，仅用于前台显示
     */
    ignore?: boolean;

    /**
     * 解析函数
     */
    parser?: ParserText;

    /**
     * 伪列，不解析，仅用于回显
     */
    dummy?: boolean;

}