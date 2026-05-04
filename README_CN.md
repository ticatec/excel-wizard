# Excel Wizard - Excel 数据处理向导

[English Document](./README.md)

# @ticatec/excel-wizard

一个基于 Schema 驱动的 Svelte 组件库，提供向导式界面进行 Excel 批量数据处理。支持 Excel 文件解析、验证、编码和带下拉选项的模板生成。

---

## ✨ 功能特色

### 核心功能
- 📂 **拖拽上传** - 直观的 `.xlsx` 文件上传界面
- 🧠 **客户端解析** - 本地 Excel 数据处理，无需服务器预处理
- 📝 **数据预览** - 实时预览，高亮显示验证错误
- 🎯 **批量处理** - 可配置批量大小，带进度跟踪
- 📤 **错误导出** - 导出失败行用于重新上传，支持自定义格式
- 🌐 **国际化支持** - 内置中英文语言支持
- 🔌 **UI 集成** - 与 `@ticatec/uniface-element` 样式无缝集成

### Schema 驱动功能（新特性！）
- 🎨 **声明式 Schema** - 使用 TypeScript 接口定义 Excel 结构
- 🔄 **自动字段映射** - 从 Excel 表头动态映射列
- 📋 **模板生成** - 生成带下拉验证的 Excel 模板
- 🔀 **选项转换** - 下拉字段的文本 ↔ 键值自动转换
- 📊 **属性提取** - 从指定单元格提取工作表级元数据

---

## 📦 安装

```bash
# 核心包（包含 xlsx 用于解析）
npm install @ticatec/excel-wizard xlsx

# 可选：用于生成带下拉验证的模板
npm install exceljs
```

---

## 📁 项目结构

### 组件

| 文件 | 描述 |
|------|------|
| `FileUploadWizard.svelte` | 上传向导，支持拖拽、验证和批量上传 |
| `EncodingWizard.svelte` | 字段映射向导，用于动态 Excel 列映射 |
| `SheetPickupDialog.svelte` | Sheet 选择对话框（多工作表时使用） |
| `SheetNameViewRender.svelte` | Sheet 名称渲染组件 |

### 基类（传统方式）

| 文件 | 描述 |
|------|------|
| `BaseTemplate.ts` | 抽象基类，封装 Excel 解析和列定义 |
| `BaseUploadTemplate.ts` | 上传模板，用于验证、预处理和批量上传 |
| `BaseEncodingTemplate.ts` | 编码模板，用于动态字段映射和转换 |

### Schema 基类（新特性！推荐）

| 文件 | 描述 |
|------|------|
| `SchemaUploadTemplate.ts` | 基于 SheetSchema 的具体上传类（无需继承） |
| `SchemaEncodingTemplate.ts` | 基于 SheetSchema 的具体编码类（无需继承） |
| `SchemaExporter.ts` | 生成带下拉验证的 Excel 模板 |
| `schema/SheetSchema.ts` | Schema 定义的 TypeScript 接口 |

### 工具类

| 文件 | 描述 |
|------|------|
| `schemaUtils.ts` | Schema 操作工具（SchemaHelper 类） |
| `excelUtils.ts` | Excel 单元格地址编码/解码工具 |
| `DataColumn.ts` | 列结构接口，支持解析选项 |
| `ProcessStatus.ts` | 上传流程状态枚举（初始化、待上传、上传中、已完成） |
| `config.ts` | 配置常量（批量大小、延迟、Excel 日期） |
| `wizardUtils.ts` | 向导工具函数（文件解析、对话框辅助） |
| `i18n_res` | 多语言资源（中英文） |

---

## 🚀 快速开始

### 方式一：Schema 方式（推荐）

Schema 方式无需继承，只需定义 Schema 并将函数传递给构造函数。

#### 1. 定义 Schema

```typescript
// productSheetSchema.ts
import type {SheetSchema} from '@ticatec/excel-wizard';

const productSheetSchema: SheetSchema = {
    headerRowNum: 0,      // 表头在第1行（0开始索引）
    dataRowNum: 1,        // 数据从第2行开始（0开始索引）
    columns: [
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
            field: 'category',
            text: '分类',
            width: 120,
            optionsName: 'categories'  // 引用下面的选项
        }
    ],
    options: {
        categories: {
            list: [
                {code: 'ELEC', text: '电子产品'},
                {code: 'CLOT', text: '服装'},
                {code: 'FOOD', text: '食品'}
            ],
            keyName: 'code',
            textName: 'text'
        }
    }
};

export default productSheetSchema;
```

#### 2. 使用 SchemaUploadTemplate 进行数据上传

```typescript
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// 创建模板实例 - 无需继承！
const uploadTemplate = new SchemaUploadTemplate(
    productSheetSchema,
    // 上传函数
    async (rows) => {
        const results = await fetch('/api/products/upload', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(rows)
        });
        return results.json();
    },
    // 可选：自定义批量大小
    50  // 默认为 50
);

// 与 FileUploadWizard 配合使用
import {FileUploadWizard} from '@ticatec/excel-wizard';

window.Dialog.showModal(FileUploadWizard, {
    template: uploadTemplate,
    width: '1240px',
    title: '上传产品'
});
```

#### 3. 使用 SchemaEncodingTemplate 进行数据编码

```typescript
import {SchemaEncodingTemplate} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// 创建模板实例 - 无需继承！
const encodingTemplate = new SchemaEncodingTemplate(
    productSheetSchema,
    // 编码函数
    async (rows) => {
        const response = await fetch('/api/products/encode', {
            method: 'POST',
            body: JSON.stringify(rows)
        });
        return response.json();
    },
    // 可选：验证函数
    (row) => {
        if (!row.barcode) {
            return {
                valid: false,
                hint: 'SKU 不能为空'
            };
        }
        return {valid: true};
    }
);

// 与 EncodingWizard 配合使用
import {EncodingWizard} from '@ticatec/excel-wizard';

window.Dialog.showModal(EncodingWizard, {
    template: encodingTemplate,
    width: '1240px',
    title: '导入产品',
    confirmCallback: (list) => {
        console.log('处理后的数据：', list);
        return true;
    }
});
```

#### 4. 生成带下拉选项的 Excel 模板

```typescript
import {SchemaExporter} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// 创建导出器
const exporter = new SchemaExporter(productSheetSchema);

// 生成并下载模板
await exporter.downloadTemplate('product-template');

// 或带示例数据
await exporter.downloadTemplate('product-template', [
    {barcode: 'SKU001', name: '产品1', category: 'ELEC'},
    {barcode: 'SKU002', name: '产品2', category: 'CLOT'}
]);
```

这将生成一个 Excel 文件，包含：
- ✅ 预定义的表头
- ✅ 正确的列宽
- ✅ "分类"列的下拉验证
- ✅ 示例数据（如果提供）

### 方式二：传统方式（基于继承）

对于高级定制，可以继承基类：

```typescript
import BaseUploadTemplate from '@ticatec/excel-wizard/BaseUploadTemplate';
import type DataColumn from '@ticatec/excel-wizard/DataColumn';
import {BATCH_CONFIG} from '@ticatec/excel-wizard';

class MyUploadTemplate extends BaseUploadTemplate {
    constructor() {
        super(BATCH_CONFIG.DEFAULT_BATCH_SIZE);
    }

    protected getMetaColumns(): Array<DataColumn> {
        return [
            {
                field: 'name',
                text: '姓名',
                width: 150,
                parser: (value) => String(value).trim()
            },
            {
                field: 'email',
                text: '邮箱',
                width: 200
            }
        ];
    }

    protected async uploadData(list: Array<any>): Promise<Array<any>> {
        const results = await fetch('/api/upload', {
            method: 'POST',
            body: JSON.stringify(list)
        });
        return results.json();
    }
}
```

---

## 📚 API 参考

### Schema 类型

#### SheetSchema

```typescript
interface SheetSchema {
    // 下拉选项
    options?: Record<string, OptionsList>;

    // 表头行号（0开始索引）
    headerRowNum: number;

    // 数据开始行号（0开始索引）
    dataRowNum: number;

    // 列定义
    columns: ColumnSchema[];

    // 工作表级属性提取（可选）
    attributes?: Record<string, AttributesSchema>;
}
```

#### ColumnSchema

```typescript
interface ColumnSchema {
    field: string;              // 数据字段名
    text: string;               // 列标题文本
    width: number;              // 列宽（像素）
    minWidth?: number;          // 最小宽度
    align?: 'left' | 'center' | 'right';  // 对齐方式
    resizable?: boolean;        // 是否可调整大小
    wrap?: boolean;             // 是否允许换行
    optionsName?: string;       // 下拉选项名称
    parser?: (value: any) => any;  // 自定义解析器
    ignore?: boolean;           // 上传时忽略此字段
    dummy?: boolean;            // 虚拟列，仅用于显示
}
```

#### OptionsList

```typescript
interface OptionsList {
    list: Array<Record<string, string>>;
    keyName?: string;   // 默认：'code'
    textName?: string;  // 默认：'text'
}
```

#### AttributesSchema

```typescript
interface AttributesSchema {
    col: number;          // 列索引（0开始）
    row: number;          // 行索引（0开始）
    labelCol?: number;    // 标签列位置
    labelRow?: number;    // 标签行位置
    labelText?: string;   // 固定标签文本
    type?: CellValueType; // 值类型，用于类型转换

    // 单元格合并（仅用于导出）
    colSpan?: number;     // 列跨度（>=1），例如 3 表示合并 col, col+1, col+2 三列
    rowSpan?: number;     // 行跨度（>=1），例如 2 表示合并 row, row+1 两行
}
```

### 核心类

#### SchemaUploadTemplate

```typescript
class SchemaUploadTemplate extends BaseUploadTemplate {
    constructor(
        schema: SheetSchema,
        uploadFunction: SchemaUploadFun,
        batchSize?: number
    )

    // 获取提取的属性
    getAttributes(): Record<string, any>
    getAttribute(name: string): any
}
```

**SchemaUploadFun 类型：**
```typescript
type SchemaUploadFun = (rows: Array<any>) => Promise<Array<any>>;
```

#### SchemaEncodingTemplate

```typescript
class SchemaEncodingTemplate extends BaseEncodingTemplate {
    constructor(
        schema: SheetSchema,
        encodeFunction: SchemaEncodeFun,
        validateFunction?: SchemaValidateFun
    )

    // 获取列映射（表头文本 -> 字段名）
    getColumnMapping(): Map<string, string>
    getFieldName(headerText: string): string | undefined
    hasMapping(headerText: string): boolean

    // 获取提取的属性
    getAttributes(): Record<string, any>
    getAttribute(name: string): any
}
```

**SchemaEncodeFun 类型：**
```typescript
type SchemaEncodeFun = (rows: Array<any>) => Promise<Array<any>>;
```

**SchemaValidateFun 类型：**
```typescript
type SchemaValidateFun = (row: any) => ValidationResult | Promise<ValidationResult>;

interface ValidationResult {
    valid: boolean;
    hint?: string;
    error?: string;
}
```

#### SchemaExporter

```typescript
class SchemaExporter {
    constructor(schema: SheetSchema)

    // 生成并下载模板
    async downloadTemplate(
        filename?: string,
        sampleData?: Array<any>
    ): Promise<void>

    // 获取列的下拉选项
    getDropdownOptions(optionsName: string): string[]

    // 转换文本为键值
    textToKey(text: string, optionsName: string): string | undefined
}
```

---

## 🔧 高级功能

### 错误导出选项

```typescript
// 仅导出失败行（用于重新上传）
template.exportErrorsForReupload('failed-data.xlsx');

// 导出完整报告（包含所有数据和错误详情）
template.exportFullReport('upload-report.xlsx');

// 自定义导出选项
template.exportErrorData('custom-export.xlsx', {
    includeAllData: true,      // 包含成功的行
    separateSheets: true,      // 分离详情工作表
    originalFormat: true       // 保持导入格式
});
```

### 配置

```typescript
import {BATCH_CONFIG, EXCEL_DATE} from '@ticatec/excel-wizard';

// 批量处理配置
BATCH_CONFIG.DEFAULT_BATCH_SIZE  // 默认值：50
BATCH_CONFIG.MIN_BATCH_SIZE      // 最小值：1
BATCH_CONFIG.BATCH_DELAY_MS      // 批次间延迟：100ms

// Excel 日期转换
EXCEL_DATE.EPOCH                 // Excel 纪元：25569
EXCEL_DATE.MS_PER_DAY            // 每天毫秒数：86400000
```

### Schema 工具

```typescript
import {SchemaHelper} from '@ticatec/excel-wizard';

const helper = new SchemaHelper(schema);

// 属性提取
helper.extractAttributes(workbook, sheetName);
helper.getAttributes();
helper.getAttribute('batchId');

// 选项转换
helper.textToKey('电子产品', 'categories');  // 返回：'ELEC'
helper.keyToText('ELEC', 'categories');      // 返回：'电子产品'

// 创建解析器函数
const parser = helper.createOptionsParser('categories');
parser('电子产品');  // 返回：'ELEC'
```

### Sheet 级别属性

从特定单元格提取元数据，这些数据应用于工作表中的所有行（例如：批次ID、部门、日期）。

#### 在 Schema 中定义属性

```typescript
// orderSheetSchema.ts
import type {SheetSchema} from '@ticatec/excel-wizard';

const orderSheetSchema: SheetSchema = {
    headerRowNum: 2,
    dataRowNum: 3,
    columns: [
        {field: 'productId', text: '产品编号', width: 120},
        {field: 'quantity', text: '数量', width: 100}
    ],
    // 定义工作表级别的属性
    attributes: {
        // 批次ID在单元格 B1（列1，行0）
        batchId: {
            col: 1,
            row: 0,
            labelCol: 0,    // 标签在 A1
            labelRow: 0,
            type: 'string'
        },
        // 部门在单元格 B2
        department: {
            col: 1,
            row: 1,
            labelText: '部门',  // 使用固定标签文本
            type: 'string'
        },
        // 订单日期在单元格 D1
        orderDate: {
            col: 3,
            row: 0,
            labelText: '订单日期',
            type: 'date'
        }
    }
};
```

#### Excel 布局示例

```
     A           B           C           D
1   批次号：     2024-BATCH-001           订单日期：    2024-01-15
2   部门：       销售部
3
4   产品编号     数量
5   PROD001     100
6   PROD002     200
```

#### 使用提取的属性

```typescript
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';

const uploadTemplate = new SchemaUploadTemplate(
    orderSheetSchema,
    async (rows) => {
        // 获取所有提取的属性
        const attributes = template.getAttributes();
        console.log(attributes);
        // 输出：{batchId: '2024-BATCH-001', department: '销售部', orderDate: '2024-01-15'}

        // 获取特定属性
        const batchId = template.getAttribute('batchId');
        console.log('批次号：', batchId);  // '2024-BATCH-001'

        // 上传时包含属性
        const response = await fetch('/api/orders/upload', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                batchId,
                department: template.getAttribute('department'),
                orderDate: template.getAttribute('orderDate'),
                items: rows
            })
        });

        return response.json();
    }
);
```

#### 属性值类型

`AttributesSchema` 中支持的 `type` 值：

- `'string'` - 转换为字符串（默认）
- `'number'` - 转换为数字
- `'boolean'` - 转换为布尔值（true/false、yes/no、1/0）
- `'date'` - 转换为 Date 对象
- `'datetime'` - 转换为带时间的 Date 对象

#### 高级示例：使用属性进行验证

```typescript
const encodingTemplate = new SchemaEncodingTemplate(
    orderSheetSchema,
    async (rows) => {
        // 在编码过程中访问属性
        const batchId = template.getAttribute('batchId');

        // 检查批次是否存在
        const batchExists = await checkBatchExists(batchId);
        if (!batchExists) {
            throw new Error(`批次 ${batchId} 不存在`);
        }

        // 使用批次上下文处理行
        return rows.map(row => ({
            ...row,
            batchId,
            department: template.getAttribute('department'),
            processedAt: new Date()
        }));
    }
);
```

#### 导出模板中的单元格合并

使用 `SchemaExporter` 生成 Excel 模板时，可以通过 `colSpan` 和 `rowSpan` 合并属性值的单元格：

```typescript
const orderSheetSchema: SheetSchema = {
    headerRowNum: 3,
    dataRowNum: 4,
    columns: [
        {field: 'productId', text: '产品编号', width: 120},
        {field: 'quantity', text: '数量', width: 100}
    ],
    attributes: {
        // 跨越多列的标题
        title: {
            col: 1,
            row: 0,
            colSpan: 4,  // 合并 B1:E1（4列）
            labelText: '订单标题'
        },
        // 跨越多列和多行的描述
        description: {
            col: 1,
            row: 1,
            colSpan: 4,  // 合并 4 列
            rowSpan: 2,  // 合并 2 行（B2:E3）
            labelText: '订单说明'
        },
        // 普通单单元格
        orderId: {
            col: 1,
            row: 4,
            labelText: '订单编号',
            type: 'string'
        }
    }
};

// 生成带合并单元格的模板
const exporter = new SchemaExporter(orderSheetSchema);
await exporter.downloadTemplate('order-template');
```

**Excel 布局效果：**
```
     A           B           C           D           E
1               订单标题（合并 B1:E1）
2               订单说明（合并 B2:E3）
3               （继续）
4   订单编号：   [值]
5   产品编号     数量
```

**注意：** 单元格合并仅适用于模板生成（`SchemaExporter`），不适用于数据导入/解析。

---

## 🌐 国际化支持

使用 `@ticatec/i18n` 实现自动语言切换。可通过扩展资源文件进行定制：

**中文：**
```json
{
    "batchUploading": {
        "status": {
            "pending": "待上传",
            "uploading": "正在上传...",
            "successful": "成功",
            "fail": "失败"
        },
        "parsing": "正在解析文件...",
        "parseFailure": "无法解析文件：{{name}}",
        "button": {
            "upload": "上传",
            "save": "保存错误数据",
            "confirm": "确定"
        }
    }
}
```

---

## 📖 文档

- [批量上传指南](./documents/FileUploadWizard_cn.md)
- [数据编码指南](./documents/EncodingWizard_cn.md)

---

## 🪪 开源协议

MIT License © Ticatec

---

## 👨‍💻 作者

**Henry Feng** <huili.f@gmail.com>

---

## 🤝 贡献

欢迎贡献代码！请随时提交 issue 或 pull request。

---

## 📝 更新日志

### v0.2.0
- ✨ 新增 SchemaUploadTemplate 和 SchemaEncodingTemplate
- ✨ 新增 SchemaExporter 用于模板生成
- ✨ 新增 schema/SheetSchema 类型定义
- ✨ 新增 SchemaHelper 工具类
- ✨ 新增 Sheet 级别属性提取功能
- 🗑️ 移除未使用的 `BaseExportTemplate`（请改用 `SchemaExporter`）
- 🐛 修复多个类型导出问题
- 📚 更新文档

**包名更改：** 此包之前发布为 `@ticatec/batch-data-uploader`。如果升级，请更新您的导入：
```typescript
// 旧版本
import {SchemaUploadTemplate} from '@ticatec/batch-data-uploader';

// 新版本
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';
```

**重大变更：** `BaseExportTemplate` 已被移除。请使用 `SchemaExporter` 进行 Excel 模板生成：
```typescript
// 旧版本（已不再可用）
import BaseExportTemplate from '@ticatec/excel-wizard/output/BaseExportTemplate';

// 新版本（推荐）
import {SchemaExporter} from '@ticatec/excel-wizard';
const exporter = new SchemaExporter(schema);
await exporter.downloadTemplate('文件名');
```

### v0.1.x
- 初始版本，包含 BaseUploadTemplate 和 BaseEncodingTemplate
- FileUploadWizard 和 EncodingWizard 组件
- 错误导出功能
- 国际化支持