import { Hover, HoverParams, Position, Range } from "vscode-languageserver";
import {
	DecimalRange,
	TCSSInfo,
	TClassInfo,
	classNameMatchInfo,
} from "./utils";

export class HoverService {
	private CSS_INFO: TCSSInfo = {};

	constructor(CSSInfo: TCSSInfo) {
		this.CSS_INFO = CSSInfo;
	}

	public onHover = (
		params: HoverParams,
		documentText: string,
	): Hover | null => {
		const { position } = params;

		const line = documentText.split("\n")[position.line];
		if (!line) return null;

		const hoverInfo = this.checkIfCursorIsOnClassName(
			line,
			position.character,
		);
		if (!hoverInfo) return null;

		const startPos: Position = {
			line: position.line,
			character: hoverInfo.start,
		};
		const endPos: Position = {
			line: position.line,
			character: hoverInfo.end,
		};

		const range: Range = {
			start: startPos,
			end: endPos,
		};
		let hover: Hover = {
			range,
			contents: hoverInfo.d,
		};

		return hover;
	};

	private checkIfCursorIsOnClassName = (
		line: string,
		character: number,
	): (TClassInfo & DecimalRange) | null => {
		const classNameMatch = classNameMatchInfo(line, character);
		if (!classNameMatch) return null;

		const { m0, m1, m2, m3, index, inRange } = classNameMatch;
		if (!inRange) return null;

		const char = character - (index + m1.length);

		const start = m2.lastIndexOf(" ", char) + 1 + index + m1.length;
		const end =
			line.indexOf(" ", character) < 0
				? m0.length + index - (m3?.length ?? 0)
				: line.indexOf(" ", character);

		const key = line.slice(start, end).trim();

		const classInfo = this.CSS_INFO[key];
		if (!classInfo) return null;

		return { ...classInfo, start, end };
	};
}
