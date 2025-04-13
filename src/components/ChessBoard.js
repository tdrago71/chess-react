import React, { useState, useEffect, useCallback } from 'react';
import ChessPiece from './ChessPiece';
import MoveHistory from './MoveHistory';
import CapturedPieces from './CapturedPieces';
import PawnPromotionDialog from './PawnPromotionDialog';
import Timer from './Timer';

const ChessBoard = () => {
  const initialBoardState = [
    [
      { type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, 
      { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, 
      { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }
    ],
    [
      { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, 
      { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }, 
      { type: 'pawn', color: 'black' }, { type: 'pawn', color: 'black' }
    ],
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    [
      { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, 
      { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }, 
      { type: 'pawn', color: 'white' }, { type: 'pawn', color: 'white' }
    ],
    [
      { type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, 
      { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, 
      { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }
    ]
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
  const [lastDoublePawnMove, setLastDoublePawnMove] = useState(null);
  const [enPassantAvailable, setEnPassantAvailable] = useState(false);
  const [moveStack, setMoveStack] = useState([]); // For undo/redo
  const [redoStack, setRedoStack] = useState([]); // For undo/redo

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
      gamePositions,
      lastDoublePawnMove,
      enPassantAvailable
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
      setLastDoublePawnMove(gameState.lastDoublePawnMove);
      setEnPassantAvailable(gameState.enPassantAvailable);
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

  // Additional logging to help debug en passant
  useEffect(() => {
    if (lastDoublePawnMove) {
      // Additional logic for debugging or visualizing en passant state can go here if needed
    }
  }, [lastDoublePawnMove, enPassantAvailable]);

  const findKing = (color) => {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] && board[i][j].type === 'king' && board[i][j].color === color) {
          return { i, j };
        }
      }
    }
    return null;
  };

  const isKingInCheck = (color) => {
    const kingPos = findKing(color);
    if (!kingPos) return false;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (board[i][j] && board[i][j].color !== color) {
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

    const pieceColor = movingPiece ? movingPiece.color : null;
    
    // Check if king would be in check after the move
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if (tempBoard[i][j] && 
            tempBoard[i][j].type === 'king' &&
            tempBoard[i][j].color === pieceColor) {
          // Found our king
          for (let attackI = 0; attackI < 8; attackI++) {
            for (let attackJ = 0; attackJ < 8; attackJ++) {
              if (tempBoard[attackI][attackJ] && 
                  tempBoard[attackI][attackJ].color !== pieceColor &&
                  isValidMoveWithBoard(attackI, attackJ, i, j, tempBoard)) {
                return true;
              }
            }
          }
          return false;
        }
      }
    }
    return false;
  };

  const isValidMoveWithBoard = (fromI, fromJ, toI, toJ, currentBoard) => {
    if (fromI === toI && fromJ === toJ) return false;

    const piece = currentBoard[fromI][fromJ];
    const targetSquare = currentBoard[toI][toJ];
    const sourceColor = fromI <= 1 ? 'black' : fromI >= 6 ? 'white' : null;
    const targetColor = toI <= 1 ? 'black' : toI >= 6 ? 'white' : null;

    if (targetSquare && sourceColor === targetColor) return false;

    switch (piece.type) {
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
    switch (piece.type) {
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
    
    if (piece.type === 'pawn' && isCapture) {
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
        
        switch (piece.type) {
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
        if (piece && piece.color === color) {
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

  const handlePawnPromotion = (promotedPieceType) => {
    if (!promotionPawn) return;

    const { i, j, fromI, fromJ, boardBeforePromotion, undoState, isCapture, isEnPassant } = promotionPawn;
    const newBoard = JSON.parse(JSON.stringify(boardBeforePromotion));

    newBoard[i][j] = { type: promotedPieceType, color: currentPlayer };
    setBoard(newBoard);

    let baseMoveNotation = getMoveNotation(
        fromI, fromJ, i, j,
        { type: 'pawn', color: currentPlayer },
        isCapture,
        false
    );
    if (isEnPassant) { baseMoveNotation += ' e.p.'; }
    const finalMoveNotation = baseMoveNotation + '=' + getPieceNotation({ type: promotedPieceType });

    undoState.moveNotation = finalMoveNotation;
    setMoveStack(prev => [...prev, undoState]);

    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
    setCurrentPlayer(nextPlayer);

    setGamePositions(prev => [...prev, JSON.stringify(newBoard)]);

    let checkStatus = '';
    if (isOpponentInCheckmate(nextPlayer)) {
      checkStatus = '#';
      alert(`Checkmate! ${currentPlayer} wins!`);
    } else if (isStalemate(nextPlayer)) {
      alert('Stalemate! The game is a draw.');
    } else if (isInsufficientMaterial()) {
      alert('Draw by insufficient material!');
    } else if (isThreefoldRepetition()) {
      alert('Draw by threefold repetition!');
    } else if (isKingInCheck(nextPlayer)) {
      checkStatus = '+';
      alert(`Check!`);
    }
    setMoveHistory(prev => [...prev, finalMoveNotation + checkStatus]);

    setPromotionPawn(null);
  };

  const getPieceColor = (i, j) => {
    const piece = board[i][j];
    if (!piece) return null;
    return piece.color;
  };

  const undoMove = () => {
    if (moveStack.length === 0) return;

    const lastMove = moveStack[moveStack.length - 1];
    
    // Add to redo stack (do this before changing state)
    setRedoStack(prev => [...prev, {
      board: board,
      currentPlayer,
      capturedPieces,
      castlingRights,
      lastDoublePawnMove,
      enPassantAvailable,
      moveNotation: moveHistory[moveHistory.length - 1],
      timers
    }]);
    
    // Apply the previous state
    setBoard(lastMove.board);
    setCurrentPlayer(lastMove.currentPlayer);
    setMoveHistory(prev => prev.slice(0, -1));
    setCapturedPieces(lastMove.capturedPieces);
    setCastlingRights(lastMove.castlingRights);
    setLastDoublePawnMove(lastMove.lastDoublePawnMove);
    setEnPassantAvailable(lastMove.enPassantAvailable);
    setGamePositions(prev => prev.slice(0, -1));
    setTimers(lastMove.timers);
    
    // Remove from move stack
    setMoveStack(prev => prev.slice(0, -1));
  };

  const redoMove = () => {
    if (redoStack.length === 0) return;

    const nextMove = redoStack[redoStack.length - 1];
    
    // Add back to move stack (do this before changing state)
    setMoveStack(prev => [...prev, {
      board,
      currentPlayer,
      capturedPieces,
      castlingRights,
      lastDoublePawnMove,
      enPassantAvailable,
      moveNotation: nextMove.moveNotation,
      timers
    }]);
    
    // Apply the next state
    setBoard(nextMove.board);
    setCurrentPlayer(nextMove.currentPlayer);
    setMoveHistory(prev => [...prev, nextMove.moveNotation]);
    setCapturedPieces(nextMove.capturedPieces);
    setCastlingRights(nextMove.castlingRights);
    setLastDoublePawnMove(nextMove.lastDoublePawnMove);
    setEnPassantAvailable(nextMove.enPassantAvailable);
    setGamePositions(prev => [...prev, JSON.stringify(nextMove.board)]);
    setTimers(nextMove.timers);
    
    // Remove from redo stack
    setRedoStack(prev => prev.slice(0, -1));
  };

  const handleSquareClick = (i, j) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (!selectedPiece) {
      const piece = board[i][j];
      const pieceColor = getPieceColor(i, j);
      if (piece && pieceColor === currentPlayer) {
        setSelectedPiece({ i, j, piece: piece.type });
      }
    } else {
      if (isValidMove(selectedPiece.i, selectedPiece.j, i, j)) {
        if (!wouldMoveExposeKing(selectedPiece.i, selectedPiece.j, i, j)) {
          // 1. Prepare state copies
          const newBoard = JSON.parse(JSON.stringify(board));
          const newCastlingRights = { ...castlingRights };
          // Get the actual piece object from the *current* board state before modification
          const movingPiece = board[selectedPiece.i][selectedPiece.j];
          const targetPiece = board[i][j]; // Direct capture target from current board
          const currentTimers = { ...timers }; // Copy timers before potential increment

          // 2. Determine move type (en passant, castling)
          let isEnPassant = false;
          let capturedPawnPosition = null;
          const direction = currentPlayer === 'white' ? -1 : 1;
          // Check if the validated move to (i, j) matches en passant conditions
          if (movingPiece.type === 'pawn' && !targetPiece && Math.abs(j - selectedPiece.j) === 1 &&
              enPassantAvailable && lastDoublePawnMove &&
              i === lastDoublePawnMove.destI + direction && j === lastDoublePawnMove.destJ) {
            isEnPassant = true;
            capturedPawnPosition = { i: lastDoublePawnMove.destI, j: lastDoublePawnMove.destJ };
          }
          const isCastling = movingPiece.type === 'king' && Math.abs(j - selectedPiece.j) === 2;

          // --- Save state for undo BEFORE making changes ---
          const undoState = {
            board: JSON.parse(JSON.stringify(board)), // Board before move
            currentPlayer,
            capturedPieces: JSON.parse(JSON.stringify(capturedPieces)),
            castlingRights: {...castlingRights},
            lastDoublePawnMove: lastDoublePawnMove ? { ...lastDoublePawnMove } : null,
            enPassantAvailable,
            timers: {...timers} // Timers before increment
            // moveNotation will be added later
          };

          // 3. Apply time increment
          const updatedTimers = {
              ...currentTimers,
              [currentPlayer]: currentTimers[currentPlayer] + timeIncrement
          };
          setTimers(updatedTimers); // Update timers state

          // 4. Move the piece in the newBoard copy
          newBoard[i][j] = movingPiece; // Use the piece object captured earlier
          newBoard[selectedPiece.i][selectedPiece.j] = null;

          // 5. Handle special move effects (en passant capture, castling rook move)
          let capturedPieceType = null;
          if (isEnPassant) {
            capturedPieceType = 'pawn'; // The piece type captured via en passant is always a pawn
            if (capturedPawnPosition) {
              // Remove the actual captured pawn from the board copy
              newBoard[capturedPawnPosition.i][capturedPawnPosition.j] = null;
            }
          } else if (targetPiece) {
            capturedPieceType = targetPiece.type; // Direct capture
          }

          if (isCastling) {
            const isKingside = j > selectedPiece.j;
            const row = selectedPiece.i;
            const rookFromJ = isKingside ? 7 : 0;
            const rookToJ = isKingside ? 5 : 3;
            // Move the rook in the newBoard copy
            newBoard[row][rookToJ] = newBoard[row][rookFromJ]; // Should copy the actual rook object
            newBoard[row][rookFromJ] = null;
          }

          // 6. Update captured pieces state
          if (capturedPieceType) {
            const capturedColor = currentPlayer === 'white' ? 'black' : 'white';
            setCapturedPieces(prev => ({
              ...prev,
              [capturedColor]: [...prev[capturedColor], capturedPieceType]
            }));
          }

          // 7. Update castling rights state
          if (movingPiece.type === 'king') {
             if (currentPlayer === 'white') newCastlingRights.whiteKingMoved = true;
             else newCastlingRights.blackKingMoved = true;
          } else if (movingPiece.type === 'rook') {
             // Use selectedPiece coords as 'from' coords
             if (currentPlayer === 'white' && selectedPiece.i === 7) {
                 if (selectedPiece.j === 0) newCastlingRights.whiteRookQueensideMoved = true;
                 if (selectedPiece.j === 7) newCastlingRights.whiteRookKingsideMoved = true;
             } else if (currentPlayer === 'black' && selectedPiece.i === 0) {
                 if (selectedPiece.j === 0) newCastlingRights.blackRookQueensideMoved = true;
                 if (selectedPiece.j === 7) newCastlingRights.blackRookKingsideMoved = true;
             }
          }
          // Update rights if a rook is captured ON ITS STARTING SQUARE
          if (targetPiece?.type === 'rook') {
              const targetColor = targetPiece.color;
              if (targetColor === 'white') {
                  if (i === 7 && j === 0) newCastlingRights.whiteRookQueensideMoved = true; // Capture on a1
                  if (i === 7 && j === 7) newCastlingRights.whiteRookKingsideMoved = true; // Capture on h1
              } else { // Black rook captured
                  if (i === 0 && j === 0) newCastlingRights.blackRookQueensideMoved = true; // Capture on a8
                  if (i === 0 && j === 7) newCastlingRights.blackRookKingsideMoved = true; // Capture on h8
              }
          }
          setCastlingRights(newCastlingRights); // Update castling state

          // 8. Update en passant state for NEXT turn
          let nextEnPassantAvailable = false;
          let nextLastDoublePawnMove = null;
          if (movingPiece.type === 'pawn' && Math.abs(i - selectedPiece.i) === 2) {
            nextLastDoublePawnMove = { destI: i, destJ: j };
            nextEnPassantAvailable = true;
          }
          setLastDoublePawnMove(nextLastDoublePawnMove);
          setEnPassantAvailable(nextEnPassantAvailable);

          // 9. Check for pawn promotion
          const promotionRank = currentPlayer === 'white' ? 0 : 7;
          if (movingPiece.type === 'pawn' && i === promotionRank) {
            setBoard(newBoard); // Update board state *before* showing dialog
            setPromotionPawn({
              i, j, // Target square
              fromI: selectedPiece.i, // Original position needed for notation
              fromJ: selectedPiece.j,
              boardBeforePromotion: newBoard, // Pass the board state after move/capture but before promotion
              undoState, // Pass the state *before* this move started
              isCapture: !!capturedPieceType, // Capture status of the move *leading* to promotion
              isEnPassant // En passant status of the move *leading* to promotion
            });
            setSelectedPiece(null);
            setRedoStack([]); // Clear redo stack when a move leads to promotion choice
            return; // Wait for user promotion selection
          }

          // --- If not promoting ---

          // 10. Finalize board state update
          setBoard(newBoard);

          // 11. Update move history notation
          let moveNotation = getMoveNotation(
            selectedPiece.i, selectedPiece.j, i, j,
            movingPiece, // Use the actual moved piece object
            !!capturedPieceType, // Use derived capture status
            isCastling
          );
          if (isEnPassant) {
             moveNotation += ' e.p.';
          }

          // 12. Save finalized undo state (with move notation)
          undoState.moveNotation = moveNotation; // Add notation to the state saved earlier
          setMoveStack(prev => [...prev, undoState]);
          setRedoStack([]); // Clear redo stack on a normal move

          // 13. Switch Player
          const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
          setCurrentPlayer(nextPlayer);

          // 14. Add position to game history
          setGamePositions(prev => [...prev, JSON.stringify(newBoard)]);

          // 15. Check for check/mate/draw conditions for the *next* player
          let checkStatus = '';
          if (isOpponentInCheckmate(nextPlayer)) {
            checkStatus = '#'; // Checkmate
            alert(`Checkmate! ${currentPlayer} wins!`);
          } else if (isStalemate(nextPlayer)) {
            alert('Stalemate! The game is a draw.');
            // Optionally add draw notation?
          } else if (isInsufficientMaterial()) {
            alert('Draw by insufficient material!');
            // Optionally add draw notation?
          } else if (isThreefoldRepetition()) {
            alert('Draw by threefold repetition!');
            // Optionally add draw notation?
          } else if (isKingInCheck(nextPlayer)) {
            checkStatus = '+'; // Check
            // Consider making check alert less intrusive or optional
            // alert(`Check!`);
          }
          // Add the move notation *with* check/mate status to history
          setMoveHistory(prev => [...prev, moveNotation + checkStatus]);

        } else {
           // Provide user feedback? e.g., flash king square red briefly
        }
      } else {
         // This case should ideally not happen if selection logic is correct,
         // but good for debugging.
      }
      setSelectedPiece(null); // Deselect piece after attempting any move (valid or invalid)
    }
  };

  const isOpponentInCheckmate = (opponentColor) => {
    if (!isKingInCheck(opponentColor)) return false;

    for (let fromI = 0; fromI < 8; fromI++) {
      for (let fromJ = 0; fromJ < 8; fromJ++) {
        const piece = board[fromI][fromJ];
        if (piece && piece.color === opponentColor) {
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
    const sourceColor = getPieceColor(fromI, fromJ);
    const targetColor = getPieceColor(toI, toJ);

    // Can't capture your own piece
    if (targetSquare && sourceColor === targetColor) return false;

    switch (piece.type) {
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

    while (currentI !== toI || currentJ !== toJ) {
      if (board[currentI][currentJ]) return false;
      currentI += iStep;
      currentJ += jStep;
    }
    return true;
  };

  const isValidPawnMove = (fromI, fromJ, toI, toJ, color, isCapture) => {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const correctEnPassantRank = color === 'white' ? 3 : 4; // 5th rank for white (index 3), 4th rank for black (index 4)

    // Check if this is an en passant capture
    if (enPassantAvailable && lastDoublePawnMove) {
      const isCorrectRankForAttacker = fromI === correctEnPassantRank;
      const isTargetEnPassantSquare = toI === lastDoublePawnMove.destI + direction && toJ === lastDoublePawnMove.destJ;
      const isAttackerAdjacent = Math.abs(fromJ - lastDoublePawnMove.destJ) === 1;

      if (isCorrectRankForAttacker && isTargetEnPassantSquare && isAttackerAdjacent) {
        // No need to check board[toI][toJ] because en passant target square is always empty
        return true;
      }
    }

    if (isCapture) {
      return (toI === fromI + direction) && Math.abs(toJ - fromJ) === 1 && !!board[toI][toJ];
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
    
    // Knight must move in an L-shape (2 squares in one direction and 1 square perpendicular)
    const isValidLShape = (iDiff === 2 && jDiff === 1) || (iDiff === 1 && jDiff === 2);
    
    // Check if target square is empty or contains an enemy piece
    const targetPiece = board[toI][toJ];
    const sourceColor = getPieceColor(fromI, fromJ);
    const targetColor = targetPiece ? targetPiece.color : null;
    
    return isValidLShape && (!targetPiece || sourceColor !== targetColor);
  };

  const isValidBishopMove = (fromI, fromJ, toI, toJ) => {
    const iDiff = Math.abs(toI - fromI);
    const jDiff = Math.abs(toJ - fromJ);
    return iDiff === jDiff && isPathClear(fromI, fromJ, toI, toJ, true);
  };

  const isValidRookMove = (fromI, fromJ, toI, toJ) => {
    // Rook must move either horizontally or vertically
    if (fromI !== toI && fromJ !== toJ) return false;
    
    return isPathClear(fromI, fromJ, toI, toJ);
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
    const pieceColor = piece ? piece.color : null;
    const isSelected = selectedPiece && selectedPiece.i === i && selectedPiece.j === j;
    const isValidMoveSquare = validMoves.some(move => move.i === i && move.j === j);
    const isCheck = piece && piece.type === 'king' && 
                   ((pieceColor === 'white' && isKingInCheck('white')) ||
                    (pieceColor === 'black' && isKingInCheck('black')));
    
    // Special highlight for en passant squares
    const isEnPassantTarget = selectedPiece && selectedPiece.piece === 'pawn' && 
                             enPassantAvailable && lastDoublePawnMove &&
                             ((currentPlayer === 'white' && selectedPiece.i === 3) || 
                              (currentPlayer === 'black' && selectedPiece.i === 4)) &&
                             Math.abs(selectedPiece.j - lastDoublePawnMove.destJ) === 1 &&
                             i === lastDoublePawnMove.destI + (currentPlayer === 'white' ? -1 : 1) && 
                             j === lastDoublePawnMove.destJ;
    
    // Show location of the pawn that would be captured by en passant
    const isPawnEligibleForEnPassant = enPassantAvailable && lastDoublePawnMove &&
                               i === lastDoublePawnMove.destI && 
                               j === lastDoublePawnMove.destJ;

    return (
      <div 
        key={`${i}-${j}`}
        className={`w-16 h-16 ${isEven ? 'bg-white' : 'bg-gray-600'} 
          ${isSelected ? 'ring-2 ring-blue-500' : ''} 
          ${isValidMoveSquare ? 'ring-2 ring-green-400' : ''}
          ${isValidMoveSquare && piece ? 'ring-2 ring-red-500' : ''}
          ${isEnPassantTarget ? 'ring-2 ring-purple-500' : ''}
          ${isPawnEligibleForEnPassant ? 'bg-yellow-200 bg-opacity-40' : ''}
          ${isCheck ? 'ring-2 ring-red-600' : ''}
          relative flex items-center justify-center cursor-pointer`}
        onClick={() => handleSquareClick(i, j)}
      >
        {isValidMoveSquare && !piece && !isEnPassantTarget && (
          <div className="absolute w-3 h-3 bg-green-400 rounded-full opacity-50" />
        )}
        {isEnPassantTarget && (
          <div className="absolute w-4 h-4 bg-purple-500 rounded-full opacity-70" />
        )}
        {piece && <ChessPiece type={piece.type} color={piece.color} />}
        {isPawnEligibleForEnPassant && (
          <div className="absolute inset-0 border-2 border-yellow-400 pointer-events-none"></div>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-4">
        {/* Rank coordinates (1-8) on the left */}
        <div className="flex mt-8">
          <div className="flex flex-col justify-around pr-2 h-[32rem]">
            {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank) => (
              <span key={rank} className="text-gray-700 font-medium">
                {rank}
              </span>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="grid grid-cols-8 border-2 border-gray-800">
              {[...Array(8)].map((_, i) => (
                [...Array(8)].map((_, j) => renderSquare(i, j))
              ))}
            </div>
            {/* File coordinates (a-h) at the bottom */}
            <div className="flex justify-around px-2 pt-1">
              {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => (
                <span key={file} className="text-gray-700 font-medium">
                  {file}
                </span>
              ))}
            </div>
          </div>
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
          <button
            onClick={undoMove}
            disabled={moveStack.length === 0}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={redoMove}
            disabled={redoStack.length === 0}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Redo
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