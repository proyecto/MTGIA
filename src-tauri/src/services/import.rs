use std::collections::HashMap;
use std::error::Error;

#[derive(Debug, Clone)]
pub struct ImportCard {
    pub name: String,
    pub set_code: Option<String>,
    pub collector_number: Option<String>,
    pub quantity: i32,
    pub condition: String,
    pub language: String,
    pub is_foil: bool,
    pub finish: String,
    pub tags: Option<String>,
    pub scryfall_id: Option<String>,
}

pub struct ImportService;

impl ImportService {
    pub fn new() -> Self {
        Self
    }

    pub fn parse_csv(&self, content: &str) -> Result<Vec<ImportCard>, Box<dyn Error>> {
        let mut reader = csv::ReaderBuilder::new()
            .has_headers(true)
            .from_reader(content.as_bytes());

        let headers = reader.headers()?.clone();
        let header_map: HashMap<String, usize> = headers
            .iter()
            .enumerate()
            .map(|(i, h)| (h.to_lowercase(), i))
            .collect();

        // Detect format
        if header_map.contains_key("count")
            && header_map.contains_key("name")
            && header_map.contains_key("edition")
        {
            return self.parse_moxfield(reader);
        } else if header_map.contains_key("quantity")
            && header_map.contains_key("name")
            && header_map.contains_key("set code")
        {
            return self.parse_archidekt(reader);
        } else {
            // Fallback to generic/MTGIA format
            return self.parse_generic(reader);
        }
    }

    fn parse_moxfield(
        &self,
        mut reader: csv::Reader<&[u8]>,
    ) -> Result<Vec<ImportCard>, Box<dyn Error>> {
        let mut cards = Vec::new();
        for result in reader.deserialize() {
            let record: HashMap<String, String> = result?;

            let quantity = record
                .get("Count")
                .and_then(|v| v.parse().ok())
                .unwrap_or(1);
            let name = record.get("Name").cloned().unwrap_or_default();
            let set_code = record.get("Edition").cloned();
            let condition = record.get("Condition").cloned().unwrap_or("NM".to_string());
            let language = record
                .get("Language")
                .cloned()
                .unwrap_or("English".to_string());
            let is_foil = record
                .get("Foil")
                .map(|v| v.to_lowercase() == "true")
                .unwrap_or(false);
            let collector_number = record.get("Collector Number").cloned();

            // Map finish based on foil status for Moxfield
            let finish = if is_foil {
                "foil".to_string()
            } else {
                "nonfoil".to_string()
            };

            cards.push(ImportCard {
                name,
                set_code,
                collector_number,
                quantity,
                condition,
                language,
                is_foil,
                finish,
                tags: None,
                scryfall_id: None, // Moxfield CSV might not have ID, or we need to fetch it
            });
        }
        Ok(cards)
    }

    fn parse_archidekt(
        &self,
        mut reader: csv::Reader<&[u8]>,
    ) -> Result<Vec<ImportCard>, Box<dyn Error>> {
        let mut cards = Vec::new();
        for result in reader.deserialize() {
            let record: HashMap<String, String> = result?;

            let quantity = record
                .get("Quantity")
                .and_then(|v| v.parse().ok())
                .unwrap_or(1);
            let name = record.get("Name").cloned().unwrap_or_default();
            let set_code = record.get("Set Code").cloned();
            let is_foil = record
                .get("Foil")
                .map(|v| v.to_lowercase() == "true")
                .unwrap_or(false);

            // Archidekt might not have condition/language in simple export
            let condition = "NM".to_string();
            let language = "English".to_string();
            let finish = if is_foil {
                "foil".to_string()
            } else {
                "nonfoil".to_string()
            };

            cards.push(ImportCard {
                name,
                set_code,
                collector_number: None,
                quantity,
                condition,
                language,
                is_foil,
                finish,
                tags: None,
                scryfall_id: None,
            });
        }
        Ok(cards)
    }

    fn parse_generic(
        &self,
        mut reader: csv::Reader<&[u8]>,
    ) -> Result<Vec<ImportCard>, Box<dyn Error>> {
        let mut cards = Vec::new();
        for result in reader.deserialize() {
            let record: HashMap<String, String> = result?;

            // Try to match standard MTGIA export headers
            let name = record.get("name").cloned().unwrap_or_default();
            let set_code = record.get("set_code").cloned();
            let collector_number = record.get("collector_number").cloned();
            let condition = record.get("condition").cloned().unwrap_or("NM".to_string());
            let quantity = record
                .get("quantity")
                .and_then(|v| v.parse().ok())
                .unwrap_or(1);
            let is_foil = record
                .get("is_foil")
                .map(|v| v == "1" || v.to_lowercase() == "true")
                .unwrap_or(false);
            let language = record
                .get("language")
                .cloned()
                .unwrap_or("English".to_string());
            let finish = record.get("finish").cloned().unwrap_or_else(|| {
                if is_foil {
                    "foil".to_string()
                } else {
                    "nonfoil".to_string()
                }
            });
            let tags = record.get("tags").cloned();
            let scryfall_id = record.get("scryfall_id").cloned();

            cards.push(ImportCard {
                name,
                set_code,
                collector_number,
                quantity,
                condition,
                language,
                is_foil,
                finish,
                tags,
                scryfall_id,
            });
        }
        Ok(cards)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_moxfield() {
        let content = "Count,Name,Edition,Condition,Language,Foil,Tag\n1,Black Lotus,LEA,NM,English,false,Power 9";
        let service = ImportService::new();
        let cards = service.parse_csv(content).unwrap();

        assert_eq!(cards.len(), 1);
        assert_eq!(cards[0].name, "Black Lotus");
        assert_eq!(cards[0].set_code, Some("LEA".to_string()));
        assert_eq!(cards[0].quantity, 1);
        assert!(!cards[0].is_foil);
    }

    #[test]
    fn test_parse_archidekt() {
        let content = "Quantity,Name,Set Code,Foil\n2,Sol Ring,C19,true";
        let service = ImportService::new();
        let cards = service.parse_csv(content).unwrap();

        assert_eq!(cards.len(), 1);
        assert_eq!(cards[0].name, "Sol Ring");
        assert_eq!(cards[0].set_code, Some("C19".to_string()));
        assert_eq!(cards[0].quantity, 2);
        assert!(cards[0].is_foil);
    }

    #[test]
    fn test_parse_generic() {
        let content = "name,set_code,quantity,is_foil\nLightning Bolt,LEA,4,false";
        let service = ImportService::new();
        let cards = service.parse_csv(content).unwrap();

        assert_eq!(cards.len(), 1);
        assert_eq!(cards[0].name, "Lightning Bolt");
        assert_eq!(cards[0].set_code, Some("LEA".to_string()));
        assert_eq!(cards[0].quantity, 4);
    }
}
