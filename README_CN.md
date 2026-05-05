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
| `schema/SchemaUploadTemplate.ts` | 抽象上传类，基于 SheetSchema 简化实现 |
| `schema/SchemaEncodingTemplate.ts` | 抽象编码类，基于 SheetSchema 简化实现 |
| `schema/SheetSchema.ts` | Schema 定义的 TypeScript 接口 |
| `schema/SchemaHelper.ts` | Schema 操作工具类（包含模板生成功能） |

### 工具类

| 文件 | 描述 |
|------|------|
| `excelUtils.ts` | Excel 单元格地址编码/解码工具 |
| `DataColumn.ts` | 列结构接口，支持解析选项 |
| `ProcessStatus.ts` | 上传流程状态枚举（初始化、待上传、上传中、已完成） |
| `config.ts` | 配置常量（批量大小、延迟、Excel 日期） |
| `wizardUtils.ts` | 向导工具函数（文件解析、对话框辅助） |
| `i18n_res` | 多语言资源（中英文） |

---

## 🚀 快速开始

### 选择合适的组件

`@ticatec/excel-wizard` 提供两个核心向导组件，适用于不同的使用场景：

#### FileUploadWizard + SchemaUploadTemplate

**适用场景：批量数据上传到服务器**

```typescript
import {FileUploadWizard} from '@ticatec/excel-wizard';
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';

// 典型流程：
// 1. 用户上传 Excel 文件
// 2. 客户端解析并验证数据
// 3. 批量上传到服务器
// 4. 显示上传进度和结果
// 5. 导出失败记录用于重新上传

window.Dialog.showModal(FileUploadWizard, {
    template: uploadTemplate,
    width: '1240px',
    title: '批量上传产品'
});
```

**特点：**
- ✅ 包含完整的服务器上传流程
- ✅ 支持批量上传和进度跟踪
- ✅ 自动错误处理和重试机制
- ✅ 导出失败数据用于修正后重新上传
- ✅ 适用于需要服务器验证和存储的场景

**示例场景：**
- 批量导入产品目录
- 批量创建用户账户
- 批量上传订单数据
- 数据库初始化和迁移

#### EncodingWizard + SchemaEncodingTemplate

**适用场景：从 Excel 读取数据并填充表单（纯客户端）**

```typescript
import {EncodingWizard} from '@ticatec/excel-wizard';
import {SchemaEncodingTemplate} from '@ticatec/excel-wizard';

// 典型流程：
// 1. 用户选择本地 Excel 文件
// 2. 客户端解析并映射字段
// 3. 数据转换和格式化
// 4. 直接填充到表单或本地数据结构
// 5. 无服务器交互，纯客户端处理

window.Dialog.showModal(EncodingWizard, {
    template: encodingTemplate,
    width: '1240px',
    title: '从 Excel 导入数据',
    confirmCallback: (encodedData) => {
        // 处理编码后的数据
        console.log('导入的数据：', encodedData);
        // 填充表单、更新本地状态等
        return true;  // 关闭对话框
    }
});
```

**特点：**
- ✅ 纯客户端处理，无需服务器交互
- ✅ 灵活的字段映射和数据转换
- ✅ 支持自定义验证逻辑
- ✅ 可选的数据预处理和格式化
- ✅ 适用于本地数据处理和表单填充

**示例场景：**
- 从 Excel 导入配置参数
- 批量填充表单字段
- 本地数据报表生成
- 离线数据处理和转换
- 从模板文件读取初始化数据

**对比总结：**

| 特性 | FileUploadWizard | EncodingWizard |
|------|------------------|----------------|
| **主要用途** | 批量上传到服务器 | 本地数据导入和处理 |
| **服务器交互** | 必需 | 不需要 |
| **数据处理** | 验证 + 上传 | 映射 + 转换 |
| **进度跟踪** | 上传进度 | 处理进度 |
| **错误处理** | 重试 + 导出失败数据 | 验证 + 提示 |
| **典型场景** | 数据库批量导入 | 表单填充、本地处理 |

---

### 方式一：Schema 方式（推荐）

Schema 方式通过继承抽象类并实现抽象方法，大大简化代码编写。

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

// 创建自定义上传模板类
class ProductUploadTemplate extends SchemaUploadTemplate {
    constructor() {
        super(productSheetSchema);  // 传递 schema 给父类
    }

    // 实现抽象方法：上传数据
    protected async uploadData(rows: Array<any>) {
        const results = await fetch('/api/products/upload', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(rows)
        });
        return results.json();
    }
}

// 创建模板实例
const uploadTemplate = new ProductUploadTemplate();

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
import {SchemaEncodingTemplate, type SchemaEncodeFun, type ValidationResult} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// 创建自定义编码模板类
class ProductEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(productSheetSchema);  // 传递 schema 给父类
    }

    // 实现抽象方法：提供编码函数
    protected getEncodeFunction(): SchemaEncodeFun {
        return async (rows) => {
            const response = await fetch('/api/products/encode', {
                method: 'POST',
                body: JSON.stringify(rows)
            });
            return response.json();
        };
    }

    // 可选：重写验证方法
    protected getValidateFunction(): (row: any) => ValidationResult {
        return (row) => {
            if (!row.barcode) {
                return {
                    valid: false,
                    hint: 'SKU 不能为空'
                };
            }
            return {valid: true};
        };
    }
}

// 创建模板实例
const encodingTemplate = new ProductEncodingTemplate();

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

#### 4. 生成带提示行和下拉选项的 Excel 模板

现在可以直接从模板实例生成 Excel 模板：

```typescript
// 直接使用模板实例
await uploadTemplate.downloadTemplate('product-template');

// 或带示例数据
await uploadTemplate.downloadTemplate('product-template', [
    {barcode: 'SKU001', name: '产品1', category: 'ELEC'},
    {barcode: 'SKU002', name: '产品2', category: 'CLOT'}
]);
```

**使用 SchemaHelper**（如果需要更底层的控制）：

```typescript
import {SchemaHelper} from '@ticatec/excel-wizard';

const helper = new SchemaHelper(productSheetSchema);

// 生成并下载模板
await helper.downloadTemplate('product-template');

// 获取下拉选项
const categories = helper.getDropdownOptions('categories');
// 返回：['电子产品', '服装', '食品']

// 文本转键值
const categoryCode = helper.textToKey('电子产品', 'categories');
// 返回：'ELEC'

// 键值转文本
const categoryText = helper.keyToText('ELEC', 'categories');
// 返回：'电子产品'
```

这将生成一个 Excel 文件，包含：
- ✅ 预定义的表头
- ✅ 提示行（如果 `showHint: true`）
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

    // 是否显示提示行（可选）
    showHint?: boolean;  // 默认：false

    // 列定义
    columns: ColumnSchema[];

    // 工作表级属性提取（可选）
    attributes?: Record<string, AttributesSchema>;

    // 模板装饰（可选）
    decorations?: TemplateDecoration[];
}
```

**数据行位置规则：**
- 无提示行 (`showHint: false`): 数据从 `headerRowNum + 1` 开始
- 有提示行 (`showHint: true`): 数据从 `headerRowNum + 2` 开始

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

    // 列提示文本（用于生成模板，仅在 showHint 为 true 时显示）
    hint?: string;              // 提示内容，支持换行（\n）

    // 列装饰（用于生成模板时为数据单元格定义样式）
    decoration?: ColumnDecoration;
}
```

**提示行示例：**
```typescript
const schema: SheetSchema = {
    headerRowNum: 0,
    showHint: true,  // 启用提示行
    columns: [
        {
            field: 'email',
            text: '邮箱',
            width: 200,
            hint: '必填。必须是有效的邮箱地址。'
        },
        {
            field: 'age',
            text: '年龄',
            width: 100,
            hint: '必须在 18 到 65 之间。\n只允许数字。'
        }
    ]
};
```

**Excel 布局：**
```
无提示行 (showHint: false):
Row 1: [列标题]
Row 2: [数据起始行]

有提示行 (showHint: true):
Row 1: [列标题]
Row 2: [提示文本 - 支持自动换行]
Row 3: [数据起始行]
```

#### OptionsList

```typescript
interface OptionsList {
    list: Array<Record<string, string>>;
    keyName?: string;   // 默认：'code'
    textName?: string;  // 默认：'text'

    // 自定义解析器：从显示文本提取键值（例如："ELEC - 电子产品" → "ELEC"）
    parser?: (value: any) => any;

    // 自定义格式化器：从键值生成显示文本（例如："ELEC" → "ELEC - 电子产品"）
    formatter?: (key: string, list: Array<Record<string, string>>) => string;
}
```

**Parser 优先级：**

当列同时指定了 `optionsName` 和 parser 时：

1. **最高优先级**：`OptionsList.parser`（如果 optionsName 指定且 OptionsList.parser 存在）
2. **中等优先级**：`ColumnSchema.parser`（如果指定）
3. **低优先级**：默认 options 的 text-to-key 查找（如果 optionsName 指定）
4. **无转换**：既没有 parser 也没有 optionsName

对于基于选项的列，推荐在 `OptionsList` 中定义 parser 而非 `ColumnSchema`：

```typescript
// ✅ 推荐：在 OptionsList 中定义 parser
const categoryOptions: OptionsList = {
    list: [
        { code: 'ELEC', text: '电子产品' },
        { code: 'CLOT', text: '服装' }
    ],
    parser: (value) => {
        const parts = String(value).split(' - ');
        return parts[0].trim();  // "ELEC - 电子产品" → "ELEC"
    },
    formatter: (key, list) => {
        const item = list.find(i => i.code === key);
        return item ? `${key} - ${item.text}` : key;  // "ELEC" → "ELEC - 电子产品"
    }
};

// ❌ 避免：ColumnSchema.parser 在 OptionsList.parser 存在时会被忽略
const column: ColumnSchema = {
    field: 'category',
    optionsName: 'categories',
    parser: (value) => value.split(' - ')[0]  // 如果 OptionsList.parser 存在则会被忽略
};
```

#### AttributesSchema

```typescript
interface AttributesSchema {
    col: number;          // 列索引（0开始）
    row: number;          // 行索引（0开始）
    type?: CellValueType; // 值类型，用于类型转换

    // 单元格合并（仅用于导出）
    colSpan?: number;     // 列跨度（>=1），例如 3 表示合并 col, col+1, col+2 三列
    rowSpan?: number;     // 行跨度（>=1），例如 2 表示合并 row, row+1 两行
}
```

**注意：** 属性名称（在 attributes 对象中的键）将直接成为 `attrs` 对象的属性名。例如：
```typescript
attributes: {
    batchId: { col: 1, row: 0 },  // 访问时使用 template.attrs.batchId
    uploadDate: { col: 3, row: 0 }  // 访问时使用 template.attrs.uploadDate
}
```

### 核心类

#### SchemaUploadTemplate

抽象上传类，基于 SheetSchema 简化实现。

```typescript
abstract class SchemaUploadTemplate extends BaseUploadTemplate {
    // 需要实现的抽象方法
    protected abstract getSheetSchema(): SheetSchema;
    protected abstract uploadData(rows: Array<any>): Promise<Array<any>>;

    // 生成并下载模板
    async downloadTemplate(
        filename?: string,
        sampleData?: Array<any>
    ): Promise<void>

    // 获取提取的属性
    getAttributes(): Record<string, any>
    getAttribute(name: string): any
}
```

**使用方式：**
```typescript
class MyUploadTemplate extends SchemaUploadTemplate {
    protected getSheetSchema() {
        return mySheetSchema;
    }

    protected async uploadData(rows) {
        // 上传逻辑
    }
}
```

#### SchemaEncodingTemplate

抽象编码类，基于 SheetSchema 简化实现。

```typescript
abstract class SchemaEncodingTemplate extends BaseEncodingTemplate {
    // 需要实现的抽象方法
    protected abstract getSheetSchema(): SheetSchema;
    protected abstract getEncodeFunction(): SchemaEncodeFun;

    // 可选重写的方法
    protected getValidateFunction(): SchemaValidateFun | undefined {
        return undefined;
    }

    // 生成并下载模板（新增）
    async downloadTemplate(
        filename?: string,
        sampleData?: Array<any>
    ): Promise<void>

    // 获取列的下拉选项（新增）
    getDropdownOptions(optionsName: string): string[]

    // 获取列映射（表头文本 -> 字段名）
    getColumnMapping(): Map<string, string>
    getFieldName(headerText: string): string | undefined
    hasMapping(headerText: string): boolean

    // 获取提取的属性
    getAttributes(): Record<string, any>
    getAttribute(name: string): any
}
```

**使用方式：**
```typescript
class MyEncodingTemplate extends SchemaEncodingTemplate {
    protected getSheetSchema() {
        return mySheetSchema;
    }

    protected getEncodeFunction() {
        return async (rows) => {
            // 编码逻辑
        };
    }
}

// 使用
const template = new MyEncodingTemplate();

// 生成模板
await template.downloadTemplate('my-template');
```

**类型定义：**
```typescript
type SchemaEncodeFun = (rows: Array<any>) => Promise<Array<any>>;
type SchemaValidateFun = (row: any) => ValidationResult | Promise<ValidationResult>;

interface ValidationResult {
    valid: boolean;
    hint?: string;
    error?: string;
}
```

#### SchemaHelper

Schema 工具类，提供所有 Schema 相关操作。

```typescript
class SchemaHelper {
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

    // 转换键值为文本
    keyToText(key: any, optionsName: string): string

    // 属性提取
    extractAttributes(workbook, sheetName): Record<string, any>
    getAttributes(): Record<string, any>
    getAttribute(name: string): any
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
            type: 'string'
        },
        // 部门在单元格 B2（列1，行1）
        department: {
            col: 1,
            row: 1,
            type: 'string'
        },
        // 订单日期在单元格 D1（列3，行0）
        orderDate: {
            col: 3,
            row: 0,
            type: 'date'
        }
    }
};
```

#### Excel 布局示例

```
     A           B           C           D
1               2024-BATCH-001           2024-01-15
2               销售部
3
4   产品编号     数量
5   PROD001     100
6   PROD002     200
```

**注意：** 属性名称（如 `batchId`、`department`、`orderDate`）将成为 `attrs` 对象的键。Excel 文件中属性标签（如"批次号："、"部门："）应该在模板中手动添加。

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

使用 `SchemaHelper` 生成 Excel 模板时，可以通过 `colSpan` 和 `rowSpan` 合并属性值的单元格：

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
import {SchemaHelper} from '@ticatec/excel-wizard';
const helper = new SchemaHelper(orderSheetSchema);
await helper.downloadTemplate('order-template');
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

**注意：** 单元格合并仅适用于模板生成，不适用于数据导入/解析。

### 模板装饰（TemplateDecoration）

使用 `TemplateDecoration` 为生成的 Excel 模板添加固定的装饰性元素，如标题、说明文字等。

```typescript
import type {SheetSchema, TemplateDecoration} from '@ticatec/excel-wizard';

const schemaWithDecoration: SheetSchema = {
    headerRowNum: 3,
    columns: [
        {field: 'name', text: '产品名称', width: 200},
        {field: 'price', text: '价格', width: 120}
    ],
    // 添加模板装饰
    decorations: [
        {
            col: 1,
            row: 0,
            colSpan: 4,
            text: '产品批量导入表',
            fontSize: 18,
            bold: true,
            color: 'FFFFFF',
            fillColor: '333333',
            align: 'center'
        },
        {
            col: 1,
            row: 1,
            colSpan: 2,
            rowSpan: 2,
            text: '填写说明：\n1. 产品名称必填\n2. 价格必须是数字',
            fontSize: 11,
            italic: true,
            fillColor: 'FFF9E7',
            wrapText: true,
            verticalAlign: 'top'
        },
        {
            col: 3,
            row: 1,
            text: '导入日期：',
            bold: true
        },
        {
            col: 4,
            row: 1,
            text: new Date().toLocaleDateString('zh-CN')
        }
    ]
};
```

**TemplateDecoration 接口：**

```typescript
interface TemplateDecoration {
    col: number;               // 起始列索引（0开始）
    row: number;               // 起始行索引（0开始）
    text?: string;             // 单元格文本
    colSpan?: number;          // 列跨度（合并列数）
    rowSpan?: number;          // 行跨度（合并行数）
    fontSize?: number;         // 字体大小
    bold?: boolean;            // 是否粗体
    italic?: boolean;          // 是否斜体
    color?: string;            // 字体颜色（支持 RGB 或 ARGB）
    fillColor?: string;        // 背景颜色（支持 RGB 或 ARGB）
    align?: 'left' | 'center' | 'right';        // 水平对齐
    verticalAlign?: 'top' | 'middle' | 'bottom'; // 垂直对齐
    wrapText?: boolean;        // 是否自动换行
}
```

**颜色格式说明：**

- **RGB 格式**（推荐）：`#333333`、`#FF0000` - 6位十六进制
- **ARGB 格式**：`#FF333333` - 8位十六进制（前2位为透明度）
- **简写格式**：`#F00` - 3位十六进制，自动扩展为 `#FF0000`

系统会自动将 RGB 格式转换为 ARGB 格式（添加 `FF` 透明度前缀）。

### 列装饰（ColumnDecoration）

使用 `ColumnDecoration` 为数据列的单元格定义样式，包括字体、背景、对齐等。

```typescript
import type {SheetSchema, ColumnDecoration} from '@ticatec/excel-wizard';

const schemaWithColumnDecoration: SheetSchema = {
    headerRowNum: 0,
    showHint: true,
    columns: [
        {
            field: 'name',
            text: '产品名称',
            width: 200,
            decoration: {
                fontSize: 12,
                bold: true,
                fillColor: 'F0F0F0'
            }
        },
        {
            field: 'price',
            text: '价格',
            width: 120,
            align: 'right',
            decoration: {
                fontSize: 11,
                color: 'FF0000',
                format: '¥#,##0.00',
                align: 'right'  // 覆盖列的 align
            }
        },
        {
            field: 'status',
            text: '状态',
            width: 100,
            decoration: {
                fillColor: 'E8F5E9',
                align: 'center',
                verticalAlign: 'middle'
            }
        }
    ]
};
```

**ColumnDecoration 接口：**

```typescript
interface ColumnDecoration {
    width?: number;           // 列宽（像素）
    fontSize?: number;        // 字体大小
    bold?: boolean;           // 是否粗体
    italic?: boolean;         // 是否斜体
    color?: string;           // 字体颜色
    fillColor?: string;       // 背景颜色
    align?: 'left' | 'center' | 'right';        // 水平对齐
    verticalAlign?: 'top' | 'middle' | 'bottom'; // 垂直对齐
    wrapText?: boolean;       // 是否自动换行
    format?: string;          // 数字格式（如：'0.00', '¥#,##0.00'）
}
```

**对齐优先级规则：**

```
decoration.align > col.align > 'left'（默认）
```

如果列定义了 `decoration.align`，则使用装饰的对齐方式；
否则使用列的 `col.align`；
最后默认为左对齐。

### 访问提取的属性（attrs）

从上传的 Excel 文件中提取工作表级别的元数据，并通过 `attrs` 对象访问。

```typescript
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';
import type {SheetSchema} from '@ticatec/excel-wizard';

const orderSchema: SheetSchema = {
    headerRowNum: 2,
    columns: [
        {field: 'productId', text: '产品编号', width: 120},
        {field: 'quantity', text: '数量', width: 100}
    ],
    attributes: {
        // 属性名 'batchId' 将成为 attrs.batchId 的键
        batchId: {
            col: 1,
            row: 0,
            type: 'string'
        },
        // 属性名 'uploadDate' 将成为 attrs.uploadDate 的键
        uploadDate: {
            col: 3,
            row: 0,
            type: 'date'
        }
    }
};

class OrderUploadTemplate extends SchemaUploadTemplate {
    constructor() {
        super(orderSchema);
    }

    protected async uploadData(rows: Array<any>) {
        // 直接通过 attrs 对象访问提取的属性
        const batchId = this.attrs.batchId;
        const uploadDate = this.attrs.uploadDate;

        console.log('批次号：', batchId);      // 例如：'2024-BATCH-001'
        console.log('上传日期：', uploadDate); // 例如：Date 对象

        // 使用属性进行上传
        const response = await fetch('/api/orders/upload', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                batchId,
                uploadDate,
                items: rows
            })
        });

        return response.json();
    }
}
```

**访问方式：**

1. **通过 `attrs` 对象直接访问**（推荐）：
   ```typescript
   const batchId = template.attrs.batchId;
   const date = template.attrs.uploadDate;
   ```

2. **通过 `getAttribute()` 方法访问**：
   ```typescript
   const batchId = template.getAttribute('batchId');
   const date = template.getAttribute('uploadDate');
   ```

3. **获取所有属性**：
   ```typescript
   const allAttrs = template.getAttributes();
   // 返回：{batchId: '2024-BATCH-001', uploadDate: Date}
   ```

**属性类型支持：**

- `'string'` - 字符串（默认）
- `'number'` - 数字
- `'boolean'` - 布尔值
- `'date'` - 日期
- `'datetime'` - 日期时间

### 数据行位置计算规则

数据行的起始位置由 `headerRowNum` 和 `showHint` 共同决定：

```
dataStartRow = headerRowNum + (showHint ? 2 : 1)
```

**示例：**

```typescript
// 情况 1：无提示行
const schema1: SheetSchema = {
    headerRowNum: 0,
    showHint: false,  // 或不设置
    columns: [...]
};
// 表头在第 1 行（行0）
// 数据从第 2 行开始（行1）

// 情况 2：有提示行
const schema2: SheetSchema = {
    headerRowNum: 0,
    showHint: true,
    columns: [...]
};
// 表头在第 1 行（行0）
// 提示在第 2 行（行1）
// 数据从第 3 行开始（行2）

// 情况 3：表头不在第一行，无提示
const schema3: SheetSchema = {
    headerRowNum: 2,
    showHint: false,
    columns: [...]
};
// 表头在第 3 行（行2）
// 数据从第 4 行开始（行3）

// 情况 4：表头不在第一行，有提示
const schema4: SheetSchema = {
    headerRowNum: 2,
    showHint: true,
    columns: [...]
};
// 表头在第 3 行（行2）
// 提示在第 4 行（行3）
// 数据从第 5 行开始（行4）
```

**Excel 布局示例：**

```
无提示行 (showHint: false):
Row 1: [表头]           <- headerRowNum
Row 2: [数据起始行]     <- headerRowNum + 1

有提示行 (showHint: true):
Row 1: [表头]           <- headerRowNum
Row 2: [提示文本]       <- headerRowNum + 1
Row 3: [数据起始行]     <- headerRowNum + 2
```

**注意：** 所有行号都是 0 开始索引。

---

## 🌐 国际化支持

使用 `@ticatec/i18n` 实现自动语言切换。可通过扩展资源文件进行定制：

**完整的国际化资源文件：**

- [English (i18n_en.json)](./documents/i18n_en.json)
- [中文 (i18n_zh.json)](./documents/i18n_zh.json)

**关键文本资源：**

**English:**
```json
{
  "excelWizard": {
    "status": {
      "pending": "To upload",
      "uploading": "Uploading...",
      "successful": "Success",
      "fail": "Failure"
    },
    "parsing": "Parsing file...",
    "parseFailure": "Cannot parse file: {{name}}",
    "waitUploading": "Cannot exit during uploading!",
    "button": {
      "upload": "Upload",
      "save": "Save error data",
      "open": "Open",
      "confirm": "Confirm"
    },
    "titleChooseSheet": "Choose a sheet",
    "errorTitle": "Error",
    "sheetName": "Abnormal data",
    "labelStatus": "Status",
    "labelValid": "Validity",
    "textValid": "Yes",
    "textInvalid": "No",
    "labelHint": "Hint",
    "uploadStatText": "Total: {{total}}, Success: {{success}}, Failed: {{failed}}",
    "buttonExportException": "Error report",
    "buttonExportFull": "Full report",
    "buttonReset": "Reset",
    "dragDropText": "Drag and drop your Excel file here",
    "dragDropSubText": "or click to browse",
    "dragDropFileType": "Supports .xlsx and .xls files"
  }
}
```

**中文:**
```json
{
  "excelWizard": {
    "status": {
      "pending": "待上传",
      "uploading": "正在上传...",
      "successful": "成功",
      "fail": "失败"
    },
    "parsing": "正在解析文件...",
    "parseFailure": "无法解析文件：{{name}}",
    "waitUploading": "上传期间无法退出！",
    "button": {
      "upload": "上传",
      "save": "保存错误数据",
      "open": "打开",
      "confirm": "确定"
    },
    "titleChooseSheet": "选择工作表",
    "errorTitle": "错误",
    "sheetName": "异常数据",
    "labelStatus": "状态",
    "labelValid": "有效性",
    "textValid": "是",
    "textInvalid": "否",
    "labelHint": "提示",
    "uploadStatText": "总计：{{total}}，成功：{{success}}，失败：{{failed}}",
    "buttonExportException": "错误报告",
    "buttonExportFull": "完整报告",
    "buttonReset": "重置",
    "dragDropText": "将 Excel 文件拖放到此处",
    "dragDropSubText": "或点击浏览",
    "dragDropFileType": "支持 .xlsx 和 .xls 文件"
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
- ✨ 新增 schema/SheetSchema 类型定义
- ✨ 新增 SchemaHelper 工具类（包含模板生成功能）
- ✨ 新增 Sheet 级别属性提取功能
- 🗑️ 移除未使用的 `BaseExportTemplate`
- 🗑️ 移除 `SchemaExporter`（功能已合并到 SchemaHelper）
- 🐛 修复多个类型导出问题
- 📚 更新文档

**重大变更：** `BaseExportTemplate` 已被移除。请使用 `SchemaHelper` 进行 Excel 模板生成：
```typescript
// 旧版本（已不再可用）
import BaseExportTemplate from '@ticatec/excel-wizard/output/BaseExportTemplate';

// 新版本（推荐）
import {SchemaHelper} from '@ticatec/excel-wizard';
const helper = new SchemaHelper(schema);
await helper.downloadTemplate('文件名');
```

或者使用模板实例：
```typescript
await template.downloadTemplate('文件名');
```

### v0.1.x
- 初始版本，包含 BaseUploadTemplate 和 BaseEncodingTemplate
- FileUploadWizard 和 EncodingWizard 组件
- 错误导出功能
- 国际化支持