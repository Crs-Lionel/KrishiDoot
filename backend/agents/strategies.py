"""
Negotiation Strategies — Game Theory Layer
Owned by: Person 2

Boulware:  Hold high price, concede sharply only near deadline.
           For non-perishables (wheat, rice, dal).

Conceder:  Drop price quickly early to secure a fast deal.
           For highly perishable crops in heat (tomato, leafy greens).
"""


def _clamp_round_progress(round_num: int, max_rounds: int) -> float:
    if max_rounds <= 0:
        return 1.0
    return min(max(round_num / max_rounds, 0.0), 1.0)


def boulware_ask(initial_ask: float, reservation_price: float, round_num: int, max_rounds: int) -> float:
    """
    Cubic concession curve — slow at first, then sharp drop near deadline.
    Agent holds firm for 70% of rounds, then concedes quickly.
    """
    t = _clamp_round_progress(round_num, max_rounds)
    concession_rate = t ** 3
    new_ask = initial_ask - (initial_ask - reservation_price) * concession_rate
    return round(max(new_ask, reservation_price), 2)


def conceder_ask(initial_ask: float, reservation_price: float, round_num: int, max_rounds: int) -> float:
    """
    Quadratic concession curve — drops fast early, then stabilizes near floor.
    Agent concedes 60% of the gap in first 3 rounds to close the deal quickly.
    """
    t = _clamp_round_progress(round_num, max_rounds)
    concession_rate = 1 - (1 - t) ** 2
    new_ask = initial_ask - (initial_ask - reservation_price) * concession_rate
    return round(max(new_ask, reservation_price), 2)


def select_strategy(
    is_perishable: bool,
    initial_ask: float,
    reservation_price: float,
    round_num: int,
    max_rounds: int,
) -> float:
    """
    Route to the correct strategy based on crop perishability.
    Always returns a price >= reservation_price.
    """
    if is_perishable:
        return conceder_ask(initial_ask, reservation_price, round_num, max_rounds)
    return boulware_ask(initial_ask, reservation_price, round_num, max_rounds)
