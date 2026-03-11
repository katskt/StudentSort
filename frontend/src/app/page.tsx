"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useFetchClassrooms } from "@/app/hooks/useFetchClassrooms";
import { useSeatingForm } from "@/app/hooks/useSeatingForm";
import Table from "@/app/components/Table";
import Modal from "@/app/components/Modal";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
export default function Home() {
  const [spreadResult, setSpreadResult] = useState(null);
  const [displayDownloadPDF, setDisplayDownloadPDF] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const { classrooms } = useFetchClassrooms();
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);

  const [classroomOrder, setClassroomOrder] = useState<{
    [key: string]: number;
  }>({});
  const [editedDimensions, setEditedDimensions] = useState<
    Record<string, number>
  >({});
  const [entries, setEntries] = useState<
    { student: string; seat: string; seatIndex: number }[]
  >([]);

  const {
    file,
    setFile,
    selectedClassroom,
    setSelectedClassroom,
    mode,
    setMode,
    sortType,
    setSortType,
    sortColumn,
    setSortColumn,
    examText1,
    setExamText1,
    examText2,
    setExamText2,
    examText3,
    setExamText3,
  } = useSeatingForm();

  useEffect(() => {
    const classroomObj = classrooms.find(
      (c) => c.lecture_hall_name === selectedClassroom,
    );
    if (classroomObj) {
      setEditedDimensions(classroomObj.row_capacity);
    } else {
      setEditedDimensions({});
    }
  }, [selectedClassroom, classrooms]);
  async function handleDownloadPDF() {
    try {
      const formData = new FormData();
      formData.append("exam_text1", examText1);
      formData.append("exam_text2", examText2);
      formData.append("exam_text3", examText3);

      formData.append("entries", JSON.stringify(entries));

      const res = await fetch("http://localhost:5001/pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text(); // <-- read as text, not JSON
        alert("Error: " + text);
        return;
      }
      // Convert response to blob and trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "results.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to download PDF");
    }
  }

  const handleSubmit = async () => {
    let errorMessage = "";
    let isError = false;
    if (!file) {
      errorMessage += "File missing.\n";
      isError = true;
    }
    if (!selectedClassroom) {
      errorMessage += "Classroom not Selected.\n";
      isError = true;
    }
    if (!mode) {
      errorMessage += "Mode Not Selected.\n";
      isError = true;
    }
    if (sortType !== "random" && !sortColumn) {
      errorMessage += "Sort-by Column Not Selected.\n";
      isError = true;
    }
    if (errorMessage) {
      alert(errorMessage);
      return;
    }
    // Find selected classroom object
    const classroomObj = classrooms.find(
      (c) => c.lecture_hall_name === selectedClassroom,
    );
    if (!classroomObj) {
      alert("Selected classroom not found!");
      return;
    }

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("classroom", selectedClassroom);
    formData.append("mode", mode);
    formData.append("sortType", sortType);
    formData.append("sortColumn", sortColumn);

    formData.append("row_capacity", JSON.stringify(editedDimensions));
    formData.append("row_order", JSON.stringify(classroomObj.row_order));
    setClassroomOrder(classroomObj.row_order);

    setDisplayDownloadPDF(false);
    if (mode === "exam") {
      formData.append("examText1", examText1);
      formData.append("examText2", examText2);
      formData.append("examText3", examText3);

      setDisplayDownloadPDF(true);
    }

    const res = await fetch(`${API_BASE}/generate`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
    } else {
      const data = await res.json();
      console.log("Response:", data);
      setEntries(data);
      // alert("Sent to backend! Check console for response.");
    }
  };

  return (
    <div className="flex">
      <aside className="bg-zinc-50 border-zinc-200 w-80 p-8 h-screen overflow-y-auto overflow-x-hidden border-r p-6 space-y-6 shrink-0">
        <h1 className="text-2xl font-semibold">StudentSort</h1>
        {/* File Upload */}
        <div>
          <label
            title="File must have 'Student Name' Column "
            className="block font-medium"
          >
            Student Roster (CSV/XLSX)
          </label>
          <input
            className="text-zinc-600"
            type="file"
            accept=".csv,.xlsx"
            onChange={async (e) => {
              const selectedFile = e.target.files?.[0] || null;
              setFile(selectedFile);
              if (!selectedFile) return;

              const data = await selectedFile.arrayBuffer();
              const workbook = XLSX.read(data);
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const sheetData = XLSX.utils.sheet_to_json(firstSheet, {
                header: 1,
              }) as any[];
              setSheetData(sheetData);
              setHeaders(sheetData[0] || []);

              const firstRow = sheetData[0] || [];
              const seen = new Set();
              for (const col of firstRow) {
                if (seen.has(col)) {
                  alert(`Duplicate column name: "${col}"`);
                  setFile(null);
                  return;
                }
                seen.add(col);
              }
              setHeaders(firstRow);
            }}
          />
        </div>
        {/* Classroom Dropdown (dynamic) */}
        <div>
          <label className="block font-medium">Classroom</label>
          <select
            className="text-zinc-600"
            value={selectedClassroom}
            onChange={(e) => {
              setSelectedClassroom(e.target.value);
              setIsClassroomModalOpen(true);
            }}
          >
            <option value="">Select classroom</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.lecture_hall_name}>
                {c.lecture_hall_name} (Capacity: {c.capacity})
              </option>
            ))}
          </select>
        </div>
        <Modal
          title={"Edit Classroom Dimensions"}
          isOpen={isClassroomModalOpen}
          onClose={() => setIsClassroomModalOpen(false)}
        >
          <div>
            <p>Changes are saved on edit.</p>
            {selectedClassroom &&
              Object.keys(editedDimensions || {}).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(editedDimensions).map(([row, count]) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="w-24">{row}</span>
                      <input
                        type="number"
                        value={count}
                        min={0}
                        onChange={(e) =>
                          setEditedDimensions((prev) => ({
                            ...prev,
                            [row]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="border px-2 py-1 w-16"
                      />
                    </div>
                  ))}
                </div>
              )}
          </div>
        </Modal>
        {/* Sorting */}
        <div>
          <label className="block font-medium">Sorting</label>
          <select
            className="text-zinc-600"
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="random">Random</option>
            <option value="asc">Increasing</option>
            <option value="desc">Decreasing</option>
          </select>
          {sortType !== "random" && (
            <select
              className="mt-2 block"
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
            >
              <option value="">Select column</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          )}
        </div>
        {/* Mode */}
        <div>
          <label className="block font-medium">Mode</label>
          <select
            className="text-zinc-600"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="lesson">Lesson Mode (Huddle to Front)</option>
            <option value="exam">Exam Mode (Scatter)</option>
          </select>
        </div>
        {/* Exam Text */}
        {mode === "exam" && (
          <div className="w-full">
            <label className="block font-medium">Exam Desk Text 1</label>
            <textarea
              className="w-full border-1 p-2 text-zinc-600"
              rows={2}
              value={examText1}
              onChange={(e) => setExamText1(e.target.value)}
            />
            <label className="block font-medium">Exam Desk Text 2</label>
            <textarea
              className="w-[100%] border-1 p-2 text-zinc-600"
              rows={2}
              value={examText2}
              onChange={(e) => setExamText2(e.target.value)}
            />
            <label className="block font-medium">Exam Desk Text 3</label>
            <textarea
              className="w-[100%] border-1 p-2 text-zinc-600"
              rows={2}
              value={examText3}
              onChange={(e) => setExamText3(e.target.value)}
            />
          </div>
        )}
        <div className="flex">
          <button
            onClick={handleSubmit}
            className="bg-black text-white px-4 py-2 mx-2 rounded"
          >
            Generate
          </button>

          {entries && (
            <div>
              {displayDownloadPDF && (
                <button
                  className="bg-neutral-600  text-white px-4 py-2 mx-2 rounded"
                  onClick={handleDownloadPDF}
                >
                  PDF Book
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
      <main className="mx-auto p-6 space-y-6">
        {entries && (
          <Table
            data={spreadResult}
            entries={entries}
            setEntries={setEntries}
            dict={classroomOrder}
          />
        )}
      </main>
    </div>
  );
}
