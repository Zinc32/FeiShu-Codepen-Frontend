import React, { useRef, useEffect, useState } from 'react';
// import { EditorState } from '@codemirror/state';
// import { EditorView, keymap } from '@codemirror/view';
// import { html } from '@codemirror/lang-html';
// import { css } from '@codemirror/lang-css';
// import { javascript } from '@codemirror/lang-javascript';
// import { autocompletion, acceptCompletion } from '@codemirror/autocomplete';
// import { basicSetup } from '@codemirror/basic-setup';

// // 定义 props 的类型
// interface CodeMirrorEditorProps {
//   mode: 'html' | 'css' | 'javascript';
//   initialContent: string;
// }

// const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({ mode, initialContent }) => {
//   const ref = useRef<HTMLDivElement>(null);
//   const [content, setContent] = useState(initialContent);

//   useEffect(() => {
//     const state = EditorState.create({
//       extensions: [
//         basicSetup,
//         mode === 'html' ? html() : mode === 'css' ? css() : javascript(),
//         autocompletion(),
//         keymap.of([
//           {
//             key: 'Ctrl-Space',
//             run: acceptCompletion,
//           },
//         ]),
//       ],
//       doc: initialContent,
//     });

//     const view = new EditorView({
//       state,
//       parent: ref.current as HTMLElement,
//     });

//     const updateContent = () => {
//       setContent(view.state.doc.toString());
//     };

//     view.dom.addEventListener('input', updateContent);

//     return () => {
//       view.destroy();
//       view.dom.removeEventListener('input', updateContent);
//     };
//   }, [mode, initialContent]);

//   return <div ref={ref} style={{ width: '100%', height: '500px' }} />;
// };

// export default CodeMirrorEditor;