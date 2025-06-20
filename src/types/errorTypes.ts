// 编译错误类型定义
export interface CompileError {
    id: string;
    type: 'javascript' | 'css' | 'html';
    message: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    source?: string; // 错误来源（babel、sass、less等）
}

// 错误位置信息
export interface ErrorPosition {
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
}

// 编译结果
export interface CompileResult {
    success: boolean;
    errors: CompileError[];
    warnings?: CompileError[];
    compiledCode?: string;
}

// 错误高亮配置
export interface ErrorHighlightConfig {
    className: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
}

// 编辑器错误状态
export interface EditorErrorState {
    htmlErrors: CompileError[];
    cssErrors: CompileError[];
    jsErrors: CompileError[];
} 