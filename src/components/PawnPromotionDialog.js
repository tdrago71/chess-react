import React from 'react';
import ChessPiece from './ChessPiece';

const PawnPromotionDialog = ({ isOpen, color, onSelect, onClose }) => {
  if (!isOpen) return null;

  const pieces = ['queen', 'rook', 'bishop', 'knight'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Choose Promotion Piece</h2>
        <div className="flex gap-4">
          {pieces.map((piece) => (
            <button
              key={piece}
              className="w-16 h-16 border rounded hover:bg-gray-100 flex items-center justify-center"
              onClick={() => {
                onSelect(piece);
                onClose();
              }}
            >
              <ChessPiece type={piece} color={color} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PawnPromotionDialog;