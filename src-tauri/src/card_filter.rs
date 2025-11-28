use crate::card_features::{BorderType, CardFeatures, FrameColor, FrameStyle};

/// Build a Scryfall search query based on detected card features
pub fn build_search_query(features: &CardFeatures, ocr_text: Option<String>) -> String {
    let mut query_parts = Vec::new();

    // Add OCR text if available
    if let Some(text) = ocr_text {
        if !text.trim().is_empty() {
            query_parts.push(text.trim().to_string());
        }
    }

    // Add color filter based on frame color
    match features.frame_color {
        FrameColor::Blue => query_parts.push("c:u".to_string()),
        FrameColor::Red => query_parts.push("c:r".to_string()),
        FrameColor::Green => query_parts.push("c:g".to_string()),
        FrameColor::White => query_parts.push("c:w".to_string()),
        FrameColor::Black => query_parts.push("c:b".to_string()),
        FrameColor::Gold => query_parts.push("c:m".to_string()), // multicolor
        FrameColor::Land => query_parts.push("t:land".to_string()),
        FrameColor::Unknown => {}
    }

    // Add border filter
    match features.border_type {
        BorderType::Black => query_parts.push("border:black".to_string()),
        BorderType::White => query_parts.push("border:white".to_string()),
        BorderType::Silver => query_parts.push("border:silver".to_string()),
        BorderType::Unknown => {}
    }

    // Add frame style filter
    match features.frame_style {
        FrameStyle::OldFrame => query_parts.push("frame:old".to_string()),
        FrameStyle::ModernFrame => query_parts.push("frame:modern".to_string()),
        FrameStyle::M15Frame => query_parts.push("frame:2015".to_string()),
        FrameStyle::Unknown => {}
    }

    // Join all parts with spaces
    if query_parts.is_empty() {
        // If no features detected, return a generic query
        "*".to_string()
    } else {
        query_parts.join(" ")
    }
}

/// Get a description of the detected features for debugging/UI
pub fn describe_features(features: &CardFeatures) -> String {
    let mut parts = Vec::new();

    match features.border_type {
        BorderType::Black => parts.push("Black border"),
        BorderType::White => parts.push("White border"),
        BorderType::Silver => parts.push("Silver border"),
        BorderType::Unknown => parts.push("Unknown border"),
    }

    match features.frame_color {
        FrameColor::Blue => parts.push("Blue frame"),
        FrameColor::Red => parts.push("Red frame"),
        FrameColor::Green => parts.push("Green frame"),
        FrameColor::White => parts.push("White frame"),
        FrameColor::Black => parts.push("Black frame"),
        FrameColor::Gold => parts.push("Multicolor frame"),
        FrameColor::Land => parts.push("Land frame"),
        FrameColor::Unknown => parts.push("Unknown frame color"),
    }

    match features.frame_style {
        FrameStyle::OldFrame => parts.push("Old frame style"),
        FrameStyle::ModernFrame => parts.push("Modern frame style"),
        FrameStyle::M15Frame => parts.push("M15 frame style"),
        FrameStyle::Unknown => {}
    }

    if features.has_corner_dots {
        parts.push("Has corner dots");
    }

    if features.is_foil {
        parts.push("Foil");
    }

    parts.join(", ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_query_with_blue_card() {
        let features = CardFeatures {
            border_type: BorderType::White,
            frame_color: FrameColor::Blue,
            frame_style: FrameStyle::Unknown,
            has_corner_dots: false,
            is_foil: false,
            phash: 0,
        };

        let query = build_search_query(&features, Some("Counterspell".to_string()));
        assert!(query.contains("Counterspell"));
        assert!(query.contains("c:u"));
        assert!(query.contains("border:white"));
    }

    #[test]
    fn test_build_query_with_old_black_border() {
        let features = CardFeatures {
            border_type: BorderType::Black,
            frame_color: FrameColor::Red,
            frame_style: FrameStyle::OldFrame,
            has_corner_dots: false,
            is_foil: false,
            phash: 0,
        };

        let query = build_search_query(&features, Some("Lightning Bolt".to_string()));
        assert!(query.contains("Lightning Bolt"));
        assert!(query.contains("c:r"));
        assert!(query.contains("border:black"));
        assert!(query.contains("frame:old"));
    }
}
