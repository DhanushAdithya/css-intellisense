import { type Connection, TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

export class DocumentService {
	public documents: TextDocuments<TextDocument>;

	constructor(conn: Connection) {
		this.documents = new TextDocuments(TextDocument);
		this.documents.listen(conn);
	}

	getDocument(uri: string) {
		return this.documents.get(uri);
	}

	getDocumentText(uri: string) {
		return this.getDocument(uri)?.getText() || "";
	}
}
