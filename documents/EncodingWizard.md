# EncodingWizard Component

A Svelte-based dialog component for parsing Excel files and mapping fields to local data structures. Perfect for client-side data import scenarios.

## Overview

**EncodingWizard** is designed for **pure client-side Excel data processing** without server interaction. It provides an interactive interface for:

- 📂 Reading local Excel files
- 🔄 Mapping Excel columns to data fields
- ✅ Validating data with custom rules
- 📝 Previewing data before processing
- ✨ Returning processed data for form filling or local use

## Use Cases

**Ideal for scenarios that require:**
- Importing configuration from Excel files
- Batch filling form fields
- Local data report generation
- Offline data processing
- Reading initialization data from templates

**❌ NOT suitable for:**
- Server-side data upload (use [FileUploadWizard](./FileUploadWizard.md) instead)
- Database batch import (use [FileUploadWizard](./FileUploadWizard.md) instead)

**Comparison:**

| Feature | EncodingWizard | FileUploadWizard |
|---------|----------------|------------------|
| **Primary Use** | Local data import | Server upload |
| **Server Interaction** | **Not required** | Required |
| **Data Flow** | Excel → Processing → Form/Local State | Excel → Validation → Server |
| **Typical Scenario** | Fill forms from Excel | Batch upload to database |

## Usage

### Schema-Based Approach (Recommended)

Using `SchemaEncodingTemplate` for a simplified, inheritance-free implementation:

```typescript
import {EncodingWizard} from '@ticatec/excel-wizard';
import {SchemaEncodingTemplate} from '@ticatec/excel-wizard';
import type {SheetSchema} from '@ticatec/excel-wizard';
import productSheetSchema from './productSheetSchema';

// Create encoding template - no inheritance needed!
class ProductEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(productSheetSchema);
    }

    // Implement encoding function (client-side processing)
    protected getEncodeFunction() {
        return async (rows) => {
            // Process data locally - no server required
            return rows.map(row => ({
                ...row,
                // Add computed fields
                total: row.price * row.quantity,
                processedAt: new Date().toISOString()
            }));
        };
    }

    // Optional: Add validation
    protected getValidateFunction() {
        return (row) => {
            if (!row.barcode) {
                return {
                    valid: false,
                    hint: 'SKU is required'
                };
            }
            return {valid: true};
        };
    }
}

const encodingTemplate = new ProductEncodingTemplate();

// Open the wizard
window.Dialog.showModal(EncodingWizard, {
    template: encodingTemplate,
    width: '1240px',
    title: 'Import Products from Excel',
    confirmCallback: (processedData) => {
        console.log('Processed data:', processedData);
        // Use the data to fill forms, update local state, etc.
        // Example:
        // - Populate form fields
        // - Update local data store
        // - Generate reports
        // - Trigger local processing
        return true;  // Close dialog
    }
});
```

### Traditional Approach (Inheritance-Based)

For advanced customization, extend `BaseEncodingTemplate`:

```typescript
import {EncodingWizard} from '@ticatec/excel-wizard';
import BaseEncodingTemplate from '@ticatec/excel-wizard/BaseEncodingTemplate';
import type {DataColumn} from '@ticatec/excel-wizard/DataColumn';

class MyEncodingTemplate extends BaseEncodingTemplate {
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

    protected async encodeData(rows: Array<any>): Promise<Array<any>> {
        // Process data locally
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
    title: 'Import Data',
    confirmCallback: (data) => {
        console.log('Imported data:', data);
        return true;
    }
});
```

## Component Properties

### Required Properties

- **template**: `SchemaEncodingTemplate | BaseEncodingTemplate`
  - An instance of encoding template used for parsing Excel files and processing data
  - Defines column mapping and data transformation logic

### Optional Properties

- **title**: `string` (default: localized "Import Data")
  - The dialog title
- **width**: `string` (default: `"1240px"`)
  - The dialog width
- **confirmCallback**: `(data: any[]) => boolean | Promise<boolean>`
  - Callback invoked when user confirms import
  - Receives the processed data array
  - Return `true` to close dialog, `false` to keep open

## Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. User opens EncodingWizard dialog                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  2. User selects local Excel file (.xlsx/.xls)         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  3. Client-side parsing:                                │
│     - Read Excel file locally (no server)              │
│     - Map columns based on schema                      │
│     - Extract data from cells                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  4. Data Validation (optional):                         │
│     - Apply custom validation rules                    │
│     - Show errors in data table                        │
│     - Highlight invalid rows                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  5. Data Transformation (encodeData):                   │
│     - Process data locally                             │
│     - Add computed fields                              │
│     - Format data as needed                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  6. Preview:                                            │
│     - Display processed data in table                  │
│     - User reviews before confirmation                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  7. User clicks Confirm:                                │
│     - invoke confirmCallback(data)                     │
│     - Return data to calling code                      │
│     - Use data for form filling, etc.                  │
└─────────────────────────────────────────────────────────┘
```

## Example Scenarios

### 1. Import Configuration from Excel

```typescript
class ConfigEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(configSheetSchema);
    }

    protected getEncodeFunction() {
        return async (rows) => {
            // Convert Excel rows to configuration object
            const config = {};
            rows.forEach(row => {
                config[row.key] = row.value;
            });
            return [config];  // Return as array for consistency
        };
    }
}

window.Dialog.showModal(EncodingWizard, {
    template: new ConfigEncodingTemplate(),
    title: 'Import Configuration',
    confirmCallback: ([config]) => {
        // Apply configuration to app
        Object.assign(appConfig, config);
        return true;
    }
});
```

### 2. Batch Fill Form Fields

```typescript
class FormFillEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(formSchema);
    }

    protected getEncodeFunction() {
        return async (rows) => {
            // Process rows for form filling
            return rows.map(row => ({
                ...row,
                // Validate and transform
                isValid: validateField(row),
                formatted: formatField(row)
            }));
        };
    }
}

window.Dialog.showModal(EncodingWizard, {
    template: new FormFillEncodingTemplate(),
    title: 'Import Form Data',
    confirmCallback: (formData) => {
        // Fill form fields
        formData.forEach((data, index) => {
            formFields[index].value = data.value;
        });
        return true;
    }
});
```

### 3. Local Data Report Generation

```typescript
class ReportEncodingTemplate extends SchemaEncodingTemplate {
    constructor() {
        super(reportSchema);
    }

    protected getEncodeFunction() {
        return async (rows) => {
            // Add calculations for report
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
    title: 'Generate Report',
    confirmCallback: (reportData) => {
        // Generate report locally
        generateReport(reportData);
        return true;
    }
});
```

## Validation

Implement custom validation logic by overriding `getValidateFunction()`:

```typescript
protected getValidateFunction() {
    return (row) => {
        // Custom validation rules
        if (!row.name || row.name.trim() === '') {
            return {
                valid: false,
                hint: 'Name is required'
            };
        }

        if (row.email && !isValidEmail(row.email)) {
            return {
                valid: false,
                hint: 'Invalid email format'
            };
        }

        if (row.age && (row.age < 18 || row.age > 65)) {
            return {
                valid: false,
                hint: 'Age must be between 18 and 65'
            };
        }

        return {valid: true};
    };
}
```

## Notes

- ✅ **Pure client-side processing** - no server interaction required
- ✅ **Flexible data transformation** - process data locally as needed
- ✅ **Custom validation** - add your own validation rules
- ✅ **Preview before confirm** - users can review data before processing
- ✅ **Internationalization** - supports multiple languages
- ⚠️ **File formats** - only accepts `.xls` and `.xlsx` files
- ⚠️ **Global dependencies** - requires `window.Indicator`, `window.Toast`, and `window.Dialog`

## Related Components

- [FileUploadWizard](./FileUploadWizard.md) - For server-side batch upload
- [SchemaHelper](../src/lib/schema/SchemaHelper.ts) - Schema utilities
- [BaseEncodingTemplate](./BaseEncodingTemplate.md) - Traditional base class