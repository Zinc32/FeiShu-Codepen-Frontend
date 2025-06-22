import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { createDebugDocument } from '../services/debugService';

const PreviewContainer = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: white;
  position: relative;
`;

const DebugToolbar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: #2d3748;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 12px;
  z-index: 1000;
  border-bottom: 1px solid #4a5568;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const DebugIndicator = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.active ? '#48bb78' : '#a0aec0'};
  font-weight: 500;
`;

const DevToolsTip = styled.div`
  margin-left: auto;
  color: #a0aec0;
  font-size: 11px;
`;

const IframeContainer = styled.div`
  height: calc(100% - 32px);
  width: 100%;
  margin-top: 32px;
`;

interface DebugPreviewProps {
    html: string;
    css: string;
    js: string;
    jsLanguage?: 'js' | 'react' | 'vue' | 'ts';
    debugEnabled: boolean;
}

const DebugPreview: React.FC<DebugPreviewProps> = ({
    html,
    css,
    js,
    jsLanguage = 'js',
    debugEnabled
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isReady, setIsReady] = useState(false);
    const blobUrlRef = useRef<string | null>(null);

    const updatePreview = () => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        try {
            setIsReady(false);

            // 生成框架库脚本
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

            // 创建调试文档
            const content = createDebugDocument(html, css, js, {
                enableDebug: debugEnabled,
                jsLanguage,
                libraryScripts
            });

            // 清理之前的blob URL
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
            }

            // 使用Blob URL来创建固定的iframe源，避免每次都生成新的document context
            const blob = new Blob([content], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            blobUrlRef.current = blobUrl;

            // 设置iframe源
            iframe.src = blobUrl;

            setIsReady(true);

            // 如果启用了调试模式，在控制台输出提示
            if (debugEnabled) {
                console.log('🐛 Debug mode active - Right-click iframe → Inspect Element to debug');
                console.log('📍 Source files location: Sources → webpack:/// → ./', {
                    javascript: 'main.js',
                    css: 'styles.css'
                });
                console.log('💡 The blob file contains the full HTML but you can debug the original source files');
            }

        } catch (error) {
            console.error('Preview rendering error:', error);
            setIsReady(false);
        }
    };

    // 当代码或调试状态变化时更新预览
    useEffect(() => {
        updatePreview();
    }, [html, css, js, jsLanguage, debugEnabled]);

    // 清理blob URL
    useEffect(() => {
        return () => {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
            }
        };
    }, []);

    const handleIframeLoad = () => {
        setIsReady(true);
    };

    return (
        <PreviewContainer>
            <DebugToolbar>
                <DebugIndicator active={debugEnabled}>
                    <span>🐛</span>
                    <span>{debugEnabled ? 'Debug ON' : 'Debug OFF'}</span>
                </DebugIndicator>

                {debugEnabled && (
                    <DevToolsTip>
                        Right-click iframe → Inspect Element to debug with source maps
                    </DevToolsTip>
                )}
            </DebugToolbar>

            <IframeContainer>
                <iframe
                    ref={iframeRef}
                    title="debug-preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onLoad={handleIframeLoad}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: 'white'
                    }}
                />
            </IframeContainer>
        </PreviewContainer>
    );
};

export default DebugPreview; 