import React from 'react';

const MoveHistory = ({ moves }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">Move History</h2>
      <div className="h-48 overflow-y-auto">
        {moves.map((move, index) => (
          <div key={index} className="flex mb-1">
            <span className="w-8 text-gray-500">{Math.floor(index / 2) + 1}.</span>
            <span className="flex-1">{move}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveHistory;