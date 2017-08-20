// The MIT License (MIT)
// 
// vs-json-explorer (https://github.com/mkloubert/vs-json-explorer)
// Copyright (c) Marcel Joachim Kloubert <marcel.kloubert@gmx.net>
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

import * as vscode from 'vscode';
import * as vsje_explorer from './explorer';
import * as vsje_helpers from './helpers';


export class Controller implements vscode.Disposable {
    private _activeEditor: vscode.TextEditor;
    private readonly _CONTEXT: vscode.ExtensionContext;
    private readonly _EXPLORER: vsje_explorer.Explorer;
    
    constructor(context: vscode.ExtensionContext) {
        this._CONTEXT = context;

        const NEW_EXPLORER = new vsje_explorer.Explorer(this);
        vscode.window.registerTreeDataProvider('vsjeExplorer', NEW_EXPLORER);
        this._EXPLORER = NEW_EXPLORER;
    }

    public get context(): vscode.ExtensionContext {
        return this._CONTEXT;
    }

    public dispose() {
    }

    public get explorer(): vsje_explorer.Explorer {
        return this._EXPLORER;
    }
    
    public onActivated() {
        this.onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    }

    public onDeactivate() {
        this._activeEditor = null;
    }

    /**
     * Is invoked when an active editor changed.
     * 
     * @param {vscode.TextEditor} editor The underlying editor. 
     */
    public onDidChangeActiveTextEditor(editor: vscode.TextEditor) {
        this._activeEditor = editor;

        this.refeshExplorer();
    }

    /**
     * Is invoked when a text document changed.
     * 
     * @param {vscode.TextDocumentChangeEvent} e The event data.
     */
    public onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
        this.refeshExplorer();
    }

    /**
     * Is invoked when visible editors changed.
     * 
     * @param {vscode.TextEditor[]} editors The underlying editors. 
     */
    public onDidChangeVisibleTextEditors(editors: vscode.TextEditor[]) {
        this.refeshExplorer();
    }

    /**
     * Is invoked when a text document has been closed.
     * 
     * @param {vscode.TextDocument} doc The underlying document.
     */
    public onDidCloseTextDocument(doc: vscode.TextDocument) {
        const ACTIVE_EDITOR = this._activeEditor;
        if (ACTIVE_EDITOR) {
            if (doc === ACTIVE_EDITOR.document) {
                this.refeshExplorer();
            }
        }
        else {
            this.refeshExplorer();
        }
    }

    /**
     * Is invoked when a text document has been opened.
     * 
     * @param {vscode.TextDocument} doc The underlying document.
     */
    public onDidOpenTextDocument(doc: vscode.TextDocument) {
        this.refeshExplorer();
    }

    /**
     * Is invoked when a text document has been saved.
     * 
     * @param {vscode.TextDocument} doc The underlying document.
     */
    public onDidSaveTextDocument(doc: vscode.TextDocument) {
        const ACTIVE_EDITOR = this._activeEditor;
        if (ACTIVE_EDITOR) {
            if (doc === ACTIVE_EDITOR.document) {
                this.refeshExplorer();
            }
        }
    }

    protected refeshExplorer() {
        this.explorer.raiseOnDidChangeTreeData();
    }

    public setupSubscriptions() {
        const ME = this;
        const CONTEXT = ME.context;

        CONTEXT.subscriptions.push(vscode.workspace.onDidChangeTextDocument(ME.onDidChangeTextDocument, ME));
        CONTEXT.subscriptions.push(vscode.workspace.onDidCloseTextDocument(ME.onDidCloseTextDocument, ME));
        CONTEXT.subscriptions.push(vscode.workspace.onDidOpenTextDocument(ME.onDidOpenTextDocument, ME));
        CONTEXT.subscriptions.push(vscode.workspace.onDidSaveTextDocument(ME.onDidSaveTextDocument, ME));

        CONTEXT.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(ME.onDidChangeActiveTextEditor, ME));
        CONTEXT.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(ME.onDidChangeVisibleTextEditors, ME));

        ME.context
          .subscriptions.push(ME.explorer,
                              ME);
    }
}
