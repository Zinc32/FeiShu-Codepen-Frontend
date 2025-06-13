import React, { useState } from 'react';
import styled from '@emotion/styled';
import Editor from '../components/Editor';
import Preview from '../components/Preview';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
  gap: 1px;
  background: #1e1e1e;
`;

const EditorsContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
`;

const EditorSection = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #2d2d2d;
  color: #fff;
`;

const EditorTitle = styled.h3`
  margin: 0;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
`;

const EditorContent = styled.div`
  flex: 1;
  overflow: auto;
  background: #fff;
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #bbb;
  }
`;

const PreviewSection = styled.div`
  background: white;
  overflow: auto;
`;

const EditorPage: React.FC = () => {
  const [html, setHtml] = useState('<div>Hello World!</div>');
  const [css, setCss] = useState('div { color: blue; }');
  const [js, setJs] = useState('console.log("Hello from JavaScript!");');

  return (
    <Container>
      <EditorsContainer>
        <EditorSection>
          <EditorHeader>
            <EditorTitle>HTML</EditorTitle>
          </EditorHeader>
          <EditorContent>
            <Editor
              value={html}
              language="html"
              onChange={setHtml}
            />
          </EditorContent>
        </EditorSection>

        <EditorSection>
          <EditorHeader>
            <EditorTitle>CSS</EditorTitle>
          </EditorHeader>
          <EditorContent>
            <Editor
              value={css}
              language="css"
              onChange={setCss}
            />
          </EditorContent>
        </EditorSection>

        <EditorSection>
          <EditorHeader>
            <EditorTitle>JavaScript</EditorTitle>
          </EditorHeader>
          <EditorContent>
            <Editor
              value={js}
              language="javascript"
              onChange={setJs}
            />
          </EditorContent>
        </EditorSection>
      </EditorsContainer>

      <PreviewSection>
        <Preview html={html} css={css} js={js} />
      </PreviewSection>
    </Container>
  );
};

export default EditorPage; 