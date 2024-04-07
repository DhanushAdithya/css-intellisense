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

			const cssImportRegex = /import(?:.*?)\.css['"`]/g;
			const styleTagRegex = /<style(?:.*?)[^\/]>/g;
			const classNameMatch = classNameMatchInfo(line, 0);
			if (classNameMatch) {
				const { m1, m2, index } = classNameMatch;

				const classes = m2.split(/\s+/g).filter(Boolean);
				classes.forEach(cls => {
					if (!classList.includes(cls)) {
						const start = index + m1.length + m2.indexOf(cls);
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
