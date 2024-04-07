import { join } from "node:path";
import { ExtensionContext } from "vscode";
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from "vscode-languageclient/node";
import clientConfig from "./config";

const { CLIENT_ID, CLIENT_NAME } = clientConfig;

let client: LanguageClient;

const activate = (context: ExtensionContext) => {
	const serverModule = context.asAbsolutePath(
		join("server", "out", "server.js"),
	);

	const options = {
		module: serverModule,
		transport: TransportKind.ipc,
	};

	const serverOptions: ServerOptions = {
		run: options,
		debug: options,
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: "file", pattern: "**/*.{tsx,jsx}" }],
	};

	client = new LanguageClient(
		CLIENT_ID,
		CLIENT_NAME,
		serverOptions,
		clientOptions,
	);

	client.start();
};

const deactivate = (): Thenable<void> | undefined => client?.stop();

export { activate, deactivate };
