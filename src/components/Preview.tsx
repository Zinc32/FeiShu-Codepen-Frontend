import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { compileJsFramework, loadTypeScriptCompiler } from '../services/compilerService';

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
      let libraryScripts = '';

      // Add library scripts based on the selected language
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
        // 对于TypeScript，添加TypeScript编译器
        libraryScripts = `
          <script src="https://cdnjs.cloudflare.com/ajax/libs/typescript/5.3.3/typescript.min.js"></script>
        `;
      }

      // 转义JavaScript代码，避免模板字符串中的特殊字符问题
      const escapedJs = js
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
                        const errors = result.diagnostics.map(d => d.messageText).join('\\n');
                        throw new Error('TypeScript compilation errors:\\n' + errors);
                      }
                      
                      console.log('Executing compiled code:', result.outputText);
                      eval(result.outputText);
                    } catch (tsError) {
                      console.error('TypeScript compilation error:', tsError);
                      const errorDiv = document.createElement('div');
                      errorDiv.style.cssText = 'color: red; padding: 20px; font-family: monospace; background: #ffe6e6; border: 1px solid #ff9999; margin: 10px; border-radius: 4px; white-space: pre-wrap;';
                      errorDiv.innerHTML = '<strong>TypeScript Error:</strong><br>' + tsError.message.replace(/\\n/g, '<br>');
                      document.body.appendChild(errorDiv);
                    }
                  } else {
                    // 如果没有TypeScript编译器，显示错误信息
                    const errorDiv = document.createElement('div');
                    errorDiv.style.cssText = 'color: red; padding: 20px; font-family: monospace; background: #ffe6e6; border: 1px solid #ff9999; margin: 10px; border-radius: 4px;';
                    errorDiv.innerHTML = '<strong>Error:</strong> TypeScript compiler not loaded';
                    document.body.appendChild(errorDiv);
                  }
                ` : `
                  // 普通JavaScript代码执行
                  const jsCode = \`${escapedJs}\`;
                  console.log('JavaScript execution input:', jsCode);
                  eval(jsCode);
                `}
              } catch (error) {
                console.error('Preview script error:', error);
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'color: red; padding: 20px; font-family: monospace; background: #ffe6e6; border: 1px solid #ff9999; margin: 10px; border-radius: 4px; white-space: pre-wrap;';
                errorDiv.innerHTML = '<strong>Runtime Error:</strong><br>' + error.message.replace(/\\n/g, '<br>');
                document.body.appendChild(errorDiv);
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
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </PreviewContainer>
  );
};

export default Preview;