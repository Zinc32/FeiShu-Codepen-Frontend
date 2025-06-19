import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, keymap, EditorViewConfig } from '@codemirror/view';
import { EditorState, Extension, Transaction } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { createPen, updatePen, getUserPens, getPen, deletePen, Pen, PenData } from '../services/penService';
import Preview from './Preview'; // Import the Preview component
import UserNavbar from './UserNavbar';
import * as sass from 'sass';
import * as less from 'less';
import Split from 'react-split';
import { Global } from '@emotion/react';
import { useAuth } from '../contexts/AuthContext';
import { compileReact, compileVue, compileJavaScript, CompilationResult } from '../services/compilerService';
import {
    PageContainer,
    Container,
    EditorContainer,
    PreviewContainer,
    EditorHeader,
    EditorTitle,
    EditorActions,
    Button,
    BackButton,
    Select,
    DeleteButton,
    LanguageSelect,
    ShareButton,
    ShareModal,
    ShareInput,
    ShareTitle,
    ShareClose,
    Overlay,
    Toast
} from '../styles/editorStyles';

const Editor: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const params = useParams();
    const [htmlEditor, setHtmlEditor] = useState<EditorView | null>(null);
    const [cssEditor, setCssEditor] = useState<EditorView | null>(null);
    const [jsEditor, setJsEditor] = useState<EditorView | null>(null);
    const [title, setTitle] = useState('Untitled');
    const [currentPen, setCurrentPen] = useState<Pen | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [userPens, setUserPens] = useState<Pen[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // State to hold the content for the preview
    const [htmlCode, setHtmlCode] = useState('<div>Hello World</div>'); // Initialize with default HTML
    const [cssCode, setCssCode] = useState('body { color: blue; }'); // Initialize with default CSS
    const [jsCode, setJsCode] = useState('console.log("Hello World");'); // Initialize with default JS
    const [cssLanguage, setCssLanguage] = useState<'css' | 'scss' | 'less'>('css');
    const [jsLanguage, setJsLanguage] = useState<'js' | 'react' | 'vue' | 'ts'>('js');
    const [compiledCss, setCompiledCss] = useState('');
    const [compiledJs, setCompiledJs] = useState('');
    const [jsCompilationError, setJsCompilationError] = useState<string>('');

    const fetchUserPens = useCallback(async () => {
        try {
            const pens = await getUserPens();
            setUserPens(pens);
        } catch (error) {
            console.error('Failed to fetch user pens:', error);
        }
    }, []);

    const initializeNewPen = useCallback(() => {
        console.log('initializeNewPen called');
        setTitle('Untitled');
        setCurrentPen(null);
        const defaultHtml = '<div id="app">Hello World</div>';
        const defaultCss = 'body { color: blue; }';
        const defaultJs = jsLanguage === 'react' 
            ? 'function App() {\n  return <h1>Hello React!</h1>;\n}\n\nReactDOM.render(<App />, document.getElementById("app"));'
            : jsLanguage === 'vue'
            ? 'const { createApp } = Vue;\n\nconst component = {\n  setup() {\n    return {\n      message: "Hello Vue!"\n    };\n  },\n  template: `<h1>{{ message }}</h1>`\n};\n\ncreateApp(component).mount("#app");'
            : 'console.log("Hello World");';

        setHtmlCode(defaultHtml);
        setCssCode(defaultCss);
        setJsCode(defaultJs);
    }, [jsLanguage]);

    // 加载单个Pen的函数（仿照handleLoadPen的逻辑）
    const loadPenById = useCallback(async (penId: string) => {
        try {
            console.log('Loading pen by ID:', penId);
            const pen = await getPen(penId);
            console.log('Loaded pen:', pen);

            setCurrentPen(pen);
            setTitle(pen.title);

            // 仿照下拉选择的逻辑，更新React state
            setHtmlCode(pen.html);
            setCssCode(pen.css);
            setJsCode(pen.js);

            // 加载语言选择（如果保存了的话）
            if (pen.cssLanguage) setCssLanguage(pen.cssLanguage);
            if (pen.jsLanguage) setJsLanguage(pen.jsLanguage);
            // console.log(pen.cssLanguage)
            // console.log(pen.jsLanguage)
        } catch (error) {
            console.error('Failed to load pen by ID:', error);
            // 如果加载失败，显示默认内容
            initializeNewPen();
        }
    }, [initializeNewPen]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchUserPens();
    }, [isAuthenticated, navigate, fetchUserPens]);

    // 处理URL参数，加载对应的Pen
    useEffect(() => {
        const penId = params.id;
        if (penId && userPens.length > 0) {
            // 确保userPens已经加载完成再加载具体的pen
            loadPenById(penId);
        } else if (!penId) {
            // 如果没有ID参数，显示默认的新建状态
            initializeNewPen();
        }
    }, [params.id, userPens.length, loadPenById, initializeNewPen]);

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
            newJsEditor = createEditor(jsElement, javascript({ typescript: jsLanguage === 'ts' }), setJsEditor, setJsCode, jsCode);
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

    // 编译 CSS 预处理器代码
    const compileCss = useCallback(async (code: string, language: 'scss' | 'less') => {
        try {
            if (language === 'scss') {
                const result = sass.compileString(code);
                return result.css;
            } else if (language === 'less') {
                const result = await less.render(code);
                return result.css;
            }
            return code;
        } catch (error) {
            console.error(`Error compiling ${language}:`, error);
            return code;
        }
    }, []);

    // 编译 JavaScript 框架代码
    const compileJs = useCallback(async (code: string, language: 'js' | 'react' | 'vue' | 'ts') => {
        try {
            let result: CompilationResult;
            
            switch (language) {
                case 'react':
                    result = compileReact(code);
                    break;
                case 'vue':
                    result = compileVue(code);
                    break;
                default:
                    result = compileJavaScript(code);
                    break;
            }
            
            if (result.error) {
                setJsCompilationError(result.error);
                return code; // Return original code if compilation fails
            } else {
                setJsCompilationError('');
                return result.code;
            }
        } catch (error) {
            console.error(`Error compiling ${language}:`, error);
            setJsCompilationError(error instanceof Error ? error.message : 'Unknown error');
            return code;
        }
    }, []);

    // 当 CSS 代码或语言改变时重新编译
    useEffect(() => {
        if (cssLanguage !== 'css') {
            compileCss(cssCode, cssLanguage).then(setCompiledCss);
        } else {
            setCompiledCss(cssCode);
        }
    }, [cssCode, cssLanguage, compileCss]);

    // 当 JS 代码或语言改变时重新编译
    useEffect(() => {
        compileJs(jsCode, jsLanguage).then(setCompiledJs);
    }, [jsCode, jsLanguage, compileJs]);

    // 检测内容是否有变化
    const checkForChanges = useCallback(() => {
        if (!currentPen) {
            // 新建状态下，如果内容不是默认内容，则认为有变化
            const hasChanges = 
                htmlCode !== '<div>Hello World</div>' ||
                cssCode !== 'body { color: blue; }' ||
                jsCode !== 'console.log("Hello World");' ||
                title !== 'Untitled';
            setHasUnsavedChanges(hasChanges);
        } else {
            // 编辑状态下，比较当前内容与保存的内容
            const hasChanges = 
                htmlCode !== currentPen.html ||
                cssCode !== currentPen.css ||
                jsCode !== currentPen.js ||
                title !== currentPen.title;
            setHasUnsavedChanges(hasChanges);
        }
    }, [htmlCode, cssCode, jsCode, title, currentPen]);

    // 监听内容变化
    useEffect(() => {
        checkForChanges();
    }, [checkForChanges]);

    // 页面关闭/刷新时的提示
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，确定要离开吗？';
                return '您有未保存的更改，确定要离开吗？';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const compileTypeScript = useCallback(async (code: string): Promise<string> => {
        try {
            // 检查是否有 TypeScript 编译器可用
            if (typeof window !== 'undefined' && (window as any).ts) {
                const ts = (window as any).ts;
                const result = ts.transpileModule(code, {
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
                return result.outputText;
            }
            // 如果没有 TypeScript 编译器，返回原始代码
            return code;
        } catch (error) {
            console.error('TypeScript compilation error:', error);
            return code; // 出错时返回原始代码
        }
    }, []);

    useEffect(() => {
        // 动态加载 TypeScript 编译器
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/typescript/5.3.3/typescript.min.js';
        script.async = true;
        script.onload = () => {
            console.log('TypeScript compiler loaded');
        };
        document.head.appendChild(script);

        return () => {
            // 清理脚本标签
            const existingScript = document.querySelector('script[src*="typescript"]');
            if (existingScript) {
                document.head.removeChild(existingScript);
            }
        };
    }, []);

    useEffect(() => {
        if (jsLanguage === 'ts') {
            compileTypeScript(jsCode).then(setCompiledJs);
        } else {
            setCompiledJs(jsCode);
        }
    }, [jsCode, jsLanguage, compileTypeScript]);

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            const penData: PenData = {
                title,
                html: htmlEditor?.state.doc.toString() || '',
                css: cssEditor?.state.doc.toString() || '',
                js: jsEditor?.state.doc.toString() || '',
                isPublic: true,
                cssLanguage: cssLanguage,
                jsLanguage: jsLanguage
            };

            if (currentPen) {
                // 更新现有文件
                const updatedPen = await updatePen(currentPen.id, penData);
                setCurrentPen(updatedPen);
                console.log('Pen updated successfully:', updatedPen.title);
            } else {
                // 创建新文件
                const newPen = await createPen(penData);
                setCurrentPen(newPen);
                console.log('New pen created successfully:', newPen.title);
                // 更新 URL 到新创建的 pen ID，避免跳到新的空白 pen
                navigate(`/editor/${newPen.id}`, { replace: true });
            }
            // 刷新用户的pen列表
            await fetchUserPens();

            // 保存成功后清除未保存标记
            setHasUnsavedChanges(false);

            // 显示保存成功反馈
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000); // 2秒后隐藏成功提示
        } catch (error) {
            console.error('Save error:', error);
            alert('保存失败，请重试');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNew = useCallback(() => {
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm('您有未保存的更改，确定要创建新的 Pen 吗？');
            if (!confirmLeave) return;
        }
        initializeNewPen();
        setHasUnsavedChanges(false);
    }, [initializeNewPen, hasUnsavedChanges]);

    const handleDelete = async () => {
        if (!currentPen || isDeleting) return;

        const confirmDelete = window.confirm(`确定要删除 "${currentPen.title}" 吗？此操作无法撤销。`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            await deletePen(currentPen.id);
            // 删除成功后，重新获取用户的pen列表
            await fetchUserPens();
            // 重置为新建状态
            initializeNewPen();
            console.log('Pen deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            alert('删除失败，请重试');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBackToHome = () => {
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm('您有未保存的更改，确定要离开吗？');
            if (!confirmLeave) return;
        }
        navigate('/pens');
    };

    const handleLoadPen = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (hasUnsavedChanges) {
            const confirmLeave = window.confirm('您有未保存的更改，确定要切换到其他 Pen 吗？');
            if (!confirmLeave) {
                // 重置选择框到当前pen
                e.target.value = currentPen?.id.toString() || '';
                return;
            }
        }

        const penId = e.target.value;

        if (!penId) {
            // 选择了"New Pen"选项
            handleNew();
            return;
        }

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
            setHasUnsavedChanges(false);
        } else {
            handleNew();
        }
    };

    const handleShare = () => {
        if (!currentPen) return;
        const url = `${window.location.origin}/p/${currentPen.id}`;
        setShareUrl(url);
        setShowShareModal(true);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setToastMessage('链接已复制到剪贴板！');
        setShowToast(true);
        setShowShareModal(false);
        setTimeout(() => {
            setShowToast(false);
        }, 2000);
    };

    return (
        <PageContainer style={{ height: '100vh', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Global styles={`
               .gutter {
                 background-color: #e1e4e8;
                 background-clip: padding-box;
                 transition: background 0.2s;
                 z-index: 10;
               }
               .gutter.gutter-horizontal {
                 cursor: col-resize;
                 width: 6px;
               }
               .gutter.gutter-vertical {
                 cursor: row-resize;
                 height: 6px;
               }
               .gutter:hover {
                 background-color: #b3d4fc;
               }
            `} />
            {/* 顶部用户信息栏 */}
            <UserNavbar />
            {/* 顶部操作栏 */}
            <EditorHeader>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flex: 1,
                    minWidth: 0,
                    marginRight: '32px'
                }}>
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
                    <Select onChange={handleLoadPen} value={currentPen?.id || ''}>
                        <option value="">📁 New Pen</option>
                        {userPens.map(pen => (
                            <option key={pen.id.toString()} value={pen.id.toString()}>{pen.title}</option>
                        ))}
                    </Select>
                    <Button onClick={handleSave} disabled={isSaving || saveSuccess}>
                        {isSaving ? '💾 Saving...' : saveSuccess ? '✅ Saved!' : '💾 Save'}
                    </Button>
                    {currentPen && (
                        <ShareButton onClick={handleShare}>
                            🔗 Share
                        </ShareButton>
                    )}
                    <DeleteButton
                        onClick={handleDelete}
                        disabled={isDeleting || !currentPen}
                        style={{
                            visibility: currentPen ? 'visible' : 'hidden',
                            opacity: currentPen ? 1 : 0,
                            transition: 'opacity 0.3s ease, visibility 0.3s ease'
                        }}
                    >
                        {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
                    </DeleteButton>
                </EditorActions>
            </EditorHeader>
            {/* 主内容区：左右分为编辑区和预览区 */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <Split
                    direction="horizontal"
                    sizes={[50, 50]}
                    minSize={150}
                    gutterSize={6}
                    style={{ display: 'flex', flex: 1, minHeight: 0, height: '100%' }}
                >
                    {/* 左侧编辑区（纵向可拖拽） */}
                    <Split
                        direction="vertical"
                        sizes={[33, 33, 34]}
                        minSize={36}
                        gutterSize={6}
                        style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
                    >
                        {/* HTML 编辑器 */}
                        <div style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                padding: '8px 12px',
                                height: '32px',
                                backgroundColor: '#f8f9fa',
                                borderBottom: '1px solid #e1e4e8',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#586069',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                flexShrink: 0,
                                position: 'sticky',
                                top: 0,
                                zIndex: 10
                            }}>
                                HTML
                            </div>
                            <div id="html-editor" style={{ flex: 1, minHeight: 0, overflow: 'auto' }} />
                        </div>
                        {/* CSS 编辑器 */}
                        <div style={{minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                padding: '8px 12px',
                                height: '32px',
                                backgroundColor: '#f8f9fa',
                                borderBottom: '1px solid #e1e4e8',
                                borderTop: '1px solid #e4e4e4',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#586069',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                flexShrink: 0,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10
                            }}>
                                <span>CSS</span>
                                <LanguageSelect
                                    value={cssLanguage}
                                    onChange={(e) => setCssLanguage(e.target.value as 'css' | 'scss' | 'less')}
                                >
                                    <option value="css">CSS</option>
                                    <option value="scss">SCSS</option>
                                    <option value="less">LESS</option>
                                </LanguageSelect>
                            </div>
                            <div id="css-editor" style={{ flex: 1, minHeight: 0, overflow: 'auto' }} />
                        </div>
                        {/* JS 编辑器 */}
                        <div style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{
                                padding: '8px 12px',
                                height: '32px',
                                backgroundColor: '#f8f9fa',
                                borderBottom: '1px solid #e1e4e8',
                                borderTop: '1px solid #e4e4e4',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#586069',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                flexShrink: 0,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10
                            }}>
                                <span>JavaScript</span>
                                <LanguageSelect
                                    value={jsLanguage}
                                    onChange={(e) => setJsLanguage(e.target.value as 'js' | 'react' | 'vue' | 'ts')}
                                >
                                    <option value="js">JavaScript</option>
                                    <option value="react">React</option>
                                    <option value="vue">Vue</option>
                                    <option value="ts">TS</option>
                                </LanguageSelect>
                            </div>
                            {jsCompilationError && (
                                <div style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#ffeaea',
                                    color: '#d73a49',
                                    fontSize: '12px',
                                    borderBottom: '1px solid #f97583'
                                }}>
                                    Compilation Error: {jsCompilationError}
                                </div>
                            )}
                            <div id="js-editor" style={{ flex: 1, minHeight: 0, overflow: 'auto' }} />
                        </div>
                    </Split>
                    {/* 右侧预览区 */}
                    <PreviewContainer>
                        <Preview 
                            html={htmlCode} 
                            css={compiledCss} 
                            js={compiledJs} 
                            jsLanguage={jsLanguage}
                        />
                    </PreviewContainer>
                </Split>
            </div>

            {showShareModal && (
                <>
                    <Overlay onClick={() => setShowShareModal(false)} />
                    <ShareModal>
                        <ShareClose onClick={() => setShowShareModal(false)}>×</ShareClose>
                        <ShareTitle>分享代码片段</ShareTitle>
                        <ShareInput
                            value={shareUrl}
                            readOnly
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <Button onClick={copyToClipboard}>
                            📋 复制链接
                        </Button>
                    </ShareModal>
                </>
            )}
            {showToast && <Toast>{toastMessage}</Toast>}
        </PageContainer>
    );
};

export default Editor;