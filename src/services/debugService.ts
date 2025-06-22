// 轻量级调试服务 - 专注于源码映射和开发者工具支持

// 生成标准的源码映射，使用虚拟文件路径
export function generateInlineSourceMap(code: string, filename: string, isCSS: boolean = false): string {
    // 创建虚拟文件路径，模拟webpack风格的源码结构
    const virtualPath = `webpack:///./${filename}`;

    // 创建标准源码映射对象
    const sourceMap = {
        version: 3,
        file: filename,
        sourceRoot: "webpack:///",
        sources: [`./${filename}`],
        sourcesContent: [code],
        names: [],
        mappings: generateVLQMappings(code)
    };

    // 生成内联源码映射
    const sourceMapJson = JSON.stringify(sourceMap);
    const sourceMapBase64 = btoa(unescape(encodeURIComponent(sourceMapJson)));

    // 根据文件类型使用正确的注释格式
    if (isCSS) {
        return `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${sourceMapBase64} */`;
    } else {
        return `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${sourceMapBase64}`;
    }
}

// 生成更准确的VLQ编码映射
function generateVLQMappings(code: string): string {
    const lines = code.split('\n');
    const mappings: string[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        if (line.trim() === '') {
            // 空行不需要映射
            mappings.push('');
            continue;
        }

        // 为非空行生成映射
        // 格式: [生成列, 源文件索引, 源行, 源列]
        if (lineIndex === 0) {
            // 第一行: [0,0,0,0]
            mappings.push('AAAA');
        } else {
            // 后续行: [0,0,1,0] (相对于上一行)
            mappings.push('AACA');
        }
    }

    return mappings.join(';');
}

// 为代码添加调试支持
export function addDebugSupport(code: string, filename: string, enableSourceMap: boolean = true): string {
    if (!enableSourceMap || !code.trim()) {
        return code;
    }

    // 添加源码映射注释
    const isCSS = filename.endsWith('.css');
    const sourceMapComment = generateInlineSourceMap(code, filename, isCSS);

    return `${code}\n${sourceMapComment}`;
}

// 创建调试友好的HTML文档
export function createDebugDocument(html: string, css: string, js: string, options: {
    enableDebug: boolean;
    jsLanguage?: string;
    libraryScripts?: string;
}): string {
    const { enableDebug, jsLanguage = 'js', libraryScripts = '' } = options;

    if (!enableDebug) {
        // 普通模式，不添加源码映射
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
${css}
  </style>
  ${libraryScripts}
</head>
<body>
${html}
<script>
${js}
</script>
</body>
</html>`;
    }

    // 调试模式 - 创建独立的源文件而不是复合文件
    const cssFileName = `styles.css`;
    const jsFileName = `main.js`;

    const cssWithSourceMap = css.trim() ?
        css + '\n' + generateInlineSourceMap(css, cssFileName, true) : '';
    const jsWithSourceMap = js.trim() ?
        js + '\n' + generateInlineSourceMap(js, jsFileName, false) : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodePen Debug Preview</title>
  <!-- Debug Mode: Source maps enabled for styles.css and main.js -->
  
  <!-- Base Styles -->
  <style>
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}
  </style>
  
  ${libraryScripts}
  
  <!-- User CSS - will appear as styles.css in DevTools -->
  <style>
${cssWithSourceMap}
  </style>
</head>
<body>
${html}

<!-- User JavaScript - will appear as main.js in DevTools -->
<script>
${jsWithSourceMap}
</script>
</body>
</html>`;
}

// 调试状态管理
export class DebugManager {
    private _enabled: boolean = false;

    get enabled(): boolean {
        return this._enabled;
    }

    enable(): void {
        this._enabled = true;
        console.log('🐛 Debug mode enabled - Source maps will be generated');
    }

    disable(): void {
        this._enabled = false;
        console.log('🐛 Debug mode disabled');
    }

    toggle(): boolean {
        if (this._enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this._enabled;
    }
} 