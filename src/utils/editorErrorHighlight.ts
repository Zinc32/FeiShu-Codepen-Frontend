import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { CompileError } from '../types/errorTypes';

// 添加错误的 Effect
export const addErrorEffect = StateEffect.define<CompileError[]>();

// 清除错误的 Effect
export const clearErrorsEffect = StateEffect.define();

// 错误高亮的 StateField
export const errorHighlightField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(decorations, tr) {
        // 应用文档变化
        decorations = decorations.map(tr.changes);
        
        // 处理错误效果
        for (let effect of tr.effects) {
            if (effect.is(addErrorEffect)) {
                const errors = effect.value;
                const newDecorations: any[] = [];
                
                errors.forEach(error => {
                    try {
                        const line = Math.max(1, error.line);
                        const doc = tr.state.doc;
                        
                        if (line <= doc.lines) {
                            const lineObj = doc.line(line);
                            const from = lineObj.from + Math.max(0, error.column);
                            const to = Math.min(lineObj.to, from + 1);
                            
                            // 创建错误装饰
                            const decoration = Decoration.mark({
                                class: `cm-error-${error.severity}`,
                                attributes: {
                                    title: error.message,
                                    'data-error-id': error.id,
                                    'data-error-type': error.type,
                                    'data-error-severity': error.severity
                                }
                            }).range(from, to);
                            
                            newDecorations.push(decoration);
                            
                            // 添加行高亮
                            const lineDecoration = Decoration.line({
                                class: `cm-error-line-${error.severity}`,
                                attributes: {
                                    'data-error-message': error.message
                                }
                            }).range(lineObj.from);
                            
                            newDecorations.push(lineDecoration);
                        }
                    } catch (e) {
                        console.warn('Error creating decoration for error:', error, e);
                    }
                });
                
                decorations = decorations.update({
                    add: newDecorations
                });
            } else if (effect.is(clearErrorsEffect)) {
                decorations = Decoration.none;
            }
        }
        
        return decorations;
    },
    provide: f => EditorView.decorations.from(f)
});

// 错误高亮主题
export const errorHighlightTheme = EditorView.theme({
    // 错误标记样式
    '.cm-error-error': {
        textDecoration: 'underline wavy red',
        textDecorationSkipInk: 'none',
        cursor: 'help'
    },
    '.cm-error-warning': {
        textDecoration: 'underline wavy orange',
        textDecorationSkipInk: 'none',
        cursor: 'help'
    },
    '.cm-error-info': {
        textDecoration: 'underline wavy blue',
        textDecorationSkipInk: 'none',
        cursor: 'help'
    },
    
    // 行高亮样式
    '.cm-error-line-error': {
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderLeft: '3px solid #ff4757',
        paddingLeft: '8px'
    },
    '.cm-error-line-warning': {
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderLeft: '3px solid #ffa500',
        paddingLeft: '8px'
    },
    '.cm-error-line-info': {
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderLeft: '3px solid #007bff',
        paddingLeft: '8px'
    },
    
    // 错误提示样式
    '.cm-error-tooltip': {
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        border: '1px solid #404040',
        borderRadius: '4px',
        padding: '6px 12px',
        maxWidth: '400px',
        fontSize: '12px',
        lineHeight: '1.4',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1000
    }
});

// 创建错误高亮扩展
export const createErrorHighlightExtension = () => {
    return [
        errorHighlightField,
        errorHighlightTheme
    ];
};

// 添加错误到编辑器
export const addErrorsToEditor = (view: EditorView, errors: CompileError[]) => {
    view.dispatch({
        effects: addErrorEffect.of(errors)
    });
};

// 清除编辑器中的错误
export const clearErrorsFromEditor = (view: EditorView) => {
    view.dispatch({
        effects: clearErrorsEffect.of(null)
    });
};

// 错误提示工具
export const createErrorTooltip = (error: CompileError, element: HTMLElement) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'cm-error-tooltip';
    tooltip.innerHTML = `
        <div style="font-weight: bold; color: ${getSeverityColor(error.severity)};">
            ${getSeverityIcon(error.severity)} ${error.severity.toUpperCase()}
        </div>
        <div style="margin-top: 4px;">
            ${error.message}
        </div>
        <div style="margin-top: 4px; opacity: 0.8; font-size: 11px;">
            Line ${error.line}, Column ${error.column}
            ${error.source ? ` (${error.source})` : ''}
        </div>
    `;
    
    // 定位提示框
    const rect = element.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    
    document.body.appendChild(tooltip);
    
    // 自动移除
    setTimeout(() => {
        if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }, 5000);
    
    return tooltip;
};

// 获取严重程度颜色
const getSeverityColor = (severity: string): string => {
    switch (severity) {
        case 'error': return '#ff4757';
        case 'warning': return '#ffa500';
        case 'info': return '#007bff';
        default: return '#ffffff';
    }
};

// 获取严重程度图标
const getSeverityIcon = (severity: string): string => {
    switch (severity) {
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return '•';
    }
}; 