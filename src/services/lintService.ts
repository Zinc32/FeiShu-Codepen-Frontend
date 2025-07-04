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
    source?: 'static' | 'runtime';
}

// 错误消息小部件
class ErrorMessageWidget extends WidgetType {
    constructor(
        private message: string,
        private type: 'error' | 'warning' = 'error',
        private fixes?: LintFix[],
        public source: 'static' | 'runtime' = 'static'
    ) {
        super();
    }

    toDOM(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'cm-lint-error-line';

        const messageDiv = document.createElement('div');
        messageDiv.className = `cm-lint-message cm-lint-${this.type} cm-lint-${this.source}`;

        const icon = document.createElement('span');
        icon.className = 'cm-lint-icon';
        icon.textContent = this.type === 'error' ? '✗' : '⚠';

        const prefix = document.createElement('span');
        prefix.className = 'cm-lint-prefix';
        const sourceText = this.source === 'runtime' ? 'Runtime ' : '';
        prefix.textContent = this.type === 'error' ? `${sourceText}Error: ` : `${sourceText}Warning: `;

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
            other.type === this.type &&
            other.source === this.source;
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
export const addStaticErrorDecorations = StateEffect.define<{
    line: number;
    message: string;
    type: 'error' | 'warning';
    fixes?: LintFix[];
    source: 'static';
}[]>();
export const addRuntimeErrorDecorations = StateEffect.define<{
    line: number;
    message: string;
    type: 'error' | 'warning';
    fixes?: LintFix[];
    source: 'runtime';
}[]>();
export const clearStaticErrorDecorations = StateEffect.define();
export const clearRuntimeErrorDecorations = StateEffect.define();
export const clearAllErrorDecorations = StateEffect.define();

// 错误装饰状态字段
export const errorDecorationField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },

    update(decorations, tr) {
        decorations = decorations.map(tr.changes);

        for (let effect of tr.effects) {
            if (effect.is(addStaticErrorDecorations)) {
                const errors = effect.value;
                const newDecorations: any[] = [];

                // 清除所有现有的错误装饰
                decorations = Decoration.none;

                for (const error of errors) {
                    try {
                        const line = Math.max(1, Math.min(error.line, tr.state.doc.lines));
                        const lineObj = tr.state.doc.line(line);

                        // 在行末添加错误消息小部件
                        const widget = new ErrorMessageWidget(error.message, error.type, error.fixes, error.source);
                        const decoration = Decoration.widget({
                            widget,
                            side: 1,
                            block: true
                        }).range(lineObj.to);

                        // 验证装饰器是否有效
                        if (decoration) {
                            newDecorations.push(decoration);
                        }

                    } catch (e) {
                        console.warn('Error creating static error decoration:', e);
                    }
                }

                if (newDecorations.length > 0) {
                    decorations = decorations.update({
                        add: newDecorations,
                        sort: true
                    });
                } else {
                    decorations = Decoration.none;
                }
            } else if (effect.is(addRuntimeErrorDecorations)) {
                const errors = effect.value;
                const newDecorations: any[] = [];

                // 检查是否已有静态错误
                const hasStaticErrors = decorations.size > 0;
                if (hasStaticErrors) {
                    // 如果有静态错误，不添加运行时错误
                    continue;
                }

                for (const error of errors) {
                    try {
                        const line = Math.max(1, Math.min(error.line, tr.state.doc.lines));
                        const lineObj = tr.state.doc.line(line);

                        // 在行末添加错误消息小部件
                        const widget = new ErrorMessageWidget(error.message, error.type, error.fixes, error.source);
                        const decoration = Decoration.widget({
                            widget,
                            side: 1,
                            block: true
                        }).range(lineObj.to);

                        // 验证装饰器是否有效
                        if (decoration) {
                            newDecorations.push(decoration);
                        }

                    } catch (e) {
                        console.warn('Error creating runtime error decoration:', e);
                    }
                }

                if (newDecorations.length > 0) {
                    decorations = decorations.update({
                        add: newDecorations,
                        sort: true
                    });
                } else {
                    decorations = Decoration.none;
                }
            } else if (effect.is(clearStaticErrorDecorations)) {
                // 只清除静态错误，保留运行时错误
                const runtimeDecorations: any[] = [];
                decorations.between(0, tr.state.doc.length, (from, to, decoration) => {
                    try {
                        const widget = decoration.spec.widget;
                        if (widget instanceof ErrorMessageWidget && widget.source === 'runtime') {
                            runtimeDecorations.push(decoration);
                        }
                    } catch (e) {
                        console.warn('Error filtering runtime decoration:', e);
                    }
                });
                // 确保装饰器数组有效
                decorations = runtimeDecorations.length > 0 ? Decoration.set(runtimeDecorations) : Decoration.none;
            } else if (effect.is(clearRuntimeErrorDecorations)) {
                // 只清除运行时错误，保留静态错误
                const staticDecorations: any[] = [];
                decorations.between(0, tr.state.doc.length, (from, to, decoration) => {
                    try {
                        const widget = decoration.spec.widget;
                        if (widget instanceof ErrorMessageWidget && widget.source === 'static') {
                            staticDecorations.push(decoration);
                        }
                    } catch (e) {
                        console.warn('Error filtering static decoration:', e);
                    }
                });
                // 确保装饰器数组有效
                decorations = staticDecorations.length > 0 ? Decoration.set(staticDecorations) : Decoration.none;
            } else if (effect.is(clearAllErrorDecorations)) {
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

    // 运行时错误特殊样式
    '.cm-lint-runtime': {
        backgroundColor: '#fff3e0 !important',
        color: '#e65100 !important',
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

// HTML 辅助函数：排除脚本、样式标签内容和注释
function excludeScriptAndStyleContent(html: string): string {
    try {
        return html
            // 替换 HTML 注释为空，避免注释中的标签被误检测
            .replace(/<!--[\s\S]*?-->/g, '')
            // 替换 script 标签内容为空，保留标签结构
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, (match) => {
                const openTag = match.match(/<script[^>]*>/i)?.[0] || '<script>';
                return openTag + '</script>';
            })
            // 替换 style 标签内容为空，保留标签结构
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
                const openTag = match.match(/<style[^>]*>/i)?.[0] || '<style>';
                return openTag + '</style>';
            });
    } catch (error) {
        // 如果处理失败，返回原始内容
        return html;
    }
}

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
                            message: errorText,
                            source: 'static'
                        });
                    } catch (lineError) {
                        // 如果获取行失败，使用默认位置
                        diagnostics.push({
                            from: 0,
                            to: code.length,
                            severity: 'error',
                            message: errorText,
                            source: 'static'
                        });
                    }
                } else {
                    // 没有行号信息，标记整个文档
                    diagnostics.push({
                        from: 0,
                        to: code.length,
                        severity: 'error',
                        message: errorText,
                        source: 'static'
                    });
                }
            });
        }
    } catch (parsingError) {
        console.warn('HTML parsing error:', parsingError);
    }

    // --- 2. 自定义 HTML 标签匹配检查 ---
    try {
        // 预处理：排除脚本和样式标签内容，避免误检测
        const processedCode = excludeScriptAndStyleContent(code);

        const lines = processedCode.split('\n');
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
                                message: `意外的结束标签 </${tagName}>`,
                                source: 'static'
                            });
                        } catch (lineError) {
                            // 忽略行获取错误
                        }
                    } else {
                        const lastTag = tagStack[tagStack.length - 1];
                        // 支持大小写不敏感的标签匹配
                        if (lastTag.tag.toLowerCase() === tagName.toLowerCase()) {
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
                                    message: `标签不匹配：</${tagName}> 应为 </${lastTag.tag}>`,
                                    source: 'static'
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
                    message: `未闭合的标签 <${tag.tag}>`,
                    source: 'static'
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
                                message: '意外的右花括号 "}"',
                                source: 'static'
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
                    message: `缺少 ${braceLevel} 个右花括号 "}"`,
                    source: 'static'
                });
            }

            // 检查未闭合的注释
            if (inComment) {
                diagnostics.push({
                    from: cssCode.length - 1,
                    to: cssCode.length,
                    severity: 'error',
                    message: '未闭合的注释 /* ... */',
                    source: 'static'
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
            message: 'CSS 语法错误',
            source: 'static'
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

// 辅助函数：检查指定行是否在字符串或注释中
function isLineInStringOrComment(lines: string[], lineIndex: number, fullCode: string): boolean {
    try {
        // 简单的启发式检查
        const line = lines[lineIndex];

        // 检查是否在单行注释中
        if (line.trim().startsWith('//')) {
            return true;
        }

        // 检查是否在多行注释或字符串中
        // 计算到当前行的字符位置
        let position = 0;
        for (let i = 0; i < lineIndex; i++) {
            position += lines[i].length + 1; // +1 for newline
        }

        // 检查从开头到当前位置的代码
        const codeUpToLine = fullCode.substring(0, position);

        // 简单的状态跟踪
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inTemplate = false;
        let inBlockComment = false;
        let inLineComment = false;

        for (let i = 0; i < codeUpToLine.length; i++) {
            const char = codeUpToLine[i];
            const nextChar = codeUpToLine[i + 1];
            const prevChar = codeUpToLine[i - 1];

            // 处理换行（重置行注释状态）
            if (char === '\n') {
                inLineComment = false;
                continue;
            }

            // 如果在行注释中，跳过
            if (inLineComment) continue;

            // 如果在块注释中
            if (inBlockComment) {
                if (char === '*' && nextChar === '/') {
                    inBlockComment = false;
                    i++; // 跳过 '/'
                }
                continue;
            }

            // 如果在字符串中
            if (inSingleQuote) {
                if (char === "'" && prevChar !== '\\') {
                    inSingleQuote = false;
                }
                continue;
            }

            if (inDoubleQuote) {
                if (char === '"' && prevChar !== '\\') {
                    inDoubleQuote = false;
                }
                continue;
            }

            if (inTemplate) {
                if (char === '`' && prevChar !== '\\') {
                    inTemplate = false;
                }
                continue;
            }

            // 检查注释开始
            if (char === '/' && nextChar === '/') {
                inLineComment = true;
                i++; // 跳过第二个 '/'
                continue;
            }

            if (char === '/' && nextChar === '*') {
                inBlockComment = true;
                i++; // 跳过 '*'
                continue;
            }

            // 检查字符串开始
            if (char === "'") {
                inSingleQuote = true;
                continue;
            }

            if (char === '"') {
                inDoubleQuote = true;
                continue;
            }

            if (char === '`') {
                inTemplate = true;
                continue;
            }
        }

        // 如果到达目标行时仍在字符串或注释中，返回 true
        return inSingleQuote || inDoubleQuote || inTemplate || inBlockComment || inLineComment;

    } catch (error) {
        // 如果检测失败，保守返回 false
        return false;
    }
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
                let lineNumber = error.loc.line;
                let columnNumber = error.loc.column || 0;

                // 特殊处理：检查是否需要调整错误位置到前面的声明关键字
                const lines = code.split('\n');
                const errorLine = lines[lineNumber - 1] || '';

                // 检查当前错误行是否看起来像是由于前面不完整的声明导致的
                const looksLikeDeclarationError = (
                    // 错误消息包含声明相关的关键词
                    error.message.includes('Missing initialiser') ||
                    error.message.includes('Missing semicolon') ||
                    error.message.includes('Unexpected identifier') ||
                    error.message.includes('Unexpected token') ||
                    error.message.includes('expected') ||
                    // 或者错误行看起来像是正常的代码（不是声明）
                    (errorLine.trim().startsWith('console.') ||
                        errorLine.trim().startsWith('return') ||
                        errorLine.trim().match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/))
                );

                if (looksLikeDeclarationError) {
                    // 查找前面的不完整声明关键字
                    const keywords = ['const', 'let', 'var', 'function', 'class', 'interface', 'type'];

                    let found = false;
                    for (let i = lineNumber - 2; i >= Math.max(0, lineNumber - 3) && !found; i--) {
                        const line = lines[i];
                        const trimmedLine = line.trim();

                        // 检查这一行是否在字符串或注释中
                        if (isLineInStringOrComment(lines, i, code)) {
                            continue;
                        }

                        for (const keyword of keywords) {
                            // 检查是否是独立的关键字（不完整的声明）
                            if (trimmedLine === keyword) {
                                lineNumber = i + 1;
                                columnNumber = line.indexOf(keyword);
                                found = true;
                                break;
                            }
                        }
                    }
                }

                try {
                    const lineObj = doc.line(lineNumber);
                    const from = lineObj.from + Math.min(columnNumber, lineObj.length);
                    const to = Math.min(from + 10, lineObj.to);

                    // 清理错误信息，提供更友好的中文提示
                    let message = error.message
                        .replace(/^SyntaxError:\s*/, '')
                        .replace(/\s*\(\d+:\d+\)$/, '')
                        // 声明相关错误
                        .replace(/Missing initialiser in const declaration.*/, 'const 声明缺少变量名和初始化值')
                        .replace(/Missing initialiser in let declaration.*/, 'let 声明缺少变量名')
                        .replace(/Missing initialiser in var declaration.*/, 'var 声明缺少变量名')
                        .replace(/Unexpected identifier.*/, '语法错误：意外的标识符')
                        .replace(/Unexpected reserved word.*/, '语法错误：意外的保留字')
                        // 函数相关错误
                        .replace(/Unexpected token, expected.*/, '语法错误：缺少必要的语法元素')
                        .replace(/Missing function name.*/, '函数声明缺少函数名')
                        // 通用语法错误
                        .replace(/^Unexpected token.*/, '语法错误：意外的标记')
                        .replace(/^Missing semicolon.*/, '语法错误：缺少分号')
                        .replace(/^Unterminated string constant.*/, '语法错误：未闭合的字符串')
                        .replace(/^Unterminated comment.*/, '语法错误：未闭合的注释')
                        .replace(/Unexpected end of input.*/, '语法错误：代码意外结束')
                        // 括号相关错误
                        .replace(/Expected.*but found.*/, '语法错误：括号或标点符号不匹配')
                        .replace(/Missing closing.*/, '语法错误：缺少闭合符号');

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

// 安全的错误检测包装器
function safeErrorDetection<T extends Diagnostic[]>(
    linterFn: (view: EditorView) => T,
    fallbackMessage: string = '错误检测器暂时不可用，请稍后重试'
): (view: EditorView) => T {
    return (view: EditorView) => {
        try {
            const start = performance.now();
            const result = linterFn(view);
            const end = performance.now();

            // 性能监控
            if (end - start > 1000) {
                console.warn(`Slow error detection (${linterFn.name}):`, end - start, 'ms');
            }

            return result;
        } catch (error) {
            console.warn('Error detection failed:', error);
            return [{
                from: 0,
                to: 0,
                severity: 'warning',
                message: fallbackMessage
            }] as T;
        }
    };
}

// 创建增强的 linter，结合 CodeMirror 原生 lint 和自定义错误消息
function createEnhancedLinter(linterFn: (view: EditorView) => Diagnostic[]) {
    // 使用较短的防抖时间，确保静态错误检测更快
    const debouncedLinter = debounce((view: EditorView) => {
        try {
            const diagnostics = linterFn(view);
            const errors = diagnostics.map(d => {
                try {
                    const line = view.state.doc.lineAt(d.from).number;
                    return {
                        line,
                        message: d.message,
                        type: d.severity as 'error' | 'warning',
                        fixes: (d as EnhancedDiagnostic).fixes,
                        source: 'static' as const
                    };
                } catch (e) {
                    console.warn('Error processing diagnostic:', e);
                    return null;
                }
            }).filter((error): error is NonNullable<typeof error> => error !== null); // 过滤掉null值

            // 如果有静态错误，清除所有错误装饰并显示静态错误
            if (errors.length > 0) {
                view.dispatch({
                    effects: [
                        clearAllErrorDecorations.of(null),
                        addStaticErrorDecorations.of(errors)
                    ]
                });
            } else {
                // 没有静态错误时，只清除静态错误装饰，保留运行时错误
                // 注意：这里不清除所有错误，只清除静态错误
                view.dispatch({
                    effects: [clearStaticErrorDecorations.of(null)]
                });
            }
        } catch (error) {
            console.warn('Error in debounced linter:', error);
        }
    }, 100); // 减少防抖时间，让静态错误检测更快

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

// 运行时错误处理函数
export function addRuntimeErrorsToEditor(
    view: EditorView,
    errors: Array<{ line: number; column: number; message: string; severity: 'error' | 'warning' }>
) {
    if (!view) {
        return;
    }

    try {
        // 检查当前是否有静态错误
        const currentDecorations = view.state.field(errorDecorationField);
        const hasStaticErrors = currentDecorations.size > 0;

        // 如果有静态错误，不显示运行时错误
        if (hasStaticErrors) {
            return;
        }

        const runtimeErrors = errors.map(error => {
            try {
                return {
                    line: error.line,
                    message: error.message,
                    type: error.severity,
                    source: 'runtime' as const
                };
            } catch (e) {
                console.warn('Error processing runtime error:', e);
                return null;
            }
        }).filter((error): error is NonNullable<typeof error> => error !== null); // 过滤掉null值

        view.dispatch({
            effects: [
                clearRuntimeErrorDecorations.of(null),
                addRuntimeErrorDecorations.of(runtimeErrors)
            ]
        });
    } catch (error) {
        console.error('Failed to add runtime errors to editor:', error);
    }
}

// 清空运行时错误的工具函数
export function clearRuntimeErrorsFromEditor(view: EditorView) {
    if (!view) return;

    try {
        view.dispatch({
            effects: [clearRuntimeErrorDecorations.of(null)]
        });
    } catch (error) {
        console.warn('Failed to clear runtime errors from editor:', error);
    }
}

// 导出增强的 lint 扩展
export const htmlLint = createEnhancedLinter(htmlLinter);
export const cssLint = createEnhancedLinter(cssLinter);
export const jsLint = createEnhancedLinter(jsLinter);

// 导出运行时错误扩展（保持向后兼容）
export const runtimeErrorExtension = [
    errorDecorationField,
    errorMessageTheme
];