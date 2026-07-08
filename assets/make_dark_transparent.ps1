$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public class ImageUtilsDark {
    public static void MakeTransparentMatchCorner(string src, string dest) {
        try {
            using (Bitmap orig = new Bitmap(src)) {
                using (Bitmap target = new Bitmap(orig.Width, orig.Height, PixelFormat.Format32bppArgb)) {
                    using (Graphics g = Graphics.FromImage(target)) {
                        g.DrawImage(orig, 0, 0);
                    }
                    Color bg = target.GetPixel(0,0);
                    for (int y = 0; y < target.Height; y++) {
                        for (int x = 0; x < target.Width; x++) {
                            Color c = target.GetPixel(x,y);
                            
                            // Check if pixel is close to background color
                            if (Math.Abs(c.R - bg.R) < 30 && Math.Abs(c.G - bg.G) < 30 && Math.Abs(c.B - bg.B) < 30) {
                                target.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                            } else {
                                // For soft edges that are slightly mixed with background, 
                                // we could calculate alpha, but a simple cutoff is usually fine 
                                // if placed on a similar colored background later.
                            }
                        }
                    }
                    target.Save(dest, ImageFormat.Png);
                    Console.WriteLine("Successfully created transparent dark-mode image: " + dest);
                }
            }
        } catch (Exception e) {
            Console.WriteLine("Error processing " + src + ": " + e.Message);
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

[ImageUtilsDark]::MakeTransparentMatchCorner("c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\logo-blue.png", "c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\logo-wide-darkmode-alpha.png")
