import { htmlCompletionSource } from '@codemirror/lang-html';
import { cssCompletionSource } from '@codemirror/lang-css';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import { bracketMatching } from '@codemirror/language';//括号匹配高亮
import { autocompletion, CompletionContext, CompletionSource, snippetCompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';

// 常用 HTML5 标签（用于标签补全）
const htmlTags = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
  'form', 'input', 'button', 'textarea', 'select', 'option', 'label', 'fieldset', 'legend', 'section', 'article',
  'header', 'footer', 'nav', 'aside', 'main', 'figure', 'figcaption', 'blockquote', 'code', 'pre', 'em', 'strong',
  'b', 'i', 'u', 'br', 'hr', 'iframe', 'video', 'audio', 'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'text'
];

// 自闭合标签列表
const selfClosingTags = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
];

// HTML 标签补全源（支持输入部分标签名补全）
export const htmlTagCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;

  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);

  // 检查是否在注释中
  const inComment = /<!--.*-->$/.test(beforeCursor);

  if (inComment) {
    return null; // 在注释中不提供补全
  }

  // 检查是否在标签内（<tag> 或 <tag attr>）
  const inTag = /<[^>]*$/.test(beforeCursor);

  if (inTag) {
    // 在标签内提供属性补全，自动添加 ="" 
    const commonAttributes = [
      'class', 'id', 'style', 'title', 'alt', 'src', 'href', 'type', 'name', 'value',
      'placeholder', 'required', 'disabled', 'readonly', 'maxlength', 'minlength',
      'pattern', 'autocomplete', 'autofocus', 'form', 'list', 'multiple', 'size',
      'step', 'min', 'max', 'checked', 'selected', 'hidden', 'target', 'rel',
      'download', 'hreflang', 'media', 'sizes', 'integrity', 'crossorigin',
      'async', 'defer', 'charset', 'content', 'http-equiv', 'name', 'property',
      'data-', 'aria-', 'role', 'tabindex', 'accesskey', 'draggable', 'spellcheck',
      'contenteditable', 'translate', 'dir', 'lang', 'xml:lang', 'xml:space'
    ];

    const attributeSnippets = commonAttributes.map(attr => {
      if (attr === 'data-' || attr === 'aria-') {
        // 对于data-和aria-属性，提供模板
        return snippetCompletion(`${attr}\${1:attribute}="\${2:value}"`, { label: attr });
      } else {
        // 普通属性，自动添加 =""
        return snippetCompletion(`${attr}="\${1}"`, { label: attr });
      }
    });
    //返回补全结果，from: word.from 表示补全结果的起始位置，options: attributeSnippets 表示补全选项，validFor: /\w*/ 表示补全的正则表达式
    return {
      from: word.from,
      options: attributeSnippets,
      validFor: /\w*/
    };
  }

  // 提供标签补全（使用snippetCompletion）
  const tagSnippets = htmlTags.map(tag => {
    if (selfClosingTags.includes(tag)) {
      // 自闭合标签，光标定位在属性位置
      return snippetCompletion(`<${tag} \${1} />`, { label: tag });
    } else {
      // 普通标签，光标定位在内容内
      return snippetCompletion(`<${tag}>\${1}</${tag}>`, { label: tag });
    }
  });

  // 只提供一些常用的HTML代码片段（CodeMirror原生没有的）
  const htmlSnippets = [
    // 常用的HTML结构片段
    snippetCompletion('<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>', { label: 'html5' }),
    snippetCompletion('<meta charset="UTF-8">', { label: 'meta charset' }),
    snippetCompletion('<meta name="viewport" content="width=device-width, initial-scale=1.0">', { label: 'meta viewport' }),
    snippetCompletion('<link rel="stylesheet" href="${1:style.css}">', { label: 'link css' }),
    snippetCompletion('<script src="${1:script.js}"></script>', { label: 'script src' }),
    // 常用的表单结构
    snippetCompletion('<form action="${1}" method="${2:post}">\n\t${3}\n</form>', { label: 'form' }),
    snippetCompletion('<fieldset>\n\t<legend>${1:Legend}</legend>\n\t${2}\n</fieldset>', { label: 'fieldset' }),
    // 常用的列表结构
    snippetCompletion('<ul>\n\t<li>${1}</li>\n\t<li>${2}</li>\n</ul>', { label: 'ul list' }),
    snippetCompletion('<ol>\n\t<li>${1}</li>\n\t<li>${2}</li>\n</ol>', { label: 'ol list' }),
    // 常用的表格结构
    snippetCompletion('<table>\n\t<thead>\n\t\t<tr>\n\t\t\t<th>${1}</th>\n\t\t</tr>\n\t</thead>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>${2}</td>\n\t\t</tr>\n\t</tbody>\n</table>', { label: 'table' }),
    // 常用的语义化结构
    snippetCompletion('<header>\n\t${1}\n</header>\n<main>\n\t${2}\n</main>\n<footer>\n\t${3}\n</footer>', { label: 'semantic layout' }),
    // 常用的媒体元素
    snippetCompletion('<figure>\n\t<img src="${1}" alt="${2}">\n\t<figcaption>${3}</figcaption>\n</figure>', { label: 'figure' }),
    // 常用的数据属性
    snippetCompletion('data-${1:attribute}="${2:value}"', { label: 'data attribute' }),
    snippetCompletion('aria-${1:label}="${2:value}"', { label: 'aria attribute' })
  ];

  return {
    from: word.from,
    options: [...tagSnippets,...htmlSnippets],
    validFor: /\w*/
  };
};

// HTML 自动补全（使用标签补全 + 代码片段 + CodeMirror原生）
export const htmlAutocomplete = autocompletion({
  override: [htmlTagCompletionSource, htmlCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50
});


// CSS 代码片段补全源（增强的CSS补全功能）
export const cssSnippetCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;

  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);

  // 检查是否在注释中
  const inComment = /\/\*.*\*\/$/.test(beforeCursor) || /\/\/.*$/.test(beforeCursor);

  if (inComment) {
    return null; // 在注释中不提供补全
  }

  // 检查是否在字符串中
  const inString = /["'][^"']*$/.test(beforeCursor);

  if (inString) {
    return null; // 在字符串中不提供补全
  }

  // 检查是否在属性值中（冒号后面）- 改进的属性名识别
  const propertyValueMatch = beforeCursor.match(/([a-zA-Z-]+(?:-[a-zA-Z-]+)*)\s*:\s*([^;]*)$/);
  const inPropertyValue = propertyValueMatch !== null;

  // 如果在属性值中，提供精确的属性值补全
  if (inPropertyValue) {
    const propertyName = propertyValueMatch[1];
    const currentValue = propertyValueMatch[2].trim();

    // 改进的数字匹配逻辑，避免重复触发
    const numberMatch = currentValue.match(/(\d+(?:\.\d+)?)\s*$/);
    if (numberMatch) {
      const number = numberMatch[1];
      // 检查光标后是否已经有单位，避免重复补全
      const afterCursor = line.text.slice(context.pos - line.from);
      const hasUnitAfter = /^[a-zA-Z%]+/.test(afterCursor);
      
      if (hasUnitAfter) {
        return null; // 已经有单位了，不需要补全
      }

      // 根据属性类型提供相应的单位
      const getUnitsForProperty = (prop: string): string[] => {
        // 长度相关属性
        if (['width', 'height', 'margin', 'padding', 'border-width', 'font-size', 'line-height',
             'top', 'right', 'bottom', 'left', 'min-width', 'max-width', 'min-height', 'max-height',
             'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
             'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
             'border-radius', 'text-indent', 'letter-spacing', 'word-spacing'].includes(prop)) {
          return ['px', 'rem', 'em', '%', 'vw', 'vh', 'pt', 'cm', 'mm', 'in'];
        }
        // 时间相关属性
        if (['transition-duration', 'animation-duration', 'animation-delay', 'transition-delay'].includes(prop)) {
          return ['s', 'ms'];
        }
        // 角度相关属性
        if (['transform', 'rotate', 'skew', 'hue-rotate'].includes(prop)) {
          return ['deg', 'rad', 'grad', 'turn'];
        }
        // 频率相关属性
        if (['pitch'].includes(prop)) {
          return ['Hz', 'kHz'];
        }
        // 默认长度单位
        return ['px', 'rem', 'em', '%'];
      };

      const relevantUnits = getUnitsForProperty(propertyName);
      const units = relevantUnits.map(unit => ({
        label: `${number}${unit}`,
        insert: unit,
        type: 'unit'
      }));

      return {
        from: context.pos,
        options: units.map(unit => ({
          label: unit.label,
          apply: unit.insert,
          type: unit.type,
          boost: 99 // 提高优先级
        })),
        validFor: /^$/ // 只在没有后续字符时有效
      };
    }

    // 完善的属性值映射表
    const getPropertyValues = (prop: string): string[] => {
      const propertyValues: { [key: string]: string[] } = {
        // 显示和布局
        'display': ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 
                   'table', 'table-cell', 'table-row', 'table-column', 'list-item', 'none'],
        'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
        'float': ['left', 'right', 'none'],
        'clear': ['left', 'right', 'both', 'none'],
        'visibility': ['visible', 'hidden', 'collapse'],
        'box-sizing': ['content-box', 'border-box'],
        'overflow': ['visible', 'hidden', 'scroll', 'auto'],
        'overflow-x': ['visible', 'hidden', 'scroll', 'auto'],
        'overflow-y': ['visible', 'hidden', 'scroll', 'auto'],
        'resize': ['none', 'both', 'horizontal', 'vertical'],

        // 文本相关
        'text-align': ['left', 'right', 'center', 'justify', 'start', 'end'],
        'text-decoration': ['none', 'underline', 'overline', 'line-through'],
        'text-decoration-line': ['none', 'underline', 'overline', 'line-through'],
        'text-decoration-style': ['solid', 'double', 'dotted', 'dashed', 'wavy'],
        'text-transform': ['none', 'uppercase', 'lowercase', 'capitalize'],
        'white-space': ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'],
        'word-wrap': ['normal', 'break-word'],
        'word-break': ['normal', 'break-all', 'keep-all', 'break-word'],
        'vertical-align': ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'sub', 'super'],
        'direction': ['ltr', 'rtl'],
        'unicode-bidi': ['normal', 'embed', 'bidi-override'],

        // 字体相关
        'font-weight': ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
        'font-style': ['normal', 'italic', 'oblique'],
        'font-variant': ['normal', 'small-caps'],
        'font-stretch': ['normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 
                        'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'],

        // 背景相关
        'background-repeat': ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round'],
        'background-size': ['auto', 'cover', 'contain'],
        'background-position': ['left', 'center', 'right', 'top', 'bottom'],
        'background-attachment': ['scroll', 'fixed', 'local'],
        'background-origin': ['padding-box', 'border-box', 'content-box'],
        'background-clip': ['border-box', 'padding-box', 'content-box', 'text'],

        // 边框相关
        'border-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
        'border-top-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
        'border-right-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
        'border-bottom-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
        'border-left-style': ['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'],
        'border-collapse': ['separate', 'collapse'],

        // Flexbox
        'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
        'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
        'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
        'align-items': ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'],
        'align-content': ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'],
        'align-self': ['auto', 'stretch', 'flex-start', 'flex-end', 'center', 'baseline'],

                 // Grid
         'grid-auto-flow': ['row', 'column', 'dense'],
         'justify-items': ['start', 'end', 'center', 'stretch'],
         'justify-self': ['auto', 'start', 'end', 'center', 'stretch'],

        // 列表相关
        'list-style-type': ['disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 
                           'upper-roman', 'lower-greek', 'lower-latin', 'upper-latin', 'armenian', 'georgian', 'none'],
        'list-style-position': ['inside', 'outside'],

        // 表格相关
        'table-layout': ['auto', 'fixed'],
        'border-spacing': ['separate', 'collapse'],
        'caption-side': ['top', 'bottom'],
        'empty-cells': ['show', 'hide'],

        // 变换和动画
        'transform-style': ['flat', 'preserve-3d'],
        'transform-origin': ['left', 'center', 'right', 'top', 'bottom'],
        'backface-visibility': ['visible', 'hidden'],
        'perspective-origin': ['left', 'center', 'right', 'top', 'bottom'],
        'animation-direction': ['normal', 'reverse', 'alternate', 'alternate-reverse'],
        'animation-fill-mode': ['none', 'forwards', 'backwards', 'both'],
        'animation-play-state': ['running', 'paused'],
        'animation-timing-function': ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'],
        'transition-timing-function': ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'],

        // 用户界面
        'cursor': ['auto', 'default', 'pointer', 'text', 'wait', 'help', 'move', 'crosshair', 'not-allowed', 
                  'grab', 'grabbing', 'zoom-in', 'zoom-out', 'copy', 'alias', 'context-menu', 'cell', 
                  'vertical-text', 'alias', 'progress', 'no-drop', 'col-resize', 'row-resize'],
        'pointer-events': ['auto', 'none', 'visiblePainted', 'visibleFill', 'visibleStroke', 'visible', 'painted', 'fill', 'stroke', 'all'],
        'user-select': ['auto', 'text', 'none', 'contain', 'all'],

        // 颜色和透明度
        'color': ['red', 'blue', 'green', 'black', 'white', 'gray', 'yellow', 'orange', 'purple', 'pink', 
                 'brown', 'cyan', 'magenta', 'lime', 'navy', 'teal', 'silver', 'transparent', 'currentColor'],
        'background-color': ['transparent', 'white', 'black', 'red', 'blue', 'green', 'gray', 'yellow', 
                            'orange', 'purple', 'pink', 'brown', 'cyan', 'magenta', 'lime', 'navy', 'teal', 'silver'],
        'border-color': ['transparent', 'currentColor', 'red', 'blue', 'green', 'black', 'white', 'gray'],

        // CSS Grid特定属性
        'grid-template-columns': ['none', 'repeat()', 'minmax()', 'fit-content()', 'auto', 'min-content', 'max-content'],
        'grid-template-rows': ['none', 'repeat()', 'minmax()', 'fit-content()', 'auto', 'min-content', 'max-content'],

        // 打印相关
        'page-break-before': ['auto', 'always', 'avoid', 'left', 'right'],
        'page-break-after': ['auto', 'always', 'avoid', 'left', 'right'],
        'page-break-inside': ['auto', 'avoid'],

        // 其他常用属性
        'object-fit': ['fill', 'contain', 'cover', 'none', 'scale-down'],
        'object-position': ['left', 'center', 'right', 'top', 'bottom'],
        'mix-blend-mode': ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 
                          'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 
                          'saturation', 'color', 'luminosity'],
        'isolation': ['auto', 'isolate'],
        'writing-mode': ['horizontal-tb', 'vertical-rl', 'vertical-lr'],
        'text-orientation': ['mixed', 'upright', 'sideways']
      };

      return propertyValues[prop] || [];
    };

    // 获取CSS函数值
    const getCSSFunctions = (prop: string): string[] => {
      const functions: { [key: string]: string[] } = {
        'background-image': ['url()', 'linear-gradient()', 'radial-gradient()', 'repeating-linear-gradient()', 'repeating-radial-gradient()'],
        'transform': ['translate()', 'translateX()', 'translateY()', 'scale()', 'scaleX()', 'scaleY()', 
                     'rotate()', 'skew()', 'skewX()', 'skewY()', 'matrix()', 'perspective()'],
        'filter': ['blur()', 'brightness()', 'contrast()', 'grayscale()', 'hue-rotate()', 'invert()', 
                  'opacity()', 'saturate()', 'sepia()', 'drop-shadow()'],
        'color': ['rgb()', 'rgba()', 'hsl()', 'hsla()', 'var()'],
        'background-color': ['rgb()', 'rgba()', 'hsl()', 'hsla()', 'var()'],
        'border-color': ['rgb()', 'rgba()', 'hsl()', 'hsla()', 'var()'],
        'width': ['calc()', 'min()', 'max()', 'clamp()', 'var()'],
        'height': ['calc()', 'min()', 'max()', 'clamp()', 'var()'],
        'font-family': ['var()'],
        'content': ['attr()', 'counter()', 'url()']
      };

      return functions[prop] || [];
    };

    // 严格过滤：只返回与当前属性相关的值
    const specificValues = getPropertyValues(propertyName);
    const cssFunctions = getCSSFunctions(propertyName);
    const allRelevantValues = [...specificValues, ...cssFunctions];

    // 根据用户输入进行过滤
    const filteredValues = allRelevantValues.filter(value => {
      if (!word.text) return true; // 如果没有输入，显示所有相关值
      return value.toLowerCase().startsWith(word.text.toLowerCase());
    });

    if (filteredValues.length > 0) {
      return {
        from: word.from,
        options: filteredValues.map(value => ({
          label: value,
          apply: value,
          type: 'value',
          boost: specificValues.includes(value) ? 15 : 10 // CSS函数稍低优先级
        })),
        validFor: /\w*/
      };
    }

    // 如果没有找到特定值，且输入较短，不显示任何补全避免干扰
    if (word.text.length < 2) {
      return null;
    }

    // 对于未知属性，只提供最通用的值
    const fallbackValues = ['auto', 'none', 'inherit', 'initial', 'unset'];
    const filteredFallback = fallbackValues.filter(value => 
      value.toLowerCase().startsWith(word.text.toLowerCase())
    );

    if (filteredFallback.length > 0) {
      return {
        from: word.from,
        options: filteredFallback.map(value => ({
          label: value,
          apply: value,
          type: 'value',
          boost: 5 // 较低优先级
        })),
        validFor: /\w*/
      };
    }

    return null; // 完全不匹配时不显示任何选项
  }

  // 改进的CSS属性补全，确保所有属性都有分号
  const cssProperties = [
    // Font相关
    'font-size', 'font-weight', 'font-family', 'font-style', 'font-variant',
    'font-stretch', 'font-size-adjust', 'line-height', 'text-align', 
    'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing',
    
    // Layout相关
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
    'box-sizing', 'overflow', 'overflow-x', 'overflow-y', 'z-index',
    
    // Margin和Padding
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    
    // Border相关
    'border', 'border-width', 'border-style', 'border-color', 'border-radius',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    
    // Background相关
    'background', 'background-color', 'background-image', 'background-size',
    'background-position', 'background-repeat', 'background-attachment',
    
    // Flexbox
    'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content',
    'align-items', 'align-content', 'align-self', 'flex-grow', 'flex-shrink',
    
    // Grid
    'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
    'grid-gap', 'grid-column', 'grid-row', 'grid-area',
    
    // Transform和Animation
    'transform', 'transform-origin', 'transition', 'transition-property',
    'transition-duration', 'transition-timing-function', 'transition-delay',
    'animation', 'animation-name', 'animation-duration', 'animation-timing-function',
    'opacity', 'visibility', 'cursor',

    'color','white-space'
  ];

  // 根据输入的字符进行过滤和补全
  const filteredProperties = cssProperties.filter(prop => 
    prop.toLowerCase().includes(word.text.toLowerCase())
  );

  const cssSnippets = filteredProperties.map(prop => 
    snippetCompletion(`${prop}: \${1};`, { 
      label: prop,
      type: 'property',
      boost: prop.startsWith(word.text) ? 10 : 0 // 前缀匹配优先级更高
    })
  );

  return {
    from: word.from,
    options: cssSnippets,
    validFor: /^[\w-]*$/
  };
};
// CSS 自动补全（使用CodeMirror原生 + 自定义代码片段）
export const cssAutocomplete = autocompletion({
  override: [cssSnippetCompletionSource, cssCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50
});


// 导出括号高亮匹配扩展
export const bracketMatchingExtension = bracketMatching();

// 自动括号补全扩展
export const closeBracketsExtension = keymap.of([
  {
    key: "(",
    run: (view) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: [{ from, insert: "()" }],
        selection: { anchor: from + 1, head: from + 1 }
      });
      return true;
    }
  },
  {
    key: "[",
    run: (view) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: [{ from, insert: "[]" }],
        selection: { anchor: from + 1, head: from + 1 }
      });
      return true;
    }
  },
  {
    key: "{",
    run: (view) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: [{ from, insert: "{}" }],
        selection: { anchor: from + 1, head: from + 1 }
      });
      return true;
    }
  }
]); 