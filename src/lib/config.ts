/**
 * Configuration constants for batch upload library
 *
 * @module config
 * @description Centralized configuration for batch upload operations.
 * These constants control batch processing behavior, Excel date conversion,
 * and other configurable parameters.
 *
 * @example
 * ```typescript
 * import { BATCH_CONFIG, EXCEL_DATE } from './config';
 *
 * // Use batch configuration
 * const batchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE;
 * const delay = BATCH_CONFIG.BATCH_DELAY_MS;
 *
 * // Convert Excel date to JavaScript Date
 * const jsDate = new Date((excelDateValue - EXCEL_DATE.EPOCH) * EXCEL_DATE.MS_PER_DAY);
 * ```
 */

/**
 * Batch upload processing configuration
 *
 * @description
 * Controls how data is uploaded in batches to optimize performance
 * and prevent server overload.
 *
 * @property {number} DEFAULT_BATCH_SIZE - Default number of records to process in each batch (default: 50)
 * @property {number} MIN_BATCH_SIZE - Minimum allowed batch size to prevent too-small batches (default: 1)
 * @property {number} BATCH_DELAY_MS - Delay between batch uploads in milliseconds to prevent rate limiting (default: 100)
 *
 * @example
 * ```typescript
 * // Create a custom batch size
 * const customBatchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE * 2;
 *
 * // Calculate total batches needed
 * const totalBatches = Math.ceil(totalRecords / BATCH_CONFIG.DEFAULT_BATCH_SIZE);
 * ```
 */
export const BATCH_CONFIG = {
  /**
   * Default number of records to process in each batch
   *
   * @description
   * This value balances between performance and memory usage.
   * Larger batches process faster but use more memory.
   * Smaller batches are safer for slow connections.
   *
   * @default 50
   * @minimum 1
   */
  DEFAULT_BATCH_SIZE: 50,

  /**
   * Minimum allowed batch size
   *
   * @description
   * Prevents setting batch sizes too small, which would cause
   * excessive HTTP requests and poor performance.
   *
   * @default 1
   * @minimum 1
   */
  MIN_BATCH_SIZE: 1,

  /**
   * Delay between batch uploads in milliseconds
   *
   * @description
   * Prevents overwhelming the server with rapid requests.
   * Also helps avoid rate limiting on some APIs.
   *
   * @default 100
   * @minimum 0
   */
  BATCH_DELAY_MS: 100,
} as const;

/**
 * Excel date conversion configuration
 *
 * @description
 * Excel stores dates as sequential serial numbers so they can be used
 * in calculations. By default, January 1, 1900 is serial number 1,
 * and January 1, 2008 is serial number 39448 because it is 39,448 days
 * after January 1, 1900.
 *
 * These constants handle the conversion between Excel date format
 * and JavaScript Date objects.
 *
 * @property {number} EPOCH - Excel epoch date (January 1, 1900 = 25569 in Unix timestamp)
 * @property {number} MS_PER_DAY - Number of milliseconds in a day (86400 * 1000)
 *
 * @see {@link https://support.microsoft.com/en-us/office/convert-date-and-time-to-excel-date-or-vice-versa-7ac78914-6896-4f40-bb0e-9d4dd34c38a9}
 *
 * @example
 * ```typescript
 * // Convert Excel date to JavaScript Date
 * const excelDateValue = 44532; // Represents January 1, 2022
 * const jsTimestamp = (excelDateValue - EXCEL_DATE.EPOCH) * EXCEL_DATE.MS_PER_DAY;
 * const jsDate = new Date(jsTimestamp);
 *
 * // Convert JavaScript Date to Excel date
 * const jsDate2 = new Date('2022-01-01');
 * const excelDateValue2 = (jsDate2.getTime() / EXCEL_DATE.MS_PER_DAY) + EXCEL_DATE.EPOCH;
 * ```
 */
export const EXCEL_DATE = {
  /**
   * Excel epoch date in Unix timestamp format
   *
   * @description
   * Represents January 1, 1900 00:00:00 GMT, which is the starting
   * point for Excel's date numbering system.
   *
   * Calculation: Math.floor(Date.parse("1900-01-01T00:00:00Z") / 86400000)
   *
   * @default 25569
   */
  EPOCH: 25569,

  /**
   * Number of milliseconds in a day
   *
   * @description
   * Used for converting between day-based Excel dates and
   * millisecond-based JavaScript Date objects.
   *
   * Calculation: 24 * 60 * 60 * 1000 = 86,400,000
   *
   * @default 86400000
   */
  MS_PER_DAY: 86400 * 1000,
} as const;