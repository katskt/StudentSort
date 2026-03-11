"use client";
import { Fragment, useEffect, useState } from "react";

interface Entry {
  student: string;
  seat: string;
  seatIndex: number;
  flatIndex: number;
}

export default function Results() {
  const [entries, setEntries] = useState<
    { student: string; seat: string; seatIndex: number }[]
  >([]);
  useEffect(() => {
    const stored = localStorage.getItem("spreadResult");
    if (stored) {
      const parsed = JSON.parse(stored);
      setEntries(
        parsed.map(
          ({
            student,
            seat,
            seatIndex,
          }: {
            student: string;
            seat: string;
            seatIndex: number;
          }) => ({
            student: student,
            seat: seat,
            seatIndex: seatIndex,
          }),
        ) || [],
      );
      setEntries((prev) => {
        // Split into non-empty and empty

        const nonEmpty = prev.filter((e) => e.seat.trim() !== "");
        const empty = prev.filter((e) => e.seat.trim() === "");
        // Sort the non-empty entries alphabetically by seat
        nonEmpty.sort((a, b) => a.seatIndex - b.seatIndex);

        // Combine non-empty first, then empty
        const combined = [...nonEmpty, ...empty];

        // Reassign flatIndex for grid logic
        return combined.map((item, i) => ({ ...item, flatIndex: i }));
      });
    }
  }, []);

  if (entries.length === 0) return <p>Fetching...</p>;

  const columns = 4;
  const rowCount = Math.ceil(entries.length / columns);

  const grid: (Entry | null)[][] = Array.from({ length: rowCount }, () =>
    Array(columns).fill(null),
  );

  entries.forEach((item, index) => {
    const col = Math.floor(index / rowCount);
    const row = index % rowCount;
    grid[row][col] = { ...item, flatIndex: index };
  });

  return (
    <div style={{ marginTop: "50px", padding: "20px", width: "100%" }}>
      <table
        className="table"
        border={1}
        cellPadding={6}
        style={{ tableLayout: "fixed", width: "100%" }}
      >
        <thead>
          <tr>
            {Array.from({ length: 4 }).map((_, i) => (
              <Fragment key={i}>
                <th style={{ width: "25%" }}>Name</th>
                <th style={{ width: "10%" }}>Seat</th>
                {i < columns - 1 && (
                  <th style={{ backgroundColor: "#FFF", width: "2.5%" }} />
                )}
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <Fragment key={colIndex}>
                  <td>{cell?.student ?? ""}</td>
                  <td>{cell?.seat ?? ""}</td>
                  {colIndex < columns - 1 && (
                    <td style={{ backgroundColor: "#FFF" }} />
                  )}
                </Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
