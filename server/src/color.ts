import {
	Color,
	ColorInformation,
	ColorPresentation,
	DocumentColorParams,
} from "vscode-languageserver";
import { TCSSInfo, TColor, classNameMatchInfo, parseHexToRGB } from "./utils";

export class ColorService {
	private CSSInfo: TCSSInfo = {};

	constructor(CSSInfo: TCSSInfo) {
		this.CSSInfo = CSSInfo;
	}

	public onDocumentColor = (
		params: DocumentColorParams,
		documentText: string,
	): ColorInformation[] => {
		const lines = documentText?.split("\n");
		if (!lines) return [];

		const colorInfo: ColorInformation[] = [];

		const cache: Record<string, TColor> = {};

		for (let i = 0; i < lines.length; ++i) {
			const line = lines[i];

			const classMatch = classNameMatchInfo(line, 0);
			if (!classMatch) continue;

			const { m1, m2, index } = classMatch;

			m2.split(/\s+/g)
				.filter(Boolean)
				.forEach(className => {
					if (this.CSSInfo[className] && this.CSSInfo[className].c) {
						const start = index + m1.length + m2.indexOf(className);
						const end = start + className.length;

						const startPos = { line: i, character: start };
						const endPos = { line: i, character: end };

						let color: TColor =
							cache[className] ||
							parseHexToRGB(this.CSSInfo[className].c as string);
						const range = { start: startPos, end: endPos };

						if (color) {
							cache[className] = color;
							colorInfo.push({ range, color });
						}
					}
				});
		}

		return colorInfo;
	};

	public onColorPresentation = (color: Color): ColorPresentation[] => {
		return [];
	};
}
