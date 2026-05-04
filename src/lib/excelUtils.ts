/**
 * Excel utility functions shared across the library
 */

/**
 * Encode cell address to A1 notation
 * Converts numeric row and column indices to Excel cell address (e.g., A1, B2, C3)
 * @param address - Object containing row and column indices (0-based)
 * @returns Excel cell address in A1 notation
 */
export function encodeCellAddress(address: {row: number, col: number}): string {
    const col = address.col;
    const row = address.row;

    // Convert column number to letter (0=A, 1=B, etc.)
    let colLetter = '';
    let colNum = col;
    while (colNum >= 0) {
        colLetter = String.fromCharCode((colNum % 26) + 65) + colLetter;
        colNum = Math.floor(colNum / 26) - 1;
    }

    return `${colLetter}${row + 1}`;
}

/**
 * Decode range from Excel notation
 * Converts Excel range notation (e.g., A1:B10) to numeric indices
 * @param range - Excel range in A1 notation (e.g., "A1:B10")
 * @returns Object with start (s) and end (e) positions containing row (r) and column (c) indices
 */
export function decodeRange(range: string): {s: {r: number, c: number}, e: {r: number, c: number}} {
    const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (!match) {
        return {s: {r: 0, c: 0}, e: {r: 0, c: 0}};
    }

    const colToNum = (col: string): number => {
        let num = 0;
        for (let i = 0; i < col.length; i++) {
            num = num * 26 + (col.charCodeAt(i) - 64);
        }
        return num - 1;
    };

    return {
        s: {c: colToNum(match[1]), r: parseInt(match[2]) - 1},
        e: {c: colToNum(match[3]), r: parseInt(match[4]) - 1}
    };
}