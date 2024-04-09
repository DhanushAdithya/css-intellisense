import {
	CompletionItem,
	CompletionItemKind,
	Diagnostic,
	DocumentDiagnosticReportKind,
	TextEdit,
} from "vscode-languageserver";

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

export const DiagnosticMessage = {
	unknownClassName: (className: string) =>
		`Class "${className}" not found in Global stylesheet`,
	avoidStyleTag: "Avoid using <style> tag",
	avoidInlineStyle: "Avoid using inline style",
	avoidCSSImport: "Avoid using CSS/SCSS import",
	duplicateClassName: "Duplicate class name",
};

export const CLASSNAME_REGEX =
    /(className\s*=\s*(?:\{?['"`]))([\w\-\s]+)?(['"`])?/; 

const items: Diagnostic[] = [];
const kind: DocumentDiagnosticReportKind = DocumentDiagnosticReportKind.Full;

export const emptyDiagonstic = { items, kind };

export const createCompletionItem = (
	label: string,
	classInfo: TClassInfo,
	partialMatch: boolean = false,
	textEdit?: TextEdit,
): CompletionItem => {
	const color = classInfo.c;
	return {
		label,
		kind: color ? CompletionItemKind.Color : CompletionItemKind.Constant,
		...(color ? { detail: color } : {}),
		...(partialMatch ? { textEdit } : {}),
	};
};

export const classNameMatchInfo = (line: string, character: number): TClassNameMatchInfo | null => {
    const classNameMatch = line.match(CLASSNAME_REGEX);
    if (!classNameMatch) return null;

    const [m0, m1, m2, m3] = classNameMatch;
    if (!m0 || !m1 || !m2) return null;
    const { index } = classNameMatch;
    if (!index && index !== 0) return null;

    const inRange =  !(
        character < index + m1.length ||
        character > index + m1.length + m2.length
    );

    return { index, m0, m1, m2, m3, inRange };
};

export const parseHexToRGB = (hex: string): TColor | null => {
    if (!hex.startsWith("#")) return null;
    hex = hex.replace("#", "");

    if (hex.length === 3) hex = hex.replace(/(.)/g, "$1$1") + "ff";
    else if (hex.length === 6) hex += "ff";
    else if (hex.length === 8) {}
    else return null;

    const red = parseInt(hex.slice(0, 2), 16) / 255;
    const green = parseInt(hex.slice(2, 4), 16) / 255;
    const blue = parseInt(hex.slice(4, 6), 16) / 255;
    const alpha = parseInt(hex.slice(6, 8), 16) / 255;

    return { red, green, blue, alpha };
};
