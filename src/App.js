import React from 'react';
import ChessBoard from './components/ChessBoard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Chess</h1>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <ChessBoard />
      </div>
    </div>
  );
}

export default App;
