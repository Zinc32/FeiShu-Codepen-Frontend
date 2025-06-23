import { linter, Diagnostic } from '@codemirror/lint';
import { Extension, StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { debounce } from 'lodash';

// 快速修复接口
interface LintFix {
    message: string;
    apply: () => void;
}

// 增强的诊断接口
interface EnhancedDiagnostic extends Diagnostic {
    fixes?: LintFix[];
}

// 错误消息小部件
class ErrorMessageWidget extends WidgetType {
    constructor(
        private message: string,
        private type: 'error' | 'warning' = 'error',
        private fixes?: LintFix[]
    ) {
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

        // 添加快速修复按钮（如果有的话）
        if (this.fixes?.length) {
            const fixesContainer = document.createElement('div');
            fixesContainer.className = 'cm-lint-fixes';

            this.fixes.forEach(fix => {
                const button = document.createElement('button');
                button.className = 'cm-lint-fix-button';
                button.textContent = fix.message;
                button.onclick = fix.apply;
                fixesContainer.appendChild(button);
            });

            wrapper.appendChild(fixesContainer);
        }

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
        return this.fixes?.length ? 28 + (this.fixes.length * 24) : 28;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

// 添加错误装饰的状态效果
export const addErrorDecorations = StateEffect.define<{ line: number; message: string; type: 'error' | 'warning'; fixes?: LintFix[] }[]>();
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
                        const widget = new ErrorMessageWidget(error.message, error.type, error.fixes);
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

    '.cm-lint-fixes': {
        marginTop: '4px !important',
        paddingLeft: '24px !important'
    },

    '.cm-lint-fix-button': {
        background: 'transparent !important',
        border: '1px solid currentColor !important',
        borderRadius: '3px !important',
        padding: '2px 6px !important',
        fontSize: '10px !important',
        cursor: 'pointer !important',
        marginRight: '4px !important',
        marginBottom: '4px !important',
        color: 'inherit !important',
        opacity: '0.8 !important',
        '&:hover': {
            opacity: '1 !important'
        }
    },

    // 确保错误消息不被编辑器样式覆盖
    '.cm-editor .cm-lint-message': {
        fontFamily: '"Consolas", "Monaco", "Lucida Console", monospace !important'
    }
});

// HTML Lint 函数
// HTML Lint 缓存
const htmlLintCache = new Map<string, EnhancedDiagnostic[]>();

function htmlLinter(view: EditorView): EnhancedDiagnostic[] {
    const diagnostics: EnhancedDiagnostic[] = [];
    const doc = view.state.doc;
    const code = doc.toString();

    // 检查缓存
    const cacheKey = code;
    if (htmlLintCache.has(cacheKey)) {
        return htmlLintCache.get(cacheKey)!;
    }

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

    // 更新缓存
    htmlLintCache.set(cacheKey, diagnostics);
    if (htmlLintCache.size > 100) {
        const firstKey = htmlLintCache.keys().next().value;
        htmlLintCache.delete(firstKey);
    }

    return diagnostics;
}

// CSS Lint 函数
// CSS Lint 缓存
const cssLintCache = new Map<string, EnhancedDiagnostic[]>();

// CSS 属性验证规则
type CSSPropertyValues = {
    [key: string]: string[];
};

const cssValidation: CSSPropertyValues = {
    display: ['none', 'block', 'inline', 'inline-block', 'flex', 'grid', 'table', 'contents', 'list-item', 'inline-flex', 'inline-grid'],
    position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    overflow: ['visible', 'hidden', 'scroll', 'auto'],
    float: ['left', 'right', 'none'],
    visibility: ['visible', 'hidden', 'collapse'],
    clear: ['none', 'left', 'right', 'both'],
    boxSizing: ['content-box', 'border-box'],
    alignItems: ['flex-start', 'flex-end', 'center', 'baseline', 'stretch'],
    justifyContent: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
    flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'],
    flexWrap: ['nowrap', 'wrap', 'wrap-reverse'],
    textAlign: ['left', 'right', 'center', 'justify'],
    verticalAlign: ['baseline', 'sub', 'super', 'text-top', 'text-bottom', 'middle', 'top', 'bottom'],
    fontWeight: ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
    cursor: ['auto', 'default', 'pointer', 'wait', 'text', 'move', 'help', 'not-allowed']
};

// 单位验证规则
const validUnits = ['px', 'em', 'rem', '%', 'vh', 'vw', 'vmin', 'vmax', 'ch', 'ex', 'cm', 'mm', 'in', 'pt', 'pc', 'fr', 'deg', 'rad', 'turn', 's', 'ms'];

function cssLinter(view: EditorView): EnhancedDiagnostic[] {
    const diagnostics: EnhancedDiagnostic[] = [];
    const doc = view.state.doc;
    const code = doc.toString();

    // 检查缓存
    const cacheKey = code;
    if (cssLintCache.has(cacheKey)) {
        return cssLintCache.get(cacheKey)!;
    }

    // 注释嵌套检测状态
    let commentNestLevel = 0;

    try {
        const lines = code.split('\n');
        let braceLevel = 0;
        let inComment = false;
        let inString = false;
        let stringChar = '';
        let currentPos = 0;
        let inPropertyBlock = false;
        let pendingSelector = false; // 标记是否有待处理的选择器
        let pendingSelectorStart = 0; // 记录选择器开始位置
        let lastLineWasSelector = false; // 记录上一行是否是选择器
        let lastSelectorLine = ''; // 记录上一行选择器内容

        for (const line of lines) {
            const lineStart = currentPos;
            let lineHasOpenBrace = false;
            let lineHasCloseBrace = false;
            let lineIsSelector = false;

            // 预处理：检查这一行是否包含选择器
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith('/*')) {
                // 检查是否是选择器（包含字母、#、.、[、:、*，但不包含:和{）
                if (/^[a-zA-Z0-9#.*[>\s+~]+/.test(trimmedLine) || trimmedLine.startsWith('@')) {
                    lineIsSelector = true;
                }
            }

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i + 1];
                const charPos = lineStart + i;

                // 处理注释
                if (!inString && char === '/' && nextChar === '*') {
                    if (inComment) {
                        commentNestLevel++;
                        diagnostics.push({
                            from: charPos,
                            to: charPos + 2,
                            severity: 'error',
                            message: '不允许嵌套注释'
                        });
                    }
                    inComment = true;
                    i++;
                    continue;
                }

                if (inComment && char === '*' && nextChar === '/') {
                    if (commentNestLevel > 0) {
                        commentNestLevel--;
                    }
                    inComment = commentNestLevel > 0;
                    i++;
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

                // 检查括号
                if (char === '{') {
                    lineHasOpenBrace = true;
                    const beforeText = line.substring(0, i).trim();
                    // 确保这是一个CSS选择器或@规则
                    if (beforeText && (beforeText.includes('@') || /[a-zA-Z#.[]/.test(beforeText))) {
                        braceLevel++;
                        inPropertyBlock = true;
                        pendingSelector = false; // 清除待处理的选择器标记
                    }
                } else if (char === '}' && inPropertyBlock) {
                    lineHasCloseBrace = true;
                    braceLevel--;
                    if (braceLevel === 0) {
                        inPropertyBlock = false;
                    }
                    if (braceLevel < 0) {
                        diagnostics.push({
                            from: charPos,
                            to: charPos + 1,
                            severity: 'error',
                            message: '意外的右花括号，没有匹配的左花括号'
                        });
                        braceLevel = 0;
                        inPropertyBlock = false;
                    }
                }
            }

            // 处理选择器和左括号缺失的情况
            if (lineIsSelector && !lineHasOpenBrace) {
                if (!pendingSelector) {
                    pendingSelector = true;
                    pendingSelectorStart = lineStart;
                    lastSelectorLine = trimmedLine;
                } else if (!trimmedLine.includes(':')) {
                    // 如果已经有待处理的选择器，并且当前行不是属性声明
                    lastSelectorLine += ' ' + trimmedLine;
                }
            } else if (pendingSelector && trimmedLine.includes(':') && !lineHasOpenBrace && !lineHasCloseBrace) {
                // 发现属性声明但没有左括号
                diagnostics.push({
                    from: pendingSelectorStart,
                    to: pendingSelectorStart + lastSelectorLine.length,
                    severity: 'error',
                    message: '选择器缺少左花括号 "{"'
                });
                pendingSelector = false;
            } else if (lineHasOpenBrace) {
                pendingSelector = false;
            }

            // 检查属性声明
            if (!inComment && !inString && trimmedLine && inPropertyBlock) {
                if (trimmedLine.includes(':')) {
                    const colonIndex = trimmedLine.indexOf(':');
                    const beforeColon = trimmedLine.substring(0, colonIndex).trim();
                    const afterColon = trimmedLine.substring(colonIndex + 1).trim();

                    const isSelector = /[\s>+~\[\]()]/.test(beforeColon);
                    const isMediaQuery = beforeColon.includes('@');
                    const isBlockStart = trimmedLine.endsWith('{');
                    const isBlockEnd = trimmedLine.endsWith('}');
                    const isPropertyDeclaration = !isSelector && !isMediaQuery && !isBlockStart && !isBlockEnd;

                    if (isPropertyDeclaration) {
                        const propertyName = beforeColon.replace(/-./g, x => x[1].toUpperCase());

                        // 检查缺少分号
                        if (!trimmedLine.endsWith(';')) {
                            diagnostics.push({
                                from: lineStart + line.lastIndexOf(trimmedLine.charAt(trimmedLine.length - 1)),
                                to: lineStart + line.length,
                                severity: 'error',
                                message: '属性声明缺少分号'
                            });
                        }

                        // 检查属性值
                        const validValues = cssValidation[propertyName as keyof typeof cssValidation];
                        if (validValues) {
                            const value = afterColon.replace(/;$/, '').trim();
                            const isNumericWithUnit = /^-?\d*\.?\d+(px|em|rem|%|vh|vw|s|ms)?$/.test(value);

                            if (!isNumericWithUnit && !validValues.includes(value)) {
                                diagnostics.push({
                                    from: lineStart + colonIndex + 1,
                                    to: lineStart + colonIndex + 1 + afterColon.length,
                                    severity: 'error',
                                    message: `无效的 ${beforeColon} 值: "${value}". 有效值: ${validValues.join(', ')}`
                                });
                            }
                        }
                    }
                }
            }

            currentPos += line.length + 1; // +1 for newline
            lastLineWasSelector = lineIsSelector && !lineHasOpenBrace;
        }

        // 检查未闭合的括号
        if (braceLevel > 0) {
            let lastOpenBracePos = code.length - 1;
            for (let i = code.length - 1; i >= 0; i--) {
                if (code[i] === '{') {
                    lastOpenBracePos = i;
                    break;
                }
            }

            diagnostics.push({
                from: lastOpenBracePos,
                to: lastOpenBracePos + 1,
                severity: 'error',
                message: `未闭合的花括号: 缺少 ${braceLevel} 个右花括号 '}' 来匹配嵌套结构`
            });
        }

        // 检查最后一个待处理的选择器
        if (pendingSelector) {
            diagnostics.push({
                from: pendingSelectorStart,
                to: pendingSelectorStart + lastSelectorLine.length,
                severity: 'error',
                message: '选择器缺少左花括号 "{"'
            });
        }

    } catch (error) {
        console.warn('Error in CSS linting:', error);
        diagnostics.push({
            from: 0,
            to: code.length,
            severity: 'error',
            message: '解析CSS时发生错误: ' + (error instanceof Error ? error.message : String(error))
        });
    }

    // 更新缓存
    cssLintCache.set(cacheKey, diagnostics);
    if (cssLintCache.size > 100) {
        const firstKey = cssLintCache.keys().next().value;
        cssLintCache.delete(firstKey);
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
    // 使用防抖处理 linting
    const debouncedLinter = debounce((view: EditorView) => {
        const diagnostics = linterFn(view);
        const errors = diagnostics.map(d => {
            const line = view.state.doc.lineAt(d.from).number;
            return {
                line,
                message: d.message,
                type: d.severity as 'error' | 'warning',
                fixes: (d as EnhancedDiagnostic).fixes
            };
        });

        view.dispatch({
            effects: [
                clearErrorDecorations.of(null),
                addErrorDecorations.of(errors)
            ]
        });
    }, 300);

    return [
        linter(linterFn),
        errorDecorationField,
        errorMessageTheme,
        EditorView.updateListener.of((update) => {
            if (update.docChanged || update.viewportChanged) {
                debouncedLinter(update.view);
            }
        })
    ];
}

// 导出增强的 lint 扩展
export const htmlLint = createEnhancedLinter(htmlLinter);
export const cssLint = createEnhancedLinter(cssLinter);
export const jsLint = createEnhancedLinter(jsLinter);