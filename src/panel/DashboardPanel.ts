import { WebviewPanel, Uri, Disposable, window, ViewColumn, Webview } from "vscode";
import generateHtml from "../helper/html";

export class DashboardPanel {
    public static readonly viewType = "dashboardPanel";
    private static _isInitDidReceive = false;
    private static _panel: WebviewPanel | undefined;
    private static _extensionUri: Uri;

    private static _disposables: Disposable[] = [];

    public static createOrShow(extensionUri: Uri) {
        this._extensionUri = extensionUri;
        
        const column = window.activeTextEditor
        ? window.activeTextEditor.viewColumn
        : undefined;

        if(this._panel) {
            this._panel.reveal(column);
            this.refreshPanel();
            return;
        }

        const newPanel = window.createWebviewPanel(
            this.viewType,
            "Go translate",
            column || ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    Uri.joinPath(extensionUri, "media"),
                    Uri.joinPath(extensionUri, "webviews"),
                    Uri.joinPath(extensionUri, "out/compiled"),
                ],
            }
        );

        newPanel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel = newPanel;
        this.refreshPanel();
    }

    public static dispose() {
        if(this._panel){
            this._panel.dispose();

            while (this._disposables.length) {
                const x = this._disposables.pop();
                if (x) x.dispose();
            }

            this._panel = undefined;
        }
    }

    public static onDidReceiveMessage(cb: (data: any) => void){
        if(this._panel){
            this._panel.webview.onDidReceiveMessage(cb);
            this._isInitDidReceive = true;
        }
    }

    public static isInitDidReceive = () => this._isInitDidReceive;

    public static onDidDispose(cb: () => void){
        if(this._panel){
            this._panel.onDidDispose(() => {
                cb();
                this.dispose();
            }, null, this._disposables);
        }
    }

    public static postData(data: {}){
        if(this._panel){
            this._panel?.webview.postMessage(data);
        }
    }

    public static refreshPanel(){
        if(this._panel){
            const webview = this._panel.webview;
            
            this._panel.webview.html = this._getHtmlForWebview(webview);
        }
    }

    private static _getHtmlForWebview(webview: Webview) {
        const screenUri = webview.asWebviewUri(
            Uri.joinPath(this._extensionUri, "out/compiled/Dashboard.js")
        );

        const styleUri = webview.asWebviewUri(
          Uri.joinPath(this._extensionUri, "webviews/css/dashboard.css")
        );
        
        return generateHtml(this._extensionUri, webview, screenUri, styleUri);
    }
}
