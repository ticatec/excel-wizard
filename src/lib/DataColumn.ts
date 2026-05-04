import type {DataColumn as TableColumn} from "@ticatec/uniface-element/DataTable";

export type ParserText = (text: string) => any;

export type SetAttributeValue = (data: string, value: any) => void;

export default interface DataColumn extends TableColumn {

    /**
     * 对应的字段
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

    /**
     * 手工设定值
     */
    setValue?: SetAttributeValue;

}