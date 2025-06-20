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
        
        // 尝试从错误信息中提取行号
        const lineMatch = message.match(/line (\d+)/i);
        if (lineMatch) {
            line = parseInt(lineMatch[1], 10);
        }
        
        // 尝试从错误信息中提取列号
        const columnMatch = message.match(/column (\d+)/i);
        if (columnMatch) {
            column = parseInt(columnMatch[1], 10);
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
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        // 检查括号匹配
        const openParens = (trimmedLine.match(/\(/g) || []).length;
        const closeParens = (trimmedLine.match(/\)/g) || []).length;
        const openBraces = (trimmedLine.match(/\{/g) || []).length;
        const closeBraces = (trimmedLine.match(/\}/g) || []).length;
        const openBrackets = (trimmedLine.match(/\[/g) || []).length;
        const closeBrackets = (trimmedLine.match(/\]/g) || []).length;
        
        if (openParens !== closeParens) {
            errors.push({
                id: `js-parens-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: '括号不匹配',
                line: lineNumber,
                column: line.indexOf('(') + 1,
                severity: 'warning',
                source: 'javascript'
            });
        }
        
        if (openBraces !== closeBraces) {
            errors.push({
                id: `js-braces-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: '大括号不匹配',
                line: lineNumber,
                column: line.indexOf('{') + 1,
                severity: 'warning',
                source: 'javascript'
            });
        }
        
        if (openBrackets !== closeBrackets) {
            errors.push({
                id: `js-brackets-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: '方括号不匹配',
                line: lineNumber,
                column: line.indexOf('[') + 1,
                severity: 'warning',
                source: 'javascript'
            });
        }
        
        // 检查常见的语法错误
        if (trimmedLine.includes('function') && !trimmedLine.includes('(')) {
            errors.push({
                id: `js-function-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: '函数定义缺少括号',
                line: lineNumber,
                column: line.indexOf('function') + 1,
                severity: 'error',
                source: 'javascript'
            });
        }
        
        // 检查未闭合的字符串
        const singleQuotes = (trimmedLine.match(/'/g) || []).length;
        const doubleQuotes = (trimmedLine.match(/"/g) || []).length;
        const backticks = (trimmedLine.match(/`/g) || []).length;
        
        if (singleQuotes % 2 !== 0) {
            errors.push({
                id: `js-quote-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: '单引号未闭合',
                line: lineNumber,
                column: line.indexOf("'") + 1,
                severity: 'error',
                source: 'javascript'
            });
        }
        
        if (doubleQuotes % 2 !== 0) {
            errors.push({
                id: `js-dquote-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: '双引号未闭合',
                line: lineNumber,
                column: line.indexOf('"') + 1,
                severity: 'error',
                source: 'javascript'
            });
        }
        
        if (backticks % 2 !== 0) {
            errors.push({
                id: `js-template-${lineNumber}-${Math.random()}`,
                type: 'javascript',
                message: '模板字符串未闭合',
                line: lineNumber,
                column: line.indexOf('`') + 1,
                severity: 'error',
                source: 'javascript'
            });
        }
    });
    
    return errors;
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
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        // 检查括号匹配
        if (trimmedLine.includes('{') && !trimmedLine.includes('}')) {
            const openBraces = (trimmedLine.match(/\{/g) || []).length;
            const closeBraces = (trimmedLine.match(/\}/g) || []).length;
            
            if (openBraces > closeBraces) {
                // 检查后续行是否有对应的闭括号
                let found = false;
                for (let i = index + 1; i < lines.length; i++) {
                    if (lines[i].includes('}')) {
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    errors.push({
                        id: `css-syntax-${lineNumber}-${Math.random()}`,
                        type: 'css',
                        message: '缺少闭合括号 }',
                        line: lineNumber,
                        column: line.indexOf('{') + 1,
                        severity: 'error',
                        source: 'css'
                    });
                }
            }
        }
        
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