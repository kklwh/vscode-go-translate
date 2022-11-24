import { commands, window, ExtensionContext } from 'vscode';
import { getCommands } from './actions/actionsManager';
import { printErr } from './helper/log';
import StateManager from './helper/stateManager';
import { getWebviewProviders } from './provider/providerManager';


export function activate(context: ExtensionContext) {
	try {
		const globalState = new StateManager(context);
		globalState.write("workspace", null);

		const allCommands = getCommands(context, globalState);
		const webviewProviders = getWebviewProviders(context, globalState);

		if (allCommands instanceof Map) {
			allCommands.forEach((func, key) => {
				context.subscriptions.push(commands.registerCommand(key, func));
			});
		}

		if (webviewProviders instanceof Map) {
			webviewProviders.forEach((provider, key) => {
				context.subscriptions.push(window.registerWebviewViewProvider(key, provider));
			});
		}

	} catch (e) {
		printErr((e as Error).message);
	}
}

export function deactivate() {
	// cannot achieve because the instance will close before function end
	// commands.executeCommand('go-translate.saveFile');
}