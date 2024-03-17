import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import CustomDialog from "@components/CustomDialog";
import socket from "../../socket";
import {
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
  Box,
} from "@mui/material";

interface Player {
  id: string;
  username: string;
}

interface GameProps {
  players: Player[];
  room: string;
  orientation: string;
  cleanup: () => void;
}

function Game({ players, room, orientation, cleanup }: GameProps): JSX.Element {
  const chess = useMemo(() => new Chess(), []); // <- 1
  const [fen, setFen] = useState<string>(chess.fen()); // <- 2
  const [over, setOver] = useState<string>("");

  // onDrop function
  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    // orientation is either 'white' or 'black'. game.turn() returns 'w' or 'b'
    if (chess.turn() !== orientation[0]) return false; // <- 1 prohibit player from moving piece of other player

    if (players.length < 2) return false; // <- 2 disallow a move if the opponent has not joined

    const moveData = {
      from: sourceSquare,
      to: targetSquare,
      color: chess.turn(),
      promotion: "q", // promote to queen where possible
    };

    const move = makeAMove(moveData);

    // illegal move
    if (move === null) return false;

    socket.emit("move", {
      // <- 3 emit a move event.
      move,
      room,
    }); // this event will be transmitted to the opponent via the server

    return true;
  }

  const makeAMove = useCallback(
    (move: any): any => {
      try {
        const result = chess.move(move); // update Chess instance
        setFen(chess.fen()); // update fen state to trigger a re-render

        if (chess.isGameOver()) {
          // check if move led to "game over"
          if (chess.isCheckmate()) {
            // if reason for game over is a checkmate
            // Set message to checkmate.
            setOver(
              `Checkmate! ${chess.turn() === "w" ? "black" : "white"} wins!`
            );
            // The winner is determined by checking which side made the last move
          } else if (chess.isDraw()) {
            setOver("Draw"); // set message to "Draw"
          } else {
            setOver("Game over");
          }
          console.log(chess.pgn());
        }

        return result;
      } catch (e) {
        return null;
      } // null if the move was illegal, the move object if the move was legal
    },
    [chess]
  );

  useEffect(() => {
    socket.on("move", (move) => {
      makeAMove(move); //
    });
  }, [makeAMove]);

  useEffect(() => {
    socket.on("playerDisconnected", (player: Player) => {
      setOver(`${player.username} has disconnected`); // set game over
    });
  }, []);

  useEffect(() => {
    socket.on("closeRoom", ({ roomId }: { roomId: string }) => {
      if (roomId === room) {
        cleanup();
      }
    });
  }, [room, cleanup]);

  // Game component returned jsx
  return (
    <Stack>
      <Card>
        <CardContent>
          <Typography variant="h5">Room ID: {room}</Typography>
        </CardContent>
      </Card>
      <Stack flexDirection="row" sx={{ pt: 2 }}>
        <div
          className="board"
          style={{
            maxWidth: 600,
            maxHeight: 600,
            flexGrow: 1,
          }}
        >
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation={orientation}
          />
        </div>
        {players.length > 0 && (
          <Box>
            <List>
              <ListSubheader>Players</ListSubheader>
              {players.map((p) => (
                <ListItem key={p.id}>
                  <ListItemText primary={p.username} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Stack>
      <CustomDialog // Game Over CustomDialog
        open={Boolean(over)}
        title={over}
        contentText={over}
        handleContinue={() => {
          socket.emit("closeRoom", { roomId: room });
          cleanup();
        }}
      />
    </Stack>
  );
}

export default Game;
