import {
	CompletionItem,
	CompletionItemKind,
	CompletionParams,
	MarkupKind,
} from "vscode-languageserver";
import { classNameMatchInfo, TCSSInfo } from "./utils";

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
		const { inRange } = isInsideClassName;
		if (!inRange) return [];

		return Object.keys(this.CSS_INFO).map(key => {
			const color = this.CSS_INFO[key].c;
			return {
				label: key,
				kind: color
					? CompletionItemKind.Color
					: CompletionItemKind.Constant,
				...(color ? { detail: color } : {}),
			};
		});
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
