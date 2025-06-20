import styled from "@emotion/styled";

// Main layout containers
export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f6f8fa;
`;

export const Container = styled.div`
  display: flex;
  flex: 1;
  background-color: #f6f8fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", sans-serif;
`;

export const PreviewContainer = styled.div`
  flex: 1;
  background-color: white;
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
`;

// Editor-specific containers
export const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e1e4e8;
  background-color: #ffffff;
  height: 100%;
  overflow: hidden;

  .cm-editor {
    height: 100%;
    max-height: 100%;
    overflow: auto;
    transform: translateZ(0);
    font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
      "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important;
    font-size: 13px !important;
    font-weight: normal !important;
    line-height: 1.3 !important;
    font-variant-ligatures: none !important;
    text-rendering: auto !important;
    -webkit-font-smoothing: auto !important;
    -moz-osx-font-smoothing: auto !important;
    letter-spacing: 0 !important;
    will-change: transform;
  }

  .cm-scroller {
    overflow: auto !important;
    max-height: 100% !important;
  }

  .cm-gutters {
    background-color: #f8f8f8;
    border-right: 1px solid #e8e8e8;
    color: #858585;
  }

  .cm-lineNumbers {
    min-width: 3ch;
    text-align: right;
    padding-right: 16px;
    font-size: 12px !important;
    font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
      "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important;
    font-weight: normal !important;
    letter-spacing: 0 !important;
  }

  .cm-lineNumbers .cm-gutterElement {
    color: #858585;
    font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
      "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important;
    font-size: 12px !important;
    font-weight: normal !important;
    line-height: 1.3 !important;
    letter-spacing: 0 !important;
  }

  .cm-content {
    background-color: #ffffff;
    caret-color: #0366d6;
    padding: 12px 16px;
    font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
      "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important;
    font-size: 13px !important;
    font-weight: normal !important;
    line-height: 1.3 !important;
    letter-spacing: 0 !important;
    text-rendering: auto !important;
    -webkit-font-smoothing: auto !important;
    -moz-osx-font-smoothing: auto !important;
    font-variant-ligatures: none !important;
  }

  /* 改善文本选中效果 */
  .cm-editor .cm-selectionBackground {
    background-color: #c8e1ff !important;
    opacity: 0.8 !important;
  }

  .cm-editor.cm-focused .cm-selectionBackground {
    background-color: #b3d4fc !important;
    opacity: 1 !important;
  }

  /* 强制覆盖 CodeMirror 默认选中样式 */
  .cm-editor .cm-content ::selection {
    background-color: #b3d4fc !important;
    color: inherit !important;
  }

  .cm-editor .cm-content ::-moz-selection {
    background-color: #b3d4fc !important;
    color: inherit !important;
  }

  /* 确保选中层在正确的层级 */
  .cm-editor .cm-selectionLayer {
    z-index: -1 !important;
  }

  /* 改善拖拽选择的视觉效果 */
  .cm-editor .cm-selectionMatch {
    background-color: #fff2cc !important;
  }

  /* 改善当前行高亮 */
  .cm-activeLine {
    background-color: #f6f8fa !important;
  }

  /* 改善光标线 */
  .cm-cursor {
    border-left-color: #0366d6 !important;
    border-left-width: 2px !important;
  }

  /* 改善搜索匹配高亮 */
  .cm-searchMatch {
    background-color: #fff2cc;
    border: 1px solid #e6cc80;
  }

  .cm-searchMatch.cm-searchMatch-selected {
    background-color: #ffd54f;
    border: 1px solid #ffb300;
  }

  /* 改善括号匹配 */
  .cm-matchingBracket {
    background-color: #e8f5e8;
    border: 1px solid #34d058;
    border-radius: 2px;
  }

  /* 改善折叠区域 */
  .cm-foldGutter .cm-gutterElement {
    text-align: center;
    color: #6a737d;
  }

  .cm-foldGutter .cm-gutterElement:hover {
    background-color: #f1f8ff;
    color: #0366d6;
  }

  /* 强制应用等宽字体到所有CodeMirror元素 */
  .cm-editor * {
    font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
      "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important;
  }

  .cm-editor .cm-line,
  .cm-editor .cm-content,
  .cm-editor .cm-gutters,
  .cm-editor .cm-lineNumbers,
  .cm-editor .cm-gutterElement {
    font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
      "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important;
    font-size: 13px !important;
    font-weight: normal !important;
    line-height: 1.3 !important;
    letter-spacing: 0 !important;
    font-variant-ligatures: none !important;
  }

  /* 特别针对语法高亮的元素 */
  .cm-editor .tok-keyword,
  .cm-editor .tok-string,
  .cm-editor .tok-comment,
  .cm-editor .tok-number,
  .cm-editor .tok-operator,
  .cm-editor .tok-punctuation,
  .cm-editor .tok-bracket,
  .cm-editor .tok-tag,
  .cm-editor .tok-attribute,
  .cm-editor .tok-property,
  .cm-editor .tok-value,
  .cm-editor .tok-variableName,
  .cm-editor .tok-typeName,
  .cm-editor .tok-className,
  .cm-editor .tok-function,
  .cm-editor .tok-literal,
  .cm-editor .tok-escape,
  .cm-editor .tok-invalid {
    font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
      "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important;
    font-size: 13px !important;
    font-weight: normal !important;
    line-height: 1.3 !important;
    letter-spacing: 0 !important;
    font-variant-ligatures: none !important;
  }

  /* 强制应用到所有可能的子元素 */
  .cm-editor span,
  .cm-editor div,
  .cm-editor pre {
    font-family: "Consolas", "Monaco", "Lucida Console", "Liberation Mono",
      "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Courier New", monospace !important;
    font-size: 13px !important;
    font-weight: normal !important;
    line-height: 1.3 !important;
    letter-spacing: 0 !important;
    font-variant-ligatures: none !important;
  }
`;

// Header components
export const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  color: white;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 80px;

  @media (max-width: 1024px) {
    padding: 18px 20px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px 20px;
    min-height: auto;
  }
`;

export const EditorTitle = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 16px;
  min-width: 120px;
  max-width: 220px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    outline: none;
    border-color: #0366d6;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
    transform: translateY(-1px);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }
`;

export const EditorActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

// Button components
export const Button = styled.button`
  padding: 10px 18px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 90px;
  white-space: nowrap;

  &:hover {
    background: linear-gradient(135deg, #218838 0%, #1ea085 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

export const BackButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

export const DeleteButton = styled.button`
  padding: 10px 18px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 110px;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

export const ShareButton = styled(Button)`
  background-color: #4caf50;
  &:hover {
    background-color: #45a049;
  }
`;

// Form controls
export const Select = styled.select`
  padding: 10px 14px;
  background: linear-gradient(135deg, #495057 0%, #343a40 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 140px;
  max-width: 140px;
  height: 44px;

  &:hover {
    background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
  }

  option {
    background-color: #343a40;
    color: white;
    padding: 8px;
  }
`;

export const LanguageSelect = styled.select`
  padding: 4px 12px;
  background: linear-gradient(135deg, #495057 0%, #343a40 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    sans-serif;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  max-width: 120px;
  height: 28px;

  &:hover {
    background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
  }

  option {
    background-color: #343a40;
    color: white;
    padding: 8px;
  }
`;

// Modal components
export const ShareModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 400px;
`;

export const ShareInput = styled.input`
  width: 100%;
  padding: 8px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

export const ShareTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #333;
`;

export const ShareClose = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  &:hover {
    color: #333;
  }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

export const Toast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1000;
  animation: fadeInOut 2s ease-in-out;

  @keyframes fadeInOut {
    0% {
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    85% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`;
