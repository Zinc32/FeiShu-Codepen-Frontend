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

const DebugIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: white;
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

            // 使用Data URL
            const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(content);

            // 设置iframe源
            iframe.src = dataUrl;

            setIsReady(true);

            // 如果启用了调试模式，在控制台输出提示
            if (debugEnabled) {
                console.log('Debug mode activated');
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

    // 监听iframe重新运行请求
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'rerun-debug') {
                // 重新更新iframe内容
                updatePreview();
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [html, css, js, jsLanguage, debugEnabled]);

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
                        右键iframe → 检查元素进行调试
                    </DevToolsTip>
                )}
            </DebugToolbar>

            <IframeContainer>
                <DebugIframe
                    ref={iframeRef}
                    title="debug-preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onLoad={handleIframeLoad}
                />
            </IframeContainer>
        </PreviewContainer>
    );
};

export default DebugPreview; 