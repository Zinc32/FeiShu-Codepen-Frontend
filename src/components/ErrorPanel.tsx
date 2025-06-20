import React, { useState } from 'react';
import styled from '@emotion/styled';
import { CompileError } from '../types/errorTypes';

interface ErrorPanelProps {
    htmlErrors: CompileError[];
    cssErrors: CompileError[];
    jsErrors: CompileError[];
    onErrorClick: (error: CompileError) => void;
    onClose: () => void;
}

const ErrorPanelContainer = styled.div`
    background-color: #1e1e1e;
    border-top: 1px solid #404040;
    color: #ffffff;
    font-family: 'Consolas', 'Monaco', 'Lucida Console', monospace;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
    position: relative;
`;

const ErrorPanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: #2d2d2d;
    border-bottom: 1px solid #404040;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 10;
`;

const ErrorTabs = styled.div`
    display: flex;
    gap: 16px;
`;

const ErrorTab = styled.button<{ active: boolean; errorCount: number }>`
    background: none;
    border: none;
    color: ${props => props.active ? '#ffffff' : '#888888'};
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    
    &:hover {
        color: #ffffff;
        background-color: rgba(255, 255, 255, 0.1);
    }
    
    ${props => props.active && `
        background-color: #007acc;
        color: #ffffff;
    `}
    
    ${props => props.errorCount > 0 && `
        &::after {
            content: '${props.errorCount}';
            background-color: #ff4757;
            color: #ffffff;
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 10px;
            min-width: 16px;
            text-align: center;
        }
    `}
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: #888888;
    font-size: 16px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
        color: #ffffff;
        background-color: rgba(255, 255, 255, 0.1);
    }
`;

const ErrorList = styled.div`
    padding: 0;
`;

const ErrorItem = styled.div<{ severity: 'error' | 'warning' | 'info' }>`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid #333333;
    cursor: pointer;
    transition: background-color 0.2s ease;
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }
    
    &:last-child {
        border-bottom: none;
    }
`;

const ErrorIcon = styled.div<{ severity: 'error' | 'warning' | 'info' }>`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    flex-shrink: 0;
    margin-top: 2px;
    
    ${props => {
        switch (props.severity) {
            case 'error':
                return `
                    background-color: #ff4757;
                    color: #ffffff;
                `;
            case 'warning':
                return `
                    background-color: #ffa500;
                    color: #ffffff;
                `;
            case 'info':
                return `
                    background-color: #007bff;
                    color: #ffffff;
                `;
            default:
                return `
                    background-color: #666666;
                    color: #ffffff;
                `;
        }
    }}
`;

const ErrorContent = styled.div`
    flex: 1;
    min-width: 0;
`;

const ErrorMessage = styled.div`
    color: #ffffff;
    font-weight: 500;
    margin-bottom: 4px;
    word-wrap: break-word;
`;

const ErrorLocation = styled.div`
    color: #888888;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const ErrorType = styled.span`
    color: #007acc;
    text-transform: uppercase;
    font-weight: 600;
`;

const ErrorSource = styled.span`
    color: #666666;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 24px 12px;
    color: #888888;
    font-style: italic;
`;

const ErrorPanel: React.FC<ErrorPanelProps> = ({
    htmlErrors,
    cssErrors,
    jsErrors,
    onErrorClick,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('js');
    
    const totalErrors = htmlErrors.length + cssErrors.length + jsErrors.length;
    
    if (totalErrors === 0) {
        return null;
    }
    
    const getCurrentErrors = () => {
        switch (activeTab) {
            case 'html': return htmlErrors;
            case 'css': return cssErrors;
            case 'js': return jsErrors;
            default: return jsErrors;
        }
    };
    
    const getErrorIcon = (severity: 'error' | 'warning' | 'info') => {
        switch (severity) {
            case 'error': return '✕';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
            default: return '•';
        }
    };
    
    const getTabIcon = (type: 'html' | 'css' | 'js') => {
        switch (type) {
            case 'html': return '📄';
            case 'css': return '🎨';
            case 'js': return '⚡';
            default: return '📄';
        }
    };
    
    const currentErrors = getCurrentErrors();
    
    return (
        <ErrorPanelContainer>
            <ErrorPanelHeader>
                <ErrorTabs>
                    <ErrorTab
                        active={activeTab === 'html'}
                        errorCount={htmlErrors.length}
                        onClick={() => setActiveTab('html')}
                    >
                        {getTabIcon('html')} HTML
                    </ErrorTab>
                    <ErrorTab
                        active={activeTab === 'css'}
                        errorCount={cssErrors.length}
                        onClick={() => setActiveTab('css')}
                    >
                        {getTabIcon('css')} CSS
                    </ErrorTab>
                    <ErrorTab
                        active={activeTab === 'js'}
                        errorCount={jsErrors.length}
                        onClick={() => setActiveTab('js')}
                    >
                        {getTabIcon('js')} JavaScript
                    </ErrorTab>
                </ErrorTabs>
                <CloseButton onClick={onClose}>
                    ✕
                </CloseButton>
            </ErrorPanelHeader>
            
            <ErrorList>
                {currentErrors.length === 0 ? (
                    <EmptyState>
                        {getTabIcon(activeTab)} 没有 {activeTab.toUpperCase()} 错误
                    </EmptyState>
                ) : (
                    currentErrors.map((error) => (
                        <ErrorItem
                            key={error.id}
                            severity={error.severity}
                            onClick={() => onErrorClick(error)}
                        >
                            <ErrorIcon severity={error.severity}>
                                {getErrorIcon(error.severity)}
                            </ErrorIcon>
                            <ErrorContent>
                                <ErrorMessage>{error.message}</ErrorMessage>
                                <ErrorLocation>
                                    <ErrorType>{error.type}</ErrorType>
                                    <span>Line {error.line}, Column {error.column}</span>
                                    {error.source && (
                                        <ErrorSource>({error.source})</ErrorSource>
                                    )}
                                </ErrorLocation>
                            </ErrorContent>
                        </ErrorItem>
                    ))
                )}
            </ErrorList>
        </ErrorPanelContainer>
    );
};

export default ErrorPanel; 