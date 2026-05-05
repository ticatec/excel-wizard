# Schema-based Template Usage Guide

This guide demonstrates how to use the schema-based generic templates (`SchemaUploadTemplate` and `SchemaEncodingTemplate`) to quickly implement Excel upload functionality.

## Overview

The schema-based approach allows you to:

1. Define your Excel structure using `SheetSchema`
2. Automatically handle column definitions and parsing
3. Convert text values to key values using options
4. Extract sheet-level attributes
5. Generate Excel templates with dropdown validation

## Define Your Schema

First, create a `SheetSchema` that defines your Excel structure:

```typescript
import SheetSchema, { OptionsList } from '@ticatec/excel-wizard/schema/SheetSchema';

// Define options for dropdown columns
const statusOptions: OptionsList = {
    list: [
        { code: 'ACTIVE', text: 'Active' },
        { code: 'INACTIVE', text: 'Inactive' },
        { code: 'PENDING', text: 'Pending' }
    ],
    keyName: 'code',  // Use 'code' as the value (default)
    textName: 'text'  // Use 'text' for display (default)
};

const roleOptions: OptionsList = {
    list: [
        { code: 'ADMIN', text: 'Administrator' },
        { code: 'USER', text: 'User' },
        { code: 'GUEST', text: 'Guest' }
    ]
};

// Define the schema
const userSchema: SheetSchema = {
    headerRowNum: 0,  // Header is on row 1 (0-indexed)
    dataRowNum: 1,    // Data starts from row 2 (0-indexed)

    options: {
        status: statusOptions,
        role: roleOptions
    },

    columns: [
        {
            field: 'username',
            text: 'Username',
            width: 150,
            align: 'left'
        },
        {
            field: 'email',
            text: 'Email',
            width: 200
        },
        {
            field: 'status',
            text: 'Status',
            width: 120,
            optionsName: 'status'  // Will convert text to code
        },
        {
            field: 'role',
            text: 'Role',
            width: 150,
            optionsName: 'role'
        },
        {
            field: 'department',
            text: 'Department',
            width: 180
        }
    ],

    attributes: {
        // Extract sheet-level metadata
        uploadedBy: {
            col: 0,
            row: 0,
            labelText: 'Uploaded By',
            type: 'string'
        },
        uploadDate: {
            col: 1,
            row: 0,
            labelText: 'Upload Date',
            type: 'date'
        }
    }
};
```

## Using SchemaUploadTemplate

Create an upload template by extending `SchemaUploadTemplate` and implementing abstract methods:

```typescript
import SchemaUploadTemplate from '@ticatec/excel-wizard/SchemaUploadTemplate';
import type SheetSchema from '@ticatec/excel-wizard/schema/SheetSchema';
import userSchema from './userSchema';

class UserUploadTemplate extends SchemaUploadTemplate {
    // Implement abstract method to provide schema
    protected getSheetSchema(): SheetSchema {
        return userSchema;
    }

    // Implement abstract method for upload logic
    protected async uploadData(list: Array<any>): Promise<Array<any>> {
        // Implement your upload logic
        const response = await fetch('/api/users/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(list)
        });

        const results = await response.json();

        // Return results with error information
        return results.map(item => ({
            error: item.success ? undefined : 'Upload failed',
            errorText: item.success ? undefined : item.message
        }));
    }
}

// Usage - no constructor arguments needed
const template = new UserUploadTemplate();

// Get extracted attributes
const uploadedBy = template.getAttribute('uploadedBy');
const uploadDate = template.getAttribute('uploadDate');
```

## Using SchemaEncodingTemplate

Create an encoding template for field mapping and validation by extending `SchemaEncodingTemplate` and implementing abstract methods:

```typescript
import SchemaEncodingTemplate, { ValidationResult, SchemaEncodeFun } from '@ticatec/excel-wizard/SchemaEncodingTemplate';
import type SheetSchema from '@ticatec/excel-wizard/schema/SheetSchema';
import userSchema from './userSchema';

class UserEncodingTemplate extends SchemaEncodingTemplate {
    // Implement abstract method to provide schema
    protected getSheetSchema(): SheetSchema {
        return userSchema;
    }

    // Implement abstract method for encoding logic
    protected getEncodeFunction(): SchemaEncodeFun {
        return async (rows: Array<any>) => {
            // Fetch data from server for enrichment
            const usernames = rows.map(row => row.username);
            const response = await fetch('/api/users/lookup', {
                method: 'POST',
                body: JSON.stringify({ usernames })
            });
            const existingUsers = await response.json();

            // Merge existing data with new data
            return rows.map(row => {
                const existing = existingUsers.find(u => u.username === row.username);
                return {
                    ...row,
                    id: existing?.id,
                    exists: !!existing
                };
            });
        };
    }

    // Optionally override validation method
    protected getValidateFunction(): (row: any) => ValidationResult {
        return (row: any): ValidationResult => {
            const errors: string[] = [];

            // Validate email format
            if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
                errors.push('Invalid email format');
            }

            // Validate username length
            if (!row.username || row.username.length < 3) {
                errors.push('Username must be at least 3 characters');
            }

            // Check for duplicate user
            if (row.exists) {
                errors.push('Username already exists');
            }

            return {
                valid: errors.length === 0,
                hint: errors.length === 0 ? 'Ready to upload' : 'Please fix errors',
                error: errors.length > 0 ? errors.join('; ') : undefined
            };
        };
    }
}

// Usage - no constructor arguments needed
const encodingTemplate = new UserEncodingTemplate();

// Check column mapping
if (encodingTemplate.hasMapping('Username')) {
    const field = encodingTemplate.getFieldName('Username');  // Returns 'username'
}

// Get valid data after validation
if (encodingTemplate.valid) {
    const validUsers = encodingTemplate.validDataList;
}
```

## Generating Excel Templates

You can now generate Excel templates directly from template instances:

```typescript
import SchemaUploadTemplate from '@ticatec/excel-wizard/SchemaUploadTemplate';
import userSchema from './userSchema';

class UserUploadTemplate extends SchemaUploadTemplate {
    protected getSheetSchema() {
        return userSchema;
    }

    protected async uploadData(rows: Array<any>) {
        // Your upload logic
    }
}

const template = new UserUploadTemplate();

// Download empty template
await template.downloadTemplate('user-import-template');

// Download template with sample data
const sampleData = [
    { username: 'john_doe', email: 'john@example.com', status: 'ACTIVE', role: 'USER', department: 'IT' },
    { username: 'jane_smith', email: 'jane@example.com', status: 'PENDING', role: 'ADMIN', department: 'HR' }
];
await template.downloadTemplate('user-import-template', sampleData);

// Get dropdown options
const statusOptions = template.getDropdownOptions('status');
// Returns: ['Active', 'Inactive', 'Pending']

// Convert text to key
const statusCode = template.textToKey('Active', 'status');
// Returns: 'ACTIVE'
```

Or use `SchemaHelper` directly:

```typescript
import { SchemaHelper } from '@ticatec/excel-wizard';

const helper = new SchemaHelper(userSchema);

// Download template
await helper.downloadTemplate('user-import-template');

// Get dropdown options
const statusOptions = helper.getDropdownOptions('status');
```

## Complete Example with Svelte Component

```svelte
<script lang="ts">
    import FileUploadWizard from '@ticatec/excel-wizard/FileUploadWizard';
    import SchemaUploadTemplate from '@ticatec/excel-wizard/SchemaUploadTemplate';
    import userSchema from './userSchema';

    class UserUploadTemplate extends SchemaUploadTemplate {
        protected getSheetSchema() {
            return userSchema;
        }

        protected async uploadData(list: Array<any>) {
            // Your upload logic
            const response = await fetch('/api/users/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(list)
            });
            return await response.json();
        }
    }

    let template = new UserUploadTemplate();

    async function downloadTemplate() {
        await template.downloadTemplate('user-template');
    }
</script>

<div>
    <button on:click={downloadTemplate}>Download Template</button>

    <FileUploadWizard
        bind:template={template}
        onUploadComplete={() => console.log('Upload complete!')}
    />
</div>
```

## Options Conversion

The schema system automatically handles text-to-key conversion:

1. **Upload**: When users select "Active" from dropdown, it's converted to "ACTIVE" (code)
2. **Download**: When exporting data, "ACTIVE" is converted back to "Active" for display

Default field names:
- `keyName`: `'code'` - the actual value to use
- `textName`: `'text'` - the display text

You can customize these in the `OptionsList` definition:

```typescript
const customOptions: OptionsList = {
    list: [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' }
    ],
    keyName: 'value',
    textName: 'label'
};
```

### Custom Parser and Formatter

For complex display formats like "CODE - Description", you can use custom parser and formatter functions:

```typescript
const categoryOptions: OptionsList = {
    list: [
        { code: 'ELEC', text: 'Electronics' },
        { code: 'CLOT', text: 'Clothing' },
        { code: 'FOOD', text: 'Food' }
    ],
    keyName: 'code',
    textName: 'text',

    // Parse "ELEC - Electronics" → "ELEC" during upload
    parser: (value) => {
        const parts = String(value).split(' - ');
        return parts[0].trim();
    },

    // Format "ELEC" → "ELEC - Electronics" during download
    formatter: (key, list) => {
        const item = list.find(i => i.code === key);
        return item ? `${key} - ${item.text}` : key;
    }
};

const schema: SheetSchema = {
    headerRowNum: 0,
    dataRowNum: 1,
    options: {
        categories: categoryOptions
    },
    columns: [
        {
            field: 'category',
            text: 'Category',
            width: 200,
            optionsName: 'categories'  // Uses parser/formatter from options
        }
    ]
};
```

**Parser Priority:**

When a column has both `optionsName` and a `parser` in ColumnSchema:

1. **Highest Priority**: `OptionsList.parser` (if optionsName is specified and OptionsList.parser exists)
2. **Medium Priority**: `ColumnSchema.parser` (if specified)
3. **Low Priority**: Default options text-to-key lookup (if optionsName is specified)
4. **No Conversion**: When neither parser nor optionsName is specified

For options-based columns, prefer defining parser in `OptionsList` rather than `ColumnSchema`:

```typescript
// ✅ Recommended: Use OptionsList.parser for options columns
const categoryOptions: OptionsList = {
    list: [...],
    parser: (value) => value.split(' - ')[0]
};

// ❌ Avoid: ColumnSchema.parser is ignored when OptionsList.parser exists
const column: ColumnSchema = {
    field: 'category',
    optionsName: 'categories',
    parser: (value) => value.split(' - ')[0]  // Ignored if OptionsList.parser exists
};
```

## Attributes Extraction

Extract sheet-level metadata automatically:

```typescript
// After parsing, access extracted attributes
const template = new UserUploadTemplate();
await template.setFile(file);
await template.parseSheet();

const attributes = template.getAttributes();
console.log(attributes.uploadedBy);  // 'John Doe'
console.log(attributes.uploadDate);  // Date object

// Or get individual attribute
const uploader = template.getAttribute('uploadedBy');
```

## Type Safety with Attributes

Define attribute types for better type safety:

```typescript
interface UserAttributes {
    uploadedBy: string;
    uploadDate: Date;
    version: number;
}

const attributes = template.getAttributes() as UserAttributes;
const uploader: string = attributes.uploadedBy;
const date: Date = attributes.uploadDate;
```

## Summary

The schema-based approach provides:

1. ✅ **Declarative schema** - Define structure once
2. ✅ **Auto column generation** - No manual column definitions
3. ✅ **Options conversion** - Automatic text↔key conversion
4. ✅ **Attributes extraction** - Sheet-level metadata
5. ✅ **Template generation** - Excel with dropdown validation
6. ✅ **Type safety** - Full TypeScript support

Use this approach when you have a well-defined Excel structure and want to minimize boilerplate code.