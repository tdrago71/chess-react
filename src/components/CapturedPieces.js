import React from 'react';
import ChessPiece from './ChessPiece';

const CapturedPieces = ({ pieces, color }) => {
  if (pieces.length === 0) return null;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">{color.charAt(0).toUpperCase() + color.slice(1)} Captures</h2>
      <div className="flex flex-wrap gap-1">
        {pieces.map((piece, index) => (
          <div key={index} className="w-8 h-8 flex items-center justify-center">
            <ChessPiece type={piece} color={color} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CapturedPieces;