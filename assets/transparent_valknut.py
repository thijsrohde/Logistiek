import sys
import os

try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # Using a threshold for "white"
    for item in datas:
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            newData.append((255, 255, 255, 0)) # Fully transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    input_img = r"C:\Users\thijs\.gemini\antigravity\brain\05d391f0-6aee-439a-aeb9-4498f5d4cdcd\media__1773824124360.png"
    output_img = r"c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\valknut.png"
    
    make_transparent(input_img, output_img)
    print(f"Saved transparent valknut to {output_img}")
