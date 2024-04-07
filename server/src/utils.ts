import { Diagnostic, DocumentDiagnosticReportKind } from "vscode-languageserver";

export type TColor = {
    red: number;
    green: number;
    blue: number;
    alpha: number;
};

export type TClassInfo = {
    /** Documentation of the class */
    d: string;
    /** Color associated to the class */
    c?: string;
};

export type DecimalRange = {
    start: number;
    end: number;
};

export type TClassNameMatchInfo = {
    index: number;
    m0: string;
    m1: string;
    m2: string;
    m3: string;
    inRange: boolean;
};

export type TCSSInfo = {
    [className: string]: TClassInfo;
};

export const CLASSNAME_REGEX =
    /(className\s*=\s*(?:\{`|['"`]))([\w\-\s]+)?(`}|['"`])?/;
export const HEX_REGEX =
    /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?/g;

const items: Diagnostic[] = [];
const kind: DocumentDiagnosticReportKind = DocumentDiagnosticReportKind.Full;

export const emptyDiagonstic = { items, kind };

export const classNameMatchInfo = (line: string, character: number): TClassNameMatchInfo | null => {
    const classNameMatch = line.match(CLASSNAME_REGEX);
    if (!classNameMatch) return null;

    const [m0, m1, m2, m3] = classNameMatch;
    if (!m2 || !m0 || !m1) return null;
    const { index } = classNameMatch;
    if (!index && index !== 0) return null;

    const inRange =  !(
        character < index + (m1?.length ?? 0) ||
        character > index + (m1.length ?? 0) + (m2?.length ?? 0)
    );

    return { index, m0, m1, m2, m3, inRange };
};

export const parseHexToRGB = (hex: string): TColor | null => {
    if (!HEX_REGEX.test(hex)) return null;

    hex = hex.slice(1);
    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;

    return { red, green, blue, alpha };
};