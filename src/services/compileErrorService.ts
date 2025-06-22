// import * as Babel from '@babel/standalone';
import * as sass from 'sass';
import * as less from 'less';
import { CompileError, CompileResult } from '../types/errorTypes';

// JavaScript编译错误检测（使用简单的语法检查）
export const checkJavaScriptErrors = async (code: string): Promise<CompileResult> => {
    const errors: CompileError[] = [];

    try {
        // 使用 eval 进行基础语法检查（在严格模式下）
        new Function('"use strict"; ' + code);

        // 额外的语法检查
        const jsErrors = parseBasicJavaScriptErrors(code);
        errors.push(...jsErrors);

        return {
            success: errors.length === 0,
            errors,
            compiledCode: code
        };
    } catch (error: any) {
        // 解析 JavaScript 错误信息
        const jsError = parseJavaScriptError(error, code);
        if (jsError) {
            errors.push(jsError);
        }

        return {
            success: false,
            errors,
            compiledCode: code
        };
    }
};

// 解析 JavaScript 错误信息
const parseJavaScriptError = (error: any, code: string): CompileError | null => {
    try {
        let line = 1;
        let column = 0;
        let message = error.message || 'JavaScript 语法错误';

        console.log('🔍 解析JS错误:', { message, error });

        // 尝试从错误信息中提取行号和列号
        // 不同浏览器的错误格式可能不同
        const lineMatch = message.match(/line (\d+)/i) || message.match(/at line (\d+)/i);
        if (lineMatch) {
            line = parseInt(lineMatch[1], 10);
        }

        const columnMatch = message.match(/column (\d+)/i) || message.match(/at column (\d+)/i);
        if (columnMatch) {
            column = parseInt(columnMatch[1], 10);
        }

        // 对于特定的语法错误，尝试智能定位
        if (message.includes('Unexpected token')) {
            const lines = code.split('\n');

            // 检查函数定义相关错误
            for (let i = 0; i < lines.length; i++) {
                const currentLine = lines[i];
                const trimmed = currentLine.trim();

                // 检查 function name { 模式（缺少括号）
                if (trimmed.match(/^function\s+\w+\s*{/)) {
                    line = i + 1;
                    column = currentLine.indexOf('{');
                    message = '函数定义语法错误：缺少参数括号 ()';
                    break;
                }

                // 检查 function name( { 模式（括号未闭合）
                if (trimmed.match(/^function\s+\w+\s*\(\s*{/)) {
                    line = i + 1;
                    column = currentLine.indexOf('(');
                    message = '函数定义语法错误：参数括号未闭合';
                    break;
                }

                // 检查不完整的函数定义
                if (trimmed.match(/^function\s+\w+\s*\(/)) {
                    // 检查这一行是否有闭合的括号
                    const openParens = (currentLine.match(/\(/g) || []).length;
                    const closeParens = (currentLine.match(/\)/g) || []).length;
                    if (openParens > closeParens) {
                        line = i + 1;
                        column = currentLine.lastIndexOf('(') + 1;
                        message = '函数定义语法错误：参数括号未闭合';
                        break;
                    }
                }
            }
        }

        // 如果还是没有找到具体位置，尝试通过代码分析找到错误位置
        if (line === 1 && column === 0) {
            const errorLocation = findErrorLocation(code, message);
            if (errorLocation) {
                line = errorLocation.line;
                column = errorLocation.column;
                if (errorLocation.message) {
                    message = errorLocation.message;
                }
            }
        }

        return {
            id: `js-error-${Date.now()}-${Math.random()}`,
            type: 'javascript',
            message: cleanErrorMessage(message),
            line,
            column,
            severity: 'error',
            source: 'javascript'
        };
    } catch {
        return {
            id: `js-error-${Date.now()}-${Math.random()}`,
            type: 'javascript',
            message: 'JavaScript 语法错误',
            line: 1,
            column: 0,
            severity: 'error',
            source: 'javascript'
        };
    }
};

// 智能定位错误位置
const findErrorLocation = (code: string, errorMessage: string): { line: number; column: number; message?: string } | null => {
    const lines = code.split('\n');

    // 首先检查函数定义相关的错误
    if (errorMessage.includes('Unexpected token')) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // 检查 function name { 模式（缺少括号）
            if (trimmed.match(/^function\s+\w+\s*{/)) {
                return {
                    line: i + 1,
                    column: line.indexOf('{'),
                    message: '函数定义语法错误：缺少参数括号 ()'
                };
            }

            // 检查 function name( { 模式（括号未闭合）
            if (trimmed.match(/^function\s+\w+\s*\(\s*{/)) {
                return {
                    line: i + 1,
                    column: line.indexOf('('),
                    message: '函数定义语法错误：参数括号未闭合'
                };
            }

            // 检查跨行的未闭合括号情况
            if (trimmed.match(/^function\s+\w+\s*\(/)) {
                const openParens = (line.match(/\(/g) || []).length;
                const closeParens = (line.match(/\)/g) || []).length;
                if (openParens > closeParens) {
                    return {
                        line: i + 1,
                        column: line.lastIndexOf('(') + 1,
                        message: '函数定义语法错误：参数括号未闭合'
                    };
                }
            }
        }

        // 检查是否是大括号未闭合的问题
        let braceCount = 0;
        let lastOpenBrace = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '{') {
                    braceCount++;
                    lastOpenBrace = { line: i + 1, column: j + 1 };
                } else if (char === '}') {
                    braceCount--;
                }
            }
        }

        // 如果有未闭合的大括号，优先报告这个错误
        if (braceCount > 0 && lastOpenBrace) {
            return {
                line: lastOpenBrace.line,
                column: lastOpenBrace.column,
                message: '大括号未闭合，缺少 }'
            };
        }

        // 如果不是函数定义错误，则尝试提取具体的错误token
        const tokenMatch = errorMessage.match(/Unexpected token '(.+?)'/);
        if (tokenMatch) {
            const token = tokenMatch[1];
            // 优先查找第一个出现的位置
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const index = line.indexOf(token);
                if (index !== -1) {
                    // 提供更具体的错误信息
                    let specificMessage = `意外的符号 '${token}'`;

                    // 根据上下文提供更好的错误提示
                    if (token === '.' && line.includes('function')) {
                        specificMessage = '函数定义语法错误，请检查括号是否正确闭合';
                    } else if (token === '{' && line.includes('function')) {
                        specificMessage = '函数定义语法错误：缺少参数括号 ()';
                    } else if (token === ')' && braceCount > 0) {
                        specificMessage = '语法错误：可能是大括号未闭合导致的';
                    }

                    return {
                        line: i + 1,
                        column: index,
                        message: specificMessage
                    };
                }
            }
        }
    }

    return null;
};

// 清理错误信息
const cleanErrorMessage = (message: string): string => {
    return message
        .replace(/^Uncaught\s+/i, '')
        .replace(/\s+at\s+.*$/, '')
        .replace(/\s+\(.*\)$/, '')
        .trim();
};

// 基础 JavaScript 语法检查
const parseBasicJavaScriptErrors = (code: string): CompileError[] => {
    const errors: CompileError[] = [];

    try {
        // 检查整体括号匹配
        const bracketErrors = checkBracketMatching(code);
        errors.push(...bracketErrors);

        // 检查未闭合的字符串（整体检查）
        const stringErrors = checkStringMatching(code);
        errors.push(...stringErrors);

        // 检查常见语法错误
        const syntaxErrors = checkCommonSyntaxErrors(code);
        errors.push(...syntaxErrors);

    } catch (error) {
        console.warn('Error in parseBasicJavaScriptErrors:', error);
    }

    return errors;
};

// 检查括号匹配（整体检查，考虑跨行情况）
const checkBracketMatching = (code: string): CompileError[] => {
    const errors: CompileError[] = [];
    const lines = code.split('\n');

    // 移除字符串和注释后再检查
    const cleanedCode = removeStringsAndComments(code);
    const cleanedLines = cleanedCode.split('\n');

    let parenStack: Array<{ char: string, line: number, column: number }> = [];
    let braceStack: Array<{ char: string, line: number, column: number }> = [];
    let bracketStack: Array<{ char: string, line: number, column: number }> = [];

    cleanedLines.forEach((line, lineIndex) => {
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const lineNumber = lineIndex + 1;
            const column = i;

            switch (char) {
                case '(':
                    parenStack.push({ char, line: lineNumber, column });
                    break;
                case ')':
                    if (parenStack.length === 0) {
                        errors.push({
                            id: `js-parens-${lineNumber}-${Math.random()}`,
                            type: 'javascript',
                            message: '多余的右括号',
                            line: lineNumber,
                            column: column,
                            severity: 'error',
                            source: 'javascript'
                        });
                    } else {
                        parenStack.pop();
                    }
                    break;
                case '{':
                    braceStack.push({ char, line: lineNumber, column });
                    break;
                case '}':
                    if (braceStack.length === 0) {
                        errors.push({
                            id: `js-braces-${lineNumber}-${Math.random()}`,
                            type: 'javascript',
                            message: '多余的右大括号',
                            line: lineNumber,
                            column: column,
                            severity: 'error',
                            source: 'javascript'
                        });
                    } else {
                        braceStack.pop();
                    }
                    break;
                case '[':
                    bracketStack.push({ char, line: lineNumber, column });
                    break;
                case ']':
                    if (bracketStack.length === 0) {
                        errors.push({
                            id: `js-brackets-${lineNumber}-${Math.random()}`,
                            type: 'javascript',
                            message: '多余的右方括号',
                            line: lineNumber,
                            column: column,
                            severity: 'error',
                            source: 'javascript'
                        });
                    } else {
                        bracketStack.pop();
                    }
                    break;
            }
        }
    });

    // 检查未闭合的括号
    parenStack.forEach(item => {
        errors.push({
            id: `js-parens-unclosed-${item.line}-${Math.random()}`,
            type: 'javascript',
            message: '左括号未闭合',
            line: item.line,
            column: item.column,
            severity: 'error',
            source: 'javascript'
        });
    });

    braceStack.forEach(item => {
        errors.push({
            id: `js-braces-unclosed-${item.line}-${Math.random()}`,
            type: 'javascript',
            message: '左大括号未闭合',
            line: item.line,
            column: item.column,
            severity: 'error',
            source: 'javascript'
        });
    });

    bracketStack.forEach(item => {
        errors.push({
            id: `js-brackets-unclosed-${item.line}-${Math.random()}`,
            type: 'javascript',
            message: '左方括号未闭合',
            line: item.line,
            column: item.column,
            severity: 'error',
            source: 'javascript'
        });
    });

    return errors;
};

// 检查字符串匹配（支持跨行字符串）
const checkStringMatching = (code: string): CompileError[] => {
    const errors: CompileError[] = [];
    const lines = code.split('\n');

    let globalInSingleQuote = false;
    let globalInDoubleQuote = false;
    let globalInTemplate = false;
    let singleQuoteStartLine = 0;
    let doubleQuoteStartLine = 0;
    let templateStartLine = 0;

    lines.forEach((line, lineIndex) => {
        const lineNumber = lineIndex + 1;
        let inComment = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const prevChar = i > 0 ? line[i - 1] : '';
            const nextChar = i < line.length - 1 ? line[i + 1] : '';

            // 检查单行注释
            if (char === '/' && nextChar === '/' && !globalInSingleQuote && !globalInDoubleQuote && !globalInTemplate) {
                inComment = true;
                break;
            }

            if (inComment) continue;

            // 跳过转义字符
            if (prevChar === '\\') continue;

            // 处理字符串状态
            if (char === "'" && !globalInDoubleQuote && !globalInTemplate) {
                if (globalInSingleQuote) {
                    globalInSingleQuote = false;
                } else {
                    globalInSingleQuote = true;
                    singleQuoteStartLine = lineNumber;
                }
            } else if (char === '"' && !globalInSingleQuote && !globalInTemplate) {
                if (globalInDoubleQuote) {
                    globalInDoubleQuote = false;
                } else {
                    globalInDoubleQuote = true;
                    doubleQuoteStartLine = lineNumber;
                }
            } else if (char === '`' && !globalInSingleQuote && !globalInDoubleQuote) {
                if (globalInTemplate) {
                    globalInTemplate = false;
                } else {
                    globalInTemplate = true;
                    templateStartLine = lineNumber;
                }
            }
        }
    });

    // 检查是否有未闭合的字符串（只在代码末尾检查）
    if (globalInSingleQuote) {
        errors.push({
            id: `js-quote-unclosed-${singleQuoteStartLine}-${Math.random()}`,
            type: 'javascript',
            message: '单引号字符串未闭合',
            line: singleQuoteStartLine,
            column: lines[singleQuoteStartLine - 1]?.indexOf("'") + 1 || 0,
            severity: 'error',
            source: 'javascript'
        });
    }

    if (globalInDoubleQuote) {
        errors.push({
            id: `js-dquote-unclosed-${doubleQuoteStartLine}-${Math.random()}`,
            type: 'javascript',
            message: '双引号字符串未闭合',
            line: doubleQuoteStartLine,
            column: lines[doubleQuoteStartLine - 1]?.indexOf('"') + 1 || 0,
            severity: 'error',
            source: 'javascript'
        });
    }

    if (globalInTemplate) {
        errors.push({
            id: `js-template-unclosed-${templateStartLine}-${Math.random()}`,
            type: 'javascript',
            message: '模板字符串未闭合',
            line: templateStartLine,
            column: lines[templateStartLine - 1]?.indexOf('`') + 1 || 0,
            severity: 'error',
            source: 'javascript'
        });
    }

    return errors;
};

// 检查常见语法错误
const checkCommonSyntaxErrors = (code: string): CompileError[] => {
    const errors: CompileError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();

        // 跳过注释行和空行
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
            return;
        }

        // 检查函数定义语法错误
        // 1. 匹配 function name { 模式（缺少括号）
        const functionWithBraceMatch = trimmedLine.match(/^function\s+(\w+)\s*{/);
        if (functionWithBraceMatch) {
            const functionName = functionWithBraceMatch[1];
            errors.push({
                id: `js-function-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: `函数 '${functionName}' 定义语法错误：缺少参数括号 ()`,
                line: lineNumber,
                column: line.indexOf('{'),
                severity: 'error',
                source: 'javascript'
            });
        }
        // 2. 匹配 function name( { 模式（括号未闭合）
        else if (trimmedLine.match(/^function\s+(\w+)\s*\(\s*{/)) {
            const functionNameMatch = trimmedLine.match(/^function\s+(\w+)/);
            const functionName = functionNameMatch ? functionNameMatch[1] : 'unknown';
            errors.push({
                id: `js-function-unclosed-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: `函数 '${functionName}' 定义语法错误：参数括号未闭合`,
                line: lineNumber,
                column: line.indexOf('('),
                severity: 'error',
                source: 'javascript'
            });
        }
        // 3. 检查跨行的函数定义（括号未闭合）
        else if (trimmedLine.match(/^function\s+\w+\s*\(/)) {
            const openParens = (trimmedLine.match(/\(/g) || []).length;
            const closeParens = (trimmedLine.match(/\)/g) || []).length;
            if (openParens > closeParens) {
                const functionNameMatch = trimmedLine.match(/^function\s+(\w+)/);
                const functionName = functionNameMatch ? functionNameMatch[1] : 'unknown';
                errors.push({
                    id: `js-function-paren-${lineNumber}-${Math.random()}`,
                    type: 'javascript',
                    message: `函数 '${functionName}' 定义语法错误：参数括号未闭合`,
                    line: lineNumber,
                    column: line.lastIndexOf('('),
                    severity: 'error',
                    source: 'javascript'
                });
            }
        }
        // 4. 检查单独的function声明（没有大括号但也没有括号）
        else {
            const functionMatch = trimmedLine.match(/^function\s+(\w+)\s*$/);
            if (functionMatch) {
                const functionName = functionMatch[1];
                errors.push({
                    id: `js-function-incomplete-${lineNumber}-${Math.random()}`,
                    type: 'javascript',
                    message: `函数 '${functionName}' 定义不完整：缺少参数括号和函数体`,
                    line: lineNumber,
                    column: line.indexOf('function'),
                    severity: 'error',
                    source: 'javascript'
                });
            }
        }

        // 检查其他常见语法错误
        // 检查if语句缺少括号
        if (trimmedLine.match(/^if\s+[^(]/)) {
            errors.push({
                id: `js-if-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: 'if 语句缺少条件括号',
                line: lineNumber,
                column: line.indexOf('if'),
                severity: 'error',
                source: 'javascript'
            });
        }

        // 检查while语句缺少括号
        if (trimmedLine.match(/^while\s+[^(]/)) {
            errors.push({
                id: `js-while-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: 'while 语句缺少条件括号',
                line: lineNumber,
                column: line.indexOf('while'),
                severity: 'error',
                source: 'javascript'
            });
        }

        // 检查for语句缺少括号
        if (trimmedLine.match(/^for\s+[^(]/)) {
            errors.push({
                id: `js-for-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: 'for 语句缺少条件括号',
                line: lineNumber,
                column: line.indexOf('for'),
                severity: 'error',
                source: 'javascript'
            });
        }
    });

    return errors;
};

// 移除字符串和注释内容
const removeStringsAndComments = (code: string): string => {
    let result = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplate = false;
    let inSingleLineComment = false;
    let inMultiLineComment = false;

    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const prevChar = i > 0 ? code[i - 1] : '';
        const nextChar = i < code.length - 1 ? code[i + 1] : '';

        // 处理换行符
        if (char === '\n') {
            inSingleLineComment = false;
            result += char;
            continue;
        }

        // 如果在注释中，跳过
        if (inSingleLineComment || inMultiLineComment) {
            if (inMultiLineComment && char === '*' && nextChar === '/') {
                inMultiLineComment = false;
                i++; // 跳过下一个字符
            }
            result += ' '; // 用空格替代注释内容
            continue;
        }

        // 检查注释开始
        if (char === '/' && nextChar === '/' && !inSingleQuote && !inDoubleQuote && !inTemplate) {
            inSingleLineComment = true;
            result += ' ';
            continue;
        }

        if (char === '/' && nextChar === '*' && !inSingleQuote && !inDoubleQuote && !inTemplate) {
            inMultiLineComment = true;
            result += ' ';
            continue;
        }

        // 如果在字符串中，跳过
        if (inSingleQuote || inDoubleQuote || inTemplate) {
            if ((char === "'" && inSingleQuote) ||
                (char === '"' && inDoubleQuote) ||
                (char === '`' && inTemplate)) {
                if (prevChar !== '\\') {
                    inSingleQuote = inSingleQuote && char !== "'";
                    inDoubleQuote = inDoubleQuote && char !== '"';
                    inTemplate = inTemplate && char !== '`';
                }
            }
            result += ' '; // 用空格替代字符串内容
            continue;
        }

        // 检查字符串开始
        if (char === "'" && prevChar !== '\\') {
            inSingleQuote = true;
            result += ' ';
            continue;
        }

        if (char === '"' && prevChar !== '\\') {
            inDoubleQuote = true;
            result += ' ';
            continue;
        }

        if (char === '`' && prevChar !== '\\') {
            inTemplate = true;
            result += ' ';
            continue;
        }

        result += char;
    }

    return result;
};

// CSS编译错误检测
export const checkCSSErrors = async (code: string, language: 'css' | 'scss' | 'less'): Promise<CompileResult> => {
    const errors: CompileError[] = [];
    let compiledCode = '';

    try {
        if (language === 'scss') {
            const result = sass.compileString(code, {
                syntax: 'scss'
            });
            compiledCode = result.css;
        } else if (language === 'less') {
            const result = await less.render(code);
            compiledCode = result.css;
        } else {
            // 原生 CSS，简单检查语法
            compiledCode = code;
            const cssErrors = parseBasicCSSErrors(code);
            errors.push(...cssErrors);
        }

        return {
            success: errors.length === 0,
            errors,
            compiledCode
        };
    } catch (error: any) {
        // 解析 SCSS/Less 错误信息
        const cssError = parseCSSError(error, language);
        if (cssError) {
            errors.push(cssError);
        }

        return {
            success: false,
            errors,
            compiledCode: code
        };
    }
};

// 解析 CSS 编译错误
const parseCSSError = (error: any, language: 'css' | 'scss' | 'less'): CompileError | null => {
    try {
        // SCSS 错误格式
        if (language === 'scss' && error.span) {
            return {
                id: `css-error-${Date.now()}-${Math.random()}`,
                type: 'css',
                message: error.message || 'SCSS 编译错误',
                line: error.span.start.line + 1,
                column: error.span.start.column,
                severity: 'error',
                source: 'sass'
            };
        }

        // Less 错误格式
        if (language === 'less' && error.line) {
            return {
                id: `css-error-${Date.now()}-${Math.random()}`,
                type: 'css',
                message: error.message || 'Less 编译错误',
                line: error.line,
                column: error.column || 0,
                severity: 'error',
                source: 'less'
            };
        }

        // 通用错误
        return {
            id: `css-error-${Date.now()}-${Math.random()}`,
            type: 'css',
            message: error.message || 'CSS 编译错误',
            line: 1,
            column: 0,
            severity: 'error',
            source: language
        };
    } catch {
        return null;
    }
};

// 基础 CSS 语法检查
const parseBasicCSSErrors = (code: string): CompileError[] => {
    const errors: CompileError[] = [];
    const lines = code.split('\n');

    // 整体检查括号匹配
    const bracketErrors = checkCSSBracketMatching(code);
    errors.push(...bracketErrors);

    // 逐行检查其他语法错误
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();

        // 检查分号
        if (trimmedLine.includes(':') && !trimmedLine.includes(';') && !trimmedLine.includes('{') && !trimmedLine.includes('}') && trimmedLine.length > 0) {
            errors.push({
                id: `css-semicolon-${lineNumber}-${Math.random()}`,
                type: 'css',
                message: '可能缺少分号 ;',
                line: lineNumber,
                column: line.length,
                severity: 'warning',
                source: 'css'
            });
        }
    });

    return errors;
};

// 检查CSS括号匹配
const checkCSSBracketMatching = (code: string): CompileError[] => {
    const errors: CompileError[] = [];
    const lines = code.split('\n');

    // 使用栈来跟踪括号匹配
    const braceStack: Array<{ line: number, column: number }> = [];

    lines.forEach((line, lineIndex) => {
        const lineNumber = lineIndex + 1;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '{') {
                braceStack.push({
                    line: lineNumber,
                    column: i + 1
                });
            } else if (char === '}') {
                if (braceStack.length === 0) {
                    // 多余的右括号
                    errors.push({
                        id: `css-extra-brace-${lineNumber}-${Math.random()}`,
                        type: 'css',
                        message: '多余的右括号 }',
                        line: lineNumber,
                        column: i + 1,
                        severity: 'error',
                        source: 'css'
                    });
                } else {
                    braceStack.pop();
                }
            }
        }
    });

    // 检查未闭合的左括号
    braceStack.forEach(brace => {
        errors.push({
            id: `css-unclosed-brace-${brace.line}-${Math.random()}`,
            type: 'css',
            message: '缺少闭合括号 }',
            line: brace.line,
            column: brace.column,
            severity: 'error',
            source: 'css'
        });
    });

    return errors;
};

// HTML 错误检测（基础检查）
export const checkHTMLErrors = async (code: string): Promise<CompileResult> => {
    const errors: CompileError[] = [];

    // 基础 HTML 语法检查
    const htmlErrors = parseBasicHTMLErrors(code);
    errors.push(...htmlErrors);

    return {
        success: errors.length === 0,
        errors,
        compiledCode: code
    };
};

// 基础 HTML 语法检查
const parseBasicHTMLErrors = (code: string): CompileError[] => {
    const errors: CompileError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();

        // 检查未闭合的标签
        const openTags = trimmedLine.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g) || [];
        const closeTags = trimmedLine.match(/<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/g) || [];

        openTags.forEach(tag => {
            const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9]*)/)?.[1];
            if (tagName && !['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName.toLowerCase())) {
                const closeTag = `</${tagName}>`;
                const hasCloseTag = closeTags.some(close => close.toLowerCase() === closeTag.toLowerCase());

                if (!hasCloseTag) {
                    // 检查后续行是否有闭合标签
                    let found = false;
                    for (let i = index + 1; i < lines.length; i++) {
                        if (lines[i].includes(`</${tagName}>`)) {
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        errors.push({
                            id: `html-unclosed-${lineNumber}-${Math.random()}`,
                            type: 'html',
                            message: `标签 <${tagName}> 可能未闭合`,
                            line: lineNumber,
                            column: line.indexOf(tag) + 1,
                            severity: 'warning',
                            source: 'html'
                        });
                    }
                }
            }
        });
    });

    return errors;
}; 