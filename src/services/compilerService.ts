import * as Babel from "@babel/standalone";
import { parse } from "@vue/compiler-sfc";
import * as sass from 'sass';
import * as less from 'less';

// Configure Babel for React/JSX
// Removed Babel.registerPreset call

export interface CompilationResult {
  code: string;
  error?: string;
  errorDetails?: any; // 原始错误对象，用于详细解析
}

//提供统一的TypeScript编译功能
export const compileTypeScript = async (code: string): Promise<CompilationResult> => {
  try {
    // 检查是否有 TypeScript 编译器可用
    if (typeof window !== 'undefined' && (window as any).ts) {
      const ts = (window as any).ts;
      const result = ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.Preserve,
          strict: false,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true
        }
      });
      return {
        code: result.outputText,
      };
    }
    // 如果没有 TypeScript 编译器，返回原始代码
    return {
      code: code,
    };
  } catch (error) {
    console.error('TypeScript compilation error:', error);
    return {
      code: code, // 出错时返回原始代码
      error: error instanceof Error ? error.message : 'Unknown TypeScript compilation error',
      errorDetails: error
    };
  }
};

//用于动态加载TypeScript编译器
export const loadTypeScriptCompiler = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).ts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/typescript/5.3.3/typescript.min.js';
    script.async = true;
    script.onload = () => {

      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load TypeScript compiler');
      reject(new Error('Failed to load TypeScript compiler'));
    };
    document.head.appendChild(script);
  });
};

export const compileReact = (code: string): CompilationResult => {
  try {
    const result = Babel.transform(code, {
      presets: [
        ["react", { runtime: "classic" }], // Configure preset-react to use classic runtime
      ],
      plugins: [],
    });

    return {
      code: result.code || "",
    };
  } catch (error) {
    console.error("React compilation error:", error);
    return {
      code: "",
      error:
        error instanceof Error ? error.message : "Unknown compilation error",
      errorDetails: error
    };
  }
};

export const compileSFCVue = (code: string): CompilationResult => {
  try {
    // Parse Vue SFC
    const { descriptor, errors } = parse(code, {
      filename: "component.vue",
    });

    if (errors.length > 0) {
      return {
        code: "",
        error: (errors as { message: string }[])
          .map((e: { message: string }) => e.message)
          .join("\n"),
        errorDetails: errors
      };
    }

    // Extract template, script, and style
    const template = descriptor.template?.content || "";
    const script =
      descriptor.script?.content || descriptor.scriptSetup?.content || "";
    interface StyleBlock {
      type: string;
      content: string;
      scoped?: boolean;
      module?: boolean | string;
      lang?: string;
      [key: string]: any;
    }

    const styles: string = (descriptor.styles as StyleBlock[])
      .map((style: StyleBlock) => style.content)
      .join("\n");

    // Generate Vue component code
    const compiledCode = `
      const { createApp, ref, reactive, computed, onMounted, onUnmounted } = Vue;
      
      ${script}
      
      const template = \`${template}\`;
      
      if (typeof component === 'undefined') {
        window.component = {
          template: template,
          setup() {
            return {};
          }
        };
      } else {
        component.template = template;
      }
      
      // Add styles
      if (template) {
        const styleEl = document.createElement('style');
        styleEl.textContent = \`${styles}\`;
        document.head.appendChild(styleEl);
      }
    `;

    return {
      code: compiledCode,
    };
  } catch (error) {
    console.error("Vue compilation error:", error);
    return {
      code: "",
      error:
        error instanceof Error ? error.message : "Unknown compilation error",
      errorDetails: error
    };
  }
};

export const compileVue = (code: string): CompilationResult => {
  return {
    code: code,
  };
};

export const compileJavaScript = (code: string): CompilationResult => {
  return {
    code: code,
  };
};

// 添加了 compileJsFramework 统一函数，处理所有JavaScript框架的编译
export const compileJsFramework = async (code: string, language: 'js' | 'react' | 'vue' | 'ts'): Promise<CompilationResult> => {
  try {
    let result: CompilationResult;

    switch (language) {
      case 'react':
        result = compileReact(code);
        break;
      case 'vue':
        result = compileVue(code);
        break;
      case 'ts':
        result = await compileTypeScript(code);
        break;
      default:
        result = compileJavaScript(code);
        break;
    }

    return result;
  } catch (error) {
    console.error(`Error compiling ${language}:`, error);
    return {
      code: code,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error
    };
  }
};

// 添加CSS编译功能
// 添加CSS编译功能
export const compileCssFramework = async (code: string, language: 'css' | 'scss' | 'less'): Promise<CompilationResult> => {
  try {
    // 普通CSS不需要编译
    if (language === 'css') {
      return { code };
    }

    let compiledCode: string;

    if (language === 'scss') {
      const result = sass.compileString(code);
      compiledCode = result.css;
    } else if (language === 'less') {
      const result = await less.render(code);
      compiledCode = result.css;
    } else {
      // 未知语言，返回原始代码
      return { code };
    }

    return { code: compiledCode };
  } catch (error) {
    console.error(`Error compiling ${language}:`, error);
    return {
      code, // 出错时返回原始代码
      error: error instanceof Error ? error.message : 'Unknown CSS compilation error',
      errorDetails: error
    };
  }
};