import React, { useState, useEffect, useCallback } from 'react';
import ChessPiece from './ChessPiece';
import MoveHistory from './MoveHistory';
import CapturedPieces from './CapturedPieces';
import PawnPromotionDialog from './PawnPromotionDialog';
import Timer from './Timer';

const ChessBoard = () => {
  const initialBoardState = [
    ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],
    ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
  ];

  const [board, setBoard] = useState(initialBoardState);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('white');
  const [validMoves, setValidMoves] = useState([]);
  const [castlingRights, setCastlingRights] = useState({
    whiteKingMoved: false,
    whiteRookKingsideMoved: false,
    whiteRookQueensideMoved: false,
    blackKingMoved: false,
    blackRookKingsideMoved: false,
    blackRookQueensideMoved: false
  });
  const [moveHistory, setMoveHistory] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({
    white: [],
    black: []
  });
  const [promotionPawn, setPromotionPawn] = useState(null);
  const [gamePositions, setGamePositions] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timers, setTimers] = useState({
    white: 600, // 10 minutes in seconds
    black: 600
  });
  const [timeIncrement, setTimeIncrement] = useState(5); // 5 seconds increment per move

  const handleTimeExpired = useCallback((player) => {
    alert(`Time's up! ${player === 'White' ? 'Black' : 'White'} wins!`);
  }, []);

  const saveGame = () => {
    const gameState = {
      board,
      currentPlayer,
      moveHistory,
      capturedPieces,
      castlingRights,
      timers,
      timeIncrement,
      gamePositions
    };
    localStorage.setItem('chessGame', JSON.stringify(gameState));
  };

  const loadGame = () => {
    const savedGame = localStorage.getItem('chessGame');
    if (savedGame) {
      const gameState = JSON.parse(savedGame);
      setBoard(gameState.board);
      setCurrentPlayer(gameState.currentPlayer);
      setMoveHistory(gameState.moveHistory);
      setCapturedPieces(gameState.capturedPieces);
      setCastlingRights(gameState.castlingRights);
      setTimers(gameState.timers);
      setTimeIncrement(gameState.timeIncrement);
      setGamePositions(gameState.gamePositions);
      setGameStarted(true);
    }
  };

  useEffect(() => {
    let intervalId;
    if (gameStarted && currentPlayer) {
      intervalId = setInterval(() => {
        setTimers(prev => ({
          ...prev,
          [currentPlayer]: Math.max(0, prev[currentPlayer] - 1)
        }));
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [gameStarted, currentPlayer]);

  useEffect(() => {
    if (selectedPiece) {
      const moves = [];
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (isValidMove(selectedPiece.i, selectedPiece.j, i, j) && 
              !wouldMoveExposeKing(selectedPiece.i, selectedPiece.j, i, j)) {
            moves.push({ i, j });
          }
        }
      }
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [selectedPiece]);

  const findKing = (color) => {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] === 'king' && 
            ((color === 'white' && i >= 6) || (color === 'black' && i < 2))) {
          return { i, j };
        }
      }
    }
  };

  const isKingInCheck = (color) => {
    const kingPos = findKing(color);
    if (!kingPos) return false;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] && 
            ((color === 'white' && i < 2) || (color === 'black' && i >= 6))) {
          if (isValidMove(i, j, kingPos.i, kingPos.j)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const wouldMoveExposeKing = (fromI, fromJ, toI, toJ) => {
    const tempBoard = board.map(row => [...row]);
    const movingPiece = tempBoard[fromI][fromJ];
    tempBoard[toI][toJ] = movingPiece;
    tempBoard[fromI][fromJ] = null;

    const pieceColor = fromI < 2 ? 'black' : 'white';
    
    // Check if king would be in check after the move
    const kingPos = findKing(pieceColor);
    if (!kingPos) return false;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (tempBoard[i][j] && 
            ((pieceColor === 'white' && i < 2) || (pieceColor === 'black' && i >= 6))) {
          // Use a modified isValidMove that takes a board parameter
          if (isValidMoveWithBoard(i, j, kingPos.i, kingPos.j, tempBoard)) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const isValidMoveWithBoard = (fromI, fromJ, toI, toJ, currentBoard) => {
    if (fromI === toI && fromJ === toJ) return false;

    const piece = currentBoard[fromI][fromJ];
    const targetSquare = currentBoard[toI][toJ];
    const sourceColor = fromI < 2 ? 'black' : 'white';
    const targetColor = toI < 2 ? 'black' : 'white';

    if (targetSquare && sourceColor === targetColor) return false;

    switch (piece) {
      case 'pawn':
        return isValidPawnMove(fromI, fromJ, toI, toJ, sourceColor, !!targetSquare);
      case 'knight':
        return isValidKnightMove(fromI, fromJ, toI, toJ);
      case 'bishop':
        return isValidBishopMove(fromI, fromJ, toI, toJ);
      case 'rook':
        return isValidRookMove(fromI, fromJ, toI, toJ);
      case 'queen':
        return isValidQueenMove(fromI, fromJ, toI, toJ);
      case 'king':
        return isValidKingMove(fromI, fromJ, toI, toJ);
      default:
        return false;
    }
  };

  const wouldSquareBeAttacked = (i, j, color) => {
    const tempBoard = board.map(row => [...row]);
    
    for (let fromI = 0; fromI < 8; fromI++) {
      for (let fromJ = 0; fromJ < 8; fromJ++) {
        if (tempBoard[fromI][fromJ] && 
            ((color === 'white' && fromI < 2) || (color === 'black' && fromI >= 6))) {
          if (isValidMoveWithBoard(fromI, fromJ, i, j, tempBoard)) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  const getSquareNotation = (i, j) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[j] + ranks[i];
  };

  const getPieceNotation = (piece) => {
    switch (piece) {
      case 'king': return 'K';
      case 'queen': return 'Q';
      case 'rook': return 'R';
      case 'bishop': return 'B';
      case 'knight': return 'N';
      case 'pawn': return '';
      default: return '';
    }
  };

  const getMoveNotation = (fromI, fromJ, toI, toJ, piece, isCapture, isCastling) => {
    if (isCastling) {
      return toJ > fromJ ? 'O-O' : 'O-O-O';
    }

    const pieceNotation = getPieceNotation(piece);
    const captureNotation = isCapture ? 'x' : '';
    const destination = getSquareNotation(toI, toJ);
    
    if (piece === 'pawn' && isCapture) {
      return getSquareNotation(fromI, fromJ)[0] + captureNotation + destination;
    }
    
    return pieceNotation + captureNotation + destination;
  };

  const isInsufficientMaterial = () => {
    const pieces = {
      white: { bishops: [], knights: 0 },
      black: { bishops: [], knights: 0 }
    };

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        const color = i < 2 ? 'black' : 'white';
        
        switch (piece) {
          case 'pawn':
          case 'rook':
          case 'queen':
            return false;
          case 'knight':
            pieces[color].knights++;
            if (pieces[color].knights > 1) return false;
            break;
          case 'bishop':
            pieces[color].bishops.push((i + j) % 2);
            break;
          default:
            break;
        }
      }
    }

    // King vs King
    if (pieces.white.knights === 0 && pieces.white.bishops.length === 0 &&
        pieces.black.knights === 0 && pieces.black.bishops.length === 0) {
      return true;
    }

    // King and Bishop vs King
    if ((pieces.white.knights === 0 && pieces.white.bishops.length === 1 &&
         pieces.black.knights === 0 && pieces.black.bishops.length === 0) ||
        (pieces.white.knights === 0 && pieces.white.bishops.length === 0 &&
         pieces.black.knights === 0 && pieces.black.bishops.length === 1)) {
      return true;
    }

    // King and Knight vs King
    if ((pieces.white.knights === 1 && pieces.white.bishops.length === 0 &&
         pieces.black.knights === 0 && pieces.black.bishops.length === 0) ||
        (pieces.white.knights === 0 && pieces.white.bishops.length === 0 &&
         pieces.black.knights === 1 && pieces.black.bishops.length === 0)) {
      return true;
    }

    return false;
  };

  const isStalemate = (color) => {
    if (isKingInCheck(color)) return false;

    // Check if the player has any legal moves
    for (let fromI = 0; fromI < 8; fromI++) {
      for (let fromJ = 0; fromJ < 8; fromJ++) {
        const piece = board[fromI][fromJ];
        if (piece && ((color === 'white' && fromI >= 6) || 
                     (color === 'black' && fromI < 2))) {
          for (let toI = 0; toI < 8; toI++) {
            for (let toJ = 0; toJ < 8; toJ++) {
              if (isValidMove(fromI, fromJ, toI, toJ) && 
                  !wouldMoveExposeKing(fromI, fromJ, toI, toJ)) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  };

  const isThreefoldRepetition = () => {
    const currentPosition = JSON.stringify(board);
    const positionCount = gamePositions.filter(pos => pos === currentPosition).length;
    return positionCount >= 3;
  };

  const handlePawnPromotion = (piece) => {
    if (!promotionPawn) return;

    const { i, j } = promotionPawn;
    const newBoard = board.map(row => [...row]);
    newBoard[i][j] = piece;
    setBoard(newBoard);
    setPromotionPawn(null);

    // Add position to history after promotion
    setGamePositions(prev => [...prev, JSON.stringify(newBoard)]);
  };

  const handleSquareClick = (i, j) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (!selectedPiece) {
      const piece = board[i][j];
      const pieceColor = i < 2 ? 'black' : 'white';
      if (piece && pieceColor === currentPlayer) {
        setSelectedPiece({ i, j, piece });
      }
    } else {
      if (isValidMove(selectedPiece.i, selectedPiece.j, i, j)) {
        if (!wouldMoveExposeKing(selectedPiece.i, selectedPiece.j, i, j)) {
          // Add time increment after successful move
          setTimers(prev => ({
            ...prev,
            [currentPlayer]: prev[currentPlayer] + timeIncrement
          }));

          const newBoard = board.map(row => [...row]);
          const newCastlingRights = { ...castlingRights };
          const targetPiece = board[i][j];
          const isCastling = selectedPiece.piece === 'king' && Math.abs(j - selectedPiece.j) === 2;

          // Handle pawn promotion
          if (selectedPiece.piece === 'pawn' && (i === 0 || i === 7)) {
            setPromotionPawn({ i, j });
            setSelectedPiece(null);
            return;
          }

          // Update castling rights
          if (selectedPiece.piece === 'king') {
            if (selectedPiece.i === 7) {
              newCastlingRights.whiteKingMoved = true;
            } else if (selectedPiece.i === 0) {
              newCastlingRights.blackKingMoved = true;
            }

            // Handle castling move
            if (Math.abs(j - selectedPiece.j) === 2) {
              const isKingside = j > selectedPiece.j;
              const row = selectedPiece.i;
              const rookFromJ = isKingside ? 7 : 0;
              const rookToJ = isKingside ? 5 : 3;
              
              // Move the rook
              newBoard[row][rookToJ] = 'rook';
              newBoard[row][rookFromJ] = null;
            }
          }

          // Update rook movement for castling rights
          if (selectedPiece.piece === 'rook') {
            if (selectedPiece.i === 7) {
              if (selectedPiece.j === 0) newCastlingRights.whiteRookQueensideMoved = true;
              if (selectedPiece.j === 7) newCastlingRights.whiteRookKingsideMoved = true;
            } else if (selectedPiece.i === 0) {
              if (selectedPiece.j === 0) newCastlingRights.blackRookQueensideMoved = true;
              if (selectedPiece.j === 7) newCastlingRights.blackRookKingsideMoved = true;
            }
          }

          // Track captured pieces
          if (targetPiece) {
            const capturedColor = currentPlayer === 'white' ? 'black' : 'white';
            setCapturedPieces(prev => ({
              ...prev,
              [capturedColor]: [...prev[capturedColor], targetPiece]
            }));
          }

          // Update move history
          const moveNotation = getMoveNotation(
            selectedPiece.i,
            selectedPiece.j,
            i,
            j,
            selectedPiece.piece,
            !!targetPiece,
            isCastling
          );
          setMoveHistory(prev => [...prev, moveNotation]);

          // Handle regular piece movement
          newBoard[i][j] = selectedPiece.piece;
          newBoard[selectedPiece.i][selectedPiece.j] = null;

          setBoard(newBoard);
          setCastlingRights(newCastlingRights);
          
          const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
          setCurrentPlayer(nextPlayer);

          // Add position to history after move
          setGamePositions(prev => [...prev, JSON.stringify(newBoard)]);

          // Check draw conditions
          if (isStalemate(nextPlayer)) {
            alert('Stalemate! The game is a draw.');
          } else if (isInsufficientMaterial()) {
            alert('Draw by insufficient material!');
          } else if (isThreefoldRepetition()) {
            alert('Draw by threefold repetition!');
          } else if (isOpponentInCheckmate(nextPlayer)) {
            setMoveHistory(prev => [...prev, moveNotation + '#']);
            alert(`Checkmate! ${currentPlayer} wins!`);
          } else if (isKingInCheck(nextPlayer)) {
            setMoveHistory(prev => [...prev, moveNotation + '+']);
            alert(`Check!`);
          }
        }
      }
      setSelectedPiece(null);
    }
  };

  const isOpponentInCheckmate = (opponentColor) => {
    if (!isKingInCheck(opponentColor)) return false;

    for (let fromI = 0; fromI < 8; fromI++) {
      for (let fromJ = 0; fromJ < 8; fromJ++) {
        const piece = board[fromI][fromJ];
        if (piece && ((opponentColor === 'white' && fromI >= 6) || 
                     (opponentColor === 'black' && fromI < 2))) {
          for (let toI = 0; toI < 8; toI++) {
            for (let toJ = 0; toJ < 8; toJ++) {
              if (isValidMove(fromI, fromJ, toI, toJ) && 
                  !wouldMoveExposeKing(fromI, fromJ, toI, toJ)) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  };

  const isValidMove = (fromI, fromJ, toI, toJ) => {
    if (fromI === toI && fromJ === toJ) return false;

    const piece = board[fromI][fromJ];
    const targetSquare = board[toI][toJ];
    const sourceColor = fromI < 2 ? 'black' : 'white';
    const targetColor = toI < 2 ? 'black' : 'white';

    if (targetSquare && sourceColor === targetColor) return false;

    switch (piece) {
      case 'pawn':
        return isValidPawnMove(fromI, fromJ, toI, toJ, sourceColor, !!targetSquare);
      case 'knight':
        return isValidKnightMove(fromI, fromJ, toI, toJ);
      case 'bishop':
        return isValidBishopMove(fromI, fromJ, toI, toJ);
      case 'rook':
        return isValidRookMove(fromI, fromJ, toI, toJ);
      case 'queen':
        return isValidQueenMove(fromI, fromJ, toI, toJ);
      case 'king':
        return isValidKingMove(fromI, fromJ, toI, toJ);
      default:
        return false;
    }
  };

  const isPathClear = (fromI, fromJ, toI, toJ, isDiagonal = false) => {
    const iStep = Math.sign(toI - fromI);
    const jStep = Math.sign(toJ - fromJ);
    let currentI = fromI + iStep;
    let currentJ = fromJ + jStep;

    while (isDiagonal ? (currentI !== toI && currentJ !== toJ) : (currentI !== toI || currentJ !== toJ)) {
      if (board[currentI][currentJ]) return false;
      currentI += iStep;
      currentJ += jStep;
    }
    return true;
  };

  const isValidPawnMove = (fromI, fromJ, toI, toJ, color, isCapture) => {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    if (isCapture) {
      return (toI === fromI + direction) && Math.abs(toJ - fromJ) === 1;
    }

    if (fromJ !== toJ) return false;

    if (fromI === startRow) {
      return (toI === fromI + direction || toI === fromI + 2 * direction) && isPathClear(fromI, fromJ, toI, toJ);
    }

    return toI === fromI + direction;
  };

  const isValidKnightMove = (fromI, fromJ, toI, toJ) => {
    const iDiff = Math.abs(toI - fromI);
    const jDiff = Math.abs(toJ - fromJ);
    return (iDiff === 2 && jDiff === 1) || (iDiff === 1 && jDiff === 2);
  };

  const isValidBishopMove = (fromI, fromJ, toI, toJ) => {
    const iDiff = Math.abs(toI - fromI);
    const jDiff = Math.abs(toJ - fromJ);
    return iDiff === jDiff && isPathClear(fromI, fromJ, toI, toJ, true);
  };

  const isValidRookMove = (fromI, fromJ, toI, toJ) => {
    return ((fromI === toI || fromJ === toJ) && 
            isPathClear(fromI, fromJ, toI, toJ));
  };

  const isValidQueenMove = (fromI, fromJ, toI, toJ) => {
    const iDiff = Math.abs(toI - fromI);
    const jDiff = Math.abs(toJ - fromJ);
    
    if (iDiff === jDiff) {
      return isPathClear(fromI, fromJ, toI, toJ, true);
    }
    
    if (fromI === toI || fromJ === toJ) {
      return isPathClear(fromI, fromJ, toI, toJ);
    }
    
    return false;
  };

  const isValidKingMove = (fromI, fromJ, toI, toJ) => {
    const iDiff = Math.abs(toI - fromI);
    const jDiff = Math.abs(toJ - fromJ);
    
    // Normal king move
    if (iDiff <= 1 && jDiff <= 1) return true;
    
    // Castling
    if (iDiff === 0 && jDiff === 2) {
      const isWhiteKing = fromI === 7;
      const isKingside = toJ > fromJ;
      
      // Check if castling is allowed
      if (isWhiteKing) {
        if (castlingRights.whiteKingMoved) return false;
        if (isKingside && castlingRights.whiteRookKingsideMoved) return false;
        if (!isKingside && castlingRights.whiteRookQueensideMoved) return false;
      } else {
        if (castlingRights.blackKingMoved) return false;
        if (isKingside && castlingRights.blackRookKingsideMoved) return false;
        if (!isKingside && castlingRights.blackRookQueensideMoved) return false;
      }
      
      // Check if path is clear
      const row = fromI;
      const rookJ = isKingside ? 7 : 0;
      const pathStart = isKingside ? fromJ + 1 : 1;
      const pathEnd = isKingside ? 6 : fromJ - 1;
      
      for (let j = pathStart; j <= pathEnd; j++) {
        if (board[row][j]) return false;
      }
      
      // Check if king passes through check
      const middleJ = fromJ + (isKingside ? 1 : -1);
      if (wouldSquareBeAttacked(row, middleJ, isWhiteKing ? 'white' : 'black') ||
          wouldSquareBeAttacked(row, toJ, isWhiteKing ? 'white' : 'black')) {
        return false;
      }
      
      return true;
    }
    
    return false;
  };

  const renderSquare = (i, j) => {
    const isEven = (i + j) % 2 === 0;
    const piece = board[i][j];
    const pieceColor = i < 2 ? 'black' : 'white';
    const isSelected = selectedPiece && selectedPiece.i === i && selectedPiece.j === j;
    const isValidMoveSquare = validMoves.some(move => move.i === i && move.j === j);
    const isCheck = piece === 'king' && 
                   ((pieceColor === 'white' && isKingInCheck('white')) ||
                    (pieceColor === 'black' && isKingInCheck('black')));

    return (
      <div 
        key={`${i}-${j}`}
        className={`w-16 h-16 ${isEven ? 'bg-white' : 'bg-gray-600'} 
          ${isSelected ? 'ring-2 ring-blue-500' : ''} 
          ${isValidMoveSquare ? 'ring-2 ring-green-400' : ''}
          ${isValidMoveSquare && board[i][j] ? 'ring-2 ring-red-500' : ''}
          ${isCheck ? 'ring-2 ring-red-600' : ''}
          relative flex items-center justify-center cursor-pointer`}
        onClick={() => handleSquareClick(i, j)}
      >
        {isValidMoveSquare && !piece && (
          <div className="absolute w-3 h-3 bg-green-400 rounded-full opacity-50" />
        )}
        {piece && <ChessPiece type={piece} color={pieceColor} />}
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-8 border-2 border-gray-800">
          {[...Array(8)].map((_, i) => (
            [...Array(8)].map((_, j) => renderSquare(i, j))
          ))}
        </div>
        <div className="flex justify-between gap-4">
          <Timer 
            player="Black" 
            isActive={gameStarted && currentPlayer === 'black'}
            timeLeft={timers.black}
            increment={timeIncrement}
            onTimeExpired={handleTimeExpired}
          />
          <Timer 
            player="White" 
            isActive={gameStarted && currentPlayer === 'white'}
            timeLeft={timers.white}
            increment={timeIncrement}
            onTimeExpired={handleTimeExpired}
          />
        </div>
        <div className="flex justify-between gap-2">
          <button
            onClick={saveGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Game
          </button>
          <button
            onClick={loadGame}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Load Game
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <MoveHistory moves={moveHistory} />
        <div className="flex flex-col gap-2">
          <CapturedPieces pieces={capturedPieces.black} color="black" />
          <CapturedPieces pieces={capturedPieces.white} color="white" />
        </div>
      </div>
      <PawnPromotionDialog
        isOpen={!!promotionPawn}
        color={currentPlayer}
        onSelect={handlePawnPromotion}
        onClose={() => setPromotionPawn(null)}
      />
    </div>
  );
};

export default ChessBoard;