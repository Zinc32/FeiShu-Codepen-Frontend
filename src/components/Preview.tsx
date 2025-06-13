import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const PreviewContainer = styled.div`
  height: 100%;
  overflow: auto;
  background: white;
  padding: 20px;
`;

interface PreviewProps {
  html: string;
  css: string;
  js: string;
}

const Preview: React.FC<PreviewProps> = ({ html, css, js }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    try {
      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>
              try {
                ${js}
              } catch (error) {
                console.error('Preview script error:', error);
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
  }, [html, css, js]);

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