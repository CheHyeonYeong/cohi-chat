from datetime import date, timedelta

def get_start_weekday_of_month(year, month):
    """월의 시작 요일을 반환합니다 (0=월요일, 6=일요일).

    >>> get_start_weekday_of_month(2024, 12)
    6
    >>> get_start_weekday_of_month(2025, 2)
    5
    """
    result = date(year, month, 1)
    return result.weekday()

def get_last_day_of_month(year, month):
    """월의 마지막 날짜를 반환합니다.

    >>> get_last_day_of_month(2024, 2)
    29
    >>> get_last_day_of_month(2025, 2)
    28
    >>> get_last_day_of_month(2024, 4)
    30
    >>> get_last_day_of_month(2024, 12)
    31
    """
    if month == 12:
        next_month = date(year + 1, 1, 1)
    else:
        next_month = date(year, month + 1, 1)
    result = next_month - timedelta(days=1)
    return result.day
    
def get_range_of_month(year, month):
    """월의 날짜 범위를 캘린더 그리드 형태로 반환합니다 (일요일=0 시작, padding 포함).

    >>> days = get_range_of_month(2024, 3)
    >>> len(days)
    35
    >>> days[:4]
    [0, 0, 0, 0]
    >>> days[4]
    1
    >>> days = get_range_of_month(2024, 12)
    >>> len(days)
    31
    >>> days[0]
    1
    """
    start_weekday = get_start_weekday_of_month(year, month)
    last_day = get_last_day_of_month(year, month)

    # 월요일=0을 월요일을 =1으로 변환
    start_weekday = (start_weekday+1)%7

    # 결과 리스트 생성
    result = [0] * start_weekday # 시작 요일 전까지 0으로 채움

    # 1일부터 마지막 날까지 추가
    # for day in range(1, last_day+1):
    #     result.append(day)

    return result + list(range(1,last_day+1))