use crate::services::scryfall::ScryfallService;
use crate::models::collection::CollectionCard;
use std::error::Error;

pub struct PriceService {
    scryfall: ScryfallService,
}

impl PriceService {
    pub fn new() -> Self {
        PriceService {
            scryfall: ScryfallService::new(),
        }
    }

    pub async fn fetch_and_update_price(&self, card: &CollectionCard, currency_pref: &str) -> Result<Option<f64>, Box<dyn Error>> {
        match self.scryfall.fetch_card(&card.scryfall_id).await {
            Ok(scryfall_card) => {
                let price_str = if currency_pref == "EUR" {
                    if card.is_foil { scryfall_card.prices.eur_foil } else { scryfall_card.prices.eur }
                } else {
                    if card.is_foil { scryfall_card.prices.usd_foil } else { scryfall_card.prices.usd }
                };

                if let Some(p) = price_str {
                    if let Ok(price) = p.parse::<f64>() {
                        return Ok(Some(price));
                    }
                }
                Ok(None)
            },
            Err(e) => Err(e)
        }
    }
}
