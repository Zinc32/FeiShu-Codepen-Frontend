import { linter, Diagnostic } from '@codemirror/lint';
import { Extension, StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';

// 错误消息小部件
class ErrorMessageWidget extends WidgetType {
    constructor(private message: string, private type: 'error' | 'warning' = 'error') {
        super();
    }

    toDOM(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'cm-lint-error-line';

        const messageDiv = document.createElement('div');
        messageDiv.className = `cm-lint-message cm-lint-${this.type}`;

        const icon = document.createElement('span');
        icon.className = 'cm-lint-icon';
        icon.textContent = this.type === 'error' ? '✗' : '⚠';

        const prefix = document.createElement('span');
        prefix.className = 'cm-lint-prefix';
        prefix.textContent = this.type === 'error' ? 'Error: ' : 'Warning: ';

        const text = document.createElement('span');
        text.className = 'cm-lint-text';
        text.textContent = this.message;

        messageDiv.appendChild(icon);
        messageDiv.appendChild(prefix);
        messageDiv.appendChild(text);
        wrapper.appendChild(messageDiv);

        return wrapper;
    }

    eq(other: WidgetType): boolean {
        return other instanceof ErrorMessageWidget &&
            other.message === this.message &&
            other.type === this.type;
    }

    updateDOM(): boolean {
        return false;
    }

    get estimatedHeight(): number {
        return 28;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

// 添加错误装饰的状态效果
export const addErrorDecorations = StateEffect.define<{ line: number; message: string; type: 'error' | 'warning' }[]>();
export const clearErrorDecorations = StateEffect.define();

// 错误装饰状态字段
export const errorDecorationField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },

    update(decorations, tr) {
        decorations = decorations.map(tr.changes);

        for (let effect of tr.effects) {
            if (effect.is(addErrorDecorations)) {
                const errors = effect.value;
                const newDecorations: any[] = [];

                for (const error of errors) {
                    try {
                        const line = Math.max(1, Math.min(error.line, tr.state.doc.lines));
                        const lineObj = tr.state.doc.line(line);

                        // 在行末添加错误消息小部件
                        const widget = new ErrorMessageWidget(error.message, error.type);
                        newDecorations.push(Decoration.widget({
                            widget,
                            side: 1,
                            block: true
                        }).range(lineObj.to));

                    } catch (e) {
                        console.warn('Error creating error decoration:', e);
                    }
                }

                decorations = decorations.update({
                    add: newDecorations,
                    sort: true
                });
            } else if (effect.is(clearErrorDecorations)) {
                decorations = Decoration.none;
            }
        }

        return decorations;
    },

    provide: f => EditorView.decorations.from(f)
});

// 错误消息样式主题
export const errorMessageTheme = EditorView.theme({
    '.cm-lint-error-line': {
        width: '100%',
        display: 'block',
        margin: '0',
        padding: '0'
    },

    '.cm-lint-message': {
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        margin: '2px 0',
        fontSize: '11px',
        fontFamily: 'inherit',
        borderRadius: '0',
        width: '100%',
        boxSizing: 'border-box'
    },

    '.cm-lint-error': {
        backgroundColor: '#ffebee !important',
        color: '#c62828 !important',
        borderLeft: '3px solid #f44336 !important'
    },

    '.cm-lint-warning': {
        backgroundColor: '#fff8e1 !important',
        color: '#f57c00 !important',
        borderLeft: '3px solid #ff9800 !important'
    },

    '.cm-lint-icon': {
        marginRight: '6px !important',
        fontWeight: 'bold !important',
        fontSize: '10px !important',
        flexShrink: '0 !important'
    },

    '.cm-lint-prefix': {
        fontWeight: 'bold !important',
        marginRight: '4px !important',
        flexShrink: '0 !important'
    },

    '.cm-lint-text': {
        flex: '1 !important',
        lineHeight: '1.3 !important',
        wordBreak: 'break-word !important'
    },

    // 确保错误消息不被编辑器样式覆盖
    '.cm-editor .cm-lint-message': {
        fontFamily: '"Consolas", "Monaco", "Lucida Console", monospace !important'
    }
});

// HTML Lint 函数
function htmlLinter(view: EditorView): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const doc = view.state.doc;
    const code = doc.toString();

    try {
        // 使用 DOMParser 检测 HTML 语法错误
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(code, 'text/html');

        // 检查解析错误
        const parserErrors = htmlDoc.querySelector('parsererror');
        if (parserErrors) {
            diagnostics.push({
                from: 0,
                to: code.length,
                severity: 'error',
                message: 'HTML syntax error detected'
            });
        }

        // 检查基本的标签匹配
        const lines = code.split('\n');
        const tagStack: Array<{ tag: string, line: number, from: number }> = [];
        const selfClosingTags = new Set([
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        ]);

        let currentPos = 0;

        lines.forEach((line, lineIndex) => {
            const lineStart = currentPos;

            // 查找标签
            const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
            let match;

            while ((match = tagRegex.exec(line)) !== null) {
                const fullTag = match[0];
                const tagName = match[1].toLowerCase();
                const tagStart = lineStart + match.index;
                const tagEnd = tagStart + fullTag.length;

                if (fullTag.startsWith('</')) {
                    // 结束标签
                    if (tagStack.length === 0) {
                        diagnostics.push({
                            from: tagStart,
                            to: tagEnd,
                            severity: 'error',
                            message: `Unexpected closing tag </${tagName}>`
                        });
                    } else {
                        const lastTag = tagStack[tagStack.length - 1];
                        if (lastTag.tag === tagName) {
                            tagStack.pop();
                        } else {
                            diagnostics.push({
                                from: tagStart,
                                to: tagEnd,
                                severity: 'error',
                                message: `Mismatched closing tag </${tagName}>, expected </${lastTag.tag}>`
                            });
                        }
                    }
                } else if (!fullTag.endsWith('/>') && !selfClosingTags.has(tagName)) {
                    // 开始标签（非自闭合）
                    tagStack.push({
                        tag: tagName,
                        line: lineIndex + 1,
                        from: tagStart
                    });
                }
            }

            currentPos += line.length + 1; // +1 for newline
        });

        // 检查未闭合的标签
        tagStack.forEach(tag => {
            diagnostics.push({
                from: tag.from,
                to: tag.from + tag.tag.length + 2, // <tagname
                severity: 'error',
                message: `Unclosed tag <${tag.tag}>`
            });
        });

    } catch (error) {
        console.warn('Error in HTML linting:', error);
    }

    return diagnostics;
}

// CSS Lint 函数
function cssLinter(view: EditorView): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const doc = view.state.doc;
    const code = doc.toString();

    try {
        const lines = code.split('\n');
        let braceLevel = 0;
        let inComment = false;
        let inString = false;
        let stringChar = '';
        let currentPos = 0;

        lines.forEach((line, lineIndex) => {
            const lineStart = currentPos;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                const charPos = lineStart + i;

                // 处理注释
                if (!inString && char === '/' && nextChar === '*') {
                    inComment = true;
                    i++; // 跳过下一个字符
                    continue;
                }

                if (inComment && char === '*' && nextChar === '/') {
                    inComment = false;
                    i++; // 跳过下一个字符
                    continue;
                }

                if (inComment) continue;

                // 处理字符串
                if ((char === '"' || char === "'") && !inString) {
                    inString = true;
                    stringChar = char;
                    continue;
                }

                if (inString && char === stringChar) {
                    inString = false;
                    stringChar = '';
                    continue;
                }

                if (inString) continue;

                // 检查括号匹配
                if (char === '{') {
                    braceLevel++;
                } else if (char === '}') {
                    braceLevel--;
                    if (braceLevel < 0) {
                        diagnostics.push({
                            from: charPos,
                            to: charPos + 1,
                            severity: 'error',
                            message: 'Unexpected closing brace }'
                        });
                        braceLevel = 0; // 重置以继续检查
                    }
                }
            }

            // 检查常见的CSS语法错误
            const trimmedLine = line.trim();
            if (!inComment && !inString && trimmedLine) {
                // 检查缺少分号的属性声明
                if (trimmedLine.includes(':') &&
                    !trimmedLine.endsWith(';') &&
                    !trimmedLine.endsWith('{') &&
                    !trimmedLine.endsWith('}') &&
                    !trimmedLine.includes('@') &&
                    trimmedLine.length > 5) {

                    const colonIndex = trimmedLine.indexOf(':');
                    const beforeColon = trimmedLine.substring(0, colonIndex).trim();

                    // 简单检查这是否像一个CSS属性
                    if (!/[\s>+~\[\]()]/.test(beforeColon) && !beforeColon.includes('@')) {
                        diagnostics.push({
                            from: lineStart + line.lastIndexOf(trimmedLine.charAt(trimmedLine.length - 1)),
                            to: lineStart + line.length,
                            severity: 'warning',
                            message: 'Missing semicolon'
                        });
                    }
                }
            }

            currentPos += line.length + 1; // +1 for newline
        });

        // 检查未闭合的括号
        if (braceLevel > 0) {
            diagnostics.push({
                from: code.length - 1,
                to: code.length,
                severity: 'error',
                message: `${braceLevel} unclosed brace(s)`
            });
        }

    } catch (error) {
        console.warn('Error in CSS linting:', error);
    }

    return diagnostics;
}

// JavaScript/TypeScript Lint 函数
function jsLinter(view: EditorView): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const doc = view.state.doc;
    const code = doc.toString();

    try {
        // --- 1. 首先进行基本的语法错误检查 ---
        try {
            // 使用 new Function() 来检测基本的语法错误
            new Function(code);
        } catch (error: any) {
            if (error instanceof SyntaxError) {
                // 尝试解析错误位置
                let line = 1;
                let column = 0;

                // 从错误消息中提取位置信息
                const message = error.message;

                // 查找行号
                const lineMatch = message.match(/line (\d+)/i);
                if (lineMatch) {
                    line = parseInt(lineMatch[1], 10);
                }

                // 计算错误位置
                const lines = code.split('\n');
                let from = 0;
                for (let i = 0; i < Math.min(line - 1, lines.length - 1); i++) {
                    from += lines[i].length + 1; // +1 for newline
                }

                const to = Math.min(from + (lines[line - 1]?.length || 0), code.length);

                diagnostics.push({
                    from,
                    to,
                    severity: 'error',
                    message: error.message.replace(/^SyntaxError:\s*/, '')
                });
            }
        }

        // --- 2. 接着进行危险函数/API 的检查 ---
        const dangerousFunctions = [
            'eval(', 'new Function(',
            'document.write(', 'document.cookie',
            'localStorage', 'sessionStorage',
            'XMLHttpRequest', 'fetch(', 'WebSocket(',
            'window.open(', 'location.href',
            'setTimeout(', 'setInterval(',
            'Worker', 'SharedWorker',
            'importScripts',
            'Blob', 'URL.createObjectURL',
            'btoa', 'atob',
            'alert(', 'prompt(', 'confirm('
        ];

        dangerousFunctions.forEach(func => {
            let match;
            const regex = new RegExp(`\\b${func.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
            while ((match = regex.exec(code)) !== null) {
                diagnostics.push({
                    from: match.index,
                    to: match.index + match[0].length,
                    severity: 'error',
                    message: `检测到危险函数: "${match[0].replace('(', '')}"。出于安全考虑，此操作不允许。`
                });
            }
        });
    } catch (error: any) {
        // 捕获 linting 工具本身可能抛出的其他错误
        diagnostics.push({
            from: 0,
            to: code.length,
            severity: 'error',
            message: `JavaScript linting 错误: ${error.message}`
        });
    }

    return diagnostics;
}

// 创建增强的 linter，结合 CodeMirror 原生 lint 和自定义错误消息
function createEnhancedLinter(linterFn: (view: EditorView) => Diagnostic[]) {
    return [
        linter(linterFn),
        errorDecorationField,
        errorMessageTheme,
        EditorView.updateListener.of((update) => {
            if (update.docChanged || update.viewportChanged) {
                // 运行 linter 并更新错误装饰
                const diagnostics = linterFn(update.view);
                const errors = diagnostics.map(d => {
                    // 计算错误所在的行号
                    const line = update.state.doc.lineAt(d.from).number;
                    return {
                        line,
                        message: d.message,
                        type: d.severity as 'error' | 'warning'
                    };
                });

                // 更新错误装饰
                update.view.dispatch({
                    effects: [
                        clearErrorDecorations.of(null),
                        addErrorDecorations.of(errors)
                    ]
                });
            }
        })
    ];
}

// 导出增强的 lint 扩展
export const htmlLint = createEnhancedLinter(htmlLinter);
export const cssLint = createEnhancedLinter(cssLinter);
export const jsLint = createEnhancedLinter(jsLinter);