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

    pub async fn fetch_card(&self, id: &str) -> Result<crate::models::scryfall::ScryfallCard, Box<dyn Error>> {
        let url = format!("{}/cards/{}", self.base_url, id);
        let resp = self.client.get(&url).send().await?;
        let card: crate::models::scryfall::ScryfallCard = resp.json().await?;
        Ok(card)
    }

    pub async fn search_cards(&self, query: &str) -> Result<Vec<crate::models::scryfall::ScryfallCard>, Box<dyn Error>> {
        let url = format!("{}/cards/search", self.base_url);
        let resp = self.client.get(&url).query(&[("q", query), ("unique", "prints")]).send().await?;
        let list: crate::models::scryfall::ScryfallCardList = resp.json().await?;
        Ok(list.data)
    }
}
