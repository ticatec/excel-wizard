import type {SetAttributeValue} from "$lib/DataColumn";

/**
 * Options list for dropdown columns
 *
 * Defines an array of option objects for columns with dropdown validation.
 * Each option is a simple object with key-value pairs.
 *
 * @example
 * ```typescript
 * const statusOptions: OptionsList = {
 *     list: [
 *         {code: 'ACTIVE', text: 'Active', color: 'green'},
 *         {code: 'INACTIVE', text: 'Inactive', color: 'gray'}
 *     ],
 *     keyName: 'code',    // Field name for the key value
 *     textName: 'text'    // Field name for display text
 * };
 *
 * // With custom parser and toOptions
 * const categoryOptions: OptionsList = {
 *     list: [
 *         {code: 'ELEC', text: 'Electronics'},
 *         {code: 'CLOT', text: 'Clothing'}
 *     ],
 *     keyName: 'code',
 *     textName: 'text',
 *     parser: (text) => text.split(' - ')[0],
 *     toOptions: (list) => list.map(item => `${item.code} - ${item.text}`)
 * };
 * ```
 */
export interface OptionsList {
    /** Array of option objects, e.g., [{code: "A", text: "产品A"}, {code: "B", text: "产品B"}] */
    list: any[];

    /** Field name in list objects that contains the key value. Defaults to 'code' */
    keyName?: string;

    /** Field name in list objects that contains the display text. Defaults to 'text' */
    textName?: string;

    /**
     * Custom parser function for extracting key from display text
     *
     * When specified, this function is used instead of the default text-to-key lookup.
     * Use this for complex display formats like "CODE - Description".
     *
     * If not provided, uses default text-to-key lookup via textName field.
     *
     * @param value - The raw value from the Excel cell
     * @returns The parsed/converted key value
     *
     * @example
     * ```typescript
     * // Parse "CODE - Description" format
     * parser: (value) => {
     *     const parts = String(value).split(' - ');
     *     return parts[0].trim();  // Return the code part
     * }
     *
     * // Parse "CODE：Description" (Chinese colon)
     * parser: (value) => {
     *     const parts = String(value).split('：');
     *     return parts[0].trim();
     * }
     *
     * // Parse with regex
     * parser: (value) => {
     *     const match = String(value).match(/^([A-Z]+)\s*-\s*(.+)$/);
     *     return match ? match[1] : value;
     * }
     * ```
     */
    parser?: (value: any) => any;

    /**
     * Custom function to generate dropdown options
     *
     * When specified, this function converts the options list into an array of
     * dropdown option strings for Excel validation. If not provided, defaults to
     * returning the textName field values.
     *
     * @param list - The full options list
     * @returns Array of dropdown option strings
     *
     * @example
     * ```typescript
     * // Generate "CODE - Description" format
     * toOptions: (list) => {
     *     const keyName = 'code';
     *     const textName = 'text';
     *     return list.map(item => `${item[keyName]} - ${item[textName]}`);
     * }
     *
     * // Generate with emoji prefix
     * toOptions: (list) => {
     *     return list.map(item => `${item.emoji} ${item.text}`);
     * }
     *
     * // Generate with Chinese style
     * toOptions: (list) => {
     *     return list.map(item => `${item.code}：${item.text}`);
     * }
     * ```
     */
    toOptions?: (list: any[]) => string[];
}

/**
 * Column schema definition
 *
 * Defines how a column should be displayed, parsed, and validated.
 * Used in SheetSchema to configure Excel column behavior.
 *
 * @example
 * ```typescript
 * const nameColumn: ColumnSchema = {
 *     field: 'username',
 *     text: 'Username',
 *     width: 150,
 *     align: 'left',
 *     resizable: true,
 *     parser: (value) => String(value).trim()
 * };
 *
 * const statusColumn: ColumnSchema = {
 *     field: 'status',
 *     text: 'Status',
 *     width: 120,
 *     optionsName: 'statusOptions'  // References options in SheetSchema.options
 * };
 * ```
 */
export interface ColumnSchema {
    /**
     * Data field name that this column maps to
     * Used as the key in the data object
     */
    field: string;

    /**
     * Whether to ignore this field during upload
     * When true, the column is displayed but not included in upload data
     * @default false
     */
    ignore?: boolean;

    /**
     * Whether this is a dummy column
     * When true, the column is not parsed and only used for display
     * @default false
     */
    dummy?: boolean;

    /**
     * Column header text displayed in the UI and Excel
     */
    text: string;

    /**
     * Text alignment for the column
     * @default 'left'
     */
    align?: 'left' | 'center' | 'right';

    /**
     * Column width in pixels
     */
    width: number;

    /**
     * Minimum column width in pixels
     * Prevents column from being resized too small
     */
    minWidth?: number;

    /**
     * Whether text wrapping is allowed in this column
     * @default false
     */
    wrap?: boolean;

    /**
     * Whether the column width can be resized by the user
     * @default true
     */
    resizable?: boolean;

    /**
     * Name of the options list to use for this column (must be defined in SheetSchema.options)
     *
     * When specified:
     * - Dropdown validation is added in generated Excel templates
     * - Display text is automatically converted to key values during parsing
     * - Key values are automatically converted to display text during export
     *
     * @example
     * ```typescript
     * // In SheetSchema
     * options: {
     *     categories: {
     *         list: [
     *             {code: 'ELEC', text: 'Electronics'},
     *             {code: 'CLOT', text: 'Clothing'}
     *         ],
     *         keyName: 'code',
     *         textName: 'text'
     *     }
     * }
     *
     * // In ColumnSchema
     * {field: 'category', text: 'Category', optionsName: 'categories'}
     * // Parses "Electronics" → "ELEC"
     * // Exports "ELEC" → "Electronics"
     * ```
     */
    optionsName?: string;

    /**
     * Custom parser function for converting cell values
     *
     * **Parser Priority (when optionsName is specified):**
     * When `optionsName` is set and the corresponding OptionsList has a `parser`,
     * the OptionsList.parser takes priority over ColumnSchema.parser.
     *
     * Resolution order:
     * 1. OptionsList.parser (if optionsName is specified and OptionsList.parser exists)
     * 2. ColumnSchema.parser (if specified)
     * 3. Default options conversion (if optionsName is specified)
     * 4. No conversion (if neither parser nor optionsName is specified)
     *
     * Use this for complex parsing or validation requirements when NOT using options.
     * For options-based columns, prefer defining parser in OptionsList.
     *
     * @param value - The raw value from the Excel cell
     * @returns The parsed/converted value
     *
     * @example
     * ```typescript
     * // Without options (uses ColumnSchema.parser)
     * parser: (value) => {
     *     if (typeof value === 'string') {
     *         return value.toUpperCase().trim();
     *     }
     *     return value;
     * }
     *
     * // With options (prefer OptionsList.parser instead)
     * // ColumnSchema:
     * {field: 'category', text: 'Category', optionsName: 'categories'}
     *
     * // OptionsList (parser here takes priority):
     * categories: {
     *     list: [{code: 'ELEC', text: 'Electronics'}],
     *     parser: (value) => value.split(' - ')[0]
     * }
     * ```
     */
    parser?: (value: any) => any;

    /**
     * Column hint text for Excel template (download only)
     *
     * When specified, displays a hint row below the header in generated templates.
     * The hint text helps users understand what data to enter in each column.
     *
     * Only used when SheetSchema.showHint is true.
     *
     * @example
     * ```typescript
     * // In SheetSchema
     * {showHint: true, headerRowNum: 0}
     *
     * // In ColumnSchema
     * {
     *     field: 'email',
     *     text: 'Email',
     *     hint: 'Required. Must be a valid email address.',
     *     width: 200
     * }
     *
     * // Excel layout:
     * // Row 1: Email (header)
     * // Row 2: Required. Must be a valid email address. (hint)
     * // Row 3: [Data starts here]
     * ```
     */
    hint?: string;

    /**
     * Column decoration for Excel data export (optional)
     *
     * When specified, applies custom styling to data cells in this column
     * during Excel export. Affects all data cells but not header or hint rows.
     *
     * Used for:
     * - Custom column width for Excel
     * - Font styling (size, bold, italic, color)
     * - Background color
     * - Text alignment and wrapping
     * - Number formatting
     *
     * @example
     * ```typescript
     * // Price column with custom styling
     * {
     *     field: 'price',
     *     text: 'Price',
     *     width: 120,
     *     decoration: {
     *         width: 100,           // Excel column width (overrides width)
     *         fontSize: 12,
     *         color: '000000',
     *         fillColor: 'FFFFCC',  // Light yellow background
     *         align: 'right',
     *         format: '#,##0.00'    // Number format
     *     }
     * }
     *
     * // Status column with bold blue text
     * {
     *     field: 'status',
     *     text: 'Status',
     *     width: 100,
     *     decoration: {
     *         fontSize: 11,
     *         bold: true,
     *         color: '0000FF',      // Blue text
     *         align: 'center',
     *         verticalAlign: 'middle'
     *     }
     * }
     * ```
     */
    decoration?: ColumnDecoration;

    /**
     * 手工设定值
     */
    setValue?: SetAttributeValue;

    formatter?: (value: any) => any;
}

/**
 * Supported cell value types for attribute extraction
 */
export type CellValueType = "string" | "number" | "boolean" | "date" | "datetime";

/**
 * Sheet-level attribute schema
 *
 * Defines metadata that applies to the entire sheet (e.g., batch ID, department, date).
 * These attributes are extracted from specific cells and can be used in upload/encoding logic.
 *
 * @example
 * ```typescript
 * const batchIdAttr: AttributesSchema = {
 *     col: 1,           // Column B (0-based)
 *     row: 0,           // Row 1 (0-based)
 *     type: 'string'    // Convert to string
 * };
 *
 * // In SheetSchema
 * attributes: {
 *     batchId: batchIdAttr  // Key 'batchId' becomes attrs.batchId
 * }
 * ```
 */
export interface AttributesSchema {
    /**
     * Column index where the attribute value is located (0-based)
     */
    col: number;

    /**
     * Row index where the attribute value is located (0-based)
     */
    row: number;

    /**
     * Data type for type conversion
     *
     * When specified, the extracted value is automatically converted to this type.
     * Supports: string, number, boolean, date, datetime
     */
    type?: CellValueType;
}

/**
 * Cell decoration for template export
 *
 * Defines text and styling for fixed cells in generated Excel templates.
 * Used for adding titles, instructions, labels, or any static content.
 *
 * @example
 * ```typescript
 * const titleDecoration: TemplateDecoration = {
 *     col: 0,
 *     row: 0,
 *     text: 'Product Import Template',
 *     fontSize: 16,
 *     bold: true,
 *     color: 'FF0000',
 *     align: 'center'
 * };
 *
 * const instructionDecoration: TemplateDecoration = {
 *     col: 0,
 *     row: 1,
 *     text: 'Please fill in all required fields marked with *',
 *     italic: true,
 *     color: '666666',
 *     colSpan: 5  // Spans across 5 columns
 * };
 * ```
 */
export interface TemplateDecoration {
    /**
     * Column index where the decoration is located (0-based)
     */
    col: number;

    /**
     * Row index where the decoration is located (0-based)
     */
    row: number;

    /**
     * Text to display in the cell
     */
    text?: string;

    /**
     * Column span for cell merging (must be >= 1)
     *
     * If > 1, merges col, col+1, ..., col+colSpan-1
     * For example, colSpan=3 merges 3 columns starting from col
     *
     * @example
     * ```typescript
     * {col: 0, row: 0, colSpan: 5}  // Merges A1:E1
     * ```
     */
    colSpan?: number;

    /**
     * Row span for cell merging (must be >= 1)
     *
     * If > 1, merges row, row+1, ..., row+rowSpan-1
     * For example, rowSpan=2 merges 2 rows starting from row
     *
     * @example
     * ```typescript
     * {col: 0, row: 0, rowSpan: 2}  // Merges A1:A2
     * ```
     */
    rowSpan?: number;

    /**
     * Font size in points
     *
     * @example
     * ```typescript
     * fontSize: 14  // 14pt font
     * ```
     */
    fontSize?: number;

    /**
     * Whether the text is bold
     * @default false
     */
    bold?: boolean;

    /**
     * Whether the text is italic
     * @default false
     */
    italic?: boolean;

    /**
     * Text color in hex format (without #)
     *
     * @example
     * ```typescript
     * color: 'FF0000'     // Red
     * color: '00FF00'     // Green
     * color: '0000FF'     // Blue
     * color: '333333'     // Dark gray
     * ```
     */
    color?: string;

    /**
     * Background fill color in hex format (without #)
     *
     * @example
     * ```typescript
     * fillColor: 'FFFF00'     // Yellow
     * fillColor: 'E0E0E0'     // Light gray
     * fillColor: 'FFE0E0'     // Light red
     * ```
     */
    fillColor?: string;

    /**
     * Horizontal alignment
     * @default 'left'
     */
    align?: 'left' | 'center' | 'right';

    /**
     * Vertical alignment
     * @default 'middle'
     */
    verticalAlign?: 'top' | 'middle' | 'bottom';

    /**
     * Whether text wrapping is enabled
     * @default false
     */
    wrapText?: boolean;
}

/**
 * Column decoration for Excel data export
 *
 * Defines styling for data cells in a specific column during Excel export.
 * Applied to all data cells in the column (not header or hint rows).
 *
 * @example
 * ```typescript
 * const priceDecoration: ColumnDecoration = {
 *     width: 100,           // Excel column width
 *     fontSize: 12,
 *     color: '000000',
 *     fillColor: 'FFFFCC',  // Light yellow for price columns
 *     align: 'right',
 *     format: '#,##0.00'    // Number format
 * };
 *
 * const statusDecoration: ColumnDecoration = {
 *     fontSize: 11,
 *     bold: true,
 *     color: '0000FF',      // Blue text
 *     align: 'center',
 *     verticalAlign: 'middle'
 * };
 * ```
 */
export interface ColumnDecoration {
    /**
     * Excel column width (optional)
     *
     * If specified, overrides the column's width for Excel export only.
     * If not specified, uses the column's width.
     */
    width?: number;

    /**
     * Font size in points
     */
    fontSize?: number;

    /**
     * Whether the text is bold
     * @default false
     */
    bold?: boolean;

    /**
     * Whether the text is italic
     * @default false
     */
    italic?: boolean;

    /**
     * Text color in hex format (without #)
     *
     * @example
     * ```typescript
     * color: 'FF0000'     // Red
     * color: '00FF00'     // Green
     * color: '0000FF'     // Blue
     * color: '333333'     // Dark gray
     * ```
     */
    color?: string;

    /**
     * Background fill color in hex format (without #)
     *
     * @example
     * ```typescript
     * fillColor: 'FFFF00'     // Yellow
     * fillColor: 'E0E0E0'     // Light gray
     * fillColor: 'FFE0E0'     // Light red
     * ```
     */
    fillColor?: string;

    /**
     * Horizontal alignment
     * @default 'left'
     */
    align?: 'left' | 'center' | 'right';

    /**
     * Vertical alignment
     * @default 'middle'
     */
    verticalAlign?: 'top' | 'middle' | 'bottom';

    /**
     * Whether text wrapping is enabled
     * @default false
     */
    wrapText?: boolean;

    /**
     * Number format code for Excel
     *
     * Used to format numbers, dates, currencies, etc.
     *
     * @example
     * ```typescript
     * format: '#,##0.00'        // Number with 2 decimal places
     * format: '0.00%'           // Percentage
     * format: '$#,##0.00'       // Currency
     * format: 'yyyy-mm-dd'      // Date format
     * format: 'dd/mm/yyyy'      // Date format
     * ```
     */
    format?: string;
}

/**
 * Sheet schema definition
 *
 * Complete definition of an Excel sheet's structure, including columns, options,
 * and metadata attributes. Used by SchemaUploadTemplate and SchemaEncodingTemplate.
 *
 * @example
 * ```typescript
 * const userSheetSchema: SheetSchema = {
 *     headerRowNum: 0,    // Headers in row 1 (0-based)
 *     showHint: true,     // Show hint row below header
 *     columns: [
 *         {
 *             field: 'username',
 *             text: 'Username',
 *             width: 150,
 *             hint: 'Required. Must be unique.',
 *             parser: (v) => String(v).trim()
 *         },
 *         {
 *             field: 'email',
 *             text: 'Email',
 *             width: 200,
 *             hint: 'Required. Must be a valid email address.'
 *         },
 *         {
 *             field: 'status',
 *             text: 'Status',
 *             width: 120,
 *             optionsName: 'statusOptions',
 *             hint: 'Select from dropdown'
 *         }
 *     ],
 *     options: {
 *         statusOptions: {
 *             list: [
 *                 {code: 'ACTIVE', text: 'Active'},
 *                 {code: 'INACTIVE', text: 'Inactive'}
 *             ],
 *             keyName: 'code',
 *             textName: 'text'
 *         }
 *     },
 *     attributes: {
 *         batchId: {
 *             col: 1,
 *             row: 0,
 *             labelText: 'Batch ID',
 *             type: 'string'
 *         }
 *     }
 * };
 * ```
 */
export interface SheetSchema {
    /**
     * Dictionary of option lists for dropdown columns
     *
     * Key is the optionsName referenced in ColumnSchema.optionsName
     * Value is the OptionsList definition
     *
     * Used for:
     * - Adding dropdown validation in generated Excel templates
     * - Converting display text to key values during parsing
     * - Converting key values to display text during export
     */
    options?: Record<string, OptionsList>;

    /**
     * Header row number (0-based)
     *
     * The row that contains column headers.
     * For example, if headers are in the first row, set to 0.
     */
    headerRowNum: number;

    /**
     * Whether to show hint row below header in Excel templates
     *
     * When true, displays a hint row between header and data rows.
     * - Without hint: data starts at headerRowNum + 1
     * - With hint: data starts at headerRowNum + 2
     *
     * @default false
     *
     * @example
     * ```typescript
     * // Without hint row
     * {headerRowNum: 0, showHint: false}
     * // Excel layout:
     * // Row 1: [Header]
     * // Row 2: [Data starts here]
     *
     * // With hint row
     * {headerRowNum: 0, showHint: true}
     * // Excel layout:
     * // Row 1: [Header]
     * // Row 2: [Hints from ColumnSchema.hint]
     * // Row 3: [Data starts here]
     * ```
     */
    showHint?: boolean;

    /**
     * Array of column definitions
     *
     * Defines all columns in the sheet, including their display properties,
     * data mapping, and any special parsing logic.
     */
    columns: ColumnSchema[];

    /**
     * Sheet-level metadata attributes
     *
     * Key is the attribute name used in code
     * Value defines where the attribute is located in the Excel sheet
     *
     * These attributes are extracted after parsing and can be accessed via:
     * - template.getAttributes() - Get all attributes
     * - template.getAttribute('name') - Get specific attribute
     *
     * @example
     * ```typescript
     * attributes: {
     *     batchId: {
     *         col: 1,
     *         row: 0,
     *         labelText: 'Batch ID',
     *         type: 'string'
     *     },
     *     uploadDate: {
     *         col: 3,
     *         row: 0,
     *         labelText: 'Upload Date',
     *         type: 'date'
     *     }
     * }
     * ```
     */
    attributes?: Record<string, AttributesSchema>;

    /**
     * Cell decorations for template export
     *
     * Array of decorative cells to add to generated Excel templates.
     * Each decoration can contain text and styling (font, color, fill, alignment, merging).
     *
     * Used for adding:
     * - Titles and headers
     * - Instructions and hints
     * - Labels and static text
     * - Visual separators and highlights
     *
     * @example
     * ```typescript
     * decorations: [
     *     {
     *         col: 0,
     *         row: 0,
     *         text: 'Product Import Template',
     *         fontSize: 16,
     *         bold: true,
     *         color: 'FF0000',
     *         align: 'center',
     *         colSpan: 5
     *     },
     *     {
     *         col: 0,
     *         row: 1,
     *         text: 'Please fill in all required fields',
     *         italic: true,
     *         color: '666666',
     *         fillColor: 'FFFFE0'
     *     }
     * ]
     * ```
     */
    decorations?: TemplateDecoration[];
}