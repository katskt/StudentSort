from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from validateForm import validateForm, getParameter, sortStudents
import os

from peedeeeff import validatePDF
app = Flask(__name__)
CORS(app, origins="https://student-sort-pu8l.vercel.app/")  # allow only your Next.js dev server
@app.route("/", methods=["GET"])
def home():
    return "Flask backend is running"

@app.route("/generate", methods=["POST"])
def generate():
    try:
        validateForm(request)
        mode, sort_type, row_capacity, row_order, student_names_sort_dict= getParameter(request)
        student_row_order_students = sortStudents(mode, sort_type, student_names_sort_dict, row_capacity, row_order)
        return jsonify(student_row_order_students)    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({"error": "Unexpected server error: " + str(e)}), 500
    # extracts these data from request    
    # gives 2 list of students, seat_arrangment that correspond to each other based on lesson mode (exam or lesson), sorting order (by which column and if asending or descending), and dimensions of table. 
    

@app.route("/pdf", methods=["POST"])
def pdf():
    return validatePDF(request)
    



if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 5001)))
