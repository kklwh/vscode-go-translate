import { Uri, Webview } from "vscode";

function _getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export default function generateHtml(extensionUri: Uri, webview: Webview, screenUri: Uri, styleUri?: Uri): string {
	const nonce = _getNonce();

	const styleMainUri = webview.asWebviewUri(
		Uri.joinPath(extensionUri, "webviews/css/main.css")
	);
	const scriptMainUri = webview.asWebviewUri(
		Uri.joinPath(extensionUri, "webviews/js/main.js")
	);

	return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src https: 'nonce-${nonce}' 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi" crossorigin="anonymous">
				<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.9.1/font/bootstrap-icons.css" rel="stylesheet">
				<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				<link href="${styleUri ?? ""}" rel="stylesheet">
				<script nonce="${nonce}">
					const tsvscode = acquireVsCodeApi();
				</script>
			</head>
			<body>
				<script nonce="${nonce}" src="https://code.jquery.com/jquery-3.3.1.js" integrity="sha256-2Kok7MbOyxpgUVvAk/HJ2jigOSYS2auK4Pfzbm7uH60=" crossorigin="anonymous"></script>
				<script nonce="${nonce}" src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3" crossorigin="anonymous"></script>

				<script nonce="${nonce}" src="${scriptMainUri}"></script>
				<script nonce="${nonce}" src="${screenUri}"></script>
			</body>
		</html>
	`;
}