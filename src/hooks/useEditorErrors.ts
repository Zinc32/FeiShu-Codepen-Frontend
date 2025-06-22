import { useState, useCallback, useEffect, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { CompileError, EditorErrorState } from '../types/errorTypes';
import {
    checkJavaScriptErrors,
    checkCSSErrors,
    checkHTMLErrors
} from '../services/compileErrorService';
import {
    addErrorsToEditor,
    clearErrorsFromEditor
} from '../utils/editorErrorHighlight';

interface UseEditorErrorsProps {
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    cssLanguage: 'css' | 'scss' | 'less';
    htmlEditor: EditorView | null;
    cssEditor: EditorView | null;
    jsEditor: EditorView | null;
}

export const useEditorErrors = ({
    htmlCode,
    cssCode,
    jsCode,
    cssLanguage,
    htmlEditor,
    cssEditor,
    jsEditor
}: UseEditorErrorsProps) => {
    const [errors, setErrors] = useState<EditorErrorState>({
        htmlErrors: [],
        cssErrors: [],
        jsErrors: []
    });

    const [isCheckingErrors, setIsCheckingErrors] = useState(false);


    // 防抖定时器
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();

    // 检查所有编辑器的错误
    const checkAllErrors = useCallback(async () => {
        if (isCheckingErrors) return;

        setIsCheckingErrors(true);
        console.log('🔍 开始检查错误...', { htmlCode: htmlCode.length, cssCode: cssCode.length, jsCode: jsCode.length });

        try {
            // 并行检查所有错误
            const [htmlResult, cssResult, jsResult] = await Promise.all([
                checkHTMLErrors(htmlCode),
                checkCSSErrors(cssCode, cssLanguage),
                checkJavaScriptErrors(jsCode)
            ]);

            console.log('📊 错误检查结果:', {
                html: htmlResult.errors.length,
                css: cssResult.errors.length,
                js: jsResult.errors.length
            });

            if (jsResult.errors.length > 0) {
                console.log('❌ JavaScript错误详情:', jsResult.errors);
            }

            const newErrors: EditorErrorState = {
                htmlErrors: htmlResult.errors,
                cssErrors: cssResult.errors,
                jsErrors: jsResult.errors
            };

            setErrors(newErrors);

            // 更新编辑器中的错误高亮
            updateEditorErrors(newErrors);

        } catch (error) {
            console.error('Error checking code:', error);
        } finally {
            setIsCheckingErrors(false);
        }
    }, [htmlCode, cssCode, jsCode, cssLanguage, isCheckingErrors]);

    // 更新编辑器中的错误高亮
    const updateEditorErrors = useCallback((errorState: EditorErrorState) => {
        console.log('🎨 更新错误高亮...', {
            editors: { html: !!htmlEditor, css: !!cssEditor, js: !!jsEditor },
            errors: {
                html: errorState.htmlErrors.length,
                css: errorState.cssErrors.length,
                js: errorState.jsErrors.length
            }
        });

        // 清除所有编辑器的现有错误
        if (htmlEditor) {
            console.log('🧹 清除HTML编辑器错误');
            clearErrorsFromEditor(htmlEditor);
        }
        if (cssEditor) {
            console.log('🧹 清除CSS编辑器错误');
            clearErrorsFromEditor(cssEditor);
        }
        if (jsEditor) {
            console.log('🧹 清除JS编辑器错误');
            clearErrorsFromEditor(jsEditor);
        }

        // 添加新的错误高亮
        if (htmlEditor && errorState.htmlErrors.length > 0) {
            console.log('📍 添加HTML错误高亮:', errorState.htmlErrors);
            addErrorsToEditor(htmlEditor, errorState.htmlErrors);
        }
        if (cssEditor && errorState.cssErrors.length > 0) {
            console.log('📍 添加CSS错误高亮:', errorState.cssErrors);
            addErrorsToEditor(cssEditor, errorState.cssErrors);
        }
        if (jsEditor && errorState.jsErrors.length > 0) {
            console.log('📍 添加JS错误高亮:', errorState.jsErrors);
            addErrorsToEditor(jsEditor, errorState.jsErrors);
        }
    }, [htmlEditor, cssEditor, jsEditor]);

    // 防抖的错误检查
    const debouncedCheckErrors = useCallback(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            checkAllErrors();
        }, 1000); // 1秒防抖
    }, [checkAllErrors]);

    // 当代码变化时，触发错误检查
    useEffect(() => {
        debouncedCheckErrors();

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [htmlCode, cssCode, jsCode, cssLanguage, debouncedCheckErrors]);

    // 手动检查错误（立即执行）
    const checkErrorsNow = useCallback(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        checkAllErrors();
    }, [checkAllErrors]);

    // 跳转到错误位置
    const jumpToError = useCallback((error: CompileError) => {
        let targetEditor: EditorView | null = null;

        switch (error.type) {
            case 'html':
                targetEditor = htmlEditor;
                break;
            case 'css':
                targetEditor = cssEditor;
                break;
            case 'javascript':
                targetEditor = jsEditor;
                break;
        }

        if (targetEditor) {
            try {
                const doc = targetEditor.state.doc;
                const line = Math.max(1, Math.min(error.line, doc.lines));
                const lineObj = doc.line(line);
                const column = Math.max(0, Math.min(error.column, lineObj.length));
                const pos = lineObj.from + column;

                // 移动光标到错误位置
                targetEditor.dispatch({
                    selection: { anchor: pos, head: pos },
                    scrollIntoView: true
                });

                // 聚焦编辑器
                targetEditor.focus();

                console.log(`Jumped to ${error.type} error at line ${line}, column ${column}`);
            } catch (e) {
                console.error('Error jumping to error location:', e);
            }
        }
    }, [htmlEditor, cssEditor, jsEditor]);

    // 清除所有错误
    const clearAllErrors = useCallback(() => {
        setErrors({
            htmlErrors: [],
            cssErrors: [],
            jsErrors: []
        });

        if (htmlEditor) clearErrorsFromEditor(htmlEditor);
        if (cssEditor) clearErrorsFromEditor(cssEditor);
        if (jsEditor) clearErrorsFromEditor(jsEditor);
    }, [htmlEditor, cssEditor, jsEditor]);



    // 获取错误总数
    const getTotalErrorCount = useCallback(() => {
        return errors.htmlErrors.length + errors.cssErrors.length + errors.jsErrors.length;
    }, [errors]);

    // 获取特定类型的错误数
    const getErrorCount = useCallback((type: 'html' | 'css' | 'js') => {
        switch (type) {
            case 'html': return errors.htmlErrors.length;
            case 'css': return errors.cssErrors.length;
            case 'js': return errors.jsErrors.length;
            default: return 0;
        }
    }, [errors]);

    // 检查是否有特定严重程度的错误
    const hasErrorsOfSeverity = useCallback((severity: 'error' | 'warning' | 'info') => {
        const allErrors = [...errors.htmlErrors, ...errors.cssErrors, ...errors.jsErrors];
        return allErrors.some(error => error.severity === severity);
    }, [errors]);

    return {
        // 错误状态
        errors,
        isCheckingErrors,

        // 错误检查方法
        checkErrorsNow,
        debouncedCheckErrors,

        // 错误处理方法
        jumpToError,
        clearAllErrors,

        // 工具方法
        getTotalErrorCount,
        getErrorCount,
        hasErrorsOfSeverity
    };
}; 