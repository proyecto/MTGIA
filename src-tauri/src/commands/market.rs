use crate::models::scryfall::ScryfallCard;
use crate::services::scryfall::ScryfallService;
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct MarketTrends {
    pub standard_staples: Vec<ScryfallCard>,
    pub modern_staples: Vec<ScryfallCard>,
    pub commander_popularity: Vec<ScryfallCard>,
    pub new_hot: Vec<ScryfallCard>,
}

#[tauri::command]
pub async fn get_market_trends() -> Result<MarketTrends, String> {
    let service = ScryfallService::new();
    let service = Arc::new(service);

    // Define queries
    // Standard Staples: Legal in Standard, sorted by USD price descending
    let standard_query = "f:standard game:paper";

    // Modern Staples: Legal in Modern, sorted by USD price descending
    let modern_query = "f:modern game:paper";

    // Commander Popularity: Sorted by EDHREC rank (popularity)
    // Note: EDHREC rank is ascending (1 is best), but Scryfall sort might differ.
    // "order:edhrec" sorts by rank. Low rank = popular.
    // We want the most popular, so we want the lowest ranks.
    // dir:asc gives 1, 2, 3...
    let commander_query = "game:paper";

    // New & Hot: Released in last 30 days, sorted by USD price
    let new_query = "date>=now-30days game:paper";

    // Run fetches in parallel
    let service_clone1 = service.clone();
    let t1 = tokio::spawn(async move {
        service_clone1
            .get_top_cards(standard_query, "usd", "desc", 10)
            .await
            .map_err(|e| e.to_string())
    });

    let service_clone2 = service.clone();
    let t2 = tokio::spawn(async move {
        service_clone2
            .get_top_cards(modern_query, "usd", "desc", 10)
            .await
            .map_err(|e| e.to_string())
    });

    let service_clone3 = service.clone();
    let t3 = tokio::spawn(async move {
        service_clone3
            .get_top_cards(commander_query, "edhrec", "asc", 10)
            .await
            .map_err(|e| e.to_string())
    });

    let service_clone4 = service.clone();
    let t4 = tokio::spawn(async move {
        service_clone4
            .get_top_cards(new_query, "usd", "desc", 10)
            .await
            .map_err(|e| e.to_string())
    });

    // Await results
    let (r1, r2, r3, r4) = tokio::join!(t1, t2, t3, t4);

    let standard_staples = r1.map_err(|e| e.to_string())??;
    let modern_staples = r2.map_err(|e| e.to_string())??;
    let commander_popularity = r3.map_err(|e| e.to_string())??;
    let new_hot = r4.map_err(|e| e.to_string())??;

    Ok(MarketTrends {
        standard_staples,
        modern_staples,
        commander_popularity,
        new_hot,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_market_trends() {
        // This is an integration test that hits the real Scryfall API.
        // It might be slow or flaky if the API is down.
        let result = get_market_trends().await;

        match result {
            Ok(trends) => {
                println!("Standard Staples: {}", trends.standard_staples.len());
                println!("Modern Staples: {}", trends.modern_staples.len());
                println!(
                    "Commander Popularity: {}",
                    trends.commander_popularity.len()
                );
                println!("New & Hot: {}", trends.new_hot.len());

                assert!(
                    !trends.standard_staples.is_empty(),
                    "Should have standard staples"
                );
                assert!(
                    !trends.modern_staples.is_empty(),
                    "Should have modern staples"
                );
                assert!(
                    !trends.commander_popularity.is_empty(),
                    "Should have commander popularity"
                );
                assert!(!trends.new_hot.is_empty(), "Should have new & hot cards");
            }
            Err(e) => {
                panic!("Failed to get market trends: {}", e);
            }
        }
    }
}
