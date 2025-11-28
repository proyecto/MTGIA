use image::{DynamicImage, GenericImageView};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct CardFeatures {
    pub border_type: BorderType,
    pub frame_color: FrameColor,
    pub frame_style: FrameStyle,
    pub has_corner_dots: bool,
    pub is_foil: bool,
    pub phash: u64, // Perceptual hash for image comparison
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub enum BorderType {
    Black,
    White,
    Silver,
    Unknown,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub enum FrameColor {
    Black,
    Blue,
    Red,
    Green,
    White,
    Gold,
    Land,
    Unknown,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub enum FrameStyle {
    OldFrame,
    ModernFrame,
    M15Frame,
    Unknown,
}

/// Convert RGB to HSV color space
fn rgb_to_hsv(r: u8, g: u8, b: u8) -> (f32, f32, f32) {
    let r = r as f32 / 255.0;
    let g = g as f32 / 255.0;
    let b = b as f32 / 255.0;

    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;

    let h = if delta == 0.0 {
        0.0
    } else if max == r {
        60.0 * (((g - b) / delta) % 6.0)
    } else if max == g {
        60.0 * (((b - r) / delta) + 2.0)
    } else {
        60.0 * (((r - g) / delta) + 4.0)
    };

    let s = if max == 0.0 { 0.0 } else { delta / max };
    let v = max;

    (if h < 0.0 { h + 360.0 } else { h }, s, v)
}

/// Detect the border type by analyzing outer edge pixels
pub fn detect_border_type(image: &DynamicImage) -> BorderType {
    let (width, height) = image.dimensions();
    
    // Instead of checking the absolute edge (which might be background),
    // check a strip slightly inside the image (e.g., 15% in)
    // This assumes the card is somewhat centered and fills most of the frame
    let margin_x = (width as f32 * 0.15) as u32;
    let margin_y = (height as f32 * 0.15) as u32;
    let sample_width = (width as f32 * 0.05) as u32; // Sample a 5% strip
    
    let mut total_r = 0u64;
    let mut total_g = 0u64;
    let mut total_b = 0u64;
    let mut pixel_count = 0u64;

    // Sample top strip (inside the margin)
    for x in margin_x..(width - margin_x) {
        for y in margin_y..(margin_y + sample_width) {
            if x < width && y < height {
                let pixel = image.get_pixel(x, y);
                total_r += pixel[0] as u64;
                total_g += pixel[1] as u64;
                total_b += pixel[2] as u64;
                pixel_count += 1;
            }
        }
    }
    
    // Sample bottom strip
    for x in margin_x..(width - margin_x) {
        for y in (height - margin_y - sample_width)..(height - margin_y) {
            if x < width && y < height {
                let pixel = image.get_pixel(x, y);
                total_r += pixel[0] as u64;
                total_g += pixel[1] as u64;
                total_b += pixel[2] as u64;
                pixel_count += 1;
            }
        }
    }

    // Sample left strip
    for y in margin_y..(height - margin_y) {
        for x in margin_x..(margin_x + sample_width) {
            if x < width && y < height {
                let pixel = image.get_pixel(x, y);
                total_r += pixel[0] as u64;
                total_g += pixel[1] as u64;
                total_b += pixel[2] as u64;
                pixel_count += 1;
            }
        }
    }
    
    // Sample right strip
    for y in margin_y..(height - margin_y) {
        for x in (width - margin_x - sample_width)..(width - margin_x) {
            if x < width && y < height {
                let pixel = image.get_pixel(x, y);
                total_r += pixel[0] as u64;
                total_g += pixel[1] as u64;
                total_b += pixel[2] as u64;
                pixel_count += 1;
            }
        }
    }

    if pixel_count == 0 {
        return BorderType::Unknown;
    }

    let avg_r = (total_r / pixel_count) as u8;
    let avg_g = (total_g / pixel_count) as u8;
    let avg_b = (total_b / pixel_count) as u8;

    let (_, s, v) = rgb_to_hsv(avg_r, avg_g, avg_b);

    // Determine border type based on brightness and saturation
    // Simplified logic: Force Black or White (Silver is too rare and causes false positives)
    
    // If it's very bright and low saturation -> White
    if s < 0.20 && v > 0.60 {
        BorderType::White
    } else {
        // Default to Black for everything else (including dark grey/glare)
        // This is safer for MTG cards where 90% are black border
        BorderType::Black
    }
}

/// Detect frame color by analyzing the card frame pixels
pub fn detect_frame_color(image: &DynamicImage) -> FrameColor {
    let (width, height) = image.dimensions();
    
    // Sample points along the left and right frame edges
    let frame_x_left = (width as f32 * 0.05) as u32;
    let frame_x_right = (width as f32 * 0.95) as u32;
    let start_y = (height as f32 * 0.15) as u32;
    let end_y = (height as f32 * 0.85) as u32;
    
    let mut total_r = 0u64;
    let mut total_g = 0u64;
    let mut total_b = 0u64;
    let mut pixel_count = 0u64;

    // Sample left frame
    for y in (start_y..end_y).step_by(10) {
        if y < height && frame_x_left < width {
            let pixel = image.get_pixel(frame_x_left, y);
            total_r += pixel[0] as u64;
            total_g += pixel[1] as u64;
            total_b += pixel[2] as u64;
            pixel_count += 1;
        }
    }

    // Sample right frame
    for y in (start_y..end_y).step_by(10) {
        if y < height && frame_x_right < width {
            let pixel = image.get_pixel(frame_x_right, y);
            total_r += pixel[0] as u64;
            total_g += pixel[1] as u64;
            total_b += pixel[2] as u64;
            pixel_count += 1;
        }
    }

    if pixel_count == 0 {
        return FrameColor::Unknown;
    }

    let avg_r = (total_r / pixel_count) as u8;
    let avg_g = (total_g / pixel_count) as u8;
    let avg_b = (total_b / pixel_count) as u8;

    let (h, s, v) = rgb_to_hsv(avg_r, avg_g, avg_b);

    // Classify color based on HSV values
    // Check in order of specificity
    if v < 0.25 {
        // Very dark - black/artifact frame
        FrameColor::Black
    } else if s < 0.20 && v > 0.60 {
        // Low saturation, high brightness - white/colorless
        FrameColor::White
    } else if h >= 200.0 && h <= 260.0 && s > 0.25 {
        // Blue hue with decent saturation
        FrameColor::Blue
    } else if ((h >= 0.0 && h <= 20.0) || (h >= 345.0 && h <= 360.0)) && s > 0.25 {
        // Red hue with decent saturation
        FrameColor::Red
    } else if h >= 90.0 && h <= 150.0 && s > 0.25 {
        // Green hue with decent saturation
        FrameColor::Green
    } else if h >= 35.0 && h <= 65.0 && s > 0.35 && v > 0.40 {
        // Yellow/gold - multicolor cards
        FrameColor::Gold
    } else if h >= 15.0 && h <= 45.0 && s > 0.15 && s < 0.50 && v > 0.25 && v < 0.65 {
        // Brown/tan - artifacts and lands (old frame)
        // This is the tricky one - artifacts have a brownish frame
        FrameColor::Black  // Treat as artifact/colorless
    } else if h >= 20.0 && h <= 50.0 && v > 0.50 {
        // Lighter brown/tan - could be land
        FrameColor::Land
    } else {
        FrameColor::Unknown
    }
}

/// Detect frame style (simplified version for now)
pub fn detect_frame_style(_image: &DynamicImage) -> FrameStyle {
    // For now, return Unknown - this would require more sophisticated analysis
    // Could be enhanced by detecting texture patterns, holographic effects, etc.
    FrameStyle::Unknown
}

/// Calculate perceptual hash (dHash) of an image
/// Resizes to 9x8, converts to grayscale, and compares adjacent pixels
pub fn calculate_phash(image: &DynamicImage) -> u64 {
    // 1. Resize to 9x8 (width x height) using FilterType::Lanczos3 for quality
    // We need 9 pixels per row to produce 8 differences
    let resized = image.resize_exact(9, 8, image::imageops::FilterType::Lanczos3);
    
    // 2. Convert to grayscale
    let gray = resized.to_luma8();
    
    let mut hash = 0u64;
    
    // 3. Compute differences
    for y in 0..8 {
        for x in 0..8 {
            let p_left = gray.get_pixel(x, y)[0];
            let p_right = gray.get_pixel(x + 1, y)[0];
            
            if p_left > p_right {
                hash |= 1 << (y * 8 + x);
            }
        }
    }
    
    hash
}

/// Calculate Hamming distance between two hashes
/// Returns the number of differing bits (0-64)
/// Lower distance means more similar images
pub fn hamming_distance(hash1: u64, hash2: u64) -> u32 {
    (hash1 ^ hash2).count_ones()
}

/// Detect corner dots (white dots in bottom corners)
pub fn detect_corner_dots(image: &DynamicImage) -> bool {
    let (width, height) = image.dimensions();
    
    // Check bottom-left corner
    let corner_size = 20u32;
    let bottom_left_x = (width as f32 * 0.05) as u32;
    let bottom_left_y = height.saturating_sub(corner_size);
    
    let bottom_right_x = (width as f32 * 0.95) as u32;
    
    let mut white_pixels_left = 0;
    let mut white_pixels_right = 0;
    let mut total_pixels = 0;

    // Sample bottom-left area
    for y in bottom_left_y..height {
        for x in bottom_left_x.saturating_sub(corner_size/2)..bottom_left_x.saturating_add(corner_size/2) {
            if x < width && y < height {
                let pixel = image.get_pixel(x, y);
                let (_, s, v) = rgb_to_hsv(pixel[0], pixel[1], pixel[2]);
                if s < 0.2 && v > 0.8 {
                    white_pixels_left += 1;
                }
                total_pixels += 1;
            }
        }
    }

    // Sample bottom-right area
    for y in bottom_left_y..height {
        for x in bottom_right_x.saturating_sub(corner_size/2)..bottom_right_x.saturating_add(corner_size/2) {
            if x < width && y < height {
                let pixel = image.get_pixel(x, y);
                let (_, s, v) = rgb_to_hsv(pixel[0], pixel[1], pixel[2]);
                if s < 0.2 && v > 0.8 {
                    white_pixels_right += 1;
                }
                total_pixels += 1;
            }
        }
    }

    // If more than 30% of pixels in both corners are white, consider it has corner dots
    let threshold = (total_pixels as f32 * 0.3) as u32;
    white_pixels_left > threshold && white_pixels_right > threshold
}

/// Extract all card features from an image
pub fn extract_card_features(image_data: &[u8]) -> Result<CardFeatures, String> {
    use base64::prelude::*;
    
    // Decode base64 if needed
    let image_bytes = if let Ok(decoded) = BASE64_STANDARD.decode(image_data) {
        decoded
    } else {
        image_data.to_vec()
    };

    // Load image
    let image = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    Ok(CardFeatures {
        border_type: detect_border_type(&image),
        frame_color: detect_frame_color(&image),
        frame_style: detect_frame_style(&image),
        has_corner_dots: detect_corner_dots(&image),
        is_foil: false, // TODO: Implement foil detection
        phash: calculate_phash(&image),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rgb_to_hsv() {
        // Test pure red
        let (h, s, v) = rgb_to_hsv(255, 0, 0);
        assert!((h - 0.0).abs() < 1.0);
        assert!((s - 1.0).abs() < 0.01);
        assert!((v - 1.0).abs() < 0.01);

        // Test pure blue
        let (h, s, v) = rgb_to_hsv(0, 0, 255);
        assert!((h - 240.0).abs() < 1.0);
        assert!((s - 1.0).abs() < 0.01);
        assert!((v - 1.0).abs() < 0.01);
    }
}
