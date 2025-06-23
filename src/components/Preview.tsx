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

const Preview: React.FC<PreviewProps> = ({ html, css, js, jsLanguage = 'js' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
            !trimmed.includes('Hello World') &&
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
              try {
                ${jsLanguage === 'ts' ? `
                  // TypeScript代码处理
                  if (typeof ts !== 'undefined') {
                    try {
                      const jsCode = \`${escapedJs}\`;
                      console.log('TypeScript compilation input:', jsCode);
                      
                      const result = ts.transpileModule(jsCode, {
                        compilerOptions: {
                          module: ts.ModuleKind.ESNext,
                          target: ts.ScriptTarget.ES2020,
                          jsx: ts.JsxEmit.Preserve,
                          strict: false,
                          esModuleInterop: true,
                          allowSyntheticDefaultImports: true,
                          skipLibCheck: true
                        }
                      });
                      
                      console.log('TypeScript compilation result:', result);
                      
                      if (result.diagnostics && result.diagnostics.length > 0) {
                        throw new Error('TypeScript compilation errors:\\n' + result.diagnostics.map(d => d.messageText).join('\\n'));
                      }
                      
                      console.log('Executing compiled code:', result.outputText);
                      eval(result.outputText);
                    } catch (tsError) {
                      console.error('TypeScript compilation error:', tsError);
                      // 不显示任何内容，让用户看到编辑器中的错误提示
                    }
                  } else {
                    // 如果没有TypeScript编译器，不显示任何内容
                  }
                ` : `
                  // 普通JavaScript代码执行
                  const jsCode = \`${escapedJs}\`;
                  console.log('JavaScript execution input:', jsCode);
                  eval(jsCode);
                `}
              } catch (error) {
                console.error('Preview script error:', error);
                // 不显示任何内容，让用户看到编辑器中的错误提示
              }
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