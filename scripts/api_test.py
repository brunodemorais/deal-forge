import requests
import json

def get_steam_game_price(app_id, currency_code='us'):
    """
    Fetches the price of a Steam game in a specific currency.
    
    Args:
        app_id (int or str): The Steam App ID of the game.
        currency_code (str): The two-letter country code for the currency (e.g., 'us' for USD).
        
    Returns:
        dict: A dictionary containing the game's price details, or None if the request fails.
    """
    url = (
        f"https://store.steampowered.com/api/appdetails"
        f"?appids={app_id}&cc={currency_code}&filters=price_overview"
    )

    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        data = response.json()
        
        # Check if the request was successful and contains data
        if data and data[str(app_id)]['success']:
            price_data = data[str(app_id)]['data']['price_overview']
            return price_data
        else:
            print(f"Failed to retrieve data for App ID {app_id}.")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the request: {e}")
        return None
    except (KeyError, json.JSONDecodeError) as e:
        print(f"Could not parse price data from the response: {e}")
        return None

# --- Example Usage ---
if __name__ == "__main__":
    # Example App ID for The Witcher 3: Wild Hunt is 292030
    game_app_id = 292030
    currency = 'us'  # For United States Dollar

    price_info = get_steam_game_price(game_app_id, currency)
    
    if price_info:
        # Extract the relevant price details
        initial_price = price_info.get('initial')
        final_price = price_info.get('final')
        discount_percent = price_info.get('discount_percent')
        formatted_final_price = price_info.get('final_formatted')
        
        # Steam API prices are in cents, so convert to dollars
        initial_dollars = initial_price / 100
        final_dollars = final_price / 100
        
        print(f"Price for App ID {game_app_id}:")
        print(f"  Currency: {price_info.get('currency')}")
        print(f"  Initial Price: ${initial_dollars:.2f}")
        print(f"  Final Price: {formatted_final_price}")
        print(f"  Discount: {discount_percent}%")

    # Example for a free-to-play game (e.g., Apex Legends)
    free_game_id = 1172470
    price_info_free = get_steam_game_price(free_game_id, currency)
    
    if price_info_free:
        print("\nChecking a free-to-play game:")
        print(f"  Price data found: {price_info_free}")
    else:
        print(f"\nNo price data found for App ID {free_game_id}, likely a free game.")

