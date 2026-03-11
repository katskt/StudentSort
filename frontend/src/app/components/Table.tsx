"use client";
import { Fragment, useEffect, useState } from "react";

interface Entry {
  student: string;
  seat: string;
  seatIndex: number;
  flatIndex: number;
}

export default function Table({
  data,
  entries,
  setEntries,
  dict,
}: {
  data?: any;
  entries: { student: string; seat: string; seatIndex: number }[];
  setEntries: React.Dispatch<
    React.SetStateAction<{ student: string; seat: string; seatIndex: number }[]>
  >;
  dict: { [key: string]: number };
}) {
  useEffect(() => {
    if (data) {
      setEntries(
        data.map(
          ({
            student,
            row,
            seatIndex,
          }: {
            student: string;
            row: string;
            seatIndex: number;
          }) => ({
            student: student,
            seat: row,
            seatIndex: seatIndex,
          }),
        ) || [],
      );
    }
  }, []);

  if (entries.length === 0) return <p>Data Preview Will Appear Here</p>;

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

  const handleNameEdit = (flatIndex: number, value: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[flatIndex] = { ...updated[flatIndex], student: value };
      return updated;
    });
  };

  const handleSeatEdit = (flatIndex: number, value: string) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[flatIndex] = {
        ...updated[flatIndex],
        seat: value,
        seatIndex: dict[value],
      };
      return updated;
    });
  };

  const handleNameResort = () => {
    setEntries((prev) => {
      // Split into non-empty and empty
      const nonEmpty = prev.filter((e) => e.student.trim() !== "");
      const empty = prev.filter((e) => e.student.trim() === "");

      // Sort the non-empty entries alphabetically by student
      nonEmpty.sort((a, b) => a.student.localeCompare(b.student));

      // Combine non-empty first, then empty
      const combined = [...nonEmpty, ...empty];

      // Reassign flatIndex for grid logic
      return combined.map((item, i) => ({ ...item, flatIndex: i }));
    });
  };

  const handleSeatResort = () => {
    setEntries((prev) => {
      // Split into non-empty and empty
      console.log(
        "Before sort:",
        prev.map((e) => e.seatIndex),
      );

      const nonEmpty = prev.filter((e) => e.seat.trim() !== "");
      const empty = prev.filter((e) => e.seat.trim() === "");
      // Sort the non-empty entries alphabetically by seat
      nonEmpty.sort((a, b) => a.seatIndex - b.seatIndex);

      // Combine non-empty first, then empty
      const combined = [...nonEmpty, ...empty];

      // Reassign flatIndex for grid logic
      console.log(
        "After sort:",
        prev.map((e) => e.seatIndex),
      );

      return combined.map((item, i) => ({ ...item, flatIndex: i }));
    });
  };

  return (
    <div style={{ padding: "10px", width: "100%" }}>
      <div className="flex justify-between">
        <div>
          <button
            onClick={handleNameResort}
            className="bg-black text-white px-4 py-2 m-right-2 rounded mb-4 mr-2"
          >
            Student Preview
          </button>
          <button
            onClick={handleSeatResort}
            className="bg-black text-white px-4 py-2 m-right-2 rounded mb-4 mr-2"
          >
            Professor Preview
          </button>
        </div>
        <div>
          <button
            className="bg-neutral-600 text-white px-4 py-2 m-right-2 rounded mb-4 ml-2"
            onClick={() => {
              localStorage.setItem("spreadResult", JSON.stringify(entries));

              window.open("/results1", "_blank", "noopener,noreferrer");
            }}
          >
            Student Fullscreen View
          </button>
          <button
            className="bg-neutral-600 text-white px-4 py-2 m-right-2 rounded mb-4 ml-2"
            onClick={() => {
              localStorage.setItem("spreadResult", JSON.stringify(entries));

              window.open("/results2", "_blank", "noopener,noreferrer");
            }}
          >
            Professor Fullscreen View
          </button>
        </div>
      </div>
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
                  <td
                    contentEditable
                    suppressContentEditableWarning
                    style={{ outline: "none" }}
                    onBlur={(e) =>
                      cell &&
                      handleNameEdit(
                        cell.flatIndex,
                        e.currentTarget.textContent || "",
                      )
                    }
                  >
                    {cell?.student ?? ""}
                  </td>
                  <td
                    contentEditable
                    suppressContentEditableWarning
                    style={{ outline: "none" }}
                    onBlur={(e) =>
                      cell &&
                      handleSeatEdit(
                        cell.flatIndex,
                        e.currentTarget.textContent || "",
                      )
                    }
                  >
                    {cell?.seat ?? ""}
                  </td>
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
