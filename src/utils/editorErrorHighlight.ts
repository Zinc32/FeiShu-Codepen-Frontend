import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';
import { EditorState, StateField, StateEffect, Range } from '@codemirror/state';
import { CompileError } from '../types/errorTypes';

// 添加错误的 Effect
export const addErrorEffect = StateEffect.define<CompileError[]>();

// 清除错误的 Effect
export const clearErrorsEffect = StateEffect.define();

// 创建错误信息行Widget
class ErrorLineWidget extends WidgetType {
    constructor(private error: CompileError) {
        super();
    }

    toDOM() {
        const div = document.createElement('div');
        div.className = `cm-error-line-widget cm-error-line-widget-${this.error.severity}`;

        // 获取错误严重程度的颜色和图标
        const { color, icon, bgColor } = this.getSeverityStyle(this.error.severity);

        div.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            margin: 2px 0;
            background-color: ${bgColor};
            border-left: 4px solid ${color};
            border-radius: 0 4px 4px 0;
            font-size: 12px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            color: ${color};
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        // 创建图标
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon;
        iconSpan.style.cssText = `
            font-size: 14px;
            font-weight: bold;
        `;

        // 创建错误类型标签
        const typeSpan = document.createElement('span');
        typeSpan.textContent = `[${this.error.type.toUpperCase()}]`;
        typeSpan.style.cssText = `
            font-weight: bold;
            opacity: 0.8;
            font-size: 11px;
        `;

        // 创建错误消息
        const messageSpan = document.createElement('span');
        messageSpan.textContent = this.error.message;
        messageSpan.style.cssText = `
            flex: 1;
            font-weight: 500;
        `;

        div.appendChild(iconSpan);
        div.appendChild(typeSpan);
        div.appendChild(messageSpan);

        // 添加悬停效果
        div.addEventListener('mouseenter', () => {
            div.style.opacity = '0.9';
            div.style.transform = 'translateX(2px)';
        });

        div.addEventListener('mouseleave', () => {
            div.style.opacity = '1';
            div.style.transform = 'translateX(0)';
        });

        return div;
    }

    private getSeverityStyle(severity: string) {
        switch (severity) {
            case 'error':
                return {
                    color: '#ff4757',
                    icon: '❌',
                    bgColor: 'rgba(255, 71, 87, 0.1)'
                };
            case 'warning':
                return {
                    color: '#ffa500',
                    icon: '⚠️',
                    bgColor: 'rgba(255, 165, 0, 0.1)'
                };
            case 'info':
                return {
                    color: '#007bff',
                    icon: 'ℹ️',
                    bgColor: 'rgba(0, 123, 255, 0.1)'
                };
            default:
                return {
                    color: '#6c757d',
                    icon: '•',
                    bgColor: 'rgba(108, 117, 125, 0.1)'
                };
        }
    }
}

// 重新实现更简单的错误高亮StateField
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
                console.log('🔍 处理错误:', effect.value.length, '个');
                const errors = effect.value;

                // 清除所有现有装饰
                decorations = Decoration.none;

                const newDecorations: Range<Decoration>[] = [];

                errors.forEach((error, index) => {
                    try {
                        const line = Math.max(1, error.line);
                        const doc = tr.state.doc;

                        if (line <= doc.lines) {
                            const lineObj = doc.line(line);
                            const from = lineObj.from;
                            const to = lineObj.to;

                            // 创建轻微的行高亮（可选，用于标识错误行）
                            const lineDecoration = Decoration.line({
                                class: `cm-error-line cm-error-line-${error.severity}`,
                                attributes: {
                                    'data-error': 'true',
                                    'data-error-message': error.message,
                                    'data-error-severity': error.severity
                                }
                            });

                            newDecorations.push(lineDecoration.range(from));

                            // 在错误行下方添加错误信息Widget
                            const errorInfoWidget = Decoration.widget({
                                widget: new ErrorLineWidget(error),
                                side: 1,    // 在行后显示
                                block: true // 作为块级元素显示
                            });

                            // Widget显示在行尾位置，这样会出现在行的下方
                            newDecorations.push(errorInfoWidget.range(to));
                        }
                    } catch (e) {
                        console.error('❌ 创建装饰时出错:', e, error);
                    }
                });

                decorations = Decoration.set(newDecorations);
                console.log('✅ 装饰已更新:', newDecorations.length, '个');

                // 延迟检查DOM
                setTimeout(() => {
                    console.log('🔍 开始DOM检查...');
                    const editors = document.querySelectorAll('.cm-editor, .cm-content');
                    console.log('📊 找到编辑器/内容元素:', editors.length);

                    editors.forEach((editor, i) => {
                        console.log(`📝 检查编辑器 ${i + 1}:`);

                        // 检查错误相关的类名
                        const errorElements = editor.querySelectorAll('[data-error], .cm-error-line, .cm-error-widget');
                        console.log(`  🎯 错误元素数量: ${errorElements.length}`);

                        errorElements.forEach((el, j) => {
                            console.log(`    元素 ${j + 1}:`, {
                                tagName: el.tagName,
                                className: el.className,
                                hasDataError: el.hasAttribute('data-error'),
                                computedBg: window.getComputedStyle(el).backgroundColor
                            });
                        });
                    });
                }, 200);

            } else if (effect.is(clearErrorsEffect)) {
                console.log('🧹 清除错误装饰');
                decorations = Decoration.none;
            }
        }

        return decorations;
    },
    provide: f => EditorView.decorations.from(f)
});

// 错误高亮主题
export const errorHighlightTheme = EditorView.theme({
    // 轻微的行级别错误样式（用于标识错误行）
    '.cm-error-line-error': {
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        borderLeft: '2px solid rgba(255, 71, 87, 0.3)'
    },
    '.cm-error-line-warning': {
        backgroundColor: 'rgba(255, 165, 0, 0.05)',
        borderLeft: '2px solid rgba(255, 165, 0, 0.3)'
    },
    '.cm-error-line-info': {
        backgroundColor: 'rgba(0, 123, 255, 0.05)',
        borderLeft: '2px solid rgba(0, 123, 255, 0.3)'
    },

    // 错误信息Widget样式
    '.cm-error-line-widget': {
        display: 'block',
        width: '100%',
        boxSizing: 'border-box'
    },

    // 确保Widget不影响编辑器布局
    '.cm-error-line-widget-error': {
        borderColor: '#ff4757'
    },
    '.cm-error-line-widget-warning': {
        borderColor: '#ffa500'
    },
    '.cm-error-line-widget-info': {
        borderColor: '#007bff'
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
    console.log('🔥 添加错误:', errors.length, '个');

    view.dispatch({
        effects: addErrorEffect.of(errors)
    });
};

// 清除编辑器中的错误
export const clearErrorsFromEditor = (view: EditorView) => {
    console.log('🧹 清除错误');
    view.dispatch({
        effects: clearErrorsEffect.of(null)
    });
};

