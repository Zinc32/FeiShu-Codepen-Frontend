import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { Diagnostic } from '@codemirror/lint';

const PreviewContainer = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: white;
`;

const PreviewIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
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

const Preview: React.FC<PreviewProps> = ({ html, css, js, jsLanguage = 'js', onRuntimeError }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 监听来自 iframe 的运行时错误消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'runtime-error') {
        if (onRuntimeError) {
          onRuntimeError(event.data.errors);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRuntimeError]);



  // 用 ref 跟踪当前代码，避免不必要的重建
  const currentCodeRef = useRef({ html: '', css: '', js: '', jsLanguage: 'js' });
  const iframeInitializedRef = useRef(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    // 检查是否真的需要重建 iframe
    const needsRebuild = !iframeInitializedRef.current ||
      currentCodeRef.current.html !== html ||
      currentCodeRef.current.css !== css ||
      currentCodeRef.current.jsLanguage !== jsLanguage;

    // 如果只是 JS 代码改变且 iframe 已经初始化，使用增量更新
    if (iframeInitializedRef.current &&
      currentCodeRef.current.html === html &&
      currentCodeRef.current.css === css &&
      currentCodeRef.current.jsLanguage === jsLanguage &&
      currentCodeRef.current.js !== js) {

      // 直接执行新的 JS 代码，不重建整个 iframe
      try {
        const iframeWindow = iframe.contentWindow;
        if (iframeWindow && (iframeWindow as any).executeUserCode) {
          // 清理 JavaScript 代码（与完整重建时相同的清理逻辑）
          const cleanJs = js
            .replace(/\/\*[\s\S]*?\*\//g, '')
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
            .replace(/eval\s*\([^)]*\)\s*;?/g, '')
            .replace(/new\s+Function\s*\([^)]*\)\s*;?/g, '')
            .replace(/document\.write\s*\([^)]*\)\s*;?/g, '')
            .replace(/setTimeout\s*\(\s*["'][^"']*["']\s*,\s*\d+\s*\)\s*;?/g, '')
            .replace(/setInterval\s*\(\s*["'][^"']*["']\s*,\s*\d+\s*\)\s*;?/g, '')
            .replace(/alert\s*\([^)]*\)\s*;?/g, '')
            .trim();

          currentCodeRef.current.js = js;
          (iframeWindow as any).executeUserCode(cleanJs);
          return;
        }
      } catch (error) {
        console.warn('Failed incremental update, falling back to full rebuild:', error);
      }
    }

    if (!needsRebuild) {
      return;
    }
    currentCodeRef.current = { html, css, js, jsLanguage };

    try {
      // 使用 codemirror/lint 的 htmlLinter 来检测HTML错误
      let hasHtmlError = false;
      try {
        // 创建一个临时的EditorView来运行htmlLinter
        const tempState = EditorState.create({
          doc: html
        });
        const tempView = new EditorView({
          state: tempState,
          parent: document.createElement('div')
        });

        // 使用与Editor组件相同的htmlLinter函数
        const diagnostics = htmlLinter(tempView);
        hasHtmlError = diagnostics.length > 0;

        // 清理临时的EditorView
        tempView.destroy();
      } catch (error) {
        console.warn('Error running HTML linter:', error);
        // 如果linter出错，使用简单的检查作为后备
        hasHtmlError = html.trim() !== '' && (
          (html.includes('<') && !html.includes('>')) ||
          (html.match(/</g) || []).length !== (html.match(/>/g) || []).length
        );
      }

      // 如果HTML有错误，只渲染基本的HTML和CSS
      if (hasHtmlError) {
        // 创建一个临时的div来解析HTML内容
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // 移除所有script标签
        const scripts = tempDiv.getElementsByTagName('script');
        while (scripts.length > 0) {
          scripts[0].parentNode?.removeChild(scripts[0]);
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
            </head>
            <body>
              ${tempDiv.innerHTML}
            </body>
          </html>
        `;

        doc.open();
        doc.write(content);
        doc.close();
        return;
      }

      // 如果HTML没有错误，正常加载所有内容
      let libraryScripts = '';
      if (jsLanguage === 'react') {
        libraryScripts = `
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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

      // 为所有语言都加载 Babel，用于编译导入的代码
      if (jsLanguage !== 'react') {
        libraryScripts += `
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
              (function() {
                // 运行时错误捕获系统 - 使用 IIFE 避免变量冲突
                let runtimeErrors = [];
                
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
                
                // 提供增量更新函数
                window.executeUserCode = function(newCode) {
                  
                  // 清空之前的错误但不发送清除消息（保持错误显示的连续性）
                  var previousErrorCount = runtimeErrors.length;
                  runtimeErrors = [];
                  var executionSuccessful = false;
                  
                  try {
                    // 清理之前的 React 根节点（如果存在）
                    if (window.reactRoot) {
                      try {
                        window.reactRoot.unmount();
                      } catch (e) {
                        // 忽略卸载错误
                      }
                      window.reactRoot = null;
                    }
                    
                    // 清理之前的 Vue 应用（如果存在）
                    if (window.vueApp) {
                      try {
                        window.vueApp.unmount();
                      } catch (e) {
                        // 忽略卸载错误
                      }
                      window.vueApp = null;
                    }
                    
                    // 编译代码（如果需要）
                    let codeToExecute = newCode;
                    
                    // 如果是 React 代码，需要编译 JSX
                    if ('${jsLanguage}' === 'react') {
                      try {
                        if (window.Babel) {
                          const result = window.Babel.transform(codeToExecute, {
                            presets: [
                              ["env", { targets: "defaults" }],
                              ["react", { runtime: "classic" }]
                            ],
                            plugins: [],
                          });
                          codeToExecute = result.code || codeToExecute;
                        }
                      } catch (compileError) {
                        console.warn('Failed to compile React code:', compileError);
                      }
                    }
                    
                    // 如果是 TypeScript 代码，需要编译
                    if ('${jsLanguage}' === 'ts') {
                      try {
                        if (window.ts) {
                          const result = window.ts.transpileModule(codeToExecute, {
                            compilerOptions: {
                              module: window.ts.ModuleKind.ESNext,
                              target: window.ts.ScriptTarget.ES2020,
                              jsx: window.ts.JsxEmit.Preserve,
                              strict: false,
                              esModuleInterop: true,
                              allowSyntheticDefaultImports: true,
                              skipLibCheck: true
                            }
                          });
                          codeToExecute = result.outputText || codeToExecute;
                        }
                      } catch (compileError) {
                        console.warn('Failed to compile TypeScript code:', compileError);
                      }
                    }
                    
                    eval(codeToExecute);
                    executionSuccessful = true;
                    
                    // 延迟检查是否需要清除错误，避免时序竞争
                    setTimeout(function() {
                      if (executionSuccessful && previousErrorCount > 0 && runtimeErrors.length === 0) {
                        try {
                          window.parent.postMessage({
                            type: 'runtime-error',
                            errors: []
                          }, '*');
                        } catch (e) {
                          console.warn('Failed to send clear message:', e);
                        }
                      }
                    }, 50); // 给 window.onerror 足够时间处理
                    
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
                
                // 初始代码执行 - 编译并执行
                runtimeErrors = []; // 重置错误数组
                
                try {
                  // 清理之前的 React 根节点（如果存在）
                  if (window.reactRoot) {
                    try {
                      window.reactRoot.unmount();
                    } catch (e) {
                      // 忽略卸载错误
                    }
                    window.reactRoot = null;
                  }
                  
                  // 清理之前的 Vue 应用（如果存在）
                  if (window.vueApp) {
                    try {
                      window.vueApp.unmount();
                    } catch (e) {
                      // 忽略卸载错误
                    }
                    window.vueApp = null;
                  }
                  
                  // 编译代码（如果需要）
                  let codeToExecute = \`${cleanJs}\`;
                  
                  // 如果是 React 代码，需要编译 JSX
                  if ('${jsLanguage}' === 'react') {
                    try {
                      if (window.Babel) {
                        const result = window.Babel.transform(codeToExecute, {
                          presets: [
                            ["env", { targets: "defaults" }],
                            ["react", { runtime: "classic" }]
                          ],
                          plugins: [],
                        });
                        codeToExecute = result.code || codeToExecute;
                      }
                    } catch (compileError) {
                      console.warn('Failed to compile React code:', compileError);
                    }
                  }
                  
                  // 如果是 TypeScript 代码，需要编译
                  if ('${jsLanguage}' === 'ts') {
                    try {
                      if (window.ts) {
                        const result = window.ts.transpileModule(codeToExecute, {
                          compilerOptions: {
                            module: window.ts.ModuleKind.ESNext,
                            target: window.ts.ScriptTarget.ES2020,
                            jsx: window.ts.JsxEmit.Preserve,
                            strict: false,
                            esModuleInterop: true,
                            allowSyntheticDefaultImports: true,
                            skipLibCheck: true
                          }
                        });
                        codeToExecute = result.outputText || codeToExecute;
                      }
                    } catch (compileError) {
                      console.warn('Failed to compile TypeScript code:', compileError);
                    }
                  }
                  
                  // 执行编译后的代码
                  eval(codeToExecute);
                  
                } catch (error) {
                  // 手动触发错误处理，因为 try-catch 可能阻止 window.onerror
                  if (window.onerror) {
                    window.onerror(error.message, '', 0, 0, error);
                  }
                }
                
              })(); // 结束 IIFE
            </script>
          </body>
        </html>
      `;

      doc.open();
      doc.write(content);
      doc.close();

      // 标记 iframe 已初始化
      iframeInitializedRef.current = true;

    } catch (error) {
      console.error('Preview rendering error:', error);
      iframeInitializedRef.current = false;
    }
  }, [html, css, js, jsLanguage]);

  return (
    <PreviewContainer>
      <PreviewIframe
        ref={iframeRef}
        title="preview"
        sandbox="allow-scripts allow-same-origin allow-modals allow-pointer-lock allow-downloads"
      />
    </PreviewContainer>
  );
};

export default Preview;