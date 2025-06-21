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
                      const result = ts.transpileModule(\`${js}\`, {
                        compilerOptions: {
                          module: ts.ModuleKind.ESNext,
                          target: ts.ScriptTarget.ES2018,
                          jsx: ts.JsxEmit.Preserve,
                          strict: false,
                          esModuleInterop: true,
                          allowSyntheticDefaultImports: true,
                          skipLibCheck: true
                        }
                      });
                      eval(result.outputText);
                    } catch (tsError) {
                      console.error('TypeScript compilation error:', tsError);
                      document.body.innerHTML += '<div style="color: red; padding: 20px; font-family: monospace;">TypeScript Error: ' + tsError.message + '</div>';
                    }
                  } else {
                    // 如果没有TypeScript编译器，直接执行代码
                    ${js}
                  }
                ` : js}
              } catch (error) {
                console.error('Preview script error:', error);
                document.body.innerHTML += '<div style="color: red; padding: 20px; font-family: monospace;">Error: ' + error.message + '</div>';
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