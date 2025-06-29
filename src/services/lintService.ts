import { StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet, WidgetType } from '@codemirror/view';

// 运行时错误检测服务
// 专注于JavaScript运行时错误捕获和显示

// 错误消息小部件
class ErrorMessageWidget extends WidgetType {
    constructor(
        private message: string,
        private type: 'error' | 'warning' = 'error'
    ) {
        super();
    }

    toDOM(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'cm-lint-error-line';

        const messageDiv = document.createElement('div');
        messageDiv.className = `cm-lint-message cm-lint-${this.type}`;

        const icon = document.createElement('span');
        icon.className = 'cm-lint-icon';
        icon.textContent = this.type === 'error' ? '✗' : '⚠';

        const prefix = document.createElement('span');
        prefix.className = 'cm-lint-prefix';
        prefix.textContent = this.type === 'error' ? 'Runtime Error: ' : 'Runtime Warning: ';

        const text = document.createElement('span');
        text.className = 'cm-lint-text';
        text.textContent = this.message;

        messageDiv.appendChild(icon);
        messageDiv.appendChild(prefix);
        messageDiv.appendChild(text);
        wrapper.appendChild(messageDiv);

        return wrapper;
    }

    eq(other: WidgetType): boolean {
        return other instanceof ErrorMessageWidget &&
            other.message === this.message &&
            other.type === this.type;
    }

    updateDOM(): boolean {
        return false;
    }

    get estimatedHeight(): number {
        return 28;
    }

    ignoreEvent(): boolean {
        return false;
    }
}

// 运行时错误状态效果
export const addRuntimeErrors = StateEffect.define<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning'
}[]>();

export const clearRuntimeErrors = StateEffect.define();

// 运行时错误装饰状态字段
export const runtimeErrorField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },

    update(decorations, tr) {
        decorations = decorations.map(tr.changes);

        for (let effect of tr.effects) {
            if (effect.is(addRuntimeErrors)) {
                const runtimeErrors = effect.value;
                const runtimeDecorations: any[] = [];

                for (const error of runtimeErrors) {
                    try {
                        const line = Math.max(1, Math.min(error.line, tr.state.doc.lines));
                        const lineObj = tr.state.doc.line(line);

                        // 在行末添加运行时错误消息小部件
                        const widget = new ErrorMessageWidget(error.message, error.severity);
                        runtimeDecorations.push(Decoration.widget({
                            widget,
                            side: 1,
                            block: true
                        }).range(lineObj.to));

                    } catch (e) {
                        console.warn('Error creating runtime error decoration:', e);
                    }
                }

                decorations = Decoration.set(runtimeDecorations, true);
            } else if (effect.is(clearRuntimeErrors)) {
                decorations = Decoration.none;
            }
        }

        return decorations;
    },

    provide: f => EditorView.decorations.from(f)
});

// 错误消息样式主题
export const errorMessageTheme = EditorView.theme({
    '.cm-lint-error-line': {
        width: '100%',
        display: 'block',
        margin: '0',
    },

    '.cm-lint-message': {
        padding: '4px 8px',
        margin: '2px 0',
        borderRadius: '4px',
        fontSize: '12px',
        lineHeight: '16px',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        maxWidth: '100%',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
    },

    '.cm-lint-message.cm-lint-error': {
        backgroundColor: '#fef2f2',
        borderLeft: '3px solid #ef4444',
        color: '#dc2626',
    },

    '.cm-lint-message.cm-lint-warning': {
        backgroundColor: '#fffbeb',
        borderLeft: '3px solid #f59e0b',
        color: '#d97706',
    },

    '.cm-lint-icon': {
        fontSize: '10px',
        fontWeight: 'bold',
        flexShrink: 0,
    },

    '.cm-lint-prefix': {
        fontWeight: '600',
        fontSize: '11px',
        flexShrink: 0,
    },

    '.cm-lint-text': {
        fontSize: '11px',
        lineHeight: '1.4',
        flex: 1,
    },

    // 暗色主题支持
    '.cm-editor.cm-dark .cm-lint-message.cm-lint-error': {
        backgroundColor: '#1f1f1f',
        borderLeft: '3px solid #ef4444',
        color: '#fca5a5',
    },

    '.cm-editor.cm-dark .cm-lint-message.cm-lint-warning': {
        backgroundColor: '#1f1f1f',
        borderLeft: '3px solid #f59e0b',
        color: '#fbbf24',
    },
});

// 添加运行时错误到编辑器的工具函数
export function addRuntimeErrorsToEditor(
    view: EditorView,
    errors: Array<{ line: number; column: number; message: string; severity: 'error' | 'warning' }>
) {
    if (!view) {
        return;
    }

    try {
        view.dispatch({
            effects: [
                clearRuntimeErrors.of(null),
                addRuntimeErrors.of(errors)
            ]
        });
    } catch (error) {
        console.error('Failed to add runtime errors to editor:', error);
    }
}

// 清空运行时错误的工具函数
export function clearRuntimeErrorsFromEditor(view: EditorView) {
    if (!view) return;

    try {
        view.dispatch({
            effects: [clearRuntimeErrors.of(null)]
        });
    } catch (error) {
        console.warn('Failed to clear runtime errors from editor:', error);
    }
}

// 导出运行时错误扩展
export const runtimeErrorExtension = [
    runtimeErrorField,
    errorMessageTheme
]; 