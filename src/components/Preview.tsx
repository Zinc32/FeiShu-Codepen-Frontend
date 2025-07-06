import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { loadTypeScriptCompiler } from '../services/compilerService';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { Diagnostic } from '@codemirror/lint';

const PreviewContainer = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: white;
`;

interface PreviewProps {
  html: string;
  css: string;
  js: string;
  jsLanguage?: 'js' | 'react' | 'vue' | 'ts';
  onRuntimeError?: (errors: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
  }>) => void;
  hasStaticErrors?: boolean; // 添加静态错误标志
}

// HTML Lint 函数 - 复制自 lintService.ts
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

const Preview: React.FC<PreviewProps> = ({ html, css, js, jsLanguage = 'js', onRuntimeError, hasStaticErrors = false }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 监听来自 iframe 的运行时错误消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Preview: Message received from iframe:', event.data); // 添加调试日志
      if (event.data?.type === 'runtime-error') {
        console.log('Preview: Runtime error message received:', event.data.errors); // 添加调试日志
        if (onRuntimeError) {
          onRuntimeError(event.data.errors);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRuntimeError]);

  // 加载 TypeScript 编译器
  useEffect(() => {
    loadTypeScriptCompiler().catch(error => {
      console.error('Failed to load TypeScript compiler:', error);
    });
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    try {
      // 使用更严格的HTML错误检测
      let hasHtmlError = false;
      const trimmedHtml = html.trim();

      if (trimmedHtml !== '') {
        try {
          // 首先尝试使用htmlLinter进行专业检测
          const tempState = EditorState.create({
            doc: html
          });
          const tempView = new EditorView({
            state: tempState,
            parent: document.createElement('div')
          });

          const diagnostics = htmlLinter(tempView);
          hasHtmlError = diagnostics.length > 0;

          tempView.destroy();
        } catch (error) {
          console.warn('Error running HTML linter:', error);
        }

        // 如果htmlLinter没有检测到错误，使用更严格的后备检测
        if (!hasHtmlError) {
          // 检查标签匹配
          const openTags = (trimmedHtml.match(/</g) || []).length;
          const closeTags = (trimmedHtml.match(/>/g) || []).length;

          // 检查是否有不匹配的标签
          if (openTags !== closeTags) {
            hasHtmlError = true;
          } else {
            // 检查是否有不完整的标签（以<开头但不以>结尾的行）
            const lines = trimmedHtml.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('<') && !trimmedLine.includes('>')) {
                hasHtmlError = true;
                break;
              }
            }
          }
        }
      }

      // 调试信息
      console.log('HTML error detection result:', hasHtmlError, 'HTML length:', html.length, 'HTML content:', html.substring(0, 100));

      // 如果HTML有错误，只渲染基本的HTML和CSS，完全不执行JavaScript
      if (hasHtmlError) {
        console.log('HTML error detected, rendering HTML/CSS only without JavaScript');
        // 直接处理HTML字符串，移除所有script标签和事件处理器
        let cleanHtml = html
          // 移除所有script标签及其内容
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          // 移除所有事件处理器属性
          .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
          // 移除javascript:协议
          .replace(/javascript:/gi, '')
          // 移除data:协议（可能包含JavaScript）
          .replace(/data:text\/html[^"']*["']/gi, '');

        const content = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  overflow-x: hidden;
                }
                ${css}
              </style>
            </head>
            <body>
              ${cleanHtml}
            </body>
          </html>
        `;

        doc.open();
        doc.write(content);
        doc.close();
        return;
      }

      // 只有在HTML没有错误的情况下，才继续处理JavaScript
      // 检查是否有静态错误，如果有则不执行JavaScript
      if (hasStaticErrors) {
        console.log('Static errors detected, executing JavaScript but not reporting runtime errors');

        // 清理 JavaScript 代码，移除测试用的注释和危险代码
        const cleanJs = js
          // 首先移除多行注释块
          .replace(/\/\*[\s\S]*?\*\//g, '')
          // 移除包含特定内容的行
          .split('\n')
          .filter(line => {
            const trimmed = line.trim();
            return !trimmed.includes('错误：') &&
              !trimmed.includes('// 错误') &&
              !trimmed.includes('/* 错误') &&
              !trimmed.includes('setTimeout("alert') &&
              !trimmed.includes('setInterval("alert') &&
              !trimmed.includes('eval("') &&
              !trimmed.includes("eval('") &&
              !trimmed.includes('document.write(') &&
              !trimmed.includes('检测到危险函数') &&
              !trimmed.includes('检测到限制的函数');
          })
          .join('\n')
          // 移除危险函数调用（在实际执行前先过滤）
          .replace(/eval\s*\([^)]*\)\s*;?/g, '')
          .replace(/new\s+Function\s*\([^)]*\)\s*;?/g, '')
          .replace(/document\.write\s*\([^)]*\)\s*;?/g, '')
          .replace(/setTimeout\s*\(\s*["'][^"']*["']\s*,\s*\d+\s*\)\s*;?/g, '')
          .replace(/setInterval\s*\(\s*["'][^"']*["']\s*,\s*\d+\s*\)\s*;?/g, '')
          .replace(/alert\s*\([^)]*\)\s*;?/g, '')
          .trim();

        // 转义JavaScript代码，避免模板字符串中的特殊字符问题
        const escapedJs = cleanJs
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');

        let libraryScripts = '';
        if (jsLanguage === 'react') {
          libraryScripts = `
            <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          `;
        } else if (jsLanguage === 'vue') {
          libraryScripts = `
            <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
          `;
        } else if (jsLanguage === 'ts') {
          libraryScripts = `
            <script src="https://cdnjs.cloudflare.com/ajax/libs/typescript/5.3.3/typescript.min.js"></script>
          `;
        }

        const content = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  overflow-x: hidden;
                }
                ${css}
              </style>
              ${libraryScripts}
            </head>
            <body>
              ${html}
              <script>
                // 静态错误时执行JavaScript但不报告运行时错误
                try {
                  ${escapedJs}
                } catch (e) {
                  // 静默处理错误，不发送给父组件
                  console.log('JavaScript executed with static errors present');
                }
              </script>
            </body>
          </html>
        `;

        doc.open();
        doc.write(content);
        doc.close();
        return;
      }

      // 如果没有静态错误，正常加载所有内容
      let libraryScripts = '';
      if (jsLanguage === 'react') {
        libraryScripts = `
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        `;
      } else if (jsLanguage === 'vue') {
        libraryScripts = `
          <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
        `;
      } else if (jsLanguage === 'ts') {
        libraryScripts = `
          <script src="https://cdnjs.cloudflare.com/ajax/libs/typescript/5.3.3/typescript.min.js"></script>
        `;
      }

      // 清理 JavaScript 代码，移除测试用的注释和危险代码
      const cleanJs = js
        // 首先移除多行注释块
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // 移除包含特定内容的行
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          return !trimmed.includes('错误：') &&
            !trimmed.includes('// 错误') &&
            !trimmed.includes('/* 错误') &&
            !trimmed.includes('setTimeout("alert') &&
            !trimmed.includes('setInterval("alert') &&
            !trimmed.includes('eval("') &&
            !trimmed.includes("eval('") &&
            !trimmed.includes('document.write(') &&
            !trimmed.includes('检测到危险函数') &&
            !trimmed.includes('检测到限制的函数');
        })
        .join('\n')
        // 移除危险函数调用（在实际执行前先过滤）
        .replace(/eval\s*\([^)]*\)\s*;?/g, '')
        .replace(/new\s+Function\s*\([^)]*\)\s*;?/g, '')
        .replace(/document\.write\s*\([^)]*\)\s*;?/g, '')
        .replace(/setTimeout\s*\(\s*["'][^"']*["']\s*,\s*\d+\s*\)\s*;?/g, '')
        .replace(/setInterval\s*\(\s*["'][^"']*["']\s*,\s*\d+\s*\)\s*;?/g, '')
        .replace(/alert\s*\([^)]*\)\s*;?/g, '')
        .trim();

      // 转义JavaScript代码，避免模板字符串中的特殊字符问题
      const escapedJs = cleanJs
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');

      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                padding: 0;
                overflow-x: hidden;
              }
              ${css}
            </style>
            ${libraryScripts}
          </head>
          <body>
            ${html}
            <script>
              // 运行时错误捕获系统
              (function() {
                var runtimeErrors = [];
                
                // 捕获全局 JavaScript 错误
                window.onerror = function(message, source, lineno, colno, error) {
                  
                  // 暂时使用原始行号，我们需要看看实际的HTML结构
                  var userCodeLine = lineno || 1;
                  
                  // 解析错误信息
                  let errorMessage = message;
                  if (typeof message === 'string') {
                    // 清理错误消息
                    errorMessage = message
                      .replace(/Uncaught\\s+/i, '')
                      .replace(/ReferenceError:\\s*/i, '未定义错误: ')
                      .replace(/TypeError:\\s*/i, '类型错误: ')
                      .replace(/SyntaxError:\\s*/i, '语法错误: ')
                      .replace(/RangeError:\\s*/i, '范围错误: ')
                      .replace(/Error:\\s*/i, '错误: ')
                      .replace(/is not defined/i, '未定义')
                      .replace(/is not a function/i, '不是一个函数')
                      .replace(/Cannot read propert(y|ies) of undefined/i, '无法读取未定义的属性')
                      .replace(/Cannot read propert(y|ies) of null/i, '无法读取null的属性')
                      .replace(/Cannot set propert(y|ies) of undefined/i, '无法设置未定义的属性')
                      .replace(/Cannot set propert(y|ies) of null/i, '无法设置null的属性');
                  }
                  
                  var errorObj = {
                    line: userCodeLine,
                    column: colno || 0,
                    message: 'Runtime error: ' + errorMessage,
                    severity: 'error'
                  };
                  
                  runtimeErrors.push(errorObj);
                  
                  // 发送错误到父窗口
                  try {
                    var messageData = {
                      type: 'runtime-error',
                      errors: runtimeErrors
                    };
                    window.parent.postMessage(messageData, '*');
                  } catch (e) {
                    console.error('Failed to send runtime error to parent:', e);
                  }
                  
                  return true; // 阻止默认错误处理
                };
                
                // 捕获 Promise 拒绝错误
                window.addEventListener('unhandledrejection', function(event) {
                  console.error('Unhandled promise rejection:', event.reason);
                  
                  let errorMessage = 'Unhandled Promise error';
                  if (event.reason && event.reason.message) {
                    errorMessage = event.reason.message;
                  } else if (typeof event.reason === 'string') {
                    errorMessage = event.reason;
                  }
                  
                  runtimeErrors.push({
                    line: 1,
                    column: 0,
                    message: 'Promise error: ' + errorMessage,
                    severity: 'error'
                  });
                  
                  try {
                    window.parent.postMessage({
                      type: 'runtime-error',
                      errors: runtimeErrors
                    }, '*');
                  } catch (e) {
                    console.warn('Failed to send promise error to parent:', e);
                  }
                  
                  event.preventDefault();
                });
                
                // 初始代码执行 - 纯运行时执行
                runtimeErrors = []; // 重置错误数组
                
                try {
                eval(\`${escapedJs}\`);
                  
                } catch (error) {
                  // 直接处理eval错误，解析正确的行号
                  var errorLine = 1; // 默认第1行
                  
                  // 尝试从错误堆栈中解析行号
                  if (error.stack) {
                    var stackLines = error.stack.split('\\n');
                    for (var i = 0; i < stackLines.length; i++) {
                      var line = stackLines[i];
                      // 查找eval中的行号信息：<anonymous>:行号:列号
                      var match = line.match(/<anonymous>:(\\d+):(\\d+)/);
                      if (match) {
                        errorLine = parseInt(match[1], 10);
                        break;
                      }
                    }
                  }
                  
                  // 直接创建错误对象并发送
                  var errorObj = {
                    line: errorLine,
                    column: 0,
                    message: 'Runtime error: ' + (error.message || '未知错误'),
                    severity: 'error'
                  };
                  
                  runtimeErrors.push(errorObj);
                  
                  try {
                    window.parent.postMessage({
                      type: 'runtime-error',
                      errors: runtimeErrors
                    }, '*');
                  } catch (e) {
                    console.warn('Failed to send eval error:', e);
                  }
                }
              })();
            </script>
          </body>
        </html>
      `;

      doc.open();
      doc.write(content);
      doc.close();
    } catch (error) {
      console.error('Preview rendering error:', error);
    }
  }, [html, css, js, jsLanguage]);

  return (
    <PreviewContainer>
      <iframe
        ref={iframeRef}
        title="preview"
        sandbox="allow-scripts allow-same-origin allow-modals allow-pointer-lock allow-downloads"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </PreviewContainer>
  );
};

export default Preview;