# EncodingWizard 组件

一个基于 Svelte 的对话框组件，用于解析 Excel 文件并将字段映射到本地数据结构。非常适合客户端数据导入场景。

## 概述

**EncodingWizard** 专为**纯客户端 Excel 数据处理**而设计，无需服务器交互。它提供了一个交互式界面，用于：

- 📂 读取本地 Excel 文件
- 🔄 将 Excel 列映射到数据字段
- ✅ 使用自定义规则验证数据
- 📝 在处理前预览数据
- ✨ 返回处理后的数据用于表单填充或本地使用

## 使用场景

**适用于需要以下功能的场景：**
- 从 Excel 文件导入配置
- 批量填充表单字段
- 本地数据报表生成
- 离线数据处理
- 从模板读取初始化数据

**❌ 不适用于：**
- 服务器端数据上传（请改用 [FileUploadWizard](./FileUploadWizard_cn.md)）
- 数据库批量导入（请改用 [FileUploadWizard](./FileUploadWizard_cn.md)）

**对比：**

| 特性 | EncodingWizard | FileUploadWizard |
|------|----------------|------------------|
| **主要用途** | 本地数据导入 | 服务器上传 |
| **服务器交互** | **不需要** | 必需 |
| **数据流** | Excel → 处理 → 表单/本地状态 | Excel → 验证 → 服务器 |
| **典型场景** | 从 Excel 填充表单 | 批量上传到数据库 |

## 使用方法

### Schema 方式（推荐）

使用 `SchemaEncodingTemplate` 实现简化的、无需继承的实现：

```typescript
import {EncodingWizard} from '@ticatec/excel-wizard';
import {SchemaEncodingTemplate} from '@ticatec/excel-wizard';
import type {SheetSchema} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// 创建编码模板 - 无需继承！
class ProductEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(productSheetSchema);
    }

    // 实现编码函数（客户端处理）
    protected getEncodeFunction() {
        return async (rows) => {
            // 在本地处理数据 - 无需服务器
            return rows.map(row => ({
                ...row,
                // 添加计算字段
                total: row.price * row.quantity,
                processedAt: new Date().toISOString()
            }));
        };
    }

    // 可选：添加验证
    protected getValidateFunction() {
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

const encodingTemplate = new ProductEncodingTemplate();

// 打开向导
window.Dialog.showModal(EncodingWizard, {
    template: encodingTemplate,
    width: '1240px',
    title: '从 Excel 导入产品',
    confirmCallback: (processedData) => {
        console.log('处理后的数据：', processedData);
        // 使用数据填充表单、更新本地状态等
        // 例如：
        // - 填充表单字段
        // - 更新本地数据存储
        // - 生成报表
        // - 触发本地处理
        return true;  // 关闭对话框
    }
});
```

### 传统方式（基于继承）

对于高级定制，可以继承 `BaseEncodingTemplate`：

```typescript
import {EncodingWizard} from '@ticatec/excel-wizard';
import BaseEncodingTemplate from '@ticatec/excel-wizard/BaseEncodingTemplate';
import type {DataColumn} from '@ticatec/excel-wizard/DataColumn';

class MyEncodingTemplate extends BaseEncodingTemplate {
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

    protected async encodeData(rows: Array<any>): Promise<Array<any>> {
        // 在本地处理数据
        return rows.map(row => ({
            ...row,
            processed: true,
            timestamp: new Date().toISOString()
        }));
    }
}

const template = new MyEncodingTemplate();

window.Dialog.showModal(EncodingWizard, {
    template: template,
    width: '1240px',
    title: '导入数据',
    confirmCallback: (data) => {
        console.log('导入的数据：', data);
        return true;
    }
});
```

## 组件属性

### 必需属性

- **template**: `SchemaEncodingTemplate | BaseEncodingTemplate`
  - 编码模板实例，用于解析 Excel 文件和处理数据
  - 定义列映射和数据转换逻辑

### 可选属性

- **title**: `string`（默认：本地化的"导入数据"）
  - 对话框标题
- **width**: `string`（默认：`"1240px"`）
  - 对话框宽度
- **confirmCallback**: `(data: any[]) => boolean | Promise<boolean>`
  - 用户确认导入时调用的回调函数
  - 接收处理后的数据数组
  - 返回 `true` 关闭对话框，返回 `false` 保持打开

## 工作流程

```
┌─────────────────────────────────────────────────────────┐
│  1. 用户打开 EncodingWizard 对话框                      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  2. 用户选择本地 Excel 文件 (.xlsx/.xls)               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  3. 客户端解析：                                        │
│     - 在本地读取 Excel 文件（无需服务器）              │
│     - 根据 schema 映射列                               │
│     - 从单元格提取数据                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  4. 数据验证（可选）：                                  │
│     - 应用自定义验证规则                               │
│     - 在数据表格中显示错误                             │
│     - 高亮显示无效行                                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  5. 数据转换（encodeData）：                            │
│     - 在本地处理数据                                   │
│     - 添加计算字段                                     │
│     - 根据需要格式化数据                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  6. 预览：                                              │
│     - 在表格中显示处理后的数据                         │
│     - 用户在确认前查看                                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  7. 用户点击确认：                                      │
│     - 调用 confirmCallback(data)                       │
│     - 将数据返回给调用代码                             │
│     - 用于表单填充等                                   │
└─────────────────────────────────────────────────────────┘
```

## 示例场景

### 1. 从 Excel 导入配置

```typescript
class ConfigEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(configSheetSchema);
    }

    protected getEncodeFunction() {
        return async (rows) => {
            // 将 Excel 行转换为配置对象
            const config = {};
            rows.forEach(row => {
                config[row.key] = row.value;
            });
            return [config];  // 为一致性返回数组
        };
    }
}

window.Dialog.showModal(EncodingWizard, {
    template: new ConfigEncodingTemplate(),
    title: '导入配置',
    confirmCallback: ([config]) => {
        // 将配置应用到应用
        Object.assign(appConfig, config);
        return true;
    }
});
```

### 2. 批量填充表单字段

```typescript
class FormFillEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(formSchema);
    }

    protected getEncodeFunction() {
        return async (rows) => {
            // 处理行以填充表单
            return rows.map(row => ({
                ...row,
                // 验证和转换
                isValid: validateField(row),
                formatted: formatField(row)
            }));
        };
    }
}

window.Dialog.showModal(EncodingWizard, {
    template: new FormFillEncodingTemplate(),
    title: '导入表单数据',
    confirmCallback: (formData) => {
        // 填充表单字段
        formData.forEach((data, index) => {
            formFields[index].value = data.value;
        });
        return true;
    }
});
```

### 3. 本地数据报表生成

```typescript
class ReportEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(reportSchema);
    }

    protected getEncodeFunction() {
        return async (rows) => {
            // 为报表添加计算
            return rows.map(row => ({
                ...row,
                total: row.quantity * row.unitPrice,
                tax: row.quantity * row.unitPrice * 0.1,
                grandTotal: row.quantity * row.unitPrice * 1.1
            }));
        };
    }
}

window.Dialog.showModal(EncodingWizard, {
    template: new ReportEncodingTemplate(),
    title: '生成报表',
    confirmCallback: (reportData) => {
        // 在本地生成报表
        generateReport(reportData);
        return true;
    }
});
```

## 验证

通过重写 `getValidateFunction()` 实现自定义验证逻辑：

```typescript
protected getValidateFunction() {
    return (row) => {
        // 自定义验证规则
        if (!row.name || row.name.trim() === '') {
            return {
                valid: false,
                hint: '姓名不能为空'
            };
        }

        if (row.email && !isValidEmail(row.email)) {
            return {
                valid: false,
                hint: '邮箱格式无效'
            };
        }

        if (row.age && (row.age < 18 || row.age > 65)) {
            return {
                valid: false,
                hint: '年龄必须在 18 到 65 之间'
            };
        }

        return {valid: true};
    };
}
```

## 注意事项

- ✅ **纯客户端处理** - 无需服务器交互
- ✅ **灵活的数据转换** - 根据需要在本地处理数据
- ✅ **自定义验证** - 添加自己的验证规则
- ✅ **确认前预览** - 用户可以在处理前查看数据
- ✅ **国际化支持** - 支持多种语言
- ⚠️ **文件格式** - 仅接受 `.xls` 和 `.xlsx` 文件
- ⚠️ **全局依赖** - 需要 `window.Indicator`、`window.Toast` 和 `window.Dialog`

## 相关组件

- [FileUploadWizard](./FileUploadWizard_cn.md) - 用于服务器端批量上传
- [SchemaHelper](../src/lib/schema/SchemaHelper.ts) - Schema 工具类
- [BaseEncodingTemplate](./BaseEncodingTemplate_cn.md) - 传统基类