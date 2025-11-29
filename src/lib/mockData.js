export const mockGames = [
  {
    id: "730",
    name: "Counter-Strike 2",
    header_image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    release_date: "2023-09-27",
    developers: ["Valve"],
    publishers: ["Valve"],
    genres: ["Action", "FPS"],
    platforms: { windows: true, mac: true, linux: true },
    current_price: 0,
    original_price: 0,
    discount_percent: 0,
    historical_low: 0,
    price_grade: "A+",
    forecast: "stable"
  },
  {
    id: "1091500",
    name: "Cyberpunk 2077",
    header_image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
    release_date: "2020-12-10",
    developers: ["CD PROJEKT RED"],
    publishers: ["CD PROJEKT RED"],
    genres: ["RPG", "Action"],
    platforms: { windows: true, mac: false, linux: false },
    current_price: 29.99,
    original_price: 59.99,
    discount_percent: 50,
    historical_low: 24.99,
    price_grade: "B",
    forecast: "rising"
  },
  {
    id: "1174180",
    name: "Red Dead Redemption 2",
    header_image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
    release_date: "2019-12-05",
    developers: ["Rockstar Games"],
    publishers: ["Rockstar Games"],
    genres: ["Action", "Adventure"],
    platforms: { windows: true, mac: false, linux: false },
    current_price: 19.79,
    original_price: 59.99,
    discount_percent: 67,
    historical_low: 19.79,
    price_grade: "A",
    forecast: "stable"
  },
  {
    id: "271590",
    name: "Grand Theft Auto V",
    header_image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80",
    release_date: "2015-04-14",
    developers: ["Rockstar North"],
    publishers: ["Rockstar Games"],
    genres: ["Action", "Adventure"],
    platforms: { windows: true, mac: false, linux: false },
    current_price: 14.99,
    original_price: 29.99,
    discount_percent: 50,
    historical_low: 7.49,
    price_grade: "C",
    forecast: "falling"
  },
  {
    id: "1245620",
    name: "Elden Ring",
    header_image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
    release_date: "2022-02-25",
    developers: ["FromSoftware"],
    publishers: ["FromSoftware"],
    genres: ["RPG", "Action"],
    platforms: { windows: true, mac: false, linux: false },
    current_price: 47.99,
    original_price: 59.99,
    discount_percent: 20,
    historical_low: 39.99,
    price_grade: "D",
    forecast: "rising"
  },
  {
    id: "1091501",
    name: "Baldur's Gate 3",
    header_image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80",
    release_date: "2023-08-03",
    developers: ["Larian Studios"],
    publishers: ["Larian Studios"],
    genres: ["RPG", "Strategy"],
    platforms: { windows: true, mac: true, linux: false },
    current_price: 53.99,
    original_price: 59.99,
    discount_percent: 10,
    historical_low: 53.99,
    price_grade: "B+",
    forecast: "stable"
  },
  {
    id: "813780",
    name: "Age of Empires IV",
    header_image: "https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?w=800&q=80",
    release_date: "2021-10-28",
    developers: ["Relic Entertainment"],
    publishers: ["Xbox Game Studios"],
    genres: ["Strategy"],
    platforms: { windows: true, mac: false, linux: false },
    current_price: 19.99,
    original_price: 59.99,
    discount_percent: 67,
    historical_low: 15.99,
    price_grade: "B",
    forecast: "stable"
  },
  {
    id: "1887720",
    name: "Hogwarts Legacy",
    header_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    release_date: "2023-02-10",
    developers: ["Avalanche Software"],
    publishers: ["Warner Bros. Games"],
    genres: ["RPG", "Action"],
    platforms: { windows: true, mac: false, linux: false },
    current_price: 35.99,
    original_price: 59.99,
    discount_percent: 40,
    historical_low: 29.99,
    price_grade: "C+",
    forecast: "falling"
  }
];

export const generatePriceHistory = (gameId, currentPrice, historicalLow) => {
  const history = [];
  const now = new Date();
  const variation = currentPrice * 0.3;
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    let price;
    if (i === 0) {
      price = currentPrice;
    } else if (i === 45) {
      price = historicalLow;
    } else {
      const randomFactor = Math.random();
      price = currentPrice - variation + (randomFactor * variation * 2);
      price = Math.max(historicalLow, Math.min(currentPrice * 1.2, price));
    }
    
    history.push({
      date: date.toISOString(),
      price: parseFloat(price.toFixed(2))
    });
  }
  
  return history;
};

export const mockRetailers = [
  { name: "Steam", price: null, link: "#" },
  { name: "Epic Games", price: null, discount: null, link: "#" },
  { name: "GOG", price: null, discount: null, link: "#" },
  { name: "Green Man Gaming", price: null, discount: null, link: "#" },
  { name: "Humble Store", price: null, discount: null, link: "#" }
];