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

const JsonSourceMap = require('json-source-map');
import * as vscode from 'vscode';
import * as vsje_controller from './controller';
import * as vsje_helpers from './helpers';


export type TreeNodeIconLink = string | vscode.Uri | { 
    light: string | vscode.Uri;
    dark: string | vscode.Uri
}


/**
 * An explorer instance.
 */
export class Explorer implements vscode.TreeDataProvider<TreeNode>, vscode.Disposable {
    private readonly _CONTROLLER: vsje_controller.Controller;
    private readonly _ON_DID_CHANGE_TREE_DATA: vscode.EventEmitter<TreeNode | null> = new vscode.EventEmitter<TreeNode | null>();

    /**
     * Initializes a new instance of that class.
     * 
     * @param {vsje_controller.Controller} controller The underlying controller.
     */
    constructor(controller: vsje_controller.Controller) {
        this._CONTROLLER = controller;
    }

    /**
     * Gets the underlying extenstion controller.
     */
    public get controller(): vsje_controller.Controller {
        return this._CONTROLLER;
    }

    /** @inheritdoc */
    public dispose() {
        /*
        const LTC = this._LIST_TARGETS_COMMAND;
        if (LTC) {
            vspt_helpers.tryDispose(LTC.command);
        }*/

        vsje_helpers.tryDispose(this._ON_DID_CHANGE_TREE_DATA);
    }

    /** @inheritdoc */
    public getChildren(node?: TreeNode) {
        let nodes: TreeNode[];
        
        const ACTIVE_EDITOR = vscode.window.activeTextEditor;
        if (ACTIVE_EDITOR) {
            const DOC = ACTIVE_EDITOR.document;
            if (DOC) {
                switch (vsje_helpers.normalizeString(DOC.languageId)) {
                    case 'json':
                        if (node) {
                            const GET_CHILDREN = node.getChildren;
                            if (GET_CHILDREN) {
                                nodes = GET_CHILDREN.apply(node,
                                                           []);
                            }
                        }
                        else {
                            nodes = this.getNodesOfJsonDocument(ACTIVE_EDITOR);
                        }
                        break;
                }
            }
        }

        return nodes || [];
    }

    private getChildrenOfObject(obj: any, root: any, sourceMap: any) {
        const ME = this;

        let nodes: TreeNode[];

        if (obj) {
            nodes = [];

            for (let k in obj) {
                const PROP_VAL = obj[k];

                const NEW_NODE = new TreeNode(this);
                NEW_NODE.label = vsje_helpers.toStringSafe(k);

                if (null === PROP_VAL) {
                    NEW_NODE.label += ': null';
                }
                else if ('undefined' === typeof PROP_VAL) {
                    NEW_NODE.label += ': undefined';
                }
                else if ('object' === typeof PROP_VAL) {
                    NEW_NODE.label += ': [object]';
                    NEW_NODE.getChildren = () => {
                        return ME.getChildrenOfObject(PROP_VAL, obj, sourceMap);
                    };
                }
                else if (Array.isArray(PROP_VAL)) {
                    NEW_NODE.label += `: [array:${PROP_VAL.length}]`;
                }
                else {
                    NEW_NODE.label += ': [' + (typeof PROP_VAL) + '] ' + PROP_VAL;
                }

                nodes.push(NEW_NODE);
            }
        }

        return nodes || [];
    }

    private getNodesOfJsonDocument(editor: vscode.TextEditor) {
        let nodes: TreeNode[];

        try {
            const DOC = editor.document;

            const jsonDoc = vsje_helpers.toStringSafe( DOC.getText() );
            if ('' !== jsonDoc.trim()) {
                let sourceMap: any;
                try {
                    sourceMap = JsonSourceMap.parse(jsonDoc);
                }
                catch (e) {
                    //TODO: log
                }

                const OBJ = JSON.parse(jsonDoc);

                nodes = this.getChildrenOfObject(OBJ, OBJ, sourceMap);
            }
        }
        catch (e) {
        }

        return nodes || [];
    }

    /** @inheritdoc */
    public getTreeItem(node: TreeNode): vscode.TreeItem {
        if (node) {
            return node.toItem();
        }
    }

    /** @inheritdoc */
    public get onDidChangeTreeData(): vscode.Event<TreeNode | null> {
        return this._ON_DID_CHANGE_TREE_DATA.event;
    }

    /**
     * Raises the 'onDidChangeTreeData' event.
     */
    public raiseOnDidChangeTreeData() {
        this._ON_DID_CHANGE_TREE_DATA.fire();
    }
}

/**
 * A tree node.
 */
export class TreeNode {
    private readonly _EXPLORER: Explorer;
    
    /**
     * Initializes a new instance of that class.
     * 
     * @param {Explorer} explorer The underlying explorer. 
     */
    constructor(explorer: Explorer) {
        this._EXPLORER = explorer;
    }

    /**
     * The collapsible state for the tree item.
     */
    public collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

    /**
     * A command to invoke.
     */
    public command: vscode.Command;

    /**
     * Gets the underlying explorer.
     */
    public get explorer(): Explorer {
        return this._EXPLORER;
    }

    /**
     * Gets the children of that node.
     * 
     * @return {TreeNode[]} The result.
     */
    public getChildren: () => TreeNode[];

    /**
     * The icon for the node.
     */
    public icon: TreeNodeIconLink;

    /**
     * The label.
     */
    public label: string;

    /**
     * Creates a tree item for that node.
     * 
     * @returns {vscode.TreeItem} The created item.
     */
    public toItem(): vscode.TreeItem {
        return new TreeItem(this);
    }
}

class TreeItem extends vscode.TreeItem {
    protected readonly _NODE: TreeNode;
    
    constructor(node: TreeNode) {
        super(node.label, node.collapsibleState);

        this._NODE = node;
        
        this.command = this._NODE.command;
        this.iconPath = this._NODE.icon;
    }

    public get node(): TreeNode {
        return this._NODE;
    }
}
