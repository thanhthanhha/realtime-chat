import boto3
import csv
import json
from botocore.exceptions import ClientError

def load_csv_to_dynamodb(csv_file, table_name, dynamodb=None):
    """
    Load data from a CSV file to a DynamoDB table.
    """
    if not dynamodb:
        # Create a DynamoDB client
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    
    table = dynamodb.Table(table_name)
    items_processed = 0
    items_succeeded = 0
    
    try:
        with open(csv_file, mode='r', encoding='utf-8') as csvfile:
            csv_reader = csv.DictReader(csvfile)
            
            for row in csv_reader:
                # Clean and convert the data
                item = clean_item(row, table_name)
                
                try:
                    # Insert or update the item in DynamoDB
                    table.put_item(Item=item)
                    items_succeeded += 1
                except ClientError as e:
                    print(f"Error inserting item {row.get('id')}: {e}")
                
                items_processed += 1
                
                # Print progress update every 10 items
                if items_processed % 10 == 0:
                    print(f"Processed {items_processed} items...")
    
    except Exception as e:
        print(f"Error loading data from {csv_file}: {e}")
        return False
    
    print(f"Successfully loaded {items_succeeded} of {items_processed} items from {csv_file} to {table_name}")
    return True

def clean_item(row, table_name):
    """
    Clean and convert an item for DynamoDB insertion based on the table type.
    """
    item = {}
    
    for key, value in row.items():
        # Skip empty values
        if value == "":
            continue
            
        # Clean quotes from the beginning and end of values
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]

        # Convert timestamp to number for messages table
        if key == "timestamp" and table_name == "messages":
            item[key] = f"{value}"
        # Handle friendlist_id for users table
        elif key == "friendlist_id" and table_name == "users":
            try:
                # Parse the JSON string array
                if value.startswith("[") and value.endswith("]"):
                    # Handle the special structure with {"S":"uuid"} format
                    friendlist = []
                    json_data = json.loads(value)
                    for friend in json_data:
                        if isinstance(friend, dict) and "S" in friend:
                            friendlist.append(friend["S"])
                        else:
                            friendlist.append(friend)
                    item[key] = friendlist
                else:
                    item[key] = []
            except json.JSONDecodeError:
                print(f"Error parsing friendlist_id: {value}")
                item[key] = []
        else:
            item[key] = value
            
    return item

def main():
    """
    Main function to run the script.
    """
    # Create a DynamoDB client
    dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-2')
    
    # Define CSV files and corresponding table names
    csv_files = {
        'messages.csv': 'messages'
    }
    
    # Load data from each CSV file to its corresponding DynamoDB table
    for csv_file, table_name in csv_files.items():
        print(f"\nProcessing {csv_file} -> {table_name}...")
        load_csv_to_dynamodb(csv_file, table_name, dynamodb)

if __name__ == "__main__":
    main()