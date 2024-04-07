require("dotenv").config();

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse, type ChildNode } from "postcss";

const readPath = resolve(__dirname, "..", "assets", process.env.CSS_FILE_NAME!);
const writePath = resolve(__dirname, "..", "assets", "css-info.json");

const CSSInfo = {};

const isMultipleSelector = (selector: string): boolean =>
	selector.includes(" ") || selector.split(".").length > 2;
const isPseudoSelector = (selector: string): boolean =>
	selector.includes(":") || selector.includes("[");
const isClassSelector = (selector: string): boolean => selector.startsWith(".");

const generateInfo = (nodes?: Array<ChildNode>, breakpoint?: string): void => {
	if (!nodes) return;

	for (const node of nodes) {
		if (node.type === "rule") {
			const selectors = node.selector.split(/,?\n+/g).map(s => s.trim());
			for (const selector of selectors) {
				if (
					!isMultipleSelector(selector) &&
					!isPseudoSelector(selector) &&
					isClassSelector(selector)
				) {
					let props = "";
					node.each(p => {
						props +=
							p.type === "decl" ? `  ${p.prop}: ${p.value};\n` : "";
					});

					let hex = "";

					if (
						node.nodes.length === 1 &&
						node.nodes[0].type === "decl" &&
						node.nodes[0].prop.includes("color")
					) {
						const hex6Regex = /.*?(#[0-9a-f]{6}).*/g;
						const hex3Regex = /.*?(#[0-9a-f]{3}).*/g;
						const hex8Regex = /.*?(#[0-9a-f]{8}).*/g;
						const rgbaRegex = /.*?rgba?\((.*?)\).*/g;
						if (hex8Regex.test(node.nodes[0].value)) {
							hex = node.nodes[0].value
								.split(hex8Regex)
								.filter(Boolean)[0];
						} else if (hex6Regex.test(node.nodes[0].value)) {
							hex = node.nodes[0].value
								.split(hex6Regex)
								.filter(Boolean)[0];
						} else if (hex3Regex.test(node.nodes[0].value)) {
							hex = node.nodes[0].value
								.split(hex3Regex)
								.filter(Boolean)[0];
						} else if (rgbaRegex.test(node.nodes[0].value)) {
							const rgba = node.nodes[0].value
								.split(rgbaRegex)
								.filter(Boolean)[0];
							const [r, g, b, a] = rgba
								.split(/,\s*/g)
								.map(c => parseFloat(c.trim()));
							hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${(a ? Math.floor(a * 255) : 255).toString(16).padStart(2, "0")}`;
						}
					}

					const documenation =
						"```css\n" +
						(breakpoint ? `/* ${breakpoint} */\n` : "") +
						`${selector} {\n${props}}\n\`\`\``;
					if (CSSInfo[selector.slice(1)])
						CSSInfo[selector.slice(1)].d += `\n${documenation}`;
					else CSSInfo[selector.slice(1)] = { d: documenation };
					if (hex) CSSInfo[selector.slice(1)].c = hex;
				}
			}
		} else if (node.type === "atrule" && node.name === "media") {
			const breakpoint = node.params;
			generateInfo(node.nodes, breakpoint);
		}
	}
};

if (!existsSync(writePath)) {
	const css = readFileSync(readPath, "utf-8");
	const ast = parse(css);
	generateInfo(ast.nodes);
	writeFileSync(writePath, JSON.stringify(CSSInfo));
}
