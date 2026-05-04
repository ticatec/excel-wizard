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
import SheetSchema, { OptionsList } from '@ticatec/batch-data-uploader/schema/SheetSchema';

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

Create an upload template by extending `SchemaUploadTemplate`:

```typescript
import SchemaUploadTemplate from '@ticatec/batch-data-uploader/SchemaUploadTemplate';
import type SheetSchema from '@ticatec/batch-data-uploader/schema/SheetSchema';

class UserUploadTemplate extends SchemaUploadTemplate {
    constructor(schema: SheetSchema) {
        super(schema);
    }

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

// Usage
const template = new UserUploadTemplate(userSchema);

// Get extracted attributes
const uploadedBy = template.getAttribute('uploadedBy');
const uploadDate = template.getAttribute('uploadDate');
```

## Using SchemaEncodingTemplate

Create an encoding template for field mapping and validation:

```typescript
import SchemaEncodingTemplate, { ValidationResult } from '@ticatec/batch-data-uploader/SchemaEncodingTemplate';
import type SheetSchema from '@ticatec/batch-data-uploader/schema/SheetSchema';

class UserEncodingTemplate extends SchemaEncodingTemplate {
    constructor(schema: SheetSchema) {
        super(schema);
    }

    protected async encodeData(rows: Array<any>): Promise<Array<any>> {
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
    }

    protected validateData(row: any): ValidationResult | Promise<ValidationResult> {
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
    }
}

// Usage
const encodingTemplate = new UserEncodingTemplate(userSchema);

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

Use `SchemaExporter` to generate downloadable Excel templates with dropdown validation:

```typescript
import { SchemaExporter } from '@ticatec/batch-data-uploader/SchemaExporter';
import type SheetSchema from '@ticatec/batch-data-uploader/schema/SheetSchema';

// Create exporter
const exporter = new SchemaExporter(userSchema);

// Download empty template
await exporter.downloadTemplate('user-import-template');

// Download template with sample data
const sampleData = [
    { username: 'john_doe', email: 'john@example.com', status: 'ACTIVE', role: 'USER', department: 'IT' },
    { username: 'jane_smith', email: 'jane@example.com', status: 'PENDING', role: 'ADMIN', department: 'HR' }
];
await exporter.downloadTemplate('user-import-template', sampleData);

// Get dropdown options
const statusOptions = exporter.getDropdownOptions('status');
// Returns: ['Active', 'Inactive', 'Pending']

// Convert text to key
const statusCode = exporter.textToKey('Active', 'status');
// Returns: 'ACTIVE'
```

## Complete Example with Svelte Component

```svelte
<script lang="ts">
    import FileUploadWizard from '@ticatec/batch-data-uploader/FileUploadWizard';
    import SchemaUploadTemplate from '@ticatec/batch-data-uploader/SchemaUploadTemplate';
    import { SchemaExporter } from '@ticatec/batch-data-uploader/SchemaExporter';
    import type SheetSchema from '@ticatec/batch-data-uploader/schema/SheetSchema';
    import userSchema from './userSchema';

    class UserUploadTemplate extends SchemaUploadTemplate {
        constructor() {
            super(userSchema);
        }

        protected async uploadData(list: Array<any>) {
            // Your upload logic
        }
    }

    let template = new UserUploadTemplate();

    async function downloadTemplate() {
        const exporter = new SchemaExporter(userSchema);
        await exporter.downloadTemplate('user-template');
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

## Attributes Extraction

Extract sheet-level metadata automatically:

```typescript
// After parsing, access extracted attributes
const template = new UserUploadTemplate(userSchema);
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