import {useState} from "react"

export function useSeatingForm() {  
    const [file, setFile] = useState<File | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [mode, setMode] = useState<"lesson" | "exam" | "">("lesson");
  const [sortType, setSortType] = useState("random");
  const [sortColumn, setSortColumn] = useState("");
  const [examText1, setExamText1] = useState<string>(
    "Do not write on this page.",
  );
  const [examText2, setExamText2] = useState<string>(
    "Adding notes here will be regarded as academic misconduct.",
  );
  const [examText3, setExamText3] = useState<string>(
    "Please return this page along with your exam booklet at the end of the examination.",
  );

  const [filterColumn, setFilterColumn] = useState("");
  const [filterValues, setFilterValues] = useState<string[]>([]);
  const [availableFilterValues, setAvailableFilterValues] = useState<string[]>(
    [],
  );
  return {file, setFile, selectedClassroom, setSelectedClassroom, mode,setMode, sortType, setSortType, sortColumn, setSortColumn, examText1, setExamText1, examText2, setExamText2,  examText3, setExamText3,filterColumn, setFilterColumn,filterValues, setFilterValues,availableFilterValues, setAvailableFilterValues}
}

export default {useSeatingForm}