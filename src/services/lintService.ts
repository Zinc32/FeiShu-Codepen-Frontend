import { linter, Diagnostic } from '@codemirror/lint';
import { Extension, StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { debounce } from 'lodash';
import * as Babel from '@babel/standalone';

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

    // --- 1. 使用 DOMParser 进行专业的 HTML 语法检查 ---
    try {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(code, 'text/html');

        // 检查解析错误（parsererror 元素）
        const parserErrors = htmlDoc.querySelectorAll('parsererror');
        if (parserErrors.length > 0) {
            parserErrors.forEach(errorElement => {
                const errorText = errorElement.textContent || 'HTML 解析错误';

                // 尝试从错误信息中提取行号
                const lineMatch = errorText.match(/line (\d+)/i);
                if (lineMatch) {
                    const lineNumber = parseInt(lineMatch[1], 10);
                    try {
                        const lineObj = doc.line(lineNumber);
                        diagnostics.push({
                            from: lineObj.from,
                            to: lineObj.to,
                            severity: 'error',
                            message: errorText
                        });
                    } catch (lineError) {
                        // 如果获取行失败，使用默认位置
                        diagnostics.push({
                            from: 0,
                            to: code.length,
                            severity: 'error',
                            message: errorText
                        });
                    }
                } else {
                    // 没有行号信息，标记整个文档
                    diagnostics.push({
                        from: 0,
                        to: code.length,
                        severity: 'error',
                        message: errorText
                    });
                }
            });
        }
    } catch (parsingError) {
        console.warn('HTML parsing error:', parsingError);
    }

    // --- 2. 自定义 HTML 标签匹配检查 ---
    try {
        const lines = code.split('\n');
        const tagStack: Array<{ tag: string, line: number, pos: number }> = [];
        const selfClosingTags = new Set([
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        ]);

        let currentPos = 0;

        lines.forEach((line, lineIndex) => {
            const lineStart = currentPos;

            // 更精确的标签匹配正则表达式
            const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
            let match;

            while ((match = tagRegex.exec(line)) !== null) {
                const fullTag = match[0];
                const tagName = match[1].toLowerCase();
                const tagStart = lineStart + match.index;
                const tagEnd = tagStart + fullTag.length;
                const lineNumber = lineIndex + 1;

                if (fullTag.startsWith('</')) {
                    // 结束标签
                    if (tagStack.length === 0) {
                        try {
                            const lineObj = doc.line(lineNumber);
                            const from = lineObj.from + match.index;
                            const to = lineObj.from + match.index + fullTag.length;

                            diagnostics.push({
                                from,
                                to,
                                severity: 'error',
                                message: `意外的结束标签 </${tagName}>`
                            });
                        } catch (lineError) {
                            // 忽略行获取错误
                        }
                    } else {
                        const lastTag = tagStack[tagStack.length - 1];
                        if (lastTag.tag === tagName) {
                            tagStack.pop();
                        } else {
                            try {
                                const lineObj = doc.line(lineNumber);
                                const from = lineObj.from + match.index;
                                const to = lineObj.from + match.index + fullTag.length;

                                diagnostics.push({
                                    from,
                                    to,
                                    severity: 'error',
                                    message: `标签不匹配：</${tagName}> 应为 </${lastTag.tag}>`
                                });
                            } catch (lineError) {
                                // 忽略行获取错误
                            }
                        }
                    }
                } else if (!fullTag.endsWith('/>') && !selfClosingTags.has(tagName)) {
                    // 开始标签（非自闭合）
                    tagStack.push({
                        tag: tagName,
                        line: lineNumber,
                        pos: tagStart
                    });
                }
            }

            currentPos += line.length + 1; // +1 for newline
        });

        // 检查未闭合的标签
        tagStack.forEach(tag => {
            try {
                const lineObj = doc.line(tag.line);
                const relativePos = tag.pos - lineObj.from;
                const from = lineObj.from + Math.max(0, Math.min(relativePos, lineObj.length));
                const to = Math.min(from + tag.tag.length + 2, lineObj.to);

                diagnostics.push({
                    from,
                    to,
                    severity: 'error',
                    message: `未闭合的标签 <${tag.tag}>`
                });
            } catch (lineError) {
                // 忽略行获取错误
            }
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

    // --- 使用浏览器原生 CSS 解析（模仿 CodePen） ---
    try {
        // 创建一个临时的 style 元素来测试 CSS 语法
        const tempStyle = document.createElement('style');
        tempStyle.textContent = code;

        // 将元素添加到 document head 中进行解析
        document.head.appendChild(tempStyle);

        // 检查是否有 CSS 解析错误
        const sheet = tempStyle.sheet;
        if (sheet) {
            // 如果能成功创建样式表，说明语法基本正确
            // 检查每个规则是否有效
            try {
                for (let i = 0; i < sheet.cssRules.length; i++) {
                    const rule = sheet.cssRules[i];
                    // 基本的规则验证
                    if (!rule.cssText) {
                        console.warn('Invalid CSS rule found');
                    }
                }
            } catch (ruleError) {
                console.warn('CSS rule access error:', ruleError);
            }
        }

        // 清理临时元素
        document.head.removeChild(tempStyle);

        // 额外的基本语法检查
        const basicSyntaxCheck = (cssCode: string) => {
            const lines = cssCode.split('\n');
            let braceLevel = 0;
            let inComment = false;

            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                const line = lines[lineIndex];
                let inString = false;
                let stringChar = '';

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const nextChar = line[i + 1];

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
                            const lineObj = doc.line(lineIndex + 1);
                            const charPos = lineObj.from + i;
                            diagnostics.push({
                                from: charPos,
                                to: charPos + 1,
                                severity: 'error',
                                message: '意外的右花括号 "}"'
                            });
                            braceLevel = 0; // 重置
                        }
                    }
                }
            }

            // 检查未闭合的括号
            if (braceLevel > 0) {
                diagnostics.push({
                    from: cssCode.length - 1,
                    to: cssCode.length,
                    severity: 'error',
                    message: `缺少 ${braceLevel} 个右花括号 "}"`
                });
            }
        };

        basicSyntaxCheck(code);

    } catch (error: any) {
        // 浏览器 CSS 解析错误
        console.warn('CSS 解析错误:', error);

        // 简单的错误处理，不尝试解析复杂的错误信息
        diagnostics.push({
            from: 0,
            to: Math.min(50, code.length),
            severity: 'error',
            message: 'CSS 语法错误'
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

    // 如果代码为空或只是注释，不进行检查
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
    if (!cleanCode) {
        return diagnostics;
    }

    try {
        // --- 1. 使用 Babel 进行基本语法检查 ---
        try {
            // 使用 Babel 解析代码，只检查基本语法错误
            Babel.transform(code, {
                parserOpts: {
                    strictMode: false,
                    allowImportExportEverywhere: true,
                    allowReturnOutsideFunction: true,
                    allowHashBang: true,
                    allowAwaitOutsideFunction: true,
                    allowUndeclaredExports: true,
                    plugins: ['jsx', 'typescript']
                },
                // 不进行任何转换，只解析
                plugins: []
            });
        } catch (error: any) {
            // 只报告真正的语法错误
            if (error && error.loc && error.message) {
                const lineNumber = error.loc.line;
                const columnNumber = error.loc.column || 0;

                try {
                    const lineObj = doc.line(lineNumber);
                    const from = lineObj.from + Math.min(columnNumber, lineObj.length);
                    const to = Math.min(from + 10, lineObj.to);

                    // 清理错误信息
                    let message = error.message
                        .replace(/^SyntaxError:\s*/, '')
                        .replace(/\s*\(\d+:\d+\)$/, '')
                        .replace(/^Unexpected token.*/, '语法错误：意外的标记')
                        .replace(/^Missing semicolon.*/, '语法错误：缺少分号')
                        .replace(/^Unterminated string constant.*/, '语法错误：未闭合的字符串')
                        .replace(/^Unterminated comment.*/, '语法错误：未闭合的注释');

                    diagnostics.push({
                        from,
                        to,
                        severity: 'error',
                        message
                    });
                } catch (lineError) {
                    // 忽略行获取错误
                }
            }
        }

        // 只进行基本的语法检查，不做复杂的静态分析或危险函数检测
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

// 修改正则表达式，移除不必要的转义字符
const propertyRegex = /[a-zA-Z-]+\s*:\s*[^;]+;?/;
const bracketRegex = /[{}]/;
const selectorPattern = /[a-zA-Z0-9_-]+(?:[.#][a-zA-Z0-9_-]+)*/;

// CSS 属性验证函数
function validateCssProperty(property: string): boolean {
    try {
        const testDiv = document.createElement('div');
        const camelCaseProp = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return camelCaseProp in testDiv.style;
    } catch {
        return true; // 如果无法验证，默认返回true
    }
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