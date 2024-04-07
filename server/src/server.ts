import {
	createConnection,
	ProposedFeatures,
	InitializeParams,
	TextDocumentSyncKind,
	InitializeResult,
	CompletionItem,
	Hover,
	Connection,
	HoverParams,
	CompletionParams,
	ColorInformation,
	DocumentColorParams,
	ColorPresentationParams,
	ColorPresentation,
	DocumentDiagnosticParams,
	DocumentDiagnosticReport,
} from "vscode-languageserver/node";
import { DocumentService } from "./document";
import { CompletionService } from "./completion";
import { HoverService } from "./hover";
import { ColorService } from "./color";
import { DiagnosticsService } from "./diagnostics";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TCSSInfo, emptyDiagonstic } from "./utils";

const CSSInfo = JSON.parse(
	readFileSync(
		join(__dirname, "..", "..", "assets", "css-info.json"),
		"utf-8",
	) || "{}",
) as TCSSInfo;

class Server {
	static TRIGGER_CHARACTERS: Array<string> = ["'", "`", '"', " "];
	private documentService: DocumentService;
	private completionService: CompletionService;
	private hoverService: HoverService;
	private colorService: ColorService;
	private diagnosticsService: DiagnosticsService;

	constructor(private connection: Connection) {
		this.documentService = new DocumentService(this.connection);
		this.completionService = new CompletionService(CSSInfo);
		this.hoverService = new HoverService(CSSInfo);
		this.colorService = new ColorService(CSSInfo);
		this.diagnosticsService = new DiagnosticsService(CSSInfo);
	}

	public start() {
		this.__init();
		this.listen();
	}

	private __init() {
		this.connection.onInitialize(this.onInitialize);
		this.connection.onCompletion(this.onCompletion);
		this.connection.onCompletionResolve(this.onCompletionResolve);
		this.connection.onHover(this.onHover);
		this.connection.onDocumentColor(this.onDocumentColor);
		this.connection.onColorPresentation(this.onColorPresentation);
		this.connection.languages.diagnostics.on(this.handleDiagnostics);
	}

	private listen() {
		this.connection.listen();
	}

	private onInitialize = (params: InitializeParams): InitializeResult => {
		return {
			capabilities: {
				textDocumentSync: TextDocumentSyncKind.Incremental,
				completionProvider: {
					resolveProvider: true,
					triggerCharacters: Server.TRIGGER_CHARACTERS,
				},
				colorProvider: true,
				hoverProvider: true,
				diagnosticProvider: {
					interFileDependencies: false,
					workspaceDiagnostics: false,
				},
			},
		};
	};

	private onCompletion = (params: CompletionParams): CompletionItem[] => {
		const documentText = this.documentService.getDocumentText(
			params.textDocument.uri,
		);
		if (!documentText) return [];

		return this.completionService.onCompletion(params, documentText);
	};

	private onCompletionResolve = (item: CompletionItem): CompletionItem => {
		return this.completionService.onCompletionResolve(item);
	};

	private onHover = (params: HoverParams): Hover | null => {
		const documentText = this.documentService.getDocumentText(
			params.textDocument.uri,
		);
		if (!documentText) return null;

		return this.hoverService.onHover(params, documentText);
	};

	private onDocumentColor = (
		params: DocumentColorParams,
	): ColorInformation[] => {
		const documentText = this.documentService.getDocumentText(
			params.textDocument.uri,
		);
		if (!documentText) return [];

		return this.colorService.onDocumentColor(params, documentText);
	};

	private onColorPresentation = (
		params: ColorPresentationParams,
	): ColorPresentation[] => {
		return this.colorService.onColorPresentation(params.color);
	};

	private handleDiagnostics = (
		params: DocumentDiagnosticParams,
	): DocumentDiagnosticReport => {
		const documentText = this.documentService.getDocumentText(
			params.textDocument.uri,
		);
		if (!documentText) return emptyDiagonstic;

		return this.diagnosticsService.handleDiagnostics(params, documentText);
	};
}

const connection = createConnection(ProposedFeatures.all);
const server = new Server(connection);
server.start();
