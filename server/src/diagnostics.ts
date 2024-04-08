import {
	Diagnostic,
	DiagnosticSeverity,
	DocumentDiagnosticParams,
	DocumentDiagnosticReport,
	DocumentDiagnosticReportKind,
} from "vscode-languageserver";
import { TCSSInfo, classNameMatchInfo, emptyDiagonstic } from "./utils";

export class DiagnosticsService {
	private CSSInfo: TCSSInfo = {};

	constructor(CSSInfo: TCSSInfo) {
		this.CSSInfo = CSSInfo;
	}

	public handleDiagnostics = (
		params: DocumentDiagnosticParams,
		documentText: string,
	): DocumentDiagnosticReport => {
		const lines = documentText.split("\n");
		const items: Diagnostic[] = [];
		const kind: DocumentDiagnosticReportKind =
			DocumentDiagnosticReportKind.Full;
		if (!lines) return emptyDiagonstic;

		const classList = Object.keys(this.CSSInfo);

		for (let i = 0; i < lines?.length; ++i) {
			const line = lines[i];

			const cssImportRegex = /import(?:.*?)\.s?css['"`]/g;
			const styleTagRegex = /<style(?:.*?)[^\/]>/g;
			const classNameMatch = classNameMatchInfo(line, 0);
			if (classNameMatch) {
				const { m1, m2, index } = classNameMatch;

                const classesSplitWithSpaces = m2.split(/(\s+)/g)
				const classes = classesSplitWithSpaces.filter(cls => cls.trim().length);
                const classFreq = classes.reduce((acc, val) => {
                    acc[val] = acc[val] ? acc[val] + 1 : 1;
                    return acc;
                }, {} as Record<string, number>);
				classes.forEach(cls => {
					if (!classList.includes(cls)) {
                        const unknownClassIdx = classesSplitWithSpaces.indexOf(cls);
						const start = index + m1.length + classesSplitWithSpaces.slice(0, unknownClassIdx).join("").length;
						const end = start + cls.length;

						const startPos = { line: i, character: start };
						const endPos = { line: i, character: end };

						items.push({
							message: "Unknown CSS class name",
							range: {
								start: startPos,
								end: endPos,
							},
							severity: DiagnosticSeverity.Warning,
						});
					}
				});
			} else if (line.match(cssImportRegex)) {
				items.push({
					message: "Avoid importing CSS files",
					range: {
						start: { line: i, character: 0 },
						end: { line: i, character: line.length },
					},
					severity: DiagnosticSeverity.Warning,
				});
			} else if (line.match(styleTagRegex)) {
				items.push({
					message: "Avoid using style tags",
					range: {
						start: { line: i, character: 0 },
						end: { line: i, character: line.length },
					},
					severity: DiagnosticSeverity.Warning,
				});
			} else continue;
		}

		return { items, kind };
	};
}
