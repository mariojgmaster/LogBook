param(
  [string]$Source = "assets/brand/logbook-logo-source.png",
  [string]$PublicDirectory = "public"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public static class LogBookBrandAssets
{
    private static bool IsBackground(Color color)
    {
        int max = Math.Max(color.R, Math.Max(color.G, color.B));
        int min = Math.Min(color.R, Math.Min(color.G, color.B));
        return max - min <= 12 && min >= 205;
    }

    private static Bitmap RemoveCheckerboard(Bitmap source)
    {
        var result = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        for (int y = 0; y < source.Height; y++)
        {
            for (int x = 0; x < source.Width; x++)
            {
                Color color = source.GetPixel(x, y);
                if (IsBackground(color))
                {
                    result.SetPixel(x, y, Color.Transparent);
                    continue;
                }

                int max = Math.Max(color.R, Math.Max(color.G, color.B));
                int min = Math.Min(color.R, Math.Min(color.G, color.B));
                int rawAlpha = (205 - min) * 255 / 35;
                int alpha = max - min <= 12
                    ? Math.Max(0, Math.Min(255, rawAlpha))
                    : 255;
                result.SetPixel(x, y, Color.FromArgb(alpha, color.R, color.G, color.B));
            }
        }
        return result;
    }

    private static Rectangle ContentBounds(Bitmap image)
    {
        int left = image.Width;
        int top = image.Height;
        int right = -1;
        int bottom = -1;
        for (int y = 0; y < image.Height; y++)
        {
            for (int x = 0; x < image.Width; x++)
            {
                if (image.GetPixel(x, y).A < 8) continue;
                left = Math.Min(left, x);
                top = Math.Min(top, y);
                right = Math.Max(right, x);
                bottom = Math.Max(bottom, y);
            }
        }
        if (right < left || bottom < top) throw new InvalidOperationException("No logo content was detected.");
        return Rectangle.FromLTRB(left, top, right + 1, bottom + 1);
    }

    private static Rectangle IconBounds(Bitmap image, Rectangle content)
    {
        int gapStart = -1;
        int gapLength = 0;
        int searchStart = content.Left + content.Width / 6;
        for (int x = searchStart; x < content.Right; x++)
        {
            bool occupied = false;
            for (int y = content.Top; y < content.Bottom; y++)
            {
                if (image.GetPixel(x, y).A >= 8) { occupied = true; break; }
            }

            if (!occupied)
            {
                if (gapLength == 0) gapStart = x;
                gapLength++;
                if (gapLength >= Math.Max(24, content.Width / 80))
                {
                    int right = gapStart;
                    using (var cropped = image.Clone(
                        new Rectangle(content.Left, content.Top, right - content.Left, content.Height),
                        PixelFormat.Format32bppArgb))
                    {
                        Rectangle bounds = ContentBounds(cropped);
                        return new Rectangle(
                            bounds.X + content.Left,
                            bounds.Y + content.Top,
                            bounds.Width,
                            bounds.Height
                        );
                    }
                }
            }
            else
            {
                gapLength = 0;
            }
        }
        throw new InvalidOperationException("Could not isolate the logo mark from the wordmark.");
    }

    private static Bitmap Render(Bitmap source, Rectangle bounds, int width, int height, bool square)
    {
        var output = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(output))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceCopy;
            graphics.CompositingQuality = CompositingQuality.HighQuality;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.SmoothingMode = SmoothingMode.HighQuality;

            int padding = square ? Math.Max(1, width / 12) : 0;
            int availableWidth = width - padding * 2;
            int availableHeight = height - padding * 2;
            double scale = Math.Min((double)availableWidth / bounds.Width, (double)availableHeight / bounds.Height);
            int drawWidth = Math.Max(1, (int)Math.Round(bounds.Width * scale));
            int drawHeight = Math.Max(1, (int)Math.Round(bounds.Height * scale));
            int drawX = (width - drawWidth) / 2;
            int drawY = (height - drawHeight) / 2;
            graphics.DrawImage(source, new Rectangle(drawX, drawY, drawWidth, drawHeight), bounds, GraphicsUnit.Pixel);
        }
        return output;
    }

    public static void Generate(string sourcePath, string publicDirectory)
    {
        using (var original = new Bitmap(sourcePath))
        using (var cleaned = RemoveCheckerboard(original))
        {
            Rectangle wordmarkBounds = ContentBounds(cleaned);
            Rectangle iconBounds = IconBounds(cleaned, wordmarkBounds);

            string iconDirectory = Path.Combine(publicDirectory, "icons");
            string brandDirectory = Path.Combine(publicDirectory, "brand");
            Directory.CreateDirectory(iconDirectory);
            Directory.CreateDirectory(brandDirectory);

            foreach (int size in new[] { 16, 32, 48, 64, 128 })
            {
                using (var icon = Render(cleaned, iconBounds, size, size, true))
                {
                    icon.Save(Path.Combine(iconDirectory, string.Format("logbook-{0}.png", size)), ImageFormat.Png);
                }
            }

            int wordmarkWidth = 768;
            int wordmarkHeight = Math.Max(1, (int)Math.Round(wordmarkWidth * (double)wordmarkBounds.Height / wordmarkBounds.Width));
            using (var wordmark = Render(cleaned, wordmarkBounds, wordmarkWidth, wordmarkHeight, false))
            {
                wordmark.Save(Path.Combine(brandDirectory, "logbook-wordmark.png"), ImageFormat.Png);
            }
        }
    }
}
'@

$sourcePath = (Resolve-Path $Source).Path
$publicPath = (Resolve-Path $PublicDirectory).Path
[LogBookBrandAssets]::Generate($sourcePath, $publicPath)
