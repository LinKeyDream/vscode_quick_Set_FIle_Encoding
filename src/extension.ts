	import * as vscode from 'vscode';
	// VS Code 支持的完整编码列表
	const ENCODINGS: { label: string, value: string }[] = [
		{ label: "UTF-8", value: "utf8" },
		{ label: "UTF-8 (BOM)", value: "utf8bom" },
		{ label: "UTF-16 LE", value: "utf16le" },
		{ label: "UTF-16 BE", value: "utf16be" },
		{ label: "Western (ISO 8859-1)", value: "iso88591" },
		{ label: "Western (ISO 8859-3)", value: "iso88593" },
		{ label: "Western (ISO 8859-15)", value: "iso885915" },
		{ label: "Western (Mac Roman)", value: "macroman" },
		{ label: "DOS (CP 437)", value: "cp437" },
		{ label: "Arabic (ISO 8859-6)", value: "iso88596" },
		{ label: "Arabic (Windows 1256)", value: "windows1256" },
		{ label: "Baltic (ISO 8859-4)", value: "iso88594" },
		{ label: "Baltic (Windows 1257)", value: "windows1257" },
		{ label: "Celtic (ISO 8859-14)", value: "iso885914" },
		{ label: "Central European (ISO 8859-2)", value: "iso88592" },
		{ label: "Central European (Windows 1250)", value: "windows1250" },
		{ label: "Cyrillic (ISO 8859-5)", value: "iso88595" },
		{ label: "Cyrillic (KOI8-R)", value: "koi8r" },
		{ label: "Cyrillic (KOI8-U)", value: "koi8u" },
		{ label: "Cyrillic (Windows 1251)", value: "windows1251" },
		{ label: "Greek (ISO 8859-7)", value: "iso88597" },
		{ label: "Greek (Windows 1253)", value: "windows1253" },
		{ label: "Hebrew (ISO 8859-8)", value: "iso88598" },
		{ label: "Hebrew (Windows 1255)", value: "windows1255" },
		{ label: "Latin 9 (ISO 8859-15)", value: "iso885915" },
		{ label: "Nordic (ISO 8859-10)", value: "iso885910" },
		{ label: "Romanian (ISO 8859-16)", value: "iso885916" },
		{ label: "South European (ISO 8859-3)", value: "iso88593" },
		{ label: "Thai (Windows 874)", value: "windows874" },
		{ label: "Turkish (ISO 8859-9)", value: "iso88599" },
		{ label: "Turkish (Windows 1254)", value: "windows1254" },
		{ label: "Vietnamese (Windows 1258)", value: "windows1258" },
		{ label: "Simplified Chinese (GB 2312)", value: "gb2312" },
		{ label: "Simplified Chinese (GBK)", value: "gbk" },
		{ label: "Simplified Chinese (GB 18030)", value: "gb18030" },
		{ label: "Traditional Chinese (Big5)", value: "big5" },
		{ label: "Japanese (EUC-JP)", value: "eucjp" },
		{ label: "Japanese (Shift JIS)", value: "shiftjis" },
		{ label: "Korean (EUC-KR)", value: "euckr" }
	];
	export function activate(context: vscode.ExtensionContext) {
		const provider = new EncodingSidebarProvider(context.extensionUri);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider('encoding-sidebar.view', provider)
		);
	}
	class EncodingSidebarProvider implements vscode.WebviewViewProvider {
		public static readonly viewType = 'encoding-sidebar.view';
		private _view?: vscode.WebviewView;
		constructor(private readonly _extensionUri: vscode.Uri) { }
		public resolveWebviewView( 
			webviewView: vscode.WebviewView,
			context: vscode.WebviewViewResolveContext,
			_token: vscode.CancellationToken
		) {
			this._view = webviewView;
			webviewView.webview.options = {
				enableScripts: true,
				localResourceRoots: [this._extensionUri]
			};
			webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
			// 接收 Webview 消息，修改全局编码
			webviewView.webview.onDidReceiveMessage(async (message) => {
				if (message.command === 'changeEncoding') {
					const newEncoding = message.value;
					await vscode.workspace.getConfiguration('files').update('encoding', newEncoding, vscode.ConfigurationTarget.Global);
					vscode.window.showInformationMessage(`全局默认编码已更改为: ${message.label}`);
				}
			});
			// 初始化时获取一次全局编码
			this.updateGlobalEncoding();
			// 监听 VS Code 全局配置改变
			vscode.workspace.onDidChangeConfiguration(() => this.updateGlobalEncoding());
			// ✨✨✨ 新增：监听侧边栏的显示/隐藏状态 ✨✨✨
			webviewView.onDidChangeVisibility(() => {
				// 当侧边栏重新变为可见时，主动刷新一次数据
				if (webviewView.visible) {
					this.updateGlobalEncoding();
				}
			});
		}
		// 获取并向 Webview 发送全局编码
		private updateGlobalEncoding() {
			if (this._view) {
				// 不传 URI 参数，直接读取全局配置
				const currentEncoding = vscode.workspace.getConfiguration('files').get<string>('encoding', 'utf8');
				this._view.webview.postMessage({ command: 'setEncoding', value: currentEncoding });
				console.log(`当前全局编码: ${currentEncoding}`);
			}
		}
		private _getHtmlForWebview(webview: vscode.Webview): string {
			const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
			const optionsHtml = ENCODINGS.map(enc => `<option value="${enc.value}">${enc.label}</option>`).join('');
			return `<!DOCTYPE html>
			<html lang="zh-CN">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${codiconsUri}" rel="stylesheet" />
				<style>
					body {
						padding: 10px;
						font-family: var(--vscode-font-family);
						color: var(--vscode-foreground);
					}
					.container {
						display: flex;
						flex-direction: column;
						gap: 10px;
					}
					label {
						font-size: 13px;
						font-weight: 600;
					}
					select {
						width: 100%;
						padding: 5px 8px;
						background-color: var(--vscode-dropdown-background);
						color: var(--vscode-dropdown-foreground);
						border: 1px solid var(--vscode-dropdown-border);
						border-radius: 3px;
						outline: none;
						font-family: var(--vscode-font-family);
						font-size: 13px;
					}
					select:focus {
						border-color: var(--vscode-focusBorder);
					}
					.hint {
						font-size: 12px;
						color: var(--vscode-descriptionForeground);
						margin-top: 5px;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<label for="encoding-select">全局默认编码</label>
					<select id="encoding-select">
						${optionsHtml}
					</select>
					<div class="hint">选择后立即生效，修改的是 VS Code 全局设置。</div>
				</div>
				<script>
					const vscode = acquireVsCodeApi();
					const select = document.getElementById('encoding-select');
					select.addEventListener('change', () => {
						const selectedOption = select.options[select.selectedIndex];
						vscode.postMessage({
							command: 'changeEncoding',
							value: select.value,
							label: selectedOption.text
						});
					});
					window.addEventListener('message', event => {
						const message = event.data;
						if (message.command === 'setEncoding') {
							select.value = message.value;
							if (select.value !== message.value) {
								select.value = 'utf8';
							}
						}
					});
				</script>
			</body>
			</html>`;
		}
	}
	export function deactivate() { }