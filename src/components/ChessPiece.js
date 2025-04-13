import React from 'react';

const ChessPiece = ({ type, color }) => {
  const getPieceSymbol = () => {
    switch (type) {
      case 'king': return color === 'white' ? '♔' : '♚';
      case 'queen': return color === 'white' ? '♕' : '♛';
      case 'rook': return color === 'white' ? '♖' : '♜';
      case 'bishop': return color === 'white' ? '♗' : '♝';
      case 'knight': return color === 'white' ? '♘' : '♞';
      case 'pawn': return color === 'white' ? '♙' : '♟';
      default: return '';
    }
  };

  return (
    <div className={`text-4xl ${color === 'white' ? 'text-white' : 'text-black'} 
      ${color === 'white' ? 'drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]' : ''} 
      select-none`}
      style={{
        WebkitTextStroke: color === 'white' ? '1px black' : 'none',
      }}>
      {getPieceSymbol()}
    </div>
  );
};

export default ChessPiece;