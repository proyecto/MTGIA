use crate::models::scryfall::{ScryfallSet, ScryfallSetList};
use reqwest::Client;
use std::error::Error;

pub struct ScryfallService {
    client: Client,
    base_url: String,
}

impl ScryfallService {
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

    pub async fn fetch_card(
        &self,
        id: &str,
    ) -> Result<crate::models::scryfall::ScryfallCard, Box<dyn Error>> {
        let url = format!("{}/cards/{}", self.base_url, id);
        let resp = self.client.get(&url).send().await?;
        let card: crate::models::scryfall::ScryfallCard = resp.json().await?;
        Ok(card)
    }

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
}
