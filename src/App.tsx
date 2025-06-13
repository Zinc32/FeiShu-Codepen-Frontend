import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import styled from '@emotion/styled';

const AppContainer = styled.div`
  height: 100vh;
  margin: 0;
  padding: 0;
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Routes>
          <Route path="/" element={<EditorPage />} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

export default App;
