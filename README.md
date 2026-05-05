# Excel Wizard

[中文文档](./README_CN.md)

# @ticatec/excel-wizard

A schema-driven Svelte component library for Excel batch data processing with wizard-style interfaces. Provides Excel file parsing, validation, encoding, and template generation with dropdown support.

---

## ✨ Features

### Core Functionality
- 📂 **Drag & Drop Upload** - Intuitive `.xlsx` file upload interface
- 🧠 **Client-side Parsing** - Local Excel data processing without server preprocessing
- 📝 **Data Preview** - Real-time preview with validation error highlighting
- 🎯 **Batch Processing** - Configurable batch size with progress tracking
- 📤 **Error Export** - Export failed rows for re-upload with customizable formats
- 🌐 **i18n Support** - Built-in Chinese and English language support
- 🔌 **UI Integration** - Seamless integration with `@ticatec/uniface-element` styles

### Schema-Driven Features (New!)
- 🎨 **Declarative Schema** - Define Excel structure with TypeScript interfaces
- 🔄 **Auto Field Mapping** - Dynamic column mapping from Excel headers
- 📋 **Template Generation** - Generate Excel templates with dropdown validation
- 🔀 **Options Conversion** - Automatic text ↔ key value conversion for dropdown fields
- 📊 **Attribute Extraction** - Extract sheet-level metadata from specific cells
---

## 📦 Installation

```bash
# Core package (includes xlsx for parsing)
npm install @ticatec/excel-wizard xlsx

# Optional: for template generation with dropdown validation
npm install exceljs
```

---

## 📁 Project Structure

### Components

| File | Description |
|------|-------------|
| `FileUploadWizard.svelte` | Upload wizard with drag-and-drop, validation, and batch upload |
| `EncodingWizard.svelte` | Field mapping wizard for dynamic Excel column mapping |
| `SheetPickupDialog.svelte` | Dialog for selecting sheets when workbook has multiple sheets |
| `SheetNameViewRender.svelte` | Component for rendering sheet names |

### Base Classes (Traditional Approach)

| File | Description |
|------|-------------|
| `BaseTemplate.ts` | Abstract base class with Excel parsing and column definition |
| `BaseUploadTemplate.ts` | Upload template for validation, preprocessing, and batch upload |
| `BaseEncodingTemplate.ts` | Encoding template for dynamic field mapping and transformation |

### Schema-Based Classes (New! - Recommended)

| File | Description |
|------|-------------|
| `SchemaUploadTemplate.ts` | Concrete upload template using SheetSchema (no inheritance needed) |
| `SchemaEncodingTemplate.ts` | Concrete encoding template using SheetSchema (no inheritance needed) |
| `SchemaExporter.ts` | Generate Excel templates with dropdown validation |
| `schema/SheetSchema.ts` | TypeScript interfaces for schema definition |

### Utilities

| File | Description |
|------|-------------|
| `schemaUtils.ts` | Shared utilities for schema operations (SchemaHelper class) |
| `excelUtils.ts` | Excel cell address encoding/decoding utilities |
| `DataColumn.ts` | Column structure interface with parsing options |
| `ProcessStatus.ts` | Upload process status enum (Init, Pending, Uploading, Done) |
| `config.ts` | Configuration constants (batch size, delays, Excel dates) |
| `wizardUtils.ts` | Wizard utility functions (file parsing, dialog helpers) |
| `i18n_res` | Multilingual resources (Chinese/English) |

---

## 🚀 Quick Start

### Choose the Right Component

`@ticatec/excel-wizard` provides two core wizard components for different use cases:

#### FileUploadWizard + SchemaUploadTemplate

**Use Case: Batch Data Upload to Server**

```typescript
import {FileUploadWizard} from '@ticatec/excel-wizard';
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';

// Typical workflow:
// 1. User uploads Excel file
// 2. Client-side parsing and validation
// 3. Batch upload to server
// 4. Display upload progress and results
// 5. Export failed records for re-upload

window.Dialog.showModal(FileUploadWizard, {
    template: uploadTemplate,
    width: '1240px',
    title: 'Batch Upload Products'
});
```

**Features:**
- ✅ Complete server upload workflow
- ✅ Batch upload with progress tracking
- ✅ Automatic error handling and retry
- ✅ Export failed data for correction and re-upload
- ✅ Ideal for scenarios requiring server validation and storage

**Example Scenarios:**
- Batch product catalog import
- Bulk user account creation
- Batch order data upload
- Database initialization and migration

#### EncodingWizard + SchemaEncodingTemplate

**Use Case: Read Excel Data and Fill Forms (Pure Client-Side)**

```typescript
import {EncodingWizard} from '@ticatec/excel-wizard';
import {SchemaEncodingTemplate} from '@ticatec/excel-wizard';

// Typical workflow:
// 1. User selects local Excel file
// 2. Client-side parsing and field mapping
// 3. Data transformation and formatting
// 4. Direct form filling or local data structure population
// 5. No server interaction, pure client-side processing

window.Dialog.showModal(EncodingWizard, {
    template: encodingTemplate,
    width: '1240px',
    title: 'Import Data from Excel',
    confirmCallback: (encodedData) => {
        // Process encoded data
        console.log('Imported data:', encodedData);
        // Fill forms, update local state, etc.
        return true;  // Close dialog
    }
});
```

**Features:**
- ✅ Pure client-side processing, **no server interaction required**
- ✅ Flexible field mapping and data transformation
- ✅ Support for custom validation logic
- ✅ Optional data preprocessing and formatting
- ✅ Ideal for local data processing and form filling

**Example Scenarios:**
- Import configuration parameters from Excel
- Batch fill form fields
- Local data report generation
- Offline data processing and transformation
- Read initialization data from template files

**Comparison Summary:**

| Feature | FileUploadWizard | EncodingWizard |
|---------|------------------|----------------|
| **Primary Use** | Batch upload to server | Local data import and processing |
| **Server Interaction** | Required | **Not required** |
| **Data Processing** | Validate + Upload | Map + Transform |
| **Progress Tracking** | Upload progress | Processing progress |
| **Error Handling** | Retry + Export failed data | Validate + Prompt |
| **Typical Scenarios** | Database batch import | Form filling, local processing |

---

### Approach 1: Schema-Based (Recommended)

Schema-based approach eliminates the need for inheritance. Simply define your schema and pass functions to the constructor.

#### 1. Define Your Schema

```typescript
// productSheetSchema.ts
import type {SheetSchema} from '@ticatec/excel-wizard';

const productSheetSchema: SheetSchema = {
    headerRowNum: 0,      // Header is on row 1 (0-indexed)
    dataRowNum: 1,        // Data starts from row 2 (0-indexed)
    columns: [
        {
            field: 'barcode',
            text: 'SKU',
            width: 180
        },
        {
            field: 'name',
            text: 'Product Name',
            width: 240,
            resizable: true
        },
        {
            field: 'category',
            text: 'Category',
            width: 120,
            optionsName: 'categories'  // References options below
        }
    ],
    options: {
        categories: {
            list: [
                {code: 'ELEC', text: 'Electronics'},
                {code: 'CLOT', text: 'Clothing'},
                {code: 'FOOD', text: 'Food'}
            ],
            keyName: 'code',
            textName: 'text'
        }
    }
};

export default productSheetSchema;
```

#### 2. Use SchemaUploadTemplate for Data Upload

```typescript
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// Create template instance - no inheritance needed!
const uploadTemplate = new SchemaUploadTemplate(
    productSheetSchema,
    // Upload function
    async (rows) => {
        const results = await fetch('/api/products/upload', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(rows)
        });
        return results.json();
    },
    // Optional: custom batch size
    50  // default is 50
);

// Use with FileUploadWizard
import {FileUploadWizard} from '@ticatec/excel-wizard';

window.Dialog.showModal(FileUploadWizard, {
    template: uploadTemplate,
    width: '1240px',
    title: 'Upload Products'
});
```

#### 3. Use SchemaEncodingTemplate for Data Encoding

```typescript
import {SchemaEncodingTemplate} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// Create template instance - no inheritance needed!
const encodingTemplate = new SchemaEncodingTemplate(
    productSheetSchema,
    // Encode function
    async (rows) => {
        const response = await fetch('/api/products/encode', {
            method: 'POST',
            body: JSON.stringify(rows)
        });
        return response.json();
    },
    // Optional: validation function
    (row) => {
        if (!row.barcode) {
            return {
                valid: false,
                hint: 'SKU is required'
            };
        }
        return {valid: true};
    }
);

// Use with EncodingWizard
import {EncodingWizard} from '@ticatec/excel-wizard';

window.Dialog.showModal(EncodingWizard, {
    template: encodingTemplate,
    width: '1240px',
    title: 'Import Products',
    confirmCallback: (list) => {
        console.log('Processed data:', list);
        return true;
    }
});
```

#### 4. Generate Excel Templates with Dropdowns

```typescript
import {SchemaExporter} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// Create exporter
const exporter = new SchemaExporter(productSheetSchema);

// Generate and download template
await exporter.downloadTemplate('product-template');

// Or with sample data
await exporter.downloadTemplate('product-template', [
    {barcode: 'SKU001', name: 'Product 1', category: 'ELEC'},
    {barcode: 'SKU002', name: 'Product 2', category: 'CLOT'}
]);
```

This generates an Excel file with:
- ✅ Pre-defined headers
- ✅ Proper column widths
- ✅ Dropdown validation for "Category" column
- ✅ Sample data (if provided)

### Approach 2: Traditional (Inheritance-Based)

For advanced customization, extend the base classes:

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
                text: 'Name',
                width: 150,
                parser: (value) => String(value).trim()
            },
            {
                field: 'email',
                text: 'Email',
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

## 📚 API Reference

### Schema Types

#### SheetSchema

```typescript
interface SheetSchema {
    // Dropdown options for columns
    options?: Record<string, OptionsList>;

    // Header row number (0-indexed)
    headerRowNum: number;

    // Data start row number (0-indexed)
    dataRowNum: number;

    // Column definitions
    columns: ColumnSchema[];

    // Sheet-level attribute extraction (optional)
    attributes?: Record<string, AttributesSchema>;
}
```

#### ColumnSchema

```typescript
interface ColumnSchema {
    field: string;              // Field name in data
    text: string;               // Column header text
    width: number;              // Column width in pixels
    minWidth?: number;          // Minimum width
    align?: 'left' | 'center' | 'right';  // Text alignment
    resizable?: boolean;        // Allow column resizing
    wrap?: boolean;             // Allow text wrapping
    optionsName?: string;       // Name of dropdown options
    parser?: (value: any) => any;  // Custom parser
    ignore?: boolean;           // Don't upload this field
    dummy?: boolean;            // Virtual column for display only
}
```

#### OptionsList

```typescript
interface OptionsList {
    list: Array<Record<string, string>>;
    keyName?: string;   // Default: 'code'
    textName?: string;  // Default: 'text'
}
```

#### AttributesSchema

```typescript
interface AttributesSchema {
    col: number;          // Column index (0-based)
    row: number;          // Row index (0-based)
    labelCol?: number;    // Label column position
    labelRow?: number;    // Label row position
    labelText?: string;   // Fixed label text
    type?: CellValueType; // Value type for conversion

    // Cell merging (for export only)
    colSpan?: number;     // Column span (>=1), e.g., 3 merges col, col+1, col+2
    rowSpan?: number;     // Row span (>=1), e.g., 2 merges row, row+1
}
```

### Core Classes

#### SchemaUploadTemplate

```typescript
class SchemaUploadTemplate extends BaseUploadTemplate {
    constructor(
        schema: SheetSchema,
        uploadFunction: SchemaUploadFun,
        batchSize?: number
    )

    // Get extracted attributes
    getAttributes(): Record<string, any>
    getAttribute(name: string): any
}
```

**SchemaUploadFun Type:**
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

    // Get column mapping (header text -> field name)
    getColumnMapping(): Map<string, string>
    getFieldName(headerText: string): string | undefined
    hasMapping(headerText: string): boolean

    // Get extracted attributes
    getAttributes(): Record<string, any>
    getAttribute(name: string): any
}
```

**SchemaEncodeFun Type:**
```typescript
type SchemaEncodeFun = (rows: Array<any>) => Promise<Array<any>>;
```

**SchemaValidateFun Type:**
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

    // Generate and download template
    async downloadTemplate(
        filename?: string,
        sampleData?: Array<any>
    ): Promise<void>

    // Get dropdown options for a column
    getDropdownOptions(optionsName: string): string[]

    // Convert text to key value
    textToKey(text: string, optionsName: string): string | undefined
}
```

---

## 🔧 Advanced Features

### Error Export Options

```typescript
// Export only failed rows (for re-upload)
template.exportErrorsForReupload('failed-data.xlsx');

// Export full report with all data and errors
template.exportFullReport('upload-report.xlsx');

// Custom export options
template.exportErrorData('custom-export.xlsx', {
    includeAllData: true,      // Include successful rows
    separateSheets: true,      // Separate sheets for details
    originalFormat: true       // Maintain import format
});
```

### Configuration

```typescript
import {BATCH_CONFIG, EXCEL_DATE} from '@ticatec/excel-wizard';

// Batch processing
BATCH_CONFIG.DEFAULT_BATCH_SIZE  // Default: 50
BATCH_CONFIG.MIN_BATCH_SIZE      // Minimum: 1
BATCH_CONFIG.BATCH_DELAY_MS      // Delay: 100ms

// Excel date conversion
EXCEL_DATE.EPOCH                 // Excel epoch: 25569
EXCEL_DATE.MS_PER_DAY            // Milliseconds/day: 86400000
```

### Schema Utilities

```typescript
import {SchemaHelper} from '@ticatec/excel-wizard';

const helper = new SchemaHelper(schema);

// Attribute extraction
helper.extractAttributes(workbook, sheetName);
helper.getAttributes();
helper.getAttribute('batchId');

// Options conversion
helper.textToKey('Electronics', 'categories');  // Returns: 'ELEC'
helper.keyToText('ELEC', 'categories');        // Returns: 'Electronics'

// Create parser function
const parser = helper.createOptionsParser('categories');
parser('Electronics');  // Returns: 'ELEC'
```

### Sheet-Level Attributes

Extract metadata from specific cells that apply to all rows in the sheet (e.g., batch ID, department, date).

#### Defining Attributes in Schema

```typescript
// orderSheetSchema.ts
import type {SheetSchema} from '@ticatec/excel-wizard';

const orderSheetSchema: SheetSchema = {
    headerRowNum: 2,
    dataRowNum: 3,
    columns: [
        {field: 'productId', text: 'Product ID', width: 120},
        {field: 'quantity', text: 'Quantity', width: 100}
    ],
    // Define sheet-level attributes
    attributes: {
        // Batch ID at cell B1 (column 1, row 0)
        batchId: {
            col: 1,
            row: 0,
            labelCol: 0,    // Label at A1
            labelRow: 0,
            type: 'string'
        },
        // Department at cell B2
        department: {
            col: 1,
            row: 1,
            labelText: 'Department',  // Use fixed label text
            type: 'string'
        },
        // Order date at cell D1
        orderDate: {
            col: 3,
            row: 0,
            labelText: 'Order Date',
            type: 'date'
        }
    }
};
```

#### Excel Layout Example

```
     A           B           C           D
1   Batch ID:   2024-BATCH-001           Order Date:  2024-01-15
2   Department: Sales
3
4   Product ID  Quantity
5   PROD001     100
6   PROD002     200
```

#### Using Extracted Attributes

```typescript
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';

const uploadTemplate = new SchemaUploadTemplate(
    orderSheetSchema,
    async (rows, template) => {
        // Get all extracted attributes
        const attributes = template.getAttributes();
        console.log(attributes);
        // Output: {batchId: '2024-BATCH-001', department: 'Sales', orderDate: '2024-01-15'}

        // Get specific attribute
        const batchId = template.getAttribute('batchId');
        console.log('Batch ID:', batchId);  // '2024-BATCH-001'

        // Upload with attributes
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

#### Attribute Value Types

Supported `type` values in `AttributesSchema`:

- `'string'` - Convert to string (default)
- `'number'` - Convert to number
- `'boolean'` - Convert to boolean (true/false, yes/no, 1/0)
- `'date'` - Convert to Date object
- `'datetime'` - Convert to Date object with time

#### Advanced Example: Using Attributes for Validation

```typescript
const encodingTemplate = new SchemaEncodingTemplate(
    orderSheetSchema,
    async (rows) => {
        // Access attributes during encoding
        const batchId = template.getAttribute('batchId');

        // Check if batch exists
        const batchExists = await checkBatchExists(batchId);
        if (!batchExists) {
            throw new Error(`Batch ${batchId} does not exist`);
        }

        // Process rows with batch context
        return rows.map(row => ({
            ...row,
            batchId,
            department: template.getAttribute('department'),
            processedAt: new Date()
        }));
    }
);
```

#### Cell Merging in Export Templates

When generating Excel templates with `SchemaExporter`, you can merge cells for attribute values using `colSpan` and `rowSpan`:

```typescript
const orderSheetSchema: SheetSchema = {
    headerRowNum: 3,
    dataRowNum: 4,
    columns: [
        {field: 'productId', text: 'Product ID', width: 120},
        {field: 'quantity', text: 'Quantity', width: 100}
    ],
    attributes: {
        // Title spanning multiple columns
        title: {
            col: 1,
            row: 0,
            colSpan: 4,  // Merge B1:E1 (4 columns)
            labelText: 'Order Title'
        },
        // Description spanning multiple columns and rows
        description: {
            col: 1,
            row: 1,
            colSpan: 4,  // Merge 4 columns
            rowSpan: 2,  // Merge 2 rows (B2:E3)
            labelText: 'Order Description'
        },
        // Regular single cell
        orderId: {
            col: 1,
            row: 4,
            labelText: 'Order ID',
            type: 'string'
        }
    }
};

// Generate template with merged cells
const exporter = new SchemaExporter(orderSheetSchema);
await exporter.downloadTemplate('order-template');
```

**Excel Layout Result:**
```
     A           B           C           D           E
1               Order Title (merged B1:E1)
2               Order Description (merged B2:E3)
3               (continues)
4   Order ID:   [Value]
5   Product ID  Quantity
```

**Note:** Cell merging only applies to template generation (`SchemaExporter`), not data import/parsing.

---

## 🌐 i18n Support

Uses `@ticatec/i18n` for automatic language switching. Extend resources for customization:

**Complete i18n Resource Files:**

- [English (i18n_en.json)](./documents/i18n_en.json)
- [中文 (i18n_zh.json)](./documents/i18n_zh.json)

**Key Text Resources:**

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

## 📖 Documentation

- [Batch Upload Guide](./documents/FileUploadWizard.md)
- [Data Encoding Guide](./documents/EncodingWizard.md)

---

## 🪪 License

MIT License © Ticatec

---

## 👨‍💻 Author

**Henry Feng** <huili.f@gmail.com>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## 📝 Changelog

### v0.2.0
- ✨ Added SchemaUploadTemplate and SchemaEncodingTemplate
- ✨ Added SchemaExporter for template generation
- ✨ Added schema/SheetSchema type definitions
- ✨ Added SchemaHelper utilities
- ✨ Added sheet-level attribute extraction
- 🗑️ Removed unused `BaseExportTemplate` (use `SchemaExporter` instead)
- 🐛 Fixed various type export issues
- 📚 Updated documentation

**Package renamed:** This package was previously published as `@ticatec/excel-wizard`. If upgrading, please update your imports:
```typescript
// Old
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';

// New
import {SchemaUploadTemplate} from '@ticatec/excel-wizard';
```

**Breaking Change:** `BaseExportTemplate` has been removed. Use `SchemaExporter` for Excel template generation:
```typescript
// Old (no longer available)
import BaseExportTemplate from '@ticatec/excel-wizard/output/BaseExportTemplate';

// New (recommended)
import {SchemaExporter} from '@ticatec/excel-wizard';
const exporter = new SchemaExporter(schema);
await exporter.downloadTemplate('filename');
```

### v0.1.x
- Initial release with BaseUploadTemplate and BaseEncodingTemplate
- FileUploadWizard and EncodingWizard components
- Error export functionality
- i18n support