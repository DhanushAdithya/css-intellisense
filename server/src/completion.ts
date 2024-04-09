import {
	CompletionItem,
	CompletionItemKind,
	CompletionParams,
	MarkupKind,
	Position,
	Range,
} from "vscode-languageserver";
import { classNameMatchInfo, createCompletionItem, TCSSInfo } from "./utils";

export class CompletionService {
	private CSS_INFO: TCSSInfo = {};

	constructor(cssInfo: TCSSInfo) {
		this.CSS_INFO = cssInfo;
	}

	public onCompletion = (
		params: CompletionParams,
		documentText: string,
	): CompletionItem[] => {
		const { position } = params;

		const line = documentText.split("\n")[position.line];
		if (!line) return [];

		const isInsideClassName = classNameMatchInfo(line, position.character);
		if (!isInsideClassName) return [];
		const { inRange, m1, index, m2 } = isInsideClassName;
		if (!inRange) return [];

		const characterRelativeToM2 = position.character - (index + m1.length);
		const classesSplitWithSpaces = m2
			.slice(0, characterRelativeToM2)
			.split(/(\s+)/g);
		const classWord = classesSplitWithSpaces.pop() || "";

		const start =
			index +
			m1.length +
			m2.slice(0, characterRelativeToM2).lastIndexOf(" ") +
			1;
		const end = start + classWord.length;

		const startPos: Position = { line: position.line, character: start };
		const endPos: Position = { line: position.line, character: end };

		const range: Range = { start: startPos, end: endPos };

		const allClasses = Object.keys(this.CSS_INFO);

		return classWord.trim().length === 0
			? allClasses.map(key => createCompletionItem(key, this.CSS_INFO[key]))
			: allClasses.map(key =>
					createCompletionItem(key, this.CSS_INFO[key], true, {
						range,
						newText: key,
					}),
				);
	};

	public onCompletionResolve = (item: CompletionItem) => {
		const { label } = item;
		const classInfo = this.CSS_INFO[label];
		if (!classInfo) return item;

		item.documentation = {
			kind: MarkupKind.Markdown,
			value: classInfo.d,
		};

		return item;
	};
}
