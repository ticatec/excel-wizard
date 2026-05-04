
import dayjs from "dayjs";


/**
 *
 * @param format
 */
const formatDate = (format: string = 'YYYY-MM-DD') => (value: string) => {
    return value == null ? '' : dayjs(value).format(format)
}




const formatCurrencyAmount = (value: any, nullText: string = '') => {
    if (value == null) {
        return nullText;
    } else if (isNaN(value)) {
        return nullText;
    } else {
        return parseFloat(value).toFixed(2);
    }
}

const formatText = (template: string, params: any): string => {
    return template.replace(/{{\s*([^}]+)\s*}}/g, (_, path) => {
        const keys = path.split('.');
        let value = params??{};
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return 'Missing'; // 找不到对应值就返回空字符串
            }
        }
        return String(value);
    });
}



export default {
    formatDate,
    formatText,
    formatCurrencyAmount
}