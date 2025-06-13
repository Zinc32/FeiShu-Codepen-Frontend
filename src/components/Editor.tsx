import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import styled from '@emotion/styled';

const EditorContainer = styled.div`
  height: 100%;
  overflow: auto;
  .cm-editor {
    height: 100%;
  }
  .cm-scroller {
    overflow: auto;
  }
`;

interface EditorProps {
    value: string;
    language: 'javascript' | 'html' | 'css';
    onChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, language, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        const languageSupport = {
            javascript: javascript(),
            html: html(),
            css: css(),
        }[language];

        const state = EditorState.create({
            doc: value,
            extensions: [
                languageSupport,
                keymap.of(defaultKeymap),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                }),
                EditorView.theme({
                    '&': {
                        height: '100%',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        backgroundColor: '#fff',
                    },
                    '.cm-content': {
                        padding: '10px 0',
                        whiteSpace: 'pre-wrap',
                        color: '#222',
                    },
                    '.cm-line': {
                        padding: '0 10px',
                        minHeight: '1.6em',
                    },
                    '.cm-focused': {
                        outline: 'none',
                    },
                    '.cm-gutters': {
                        backgroundColor: '#f5f5f5',
                        color: '#888',
                        border: 'none',
                        borderRight: '1px solid #eee',
                        paddingRight: '8px',
                    },
                    '.cm-activeLineGutter': {
                        backgroundColor: '#e8e8e8',
                    },
                    '.cm-activeLine': {
                        backgroundColor: '#f0f0f0',
                    },
                    '.cm-lineNumbers': {
                        minWidth: '3em',
                    },
                    '.cm-lineNumbers .cm-gutterElement': {
                        padding: '0 8px',
                    },
                    '.cm-keyword': { color: '#005cc5' },
                    '.cm-operator': { color: '#222' },
                    '.cm-variable': { color: '#222' },
                    '.cm-string': { color: '#d73a49' },
                    '.cm-comment': { color: '#6a737d' },
                    '.cm-number': { color: '#005cc5' },
                    '.cm-property': { color: '#222' },
                    '.cm-atom': { color: '#005cc5' },
                    '.cm-definition': { color: '#6f42c1' },
                    '.cm-cursor': {
                        borderLeft: '2px solid #111',
                        borderRight: 'none',
                        width: '0',
                        animation: 'cm-blink 1s steps(1) infinite',
                    },
                    '@keyframes cm-blink': {
                        '0%': { borderColor: 'transparent' },
                        '50%': { borderColor: '#111' },
                        '100%': { borderColor: 'transparent' },
                    },
                }),
            ],
        });

        const view = new EditorView({
            state,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, [language]);

    useEffect(() => {
        const view = viewRef.current;
        if (view && value !== view.state.doc.toString()) {
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: value,
                },
            });
        }
    }, [value]);

    return <EditorContainer ref={editorRef} />;
};

export default Editor; 