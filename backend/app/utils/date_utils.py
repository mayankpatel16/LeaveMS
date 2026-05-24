from datetime import date, timedelta

def calculate_working_days(start_date: date, end_date: date) -> int:

    if start_date > end_date:
        return 0

    working_days = 0
    current_date = start_date
    
    # Iterate through every day in the range
    while current_date <= end_date:
        # .weekday() returns 0 for Monday, 4 for Friday, 5 for Saturday, 6 for Sunday
        if current_date.weekday() < 5:
            working_days += 1
        
        # Move to the next day
        current_date += timedelta(days=1)
        
    return working_days

def format_date_to_str(date_obj: date) -> str:
    return date_obj.strftime("%Y-%m-%d")