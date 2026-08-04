from flask import Flask, request, send_file, render_template, flash, redirect, url_name
import io
import os
from rembg import remove, new_session # Local BG Remover
from PIL import Image, ImageOps, ImageEnhance
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'TvarnipAISecurity' # Required for flashes

# --- CONFIGURATION ---
# SPEED BOOSTER: Model pre-load karein global space mein
# First time load hone mein 1-2 min lag sakta hai, uske baad instant chalega.
print("Loading Local AI Model (u2net)... Please wait...")
session = new_session("u2net")
print("AI Model Loaded Successfully! Tvarnip Studio is ready.")

# Allowed Image Extensions (Security validation)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- CORE LOGIC FUNCTIONS (No API delay) ---

def process_logic_local(image_bytes):
    input_img = Image.open(io.BytesIO(image_bytes))
    
    # Check if image is too large (Optional, protects CPU)
    if input_img.width > 3000 or input_img.height > 3000:
        input_img.thumbnail((2000, 2000), Image.Resampling.LANCZOS)
    
    # 1. Direct Local Background Removal (u2net model is used)
    # session pass karne se processing har baar fast hoti hai
    output_no_bg = remove(input_img, session=session).convert("RGBA")
    
    # 2. Process Image (White BG + Enhancement)
    white_bg = Image.new("RGBA", output_no_bg.size, (255, 255, 255, 255))
    combined = Image.alpha_composite(white_bg, output_no_bg).convert("RGB")
    
    # Pro Studio Enhancements (Indian Skin Tone Boost)
    combined = ImageEnhance.Sharpness(combined).enhance(1.7) # Extra crisp
    combined = ImageEnhance.Brightness(combined).enhance(1.1)
    combined = ImageEnhance.Contrast(combined).enhance(1.15) # Better dynamic range

    # 3. Exact Passport Size (35x45mm @ 300 DPI quality)
    # Target size: 413x531 px + 1mm Border (approx 12px)
    target_size = (413, 531)
    combined = ImageOps.fit(combined, target_size, Image.Resampling.LANCZOS)
    final_photo = ImageOps.expand(combined, border=12, fill=(25, 25, 25)) # Pro dark border
    
    return final_photo

def generate_pdf(processed_img):
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=(210*mm, 297*mm)) # A4
    
    # Image needs to be saved to pass to reportlab
    processed_img.save("temp_pass.png")
    
    # Passport Dimensions in mm
    w_mm, h_mm, gap_mm = 35, 45, 5
    x_start, y_pos = 15*mm, 240*mm
    
    # Print 6 photos in a row
    for i in range(6):
        # Using drawImage because we have a temp file (reportlab's faster method)
        c.drawImage("temp_pass.png", x_start + (i*(w_mm + gap_mm)), y_pos, 
                    width=w_mm*mm, height=h_mm*mm)
    
    c.showPage()
    c.save()
    pdf_buffer.seek(0)
    
    # Clean up temp file
    if os.path.exists("temp_pass.png"):
        os.remove("temp_pass.png")
        
    return pdf_buffer

# --- UI & ROUTES ---

@app.route('/', methods=['GET', 'POST'])
def home():
    if request.method == 'POST':
        # Check if file part exists
        if 'file' not in request.files:
            flash('No file selected', 'danger')
            return redirect(url_name('home'))
            
        file = request.files.get('file')
        
        # If no filename is provided
        if file.filename == '':
            flash('No image uploaded', 'danger')
            return redirect(url_name('home'))
            
        # File Validation (Only Images allowed)
        if file and allowed_file(file.filename):
            print(f"Processing image: {file.filename} (Local AI Mode)")
            img_data = process_logic_local(file.read())
            
            if img_data:
                pdf = generate_pdf(img_data)
                return send_file(pdf, download_name="print_ready.pdf", as_attachment=True)
            else:
                flash('An unexpected error occurred during processing', 'danger')
        else:
            flash('Invalid file format. Only JPG, PNG, WEBP are allowed.', 'warning')
            
    return render_template('index.html')

if __name__ == '__main__':
    # '0.0.0.0' allowing local network access
    app.run(host='0.0.0.0', port=5000)