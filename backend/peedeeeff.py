from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from flask import Flask, request, jsonify, send_file, json
import tempfile

def validatePDF(request):
    # ---------- Get Form Fields ----------
    exam_text1: str = request.form.get("exam_text1")
    exam_text2: str = request.form.get("exam_text2")
    exam_text3: str = request.form.get("exam_text3")

    entries: str = request.form.get("entries")
    if not entries:
        print("Error, missing required fields", entries)
        return jsonify({"error": "Missing required fields"}), 400
    entries = json.loads(entries)
    temp_entries = []
    for entry in entries:
        if 'flatIndex' in entry:
            del entry['flatIndex']
        if entry["seat"] != "" and entry["student"] != "":
            temp_entries.append({'student': entry["student"], 'seat': entry["seat"], 'seatIndex': entry["seatIndex"]})
            

    # sort entries
    temp_entries = sorted(
    temp_entries,
    key=lambda x: int(x['seatIndex'])
    )

    # Print result
    return makePDF(exam_text1,exam_text2,exam_text3 , temp_entries)

def makePDF(exam_text1,exam_text2,exam_text3 , entries):
    print(exam_text1, exam_text2, exam_text3)
    # init file to be returned
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    pdf = canvas.Canvas(temp_file.name,pagesize=landscape(letter))
    width, height = landscape(letter)
    center = width / 2
    height = height - 2 * inch
    for student_row in entries:
        pdf.setFont("Helvetica-Bold", 45)
        pdf.drawCentredString((center), height, f"{exam_text1}")
        pdf.translate(0,-inch)
        pdf.setFont("Helvetica", 20)
        pdf.drawCentredString((center), height, f"{exam_text2}")
        pdf.translate(0,-inch)
        pdf.setFont("Helvetica-Bold", 45)
        pdf.drawCentredString((center), height, f"{student_row['student']}")
        pdf.translate(0,-inch)
        pdf.drawCentredString((center), height, f"Row {student_row['seat']}")
        pdf.translate(0,-inch)

        pdf.setFont("Helvetica", 20)
        pdf.drawCentredString((center), height, f"{exam_text3}")
        pdf.showPage()   # end current page, start next
    pdf.save()
    return send_file(
        temp_file.name,
        as_attachment=True,
        download_name="results.pdf",
        mimetype="application/pdf"
    )