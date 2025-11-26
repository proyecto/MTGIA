use crate::models::scryfall::{ScryfallSet, ScryfallSetList};
use reqwest::Client;
use std::error::Error;

pub struct ScryfallService {
    client: Client,
    base_url: String,
}

impl ScryfallService {
    /// Creates a new instance of ScryfallService.
    pub fn new() -> Self {
        let client = Client::builder()
            .user_agent("MTGCollectionManager/0.1.0")
            .build()
            .unwrap_or_else(|_| Client::new());

        ScryfallService {
            client,
            base_url: "https://api.scryfall.com".to_string(),
        }
    }

    /// Fetches all available Magic: The Gathering sets from Scryfall.
    ///
    /// # Returns
    ///
    /// * `Result<Vec<ScryfallSet>, Box<dyn Error>>` - A list of sets or an error.
    pub async fn fetch_sets(&self) -> Result<Vec<ScryfallSet>, Box<dyn Error>> {
        let url = format!("{}/sets", self.base_url);
        let resp = self.client.get(&url).send().await?;
        let text = resp.text().await?;

        // Try to parse as success
        match serde_json::from_str::<ScryfallSetList>(&text) {
            Ok(list) => Ok(list.data),
            Err(_) => {
                // Try to parse as error to give more info
                println!("Raw response that failed to parse: {}", text);
                Err(format!("Failed to parse Scryfall response. Raw: {}", text).into())
            }
        }
    }

    /// Fetches a single card by its Scryfall ID.
    ///
    /// # Arguments
    ///
    /// * `id` - The Scryfall ID of the card.
    ///
    /// # Returns
    ///
    /// * `Result<ScryfallCard, Box<dyn Error>>` - The card data or an error.
    pub async fn fetch_card(
        &self,
        id: &str,
    ) -> Result<crate::models::scryfall::ScryfallCard, Box<dyn Error>> {
        let url = format!("{}/cards/{}", self.base_url, id);
        let resp = self.client.get(&url).send().await?;
        let card: crate::models::scryfall::ScryfallCard = resp.json().await?;
        Ok(card)
    }

    /// Searches for cards using a Scryfall syntax query.
    ///
    /// # Arguments
    ///
    /// * `query` - The search query (e.g., "t:creature").
    /// * `page` - The page number (1-indexed).
    ///
    /// # Returns
    ///
    /// * `Result<ScryfallCardList, Box<dyn Error>>` - A paginated list of cards or an error.
    pub async fn search_cards(
        &self,
        query: &str,
        page: u32,
    ) -> Result<crate::models::scryfall::ScryfallCardList, Box<dyn Error>> {
        let url = format!("{}/cards/search", self.base_url);
        println!("Searching Scryfall: {} (Page {})", query, page);
        let resp = self
            .client
            .get(&url)
            .query(&[
                ("q", query),
                ("unique", "prints"),
                ("page", &page.to_string()),
            ])
            .send()
            .await?;

        let url_debug = resp.url().to_string();
        println!("Request URL: {}", url_debug);

        if resp.status() == reqwest::StatusCode::NOT_FOUND {
            println!("Scryfall returned 404 (No cards found)");
            return Ok(crate::models::scryfall::ScryfallCardList {
                data: vec![],
                has_more: false,
                total_cards: Some(0),
            });
        }

        let list: crate::models::scryfall::ScryfallCardList = resp.json().await?;
        println!(
            "Found {} cards, has_more: {}",
            list.data.len(),
            list.has_more
        );
        Ok(list)
    }

    /// Fetches all cards in a specific set.
    ///
    /// # Arguments
    ///
    /// * `set_code` - The 3-letter code of the set (e.g., "dom").
    /// * `page` - The page number (1-indexed).
    ///
    /// # Returns
    ///
    /// * `Result<ScryfallCardList, Box<dyn Error>>` - A paginated list of cards or an error.
    pub async fn fetch_cards_by_set(
        &self,
        set_code: &str,
        page: u32,
    ) -> Result<crate::models::scryfall::ScryfallCardList, Box<dyn Error>> {
        let url = format!("{}/cards/search", self.base_url);
        let query = format!("e:{}", set_code);
        let resp = self
            .client
            .get(&url)
            .query(&[
                ("q", query.as_str()),
                ("unique", "prints"),
                ("order", "set"),
                ("page", &page.to_string()),
            ])
            .send()
            .await?;

        if resp.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(crate::models::scryfall::ScryfallCardList {
                data: vec![],
                has_more: false,
                total_cards: Some(0),
            });
        }

        let list: crate::models::scryfall::ScryfallCardList = resp.json().await?;
        Ok(list)
    }

    /// Fetches available languages for a specific card in a set.
    ///
    /// # Arguments
    ///
    /// * `oracle_id` - The Oracle ID of the card.
    /// * `set_code` - The set code.
    ///
    /// # Returns
    ///
    /// * `Result<Vec<String>, Box<dyn Error>>` - A list of language codes or an error.
    pub async fn get_card_languages(
        &self,
        oracle_id: &str,
        set_code: &str,
    ) -> Result<Vec<String>, Box<dyn Error>> {
        let url = format!("{}/cards/search", self.base_url);
        let query = format!("oracle_id:{} set:{}", oracle_id, set_code);
        println!(
            "Fetching languages for Oracle ID: {}, Set: {}",
            oracle_id, set_code
        );
        println!("Query: {}", query);

        let resp = self
            .client
            .get(&url)
            .query(&[
                ("q", query.as_str()),
                ("unique", "prints"),
                ("include_multilingual", "true"),
            ])
            .send()
            .await?;

        if resp.status() == reqwest::StatusCode::NOT_FOUND {
            println!("No languages found (404)");
            return Ok(vec![]);
        }

        let list: crate::models::scryfall::ScryfallCardList = resp.json().await?;
        println!("Found {} printings", list.data.len());

        let mut languages: Vec<String> =
            list.data.into_iter().filter_map(|card| card.lang).collect();

        languages.sort();
        languages.dedup();
        println!("Languages found: {:?}", languages);

        Ok(languages)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_search_pagination() {
        let service = ScryfallService::new();
        // "t:creature" definitely has more than 175 cards
        let result = service
            .search_cards("t:creature", 1)
            .await
            .expect("Search failed");

        println!("Found {} cards", result.data.len());
        println!("Has more: {}", result.has_more);
        println!("Total cards: {:?}", result.total_cards);

        assert_eq!(
            result.data.len(),
            175,
            "Should return 175 cards for the first page"
        );
        assert!(result.has_more, "Should have more results");
    }

    #[tokio::test]
    async fn test_search_fbb() {
        let service = ScryfallService::new();
        // Query "fbb" (name search) likely has few results
        let result = service.search_cards("fbb", 1).await.expect("Search failed");

        println!("FBB Search - Found {} cards", result.data.len());
        println!("FBB Search - Has more: {}", result.has_more);

        assert_eq!(
            result.data.len(),
            0,
            "Should return 0 cards for 'fbb' query"
        );
        assert!(!result.has_more, "Should NOT have more results");
    }

    #[tokio::test]
    async fn test_get_card_languages() {
        let service = ScryfallService::new();

        // 1. Fetch Lightning Bolt from M10 to get a valid Oracle ID
        let cards = service
            .search_cards("Lightning Bolt set:m10", 1)
            .await
            .expect("Failed to search card");
        assert!(!cards.data.is_empty(), "Should find Lightning Bolt");
        let card = &cards.data[0];
        let oracle_id = card.oracle_id.as_ref().expect("Card should have oracle_id");

        println!("Found Lightning Bolt, Oracle ID: {}", oracle_id);

        // 2. Test get_card_languages with the valid ID
        let languages = service
            .get_card_languages(oracle_id, "m10")
            .await
            .expect("Failed to fetch languages");

        println!("Languages found for Lightning Bolt (M10): {:?}", languages);
        assert!(languages.contains(&"en".to_string()));
        // M10 Lightning Bolt should be printed in multiple languages
        // If this fails, it might be that Scryfall API behavior changed or my assumption about M10 languages is wrong,
        // but it's a standard set so it should have them.
        assert!(languages.len() > 1, "Should have multiple languages");

        // 3. Test with Alpha Black Lotus (English only)
        let cards_alpha = service
            .search_cards("Black Lotus set:lea", 1)
            .await
            .expect("Failed to search Alpha card");
        assert!(!cards_alpha.data.is_empty(), "Should find Black Lotus");
        let card_alpha = &cards_alpha.data[0];
        let oracle_id_alpha = card_alpha
            .oracle_id
            .as_ref()
            .expect("Card should have oracle_id");

        let languages_alpha = service
            .get_card_languages(oracle_id_alpha, "lea")
            .await
            .expect("Failed to fetch languages for Alpha");

        println!(
            "Languages found for Black Lotus (Alpha): {:?}",
            languages_alpha
        );
        assert_eq!(languages_alpha.len(), 1);
        assert_eq!(languages_alpha[0], "en");
    }
}
