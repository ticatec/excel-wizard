
import appUtils from "./appUtils";
import type DataColumn from "$lib/DataColumn";
import BaseUploadTemplate from "$lib/BaseUploadTemplate";



const getColumns = (breaks: Array<number>): Array<DataColumn> => {
    let breakCols: Array<DataColumn> = [];
    for (let bk of breaks) {
        breakCols.push({
            setValue: (data: any, value: any) => {
                data.weightBreaks = [...(data.weightBreaks??[]), {weight: bk, rate: value}]
            },
            field: 'weightBreaks',
            text: `+${bk}KG`,
            formatter: (data: any) => {
                let item = data?.find((item: any) => item.weight == bk);
                return appUtils.formatCurrencyAmount(item?.rate, '')
            },
            align: "right",
            width: 80
        })
    }
    return [
        {
            field: "transitAirportsCode",
            text: '中转机场',
            width: 120,
            align: "center"
        },
        {
            field: "destAirportCode",
            text: '目的起机场',
            width: 90,
            align: "center"
        },
        {
            field: "minimumCharge",
            text: '起运价格',
            width: 90,
            align: "right"
        },
        {
            field: "normalRate",
            text: '单价',
            width: 90,
            align: "right"
        },
        ...breakCols,
        {
            field: "inquiryRemark",
            text: '询价备注',
            width: 120,
            resizable: true
        },
        {
            field: "priceRemark",
            text: '报价备注',
            width: 120,
            resizable: true
        },
        {
            field: "note",
            text: '备注',
            width: 240,
            resizable: true
        }
    ]
}

export class RoutePriceTemplate extends BaseUploadTemplate {

    private readonly breaks: Array<number>;
    private generateDensityRatesCommand?: string;


    constructor( breaks: Array<number>) {
        super(10);
        this.breaks = breaks;
    }

    protected getRowOffset(): number {
        return 2;
    }

    protected getMetaColumns(): Array<DataColumn> {
        return getColumns(this.breaks);
    }

    protected extractFormAttributes() {
        this.generateDensityRatesCommand = this.getCellValue(0, 3);
        console.log("设置泡重比价格", this.generateDensityRatesCommand);
    }

    protected async uploadData(rows: Array<any>): Promise<Array<any>> {
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



    protected calculateDensityRates(list: Array<any>) {
        const result: Array<any> = [];
        const densities = [200, 250, 300, 120, 100];
        densities.forEach(d => {
            const breaks: Array<any> = [];
            list.forEach(item => {
                if (item.weight >= 100) {
                    if (d > 167 && d <= 300) {
                        const baseRate = list.find(x => x.weight === item.weight)?.rate;
                        if (baseRate != null) {
                            if (d === 200) breaks.push({
                                weight: item.weight,
                                rate: baseRate - 1
                            }); else if (d === 250) breaks.push({
                                weight: item.weight,
                                rate: baseRate - 2
                            }); else if (d === 300) breaks.push({weight: item.weight, rate: baseRate - 3});
                        }
                    } else if (d <= 167) {
                        const baseRate = list.find(x => x.weight === item.weight)?.rate;
                        if (baseRate != null) {
                            if (d === 120) breaks.push({
                                weight: item.weight,
                                rate: baseRate - 1
                            }); else if (d === 100) breaks.push({weight: item.weight, rate: baseRate - 2});
                        }
                    }
                }
            });
            if (breaks.length) result.push({density: d, breaks});
        });
        return result;
    }

    protected async consolidateData(rows: Array<any>): Promise<Array<any>> {
        for (let row of rows) {
            row.data.densityRates = this.calculateDensityRates(row.data.weightBreaks??[]);
        }
        console.log('计算泡重比后的价格', rows);
        return rows;
    }
}