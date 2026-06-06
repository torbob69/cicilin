# Global rank and XP constants — single source of truth for all services

# Descending order for first-match threshold lookup
XP_THRESHOLDS: list[tuple[int, str]] = [
    (2000, "Ruby"),
    (1500, "Diamond"),
    (1000, "Platinum"),
    (600,  "Gold"),
    (300,  "Silver"),
    (100,  "Bronze"),
    (0,    "Iron"),
]

# grade: ML loan_grade fed to model
# monthly_limit: IDR cap per month
# interest_rate: annual % locked at application time
# xp_next: XP needed to reach next rank (None = already max)
RANK_CONFIG: dict[str, dict] = {
    "Ruby":     {"grade": "A", "monthly_limit": 100_000_000, "interest_rate": 6.0,  "xp_next": None},
    "Diamond":  {"grade": "B", "monthly_limit": 50_000_000,  "interest_rate": 9.0,  "xp_next": 2000},
    "Platinum": {"grade": "C", "monthly_limit": 25_000_000,  "interest_rate": 12.0, "xp_next": 1500},
    "Gold":     {"grade": "D", "monthly_limit": 10_000_000,  "interest_rate": 15.0, "xp_next": 1000},
    "Silver":   {"grade": "E", "monthly_limit": 5_000_000,   "interest_rate": 18.0, "xp_next": 600},
    "Bronze":   {"grade": "F", "monthly_limit": 2_000_000,   "interest_rate": 24.0, "xp_next": 300},
    "Iron":     {"grade": "G", "monthly_limit": 0,           "interest_rate": 0.0,  "xp_next": 100},
}

# Daily XP drain while user has at least one overdue repayment
DAILY_DRAIN: dict[str, int] = {
    "Ruby":     -3,
    "Diamond":  -3,
    "Platinum": -2,
    "Gold":     -2,
    "Silver":   -1,
    "Bronze":   -1,
    "Iron":     0,
}
