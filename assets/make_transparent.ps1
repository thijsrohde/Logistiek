$code = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public class ImageUtils {
    public static void MakeTransparent(string src, string dest) {
        try {
            using (Bitmap orig = new Bitmap(src)) {
                using (Bitmap target = new Bitmap(orig.Width, orig.Height, PixelFormat.Format32bppArgb)) {
                    using (Graphics g = Graphics.FromImage(target)) {
                        g.DrawImage(orig, 0, 0);
                    }
                    for (int y = 0; y < target.Height; y++) {
                        for (int x = 0; x < target.Width; x++) {
                            Color c = target.GetPixel(x,y);
                            if (c.R > 230 && c.G > 230 && c.B > 230) {
                                target.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                            }
                        }
                    }
                    target.Save(dest, ImageFormat.Png);
                    Console.WriteLine("Successfully created transparent image: " + dest);
                }
            }
        } catch (Exception e) {
            Console.WriteLine("Error processing " + src + ": " + e.Message);
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

[ImageUtils]::MakeTransparent("c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\logo-white.png", "c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\logo-wide-alpha.png")
[ImageUtils]::MakeTransparent("c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\logo-blue.png", "c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\logo-wide-blue-alpha.png")
[ImageUtils]::MakeTransparent("c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\valknut.jpg", "c:\Users\thijs\Documents\Antigravity project\Logistieke app\assets\valknut-alpha.png")
