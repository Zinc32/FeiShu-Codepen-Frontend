import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap, EditorViewConfig } from '@codemirror/view';
import { EditorState, Extension, Transaction } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import styled from '@emotion/styled';
import { createPen, updatePen, getUserPens, Pen, PenData } from '../services/penService';
import Preview from './Preview'; // Import the Preview component

const Container = styled.div`
    display: flex;
    height: 100vh;
    background-color: #f6f8fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
`;

const EditorContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e1e4e8;
    background-color: #ffffff;
    height: 100vh;
    overflow: hidden;

    .cm-editor {
        height: 100%;
        max-height: 100%;
        overflow: auto;
        transform: translateZ(0);
        font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace !important;
        font-size: 13px !important;
        font-weight: normal !important;
        line-height: 1.3 !important;
        font-variant-ligatures: none !important;
        text-rendering: auto !important;
        -webkit-font-smoothing: auto !important;
        -moz-osx-font-smoothing: auto !important;
        letter-spacing: 0 !important;
        will-change: transform;
    }

    .cm-scroller {
        overflow: auto !important;
        max-height: 100% !important;
    }

    .cm-gutters {
        background-color: #f8f8f8;
        border-right: 1px solid #e8e8e8;
        color: #858585;
    }

    .cm-lineNumbers {
        min-width: 3ch;
        text-align: right;
        padding-right: 16px;
        font-size: 12px !important;
        font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace !important;
        font-weight: normal !important;
        letter-spacing: 0 !important;
    }

    .cm-lineNumbers .cm-gutterElement {
        color: #858585;
        font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace !important;
        font-size: 12px !important;
        font-weight: normal !important;
        line-height: 1.3 !important;
        letter-spacing: 0 !important;
    }

    .cm-content {
        background-color: #ffffff;
        caret-color: #0366d6;
        padding: 12px 16px;
        font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace !important;
        font-size: 13px !important;
        font-weight: normal !important;
        line-height: 1.3 !important;
        letter-spacing: 0 !important;
        text-rendering: auto !important;
        -webkit-font-smoothing: auto !important;
        -moz-osx-font-smoothing: auto !important;
        font-variant-ligatures: none !important;
    }

    /* 改善文本选中效果 */
    .cm-editor .cm-selectionBackground {
        background-color: #c8e1ff !important;
        opacity: 0.8 !important;
    }

    .cm-editor.cm-focused .cm-selectionBackground {
        background-color: #b3d4fc !important;
        opacity: 1 !important;
    }

    /* 强制覆盖 CodeMirror 默认选中样式 */
    .cm-editor .cm-content ::selection {
        background-color: #b3d4fc !important;
        color: inherit !important;
    }

    .cm-editor .cm-content ::-moz-selection {
        background-color: #b3d4fc !important;
        color: inherit !important;
    }

    /* 确保选中层在正确的层级 */
    .cm-editor .cm-selectionLayer {
        z-index: -1 !important;
    }

    /* 改善拖拽选择的视觉效果 */
    .cm-editor .cm-selectionMatch {
        background-color: #fff2cc !important;
    }

    /* 改善当前行高亮 */
    .cm-activeLine {
        background-color: #f6f8fa !important;
    }

    /* 改善光标线 */
    .cm-cursor {
        border-left-color: #0366d6 !important;
        border-left-width: 2px !important;
    }

    /* 改善搜索匹配高亮 */
    .cm-searchMatch {
        background-color: #fff2cc;
        border: 1px solid #e6cc80;
    }

    .cm-searchMatch.cm-searchMatch-selected {
        background-color: #ffd54f;
        border: 1px solid #ffb300;
    }

    /* 改善括号匹配 */
    .cm-matchingBracket {
        background-color: #e8f5e8;
        border: 1px solid #34d058;
        border-radius: 2px;
    }

    /* 改善折叠区域 */
    .cm-foldGutter .cm-gutterElement {
        text-align: center;
        color: #6a737d;
    }

    .cm-foldGutter .cm-gutterElement:hover {
        background-color: #f1f8ff;
        color: #0366d6;
    }

    /* 强制应用等宽字体到所有CodeMirror元素 */
    .cm-editor * {
        font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace !important;
    }

    .cm-editor .cm-line,
    .cm-editor .cm-content,
    .cm-editor .cm-gutters,
    .cm-editor .cm-lineNumbers,
    .cm-editor .cm-gutterElement {
        font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace !important;
        font-size: 13px !important;
        font-weight: normal !important;
        line-height: 1.3 !important;
        letter-spacing: 0 !important;
        font-variant-ligatures: none !important;
    }

    /* 特别针对语法高亮的元素 */
    .cm-editor .tok-keyword,
    .cm-editor .tok-string,
    .cm-editor .tok-comment,
    .cm-editor .tok-number,
    .cm-editor .tok-operator,
    .cm-editor .tok-punctuation,
    .cm-editor .tok-bracket,
    .cm-editor .tok-tag,
    .cm-editor .tok-attribute,
    .cm-editor .tok-property,
    .cm-editor .tok-value,
    .cm-editor .tok-variableName,
    .cm-editor .tok-typeName,
    .cm-editor .tok-className,
    .cm-editor .tok-function,
    .cm-editor .tok-literal,
    .cm-editor .tok-escape,
    .cm-editor .tok-invalid {
        font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace !important;
        font-size: 13px !important;
        font-weight: normal !important;
        line-height: 1.3 !important;
        letter-spacing: 0 !important;
        font-variant-ligatures: none !important;
    }

    /* 强制应用到所有可能的子元素 */
    .cm-editor span,
    .cm-editor div,
    .cm-editor pre {
        font-family: 'Consolas', 'Monaco', 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace !important;
        font-size: 13px !important;
        font-weight: normal !important;
        line-height: 1.3 !important;
        letter-spacing: 0 !important;
        font-variant-ligatures: none !important;
    }
`;

const PreviewContainer = styled.div`
    flex: 1;
    background-color: white;
    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }
`;

const EditorHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    color: white;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const EditorTitle = styled.input`
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    padding: 8px 16px;
    min-width: 200px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    &:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    &:focus {
        outline: none;
        border-color: #0366d6;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
        transform: translateY(-1px);
    }
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
    }
`;

const EditorActions = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const Button = styled.button`
    padding: 8px 16px;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    &:hover {
        background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
`;

const BackButton = styled.button`
    padding: 8px 16px;
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    &:hover {
        background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
`;

const Select = styled.select`
    padding: 8px 12px;
    background: linear-gradient(135deg, #495057 0%, #343a40 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-width: 140px;
    
    &:hover {
        background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    &:focus {
        outline: none;
        border-color: #0366d6;
        box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
    }
    
    option {
        background-color: #343a40;
        color: white;
        padding: 8px;
    }
`;

const Editor: React.FC = () => {
    const navigate = useNavigate();
    const [htmlEditor, setHtmlEditor] = useState<EditorView | null>(null);
    const [cssEditor, setCssEditor] = useState<EditorView | null>(null);
    const [jsEditor, setJsEditor] = useState<EditorView | null>(null);
    const [title, setTitle] = useState('Untitled');
    const [currentPen, setCurrentPen] = useState<Pen | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [userPens, setUserPens] = useState<Pen[]>([]);

    // State to hold the content for the preview
    const [htmlCode, setHtmlCode] = useState('<div>Hello World</div>'); // Initialize with default HTML
    const [cssCode, setCssCode] = useState('body { color: blue; }'); // Initialize with default CSS
    const [jsCode, setJsCode] = useState('console.log("Hello World");'); // Initialize with default JS

    const fetchUserPens = useCallback(async () => {
        try {
            const pens = await getUserPens();
            setUserPens(pens);
        } catch (error) {
            console.error('Failed to fetch user pens:', error);
        }
    }, []);

    useEffect(() => {
        fetchUserPens();
    }, [fetchUserPens]);

    // 添加一个标志来跟踪是否是程序性更新
    const [isUpdatingFromState, setIsUpdatingFromState] = useState(false);

    useEffect(() => {
        // Initialize editors only once
        const htmlElement = document.getElementById('html-editor');
        const cssElement = document.getElementById('css-editor');
        const jsElement = document.getElementById('js-editor');

        const commonExtensions = [
            lineNumbers({
                formatNumber: (lineNo) => lineNo.toString()
            }),
            highlightActiveLineGutter(),
            highlightSpecialChars(),
            drawSelection({
                drawRangeCursor: true
            }),
            dropCursor(),
            rectangularSelection(),
            crosshairCursor(),
            highlightActiveLine(),
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap
            ]),
            history(),
            syntaxHighlighting(defaultHighlightStyle),
            // 确保选择功能正常工作和字体优化
            EditorView.theme({
                '&.cm-focused .cm-selectionBackground': {
                    backgroundColor: '#b3d4fc !important'
                },
                '.cm-selectionBackground': {
                    backgroundColor: '#c8e1ff !important'
                },
                '.cm-content': {
                    fontFamily: '"Consolas", "Monaco", "Lucida Console", "Liberation Mono", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important',
                    fontSize: '13px !important',
                    fontWeight: 'normal !important',
                    lineHeight: '1.3 !important',
                    letterSpacing: '0 !important',
                    textRendering: 'auto !important',
                    WebkitFontSmoothing: 'auto !important',
                    MozOsxFontSmoothing: 'auto !important',
                    fontVariantLigatures: 'none !important'
                },
                '.cm-editor .cm-line': {
                    fontFamily: '"Consolas", "Monaco", "Lucida Console", "Liberation Mono", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important',
                    fontSize: '13px !important',
                    fontWeight: 'normal !important',
                    lineHeight: '1.3 !important',
                    letterSpacing: '0 !important'
                },
                '.cm-editor': {
                    fontFamily: '"Consolas", "Monaco", "Lucida Console", "Liberation Mono", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important'
                },
                '.cm-gutters': {
                    fontFamily: '"Consolas", "Monaco", "Lucida Console", "Liberation Mono", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important',
                    fontSize: '12px !important'
                }
            })
        ];

        // Create a helper function to initialize each editor
        const createEditor = (element: HTMLElement, langExtension: Extension, setEditor: React.Dispatch<React.SetStateAction<EditorView | null>>, setCode: React.Dispatch<React.SetStateAction<string>>, initialContent: string) => {
            const state = EditorState.create({
                doc: initialContent,
                extensions: [
                    ...commonExtensions,
                    langExtension,
                    // 监听编辑器变化，在非程序性更新时同步到React state
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged && !isUpdatingFromState) {
                            // 简化逻辑：如果不是程序性更新，就认为是用户输入
                            const newContent = update.state.doc.toString();
                            setCode(newContent);
                        }
                    })
                ]
            });
            const view = new EditorView({
                state,
                parent: element
            });
            setEditor(view);
            return view;
        };

        // Destroy existing editors before creating new ones
        if (htmlEditor) htmlEditor.destroy();
        if (cssEditor) cssEditor.destroy();
        if (jsEditor) jsEditor.destroy();

        let newHtmlEditor: EditorView | null = null;
        let newCssEditor: EditorView | null = null;
        let newJsEditor: EditorView | null = null;

        if (htmlElement) {
            htmlElement.innerHTML = '';
            newHtmlEditor = createEditor(htmlElement, html(), setHtmlEditor, setHtmlCode, htmlCode);
        }
        if (cssElement) {
            cssElement.innerHTML = '';
            newCssEditor = createEditor(cssElement, css(), setCssEditor, setCssCode, cssCode);
        }
        if (jsElement) {
            jsElement.innerHTML = '';
            newJsEditor = createEditor(jsElement, javascript(), setJsEditor, setJsCode, jsCode);
        }

        return () => {
            newHtmlEditor?.destroy();
            newCssEditor?.destroy();
            newJsEditor?.destroy();
        };
    }, []); // 只初始化一次

    // 当React state变化时，同步更新编辑器内容（不重建编辑器）
    useEffect(() => {
        if (htmlEditor && cssEditor && jsEditor && !isUpdatingFromState) {
            setIsUpdatingFromState(true);

            const currentHtml = htmlEditor.state.doc.toString();
            const currentCss = cssEditor.state.doc.toString();
            const currentJs = jsEditor.state.doc.toString();

            // 只有当内容真的不同时才更新
            if (currentHtml !== htmlCode) {
                htmlEditor.dispatch({
                    changes: {
                        from: 0,
                        to: htmlEditor.state.doc.length,
                        insert: htmlCode
                    }
                });
            }

            if (currentCss !== cssCode) {
                cssEditor.dispatch({
                    changes: {
                        from: 0,
                        to: cssEditor.state.doc.length,
                        insert: cssCode
                    }
                });
            }

            if (currentJs !== jsCode) {
                jsEditor.dispatch({
                    changes: {
                        from: 0,
                        to: jsEditor.state.doc.length,
                        insert: jsCode
                    }
                });
            }

            // 重置标志
            setTimeout(() => setIsUpdatingFromState(false), 0);
        }
    }, [htmlCode, cssCode, jsCode, htmlEditor, cssEditor, jsEditor, isUpdatingFromState]);

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const penData: PenData = {
                title,
                html: htmlEditor?.state.doc.toString() || '',
                css: cssEditor?.state.doc.toString() || '',
                js: jsEditor?.state.doc.toString() || '',
                isPublic: true
            };

            if (currentPen) {
                const updatedPen = await updatePen(currentPen.id, penData);
                setCurrentPen(updatedPen);
            } else {
                const newPen = await createPen(penData);
                setCurrentPen(newPen);
            }
            fetchUserPens(); // Refresh the list of pens after saving
        } catch (error) {
            console.error('Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNew = useCallback(() => {
        console.log('handleNew called');
        setTitle('Untitled');
        setCurrentPen(null);
        const defaultHtml = '<div>Hello World</div>';
        const defaultCss = 'body { color: blue; }';
        const defaultJs = 'console.log("Hello World");';

        // 只更新React state，useEffect会自动同步到编辑器（就像预览组件）
        setHtmlCode(defaultHtml);
        setCssCode(defaultCss);
        setJsCode(defaultJs);
    }, []);

    const handleBackToHome = () => {
        navigate('/pens');
    };

    const handleLoadPen = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const penId = e.target.value;
        const selectedPen = userPens.find(pen => pen.id === penId);
        console.log('handleLoadPen called:', penId, selectedPen);

        if (selectedPen) {
            console.log('Loading pen:', selectedPen);
            setCurrentPen(selectedPen);
            setTitle(selectedPen.title);

            // 只更新React state，useEffect会自动同步到编辑器（就像预览组件）
            setHtmlCode(selectedPen.html);
            setCssCode(selectedPen.css);
            setJsCode(selectedPen.js);
        } else {
            handleNew();
        }
    };

    return (
        <Container>
            <EditorContainer>
                <EditorHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <BackButton onClick={handleBackToHome}>
                            <span style={{ fontSize: '16px' }}>←</span>
                            My Pens
                        </BackButton>
                        <EditorTitle
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled"
                        />
                    </div>
                    <EditorActions>
                        <Button onClick={handleNew}>New</Button>
                        <Select onChange={handleLoadPen} value={currentPen?.id || ''}>
                            <option value="">Load Pen</option>
                            {userPens.map(pen => (
                                <option key={pen.id.toString()} value={pen.id.toString()}>{pen.title}</option>
                            ))}
                        </Select>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </EditorActions>
                </EditorHeader>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    {/* HTML Editor */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0,
                        maxHeight: '33.333%'
                    }}>
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderBottom: '1px solid #e1e4e8',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#586069',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            flexShrink: 0
                        }}>
                            HTML
                        </div>
                        <div id="html-editor" style={{
                            flex: 1,
                            minHeight: 0,
                            overflow: 'hidden'
                        }} />
                    </div>

                    {/* CSS Editor */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0,
                        maxHeight: '33.333%'
                    }}>
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderBottom: '1px solid #e1e4e8',
                            borderTop: '1px solid #e1e4e8',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#586069',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            flexShrink: 0
                        }}>
                            CSS
                        </div>
                        <div id="css-editor" style={{
                            flex: 1,
                            minHeight: 0,
                            overflow: 'hidden'
                        }} />
                    </div>

                    {/* JavaScript Editor */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0,
                        maxHeight: '33.333%'
                    }}>
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            borderBottom: '1px solid #e1e4e8',
                            borderTop: '1px solid #e1e4e8',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#586069',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            flexShrink: 0
                        }}>
                            JavaScript
                        </div>
                        <div id="js-editor" style={{
                            flex: 1,
                            minHeight: 0,
                            overflow: 'hidden'
                        }} />
                    </div>
                </div>
            </EditorContainer>
            <PreviewContainer>
                <Preview html={htmlCode} css={cssCode} js={jsCode} />
            </PreviewContainer>
        </Container>
    );
};

export default Editor; 