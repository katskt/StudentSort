import json
import pandas as pd
from flask import Flask, request, jsonify
import random
# validateForm.py
def validateForm(request):    
    if "file" not in request.files:
        raise ValueError("No file uploaded")
    file = request.files["file"]
    # ---------- Get Form Fields ----------
    classroom: str = request.form.get("classroom")
    mode: str = request.form.get("mode")
    sort_type: str = request.form.get("sortType")
    sort_column: str = request.form.get("sortColumn")
    exam_text1: str = request.form.get("examText1")  # may be None
    exam_text2: str = request.form.get("examText2")  # may be None
    exam_text3: str = request.form.get("examText3")  # may be None
    row_capacity: dict = json.loads(request.form.get("row_capacity"))  # now it's a Python dict
    if not classroom or not mode:
        raise ValueError("Missing Classroom or Mode")

    # ---------- Read spreadsheet ----------
    filename = file.filename.lower()

    if filename.endswith(".csv"):
        df = pd.read_csv(file)
    elif filename.endswith(".xlsx"):
        df = pd.read_excel(file)
    else:
        print("Error, Unsupported File Types")
        raise ValueError("Error, Unsupported File Types")
    
    # ---------- Validate Column Name has "Student Name" ----------
    if "Student Name" not in df.columns:
        if "First Name" in df.columns and "Last Name" in df.columns:
            df["Student Name"] = df["First Name"].astype(str) + " " + df["Last Name"].astype(str)
        else:
            raise ValueError("Spreadsheet must have 'Student Name' or both 'First Name' and 'Last Name' columns")

    if len(df) == 0:
        raise ValueError("No valid students found in spreadsheet")

def getParameter(request):
    file = request.files["file"]
    file.seek(0)        #resetting file pointer

    filename = file.filename.lower()
    if filename.endswith(".csv"):
        df = pd.read_csv(file)
    elif filename.endswith(".xlsx"):
        df = pd.read_excel(file)

    mode = request.form.get("mode")
    sort_type = request.form.get("sortType")
    sort_column = request.form.get("sortColumn")
    row_capacity = json.loads(request.form.get("row_capacity"))  # now it's a Python dict
    row_order = json.loads(request.form.get("row_order"))
    # ---------- Validate Student Name Column isnt funky ----------
    # Drop NaN student names
    if "Student Name" not in df.columns:
        if "First Name" in df.columns and "Last Name" in df.columns:
            df["Student Name"] = df["First Name"].astype(str) + " " + df["Last Name"].astype(str)
        else:
            raise ValueError("Spreadsheet must have 'Student Name' or both 'First Name' and 'Last Name' columns")

    df = df.dropna(subset=["Student Name"])
    df = df[~df["Student Name"].str.strip().isin(["Student, Test", "Points Possible"])]    
    
    num_students = df.shape[0]  # Gives number of rows
    num_seats = getSeatsInClassroom(row_capacity)
    if num_seats < num_students:
        print(f"Error, Number of Students ({num_students})Cannot Execeed Number of seats ({num_seats})")
        raise ValueError(f"Error, Number of Students ({num_students})Cannot Execeed Number of seats ({num_seats})")


    if sort_type != "random" and (df["Student Name"].isnull().any()):
        raise ValueError("Sort Column has Empty Values")
    student_names_list = list(df["Student Name"])

    if sort_column:
        if pd.api.types.is_numeric_dtype(df[sort_column]): # if all numeric make them floats
            sort_column_list = list(df[sort_column].astype(float))
            print("Sort as float")
        else:
            converted = pd.to_numeric(df[sort_column], errors='coerce') #else try to force
            if converted.notna().all():
                sort_column_list = list(converted)
                print("Sort as float (converted)")
            else: # else sort as string
                sort_column_list = list(df[sort_column].astype(str))
                print("Sort as string")
    else:
        sort_column_list = list(df["Student Name"])
    
    
    student_names_sort_dict = {k: v for k, v in zip(student_names_list, sort_column_list)}
    
    return mode, sort_type, row_capacity, row_order, student_names_sort_dict


def getSeatsInClassroom(row_capacity):
    sum = 0
    for i in row_capacity:
        sum += int(row_capacity[i])
    return sum

def spread_students(num_students, num_seats) -> list:
    if num_students == 1:
        return [num_seats // 2]  # put in middle

    step = min((num_seats - 1) / (num_students - 1), 3)
    return [round(i * step) for i in range(num_students)]

def construct_rows_list(row_capacity):
    ordered_rows = []
    for row in row_capacity:
        i = 0
        while i < row_capacity[row]:
            ordered_rows.append(row)
            i += 1
    return ordered_rows
def sortStudents(mode, sort_type, student_names_sort_dict, row_capacity, row_order):
    num_students = len(student_names_sort_dict)
    num_seats = getSeatsInClassroom(row_capacity)
    ordered_students = []
    ordered_rows = []
    if sort_type == "random":
        ordered_students = list(student_names_sort_dict)
        random.shuffle(ordered_students)
        print("random")
    elif sort_type == "asc":
        ordered_students = [
            name for name, _ in sorted(
                student_names_sort_dict.items(),
                key=lambda item: item[1],
            )]
        print("asc")
    elif sort_type == "desc":
        ordered_students = [
            name for name, _ in sorted(
                student_names_sort_dict.items(),
                key=lambda item: item[1],
                reverse=True
            )]
        print("desc")
    else: 
        raise Exception("an error occurred")
    ordered_rows = construct_rows_list(row_capacity)
    
    if mode == "lesson":
        ordered_rows = ordered_rows[0:num_students]
        print("lesson")
    elif mode == "exam":
        validSeats = spread_students(num_students, num_seats) # do some kind of division and moduluo thing 103 146
        new_ordered_rows = []
        for i in validSeats:
            new_ordered_rows.append(ordered_rows[i])
        ordered_rows = new_ordered_rows
    else: 
        raise Exception("an error occurred")
    student_row_pair = dict(zip(ordered_students, ordered_rows))
    student_row_order_students = dict(sorted(student_row_pair.items()))
    student_row_order_students = [
    {"student": student, "seat": row, "seatIndex": row_order[row]}
    for student, row in sorted(student_row_pair.items())
    ]
    return student_row_order_students