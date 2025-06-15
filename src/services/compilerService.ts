import * as Babel from '@babel/standalone';
import { parse } from '@vue/compiler-sfc';

// Configure Babel for React/JSX
// Removed Babel.registerPreset call

export interface CompilationResult {
  code: string;
  error?: string;
}

export const compileReact = (code: string): CompilationResult => {
  try {
    const result = Babel.transform(code, {
      presets: [
        ['react', { runtime: 'classic' }] // Configure preset-react to use classic runtime
      ],
      plugins: []
    });
    
    return {
      code: result.code || ''
    };
  } catch (error) {
    console.error('React compilation error:', error);
    return {
      code: '',
      error: error instanceof Error ? error.message : 'Unknown compilation error'
    };
  }
};

export const compileVue = (code: string): CompilationResult => {
  try {
    // Parse Vue SFC
    const { descriptor, errors } = parse(code, {
      filename: 'component.vue'
    });

    if (errors.length > 0) {
      return {
        code: '',
        error: (errors as { message: string }[]).map((e: { message: string }) => e.message).join('\n')
      };
    }

    // Extract template, script, and style
    const template = descriptor.template?.content || '';
    const script = descriptor.script?.content || descriptor.scriptSetup?.content || '';
    interface StyleBlock {
      type: string;
      content: string;
      scoped?: boolean;
      module?: boolean | string;
      lang?: string;
      [key: string]: any;
    }

    const styles: string = (descriptor.styles as StyleBlock[]).map((style: StyleBlock) => style.content).join('\n');

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
      code: compiledCode
    };
  } catch (error) {
    console.error('Vue compilation error:', error);
    return {
      code: '',
      error: error instanceof Error ? error.message : 'Unknown compilation error'
    };
  }
};

export const compileJavaScript = (code: string): CompilationResult => {
  return {
    code: code
  };
};