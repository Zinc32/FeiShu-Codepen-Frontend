import React, { useEffect, useState, useRef } from 'react';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import {
    EditorContainer,
    TabContainer,
    TabButton,
    EditorContent,
    CodeEditor,
    NoContent
} from '../styles/ReadOnlyEditor.styles';

type TabType = 'html' | 'css' | 'js';

interface ReadOnlyEditorProps {
    html: string;
    css: string;
    js: string;
    jsLanguage?: 'js' | 'react' | 'vue' | 'ts';
}

const ReadOnlyEditor: React.FC<ReadOnlyEditorProps> = ({ 
    html: htmlContent, 
    css: cssContent, 
    js: jsContent, 
    jsLanguage = 'js' 
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('html');
    const [editor, setEditor] = useState<EditorView | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // 创建只读编辑器的辅助函数
    const createReadOnlyEditor = (
        element: HTMLElement,
        langExtension: Extension,
        content: string
    ) => {
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
            // 设置为只读模式
            EditorView.editable.of(false),
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

        const state = EditorState.create({
            doc: content,
            extensions: [
                ...commonExtensions,
                langExtension
            ]
        });

        const view = new EditorView({
            state,
            parent: element
        });

        setEditor(view);
        return view;
    };

    // 根据当前标签页获取内容和语言扩展
    const getCurrentContent = (): { content: string; extension: Extension } => {
        switch (activeTab) {
            case 'html':
                return { content: htmlContent, extension: html() };
            case 'css':
                return { content: cssContent, extension: css() };
            case 'js':
                const jsExtension = jsLanguage === 'ts' 
                    ? javascript({ typescript: true })
                    : javascript();
                return { content: jsContent, extension: jsExtension };
            default:
                return { content: htmlContent, extension: html() };
        }
    };

    // 当标签页改变时重新创建编辑器
    useEffect(() => {
        if (!editorRef.current) return;

        // 销毁现有编辑器
        if (editor) {
            editor.destroy();
            setEditor(null);
        }

        // 清空容器
        editorRef.current.innerHTML = '';

        // 获取当前内容
        const { content, extension } = getCurrentContent();

        // 创建新编辑器
        if (editorRef.current) {
            createReadOnlyEditor(editorRef.current, extension, content);
        }

        return () => {
            if (editor) {
                editor.destroy();
            }
        };
    }, [activeTab, htmlContent, cssContent, jsContent, jsLanguage]);

    const handleTabClick = (tab: TabType) => {
        setActiveTab(tab);
    };

    return (
        <EditorContainer>
            <TabContainer>
                <TabButton
                    active={activeTab === 'html'}
                    onClick={() => handleTabClick('html')}
                >
                    HTML
                </TabButton>
                <TabButton
                    active={activeTab === 'css'}
                    onClick={() => handleTabClick('css')}
                >
                    CSS
                </TabButton>
                <TabButton
                    active={activeTab === 'js'}
                    onClick={() => handleTabClick('js')}
                >
                    {jsLanguage === 'ts' ? 'TS' : 'JS'}
                </TabButton>
            </TabContainer>
            <EditorContent>
                <CodeEditor ref={editorRef} />
            </EditorContent>
        </EditorContainer>
    );
};

export default ReadOnlyEditor; 