import { htmlCompletionSource } from '@codemirror/lang-html';
import { cssCompletionSource } from '@codemirror/lang-css';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import { bracketMatching } from '@codemirror/language';//括号匹配高亮
import { autocompletion, CompletionContext, CompletionSource, snippetCompletion, completionKeymap } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { closeBracketsKeymap } from '@codemirror/autocomplete';

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
    options: [...tagSnippets, ...htmlSnippets],
    validFor: /\w*/
  };
};

// HTML 自动补全（使用标签补全 + 代码片段 + CodeMirror原生）
export const htmlAutocomplete = autocompletion({
  override: [htmlTagCompletionSource, htmlCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50,
  activateOnTyping: true
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

    'color', 'white-space'
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
  maxRenderedOptions: 50,
  activateOnTyping: true
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

// JavaScript 代码片段补全源
export const jsSnippetCompletionSource: CompletionSource = (context: CompletionContext) => {
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
  const inString = /["'`][^"'`]*$/.test(beforeCursor);

  if (inString) {
    return null; // 在字符串中不提供补全
  }

  // JavaScript 常用代码片段
  const jsSnippets = [
    // 函数相关
    snippetCompletion('function ${1:functionName}(${2:params}) {\n\t${3}\n}', { label: 'function' }),
    snippetCompletion('const ${1:functionName} = (${2:params}) => {\n\t${3}\n}', { label: 'arrow function' }),
    snippetCompletion('function* ${1:generatorName}(${2:params}) {\n\t${3}\n}', { label: 'generator function' }),
    snippetCompletion('async function ${1:functionName}(${2:params}) {\n\t${3}\n}', { label: 'async function' }),
    snippetCompletion('const ${1:functionName} = async (${2:params}) => {\n\t${3}\n}', { label: 'async arrow function' }),

    // 控制流
    snippetCompletion('if (${1:condition}) {\n\t${2}\n}', { label: 'if' }),
    snippetCompletion('if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}', { label: 'if else' }),
    snippetCompletion('switch (${1:expression}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\t${4}\n}', { label: 'switch' }),
    snippetCompletion('for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}', { label: 'for loop' }),
    snippetCompletion('for (const ${1:item} of ${2:array}) {\n\t${3}\n}', { label: 'for of' }),
    snippetCompletion('for (const ${1:key} in ${2:object}) {\n\t${3}\n}', { label: 'for in' }),
    snippetCompletion('while (${1:condition}) {\n\t${2}\n}', { label: 'while' }),
    snippetCompletion('do {\n\t${1}\n} while (${2:condition});', { label: 'do while' }),

    // 类和对象
    snippetCompletion('class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t${3}\n\t}\n}', { label: 'class' }),
    snippetCompletion('class ${1:ClassName} extends ${2:ParentClass} {\n\tconstructor(${3:params}) {\n\t\tsuper(${4});\n\t\t${5}\n\t}\n}', { label: 'class extends' }),
    snippetCompletion('const ${1:objectName} = {\n\t${2:property}: ${3:value}\n}', { label: 'object' }),

    // 异步处理
    snippetCompletion('try {\n\t${1}\n} catch (${2:error}) {\n\t${3}\n}', { label: 'try catch' }),
    snippetCompletion('try {\n\t${1}\n} catch (${2:error}) {\n\t${3}\n} finally {\n\t${4}\n}', { label: 'try catch finally' }),
    snippetCompletion('Promise.resolve(${1:value})', { label: 'Promise.resolve' }),
    snippetCompletion('Promise.reject(${1:error})', { label: 'Promise.reject' }),
    snippetCompletion('Promise((resolve, reject) => {\n\t${1}\n})', { label: 'Promise' }),
    snippetCompletion('await ${1:promise}', { label: 'await' }),

    // 数组和对象方法
    snippetCompletion('${1:array}.map((${2:item}) => ${3})', { label: 'array map' }),
    snippetCompletion('${1:array}.filter((${2:item}) => ${3})', { label: 'array filter' }),
    snippetCompletion('${1:array}.reduce((${2:acc}, ${3:item}) => ${4}, ${5:initialValue})', { label: 'array reduce' }),
    snippetCompletion('${1:array}.forEach((${2:item}) => ${3})', { label: 'array forEach' }),
    snippetCompletion('Object.keys(${1:object})', { label: 'Object.keys' }),
    snippetCompletion('Object.values(${1:object})', { label: 'Object.values' }),
    snippetCompletion('Object.entries(${1:object})', { label: 'Object.entries' }),

    // 常用语句
    snippetCompletion('console.log(${1:message})', { label: 'console.log' }),
    snippetCompletion('console.error(${1:message})', { label: 'console.error' }),
    snippetCompletion('console.warn(${1:message})', { label: 'console.warn' }),
    snippetCompletion('console.table(${1:data})', { label: 'console.table' }),
    snippetCompletion('return ${1:value}', { label: 'return' }),
    snippetCompletion('throw new Error(${1:message})', { label: 'throw error' }),
    snippetCompletion('const ${1:variableName} = ${2:value}', { label: 'const' }),
    snippetCompletion('let ${1:variableName} = ${2:value}', { label: 'let' }),
    snippetCompletion('var ${1:variableName} = ${2:value}', { label: 'var' }),

    // 模块相关
    snippetCompletion('import ${1:module} from \'${2:path}\'', { label: 'import' }),
    snippetCompletion('import { ${1:export} } from \'${2:path}\'', { label: 'import named' }),
    snippetCompletion('import * as ${1:alias} from \'${2:path}\'', { label: 'import all' }),
    snippetCompletion('export default ${1:value}', { label: 'export default' }),
    snippetCompletion('export { ${1:export} }', { label: 'export named' }),
    snippetCompletion('export const ${1:name} = ${2:value}', { label: 'export const' }),

    // 模板字符串
    snippetCompletion('`${1:content}`', { label: 'template literal' }),
    snippetCompletion('`${1:content} ${2:${expression}}`', { label: 'template with expression' })
  ];

  return {
    from: word.from,
    options: jsSnippets,
    validFor: /\w*/
  };
};

// React 代码片段补全源
export const reactSnippetCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;

  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);

  // 检查是否在注释或字符串中
  const inComment = /\/\*.*\*\/$/.test(beforeCursor) || /\/\/.*$/.test(beforeCursor);
  const inString = /["'`][^"'`]*$/.test(beforeCursor);

  if (inComment || inString) {
    return null;
  }

  // React 常用代码片段
  const reactSnippets = [
    // 组件定义
    snippetCompletion('function ${1:ComponentName}(${2:props}) {\n\treturn (\n\t\t${3}\n\t);\n}', { label: 'react function component' }),
    snippetCompletion('const ${1:ComponentName} = (${2:props}) => {\n\treturn (\n\t\t${3}\n\t);\n}', { label: 'react arrow component' }),
    snippetCompletion('class ${1:ComponentName} extends React.Component {\n\trender() {\n\t\treturn (\n\t\t\t${2}\n\t\t);\n\t}\n}', { label: 'react class component' }),
    snippetCompletion('const ${1:ComponentName} = React.memo((${2:props}) => {\n\treturn (\n\t\t${3}\n\t);\n});', { label: 'react memo component' }),

    // Hooks
    snippetCompletion('const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue})', { label: 'useState' }),
    snippetCompletion('useEffect(() => {\n\t${1}\n}, [${2:dependencies}])', { label: 'useEffect' }),
    snippetCompletion('useEffect(() => {\n\t${1}\n}, [])', { label: 'useEffect empty deps' }),
    snippetCompletion('const ${1:ref} = useRef(${2:initialValue})', { label: 'useRef' }),
    snippetCompletion('const ${1:callback} = useCallback((${2:params}) => {\n\t${3}\n}, [${4:dependencies}])', { label: 'useCallback' }),
    snippetCompletion('const ${1:memoizedValue} = useMemo(() => {\n\t${2}\n}, [${3:dependencies}])', { label: 'useMemo' }),
    snippetCompletion('const ${1:context} = useContext(${2:Context})', { label: 'useContext' }),
    snippetCompletion('const ${1:reducer} = useReducer(${2:reducer}, ${3:initialState})', { label: 'useReducer' }),

    // JSX 元素
    snippetCompletion('<${1:div}>\n\t${2}\n</${1:div}>', { label: 'jsx element' }),
    snippetCompletion('<${1:Component} ${2:props}>\n\t${3}\n</${1:Component}>', { label: 'jsx component' }),
    snippetCompletion('<${1:div} className="${2:className}">\n\t${3}\n</${1:div}>', { label: 'jsx with className' }),
    snippetCompletion('<${1:div} style={{ ${2:styles} }}>\n\t${3}\n</${1:div}>', { label: 'jsx with style' }),
    snippetCompletion('<${1:input} type="${2:text}" value={${3:value}} onChange={${4:handleChange}} />', { label: 'jsx input' }),
    snippetCompletion('<${1:button} onClick={${2:handleClick}}>\n\t${3}\n</${1:button}>', { label: 'jsx button' }),

    // 条件渲染
    snippetCompletion('{${1:condition} && (\n\t${2}\n)}', { label: 'conditional render' }),
    snippetCompletion('{${1:condition} ? (\n\t${2}\n) : (\n\t${3}\n)}', { label: 'ternary render' }),
    snippetCompletion('{${1:items}.map((${2:item}, ${3:index}) => (\n\t<${4:div} key={${3:index}}>\n\t\t${5}\n\t</${4:div}>\n))}', { label: 'map render' }),

    // 事件处理
    snippetCompletion('const handle${1:Event} = (${2:event}) => {\n\t${3}\n}', { label: 'event handler' }),
    snippetCompletion('const handle${1:Event} = useCallback((${2:event}) => {\n\t${3}\n}, [${4:dependencies}])', { label: 'event handler with callback' }),

    // 导入导出
    snippetCompletion('import React from \'react\'', { label: 'import React' }),
    snippetCompletion('import React, { ${1:hook} } from \'react\'', { label: 'import React with hook' }),
    snippetCompletion('export default ${1:ComponentName}', { label: 'export default component' }),

    // 常用模式
    snippetCompletion('const ${1:ComponentName} = ({ ${2:props} }) => {\n\t${3}\n}', { label: 'destructured props' }),
    snippetCompletion('const { ${1:prop1}, ${2:prop2} } = ${3:props}', { label: 'destructure props' }),
    snippetCompletion('const { ${1:state1}, ${2:state2} } = ${3:state}', { label: 'destructure state' })
  ];

  return {
    from: word.from,
    options: reactSnippets,
    validFor: /\w*/
  };
};

// Vue 代码片段补全源
export const vueSnippetCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;

  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);

  // 检查是否在注释或字符串中
  const inComment = /\/\*.*\*\/$/.test(beforeCursor) || /\/\/.*$/.test(beforeCursor);
  const inString = /["'`][^"'`]*$/.test(beforeCursor);

  if (inComment || inString) {
    return null;
  }

  // Vue 常用代码片段
  const vueSnippets = [
    // Vue 3 Composition API
    snippetCompletion('const { createApp } = Vue', { label: 'import createApp' }),
    snippetCompletion('const app = createApp({\n\t${1}\n})', { label: 'createApp' }),
    snippetCompletion('app.mount(\'${1:#app}\')', { label: 'app mount' }),
    snippetCompletion('const { ref } = Vue', { label: 'import ref' }),
    snippetCompletion('const { reactive } = Vue', { label: 'import reactive' }),
    snippetCompletion('const { computed } = Vue', { label: 'import computed' }),
    snippetCompletion('const { watch } = Vue', { label: 'import watch' }),
    snippetCompletion('const { onMounted } = Vue', { label: 'import onMounted' }),
    snippetCompletion('const { onUnmounted } = Vue', { label: 'import onUnmounted' }),

    // 响应式数据
    snippetCompletion('const ${1:count} = ref(${2:0})', { label: 'ref' }),
    snippetCompletion('const ${1:state} = reactive({\n\t${2:property}: ${3:value}\n})', { label: 'reactive' }),
    snippetCompletion('const ${1:computedValue} = computed(() => {\n\t${2}\n})', { label: 'computed' }),

    // 生命周期
    snippetCompletion('onMounted(() => {\n\t${1}\n})', { label: 'onMounted' }),
    snippetCompletion('onUnmounted(() => {\n\t${1}\n})', { label: 'onUnmounted' }),
    snippetCompletion('onUpdated(() => {\n\t${1}\n})', { label: 'onUpdated' }),
    snippetCompletion('onBeforeMount(() => {\n\t${1}\n})', { label: 'onBeforeMount' }),
    snippetCompletion('onBeforeUnmount(() => {\n\t${1}\n})', { label: 'onBeforeUnmount' }),

    // 监听器
    snippetCompletion('watch(${1:source}, (${2:newValue}, ${3:oldValue}) => {\n\t${4}\n})', { label: 'watch' }),
    snippetCompletion('watchEffect(() => {\n\t${1}\n})', { label: 'watchEffect' }),

    // 组件定义
    snippetCompletion('const component = {\n\tsetup() {\n\t\t${1}\n\t\treturn {\n\t\t\t${2}\n\t\t}\n\t},\n\ttemplate: `${3}`\n}', { label: 'vue component' }),
    snippetCompletion('const component = {\n\tsetup() {\n\t\t${1}\n\t},\n\ttemplate: `${2}`\n}', { label: 'vue component simple' }),

    // 模板语法
    snippetCompletion('{{ ${1:expression} }}', { label: 'template expression' }),
    snippetCompletion('v-if="${1:condition}"', { label: 'v-if' }),
    snippetCompletion('v-show="${1:condition}"', { label: 'v-show' }),
    snippetCompletion('v-for="${1:item} in ${2:items}"', { label: 'v-for' }),
    snippetCompletion('v-for="(${1:item}, ${2:index}) in ${3:items}"', { label: 'v-for with index' }),
    snippetCompletion('v-bind:${1:prop}="${2:value}"', { label: 'v-bind' }),
    snippetCompletion(':${1:prop}="${2:value}"', { label: 'v-bind shorthand' }),
    snippetCompletion('v-on:${1:click}="${2:handler}"', { label: 'v-on' }),
    snippetCompletion('@${1:click}="${2:handler}"', { label: 'v-on shorthand' }),
    snippetCompletion('v-model="${1:value}"', { label: 'v-model' }),

    // 事件处理
    snippetCompletion('const handle${1:Event} = () => {\n\t${2}\n}', { label: 'event handler' }),
    snippetCompletion('const handle${1:Event} = (${2:event}) => {\n\t${3}\n}', { label: 'event handler with event' }),

    // 常用方法
    snippetCompletion('const ${1:methodName} = () => {\n\t${2}\n}', { label: 'method' }),
    snippetCompletion('const ${1:methodName} = async () => {\n\t${2}\n}', { label: 'async method' }),

    // 响应式更新
    snippetCompletion('${1:count}.value = ${2:newValue}', { label: 'update ref' }),
    snippetCompletion('${1:state}.${2:property} = ${3:newValue}', { label: 'update reactive' })
  ];

  return {
    from: word.from,
    options: vueSnippets,
    validFor: /\w*/
  };
};

// TypeScript 代码片段补全源
export const tsSnippetCompletionSource: CompletionSource = (context: CompletionContext) => {
  const word = context.matchBefore(/\w*/);
  if (!word || (word.from == word.to && !context.explicit)) return null;

  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);

  // 检查是否在注释或字符串中
  const inComment = /\/\*.*\*\/$/.test(beforeCursor) || /\/\/.*$/.test(beforeCursor);
  const inString = /["'`][^"'`]*$/.test(beforeCursor);

  if (inComment || inString) {
    return null;
  }

  // TypeScript 常用代码片段
  const tsSnippets = [
    // 类型定义
    snippetCompletion('type ${1:TypeName} = ${2:string}', { label: 'type alias' }),
    snippetCompletion('interface ${1:InterfaceName} {\n\t${2:property}: ${3:string}\n}', { label: 'interface' }),
    snippetCompletion('interface ${1:InterfaceName} extends ${2:BaseInterface} {\n\t${3:property}: ${4:string}\n}', { label: 'interface extends' }),
    snippetCompletion('enum ${1:EnumName} {\n\t${2:VALUE} = ${3:value}\n}', { label: 'enum' }),
    snippetCompletion('const enum ${1:EnumName} {\n\t${2:VALUE} = ${3:value}\n}', { label: 'const enum' }),

    // 泛型
    snippetCompletion('function ${1:functionName}<${2:T}>(param: ${2:T}): ${2:T} {\n\t${3}\n}', { label: 'generic function' }),
    snippetCompletion('class ${1:ClassName}<${2:T}> {\n\tprivate value: ${2:T};\n\tconstructor(value: ${2:T}) {\n\t\tthis.value = value;\n\t}\n}', { label: 'generic class' }),
    snippetCompletion('interface ${1:InterfaceName}<${2:T}> {\n\tvalue: ${2:T};\n}', { label: 'generic interface' }),

    // 类型断言和类型守卫
    snippetCompletion('const ${1:value} = ${2:expression} as ${3:string}', { label: 'type assertion' }),
    snippetCompletion('const ${1:value} = <${2:string}>${3:expression}', { label: 'type assertion angle' }),
    snippetCompletion('if (typeof ${1:value} === \'${2:string}\') {\n\t${3}\n}', { label: 'typeof guard' }),
    snippetCompletion('if (${1:value} instanceof ${2:Constructor}) {\n\t${3}\n}', { label: 'instanceof guard' }),
    snippetCompletion('function is${1:Type}(${2:value}: any): ${2:value} is ${1:Type} {\n\t${3}\n}', { label: 'type guard function' }),

    // 函数类型
    snippetCompletion('const ${1:functionName}: (${2:param}: ${3:string}) => ${4:string} = (${2:param}) => {\n\t${5}\n}', { label: 'function type annotation' }),
    snippetCompletion('type ${1:FunctionType} = (${2:param}: ${3:string}) => ${4:string}', { label: 'function type' }),
    snippetCompletion('interface ${1:InterfaceName} {\n\t${2:method}: (${3:param}: ${4:string}) => ${5:string};\n}', { label: 'method in interface' }),

    // 联合类型和交叉类型
    snippetCompletion('type ${1:UnionType} = ${2:string} | ${3:number}', { label: 'union type' }),
    snippetCompletion('type ${1:IntersectionType} = ${2:Type1} & ${3:Type2}', { label: 'intersection type' }),
    snippetCompletion('type ${1:OptionalType} = {\n\t${2:required}: ${3:string};\n\t${4:optional}?: ${5:string};\n}', { label: 'optional properties' }),

    // 映射类型
    snippetCompletion('type ${1:MappedType}<${2:T}> = {\n\t[K in keyof ${2:T}]: ${2:T}[K];\n}', { label: 'mapped type' }),
    snippetCompletion('type ${1:PartialType}<${2:T}> = Partial<${2:T}>', { label: 'partial type' }),
    snippetCompletion('type ${1:RequiredType}<${2:T}> = Required<${2:T}>', { label: 'required type' }),
    snippetCompletion('type ${1:PickType}<${2:T}, ${3:K}> = Pick<${2:T}, ${3:K}>', { label: 'pick type' }),
    snippetCompletion('type ${1:OmitType}<${2:T}, ${3:K}> = Omit<${2:T}, ${3:K}>', { label: 'omit type' }),

    // 条件类型
    snippetCompletion('type ${1:ConditionalType}<${2:T}> = ${2:T} extends ${3:string} ? ${4:true} : ${5:false}', { label: 'conditional type' }),
    snippetCompletion('type ${1:InferType}<${2:T}> = ${2:T} extends infer ${3:U} ? ${3:U} : never', { label: 'infer type' }),

    // 工具类型
    snippetCompletion('type ${1:NullableType} = ${2:string} | null | undefined', { label: 'nullable type' }),
    snippetCompletion('type ${1:ReadonlyType}<${2:T}> = Readonly<${2:T}>', { label: 'readonly type' }),
    snippetCompletion('type ${1:RecordType} = Record<${2:string}, ${3:any}>', { label: 'record type' }),

    // 模块声明
    snippetCompletion('declare module \'${1:module-name}\' {\n\t${2}\n}', { label: 'declare module' }),
    snippetCompletion('declare global {\n\t${1}\n}', { label: 'declare global' }),
    snippetCompletion('declare namespace ${1:Namespace} {\n\t${2}\n}', { label: 'declare namespace' }),

    // 装饰器
    snippetCompletion('@${1:decorator}(${2:options})\n${3:class} ${4:ClassName} {\n\t${5}\n}', { label: 'decorator class' }),
    snippetCompletion('@${1:decorator}(${2:options})\n${3:method} ${4:methodName}() {\n\t${5}\n}', { label: 'decorator method' }),

    // 异步类型
    snippetCompletion('const ${1:asyncFunction}: () => Promise<${2:string}> = async () => {\n\t${3}\n}', { label: 'async function type' }),
    snippetCompletion('type ${1:AsyncType} = Promise<${2:string}>', { label: 'promise type' }),

    // 常用模式
    snippetCompletion('const ${1:variable}: ${2:string} = ${3:value}', { label: 'typed variable' }),
    snippetCompletion('function ${1:functionName}(${2:param}: ${3:string}): ${4:string} {\n\t${5}\n}', { label: 'typed function' }),
    snippetCompletion('class ${1:ClassName} {\n\tprivate ${2:property}: ${3:string};\n\tconstructor(${2:property}: ${3:string}) {\n\t\tthis.${2:property} = ${2:property};\n\t}\n}', { label: 'typed class' })
  ];

  return {
    from: word.from,
    options: tsSnippets,
    validFor: /\w*/
  };
};

// JavaScript 自动补全（使用CodeMirror原生 + 自定义代码片段）
export const jsAutocomplete = autocompletion({
  override: [jsSnippetCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50,
  activateOnTyping: true
});

// React 自动补全
export const reactAutocomplete = autocompletion({
  override: [reactSnippetCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50,
  activateOnTyping: true
});

// Vue 自动补全
export const vueAutocomplete = autocompletion({
  override: [vueSnippetCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50,
  activateOnTyping: true
});

// TypeScript 自动补全
export const tsAutocomplete = autocompletion({
  override: [tsSnippetCompletionSource],
  defaultKeymap: true,
  maxRenderedOptions: 50
});

// 导出所有keymap供编辑器使用
export { completionKeymap, closeBracketsKeymap }; 