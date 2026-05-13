import random
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.models.loan_application import LoanApplication
from app.models.monthly_quest import MonthlyQuest
from app.models.repayment import Repayment
from app.models.user import User
from app.models.user_quest_progress import UserQuestProgress
from app.schemas.quest import ActiveQuestsResponse, QuestResponse
from app.services import xp_service

QUEST_POOL: dict[int, dict] = {
    1:  {"title": "Lunasi minimal 1 cicilan tepat waktu bulan ini",                              "xp_reward": 30},
    2:  {"title": "Bayar cicilan lebih awal 2 hari sebelum jatuh tempo",                         "xp_reward": 50},
    3:  {"title": "Lunasi minimal Rp 500.000 total cicilan bulan ini",                           "xp_reward": 60},
    4:  {"title": "Lunasi minimal Rp 1.000.000 total cicilan bulan ini",                         "xp_reward": 100},
    5:  {"title": "Lunasi minimal Rp 5.000.000 total cicilan bulan ini",                         "xp_reward": 200},
    6:  {"title": "Lunasi semua pinjaman aktif bulan ini",                                       "xp_reward": 300},
    7:  {"title": "Bayar semua cicilan tepat waktu bulan ini (tanpa keterlambatan)",             "xp_reward": 120},
    8:  {"title": "Tidak ada keterlambatan lebih dari 1 hari bulan ini",                         "xp_reward": 80},
    9:  {"title": "Lunasi pinjaman terlama yang kamu miliki bulan ini",                          "xp_reward": 150},
    10: {"title": "Kurangi total hutang sebesar 10% bulan ini",                                  "xp_reward": 100},
    11: {"title": "Pertahankan rank minimal Gold selama 30 hari penuh",                          "xp_reward": 80},
    12: {"title": "Naik satu tingkat rank bulan ini",                                            "xp_reward": 200},
    13: {"title": "Login ke aplikasi minimal 15 hari dalam sebulan",                             "xp_reward": 25},
    14: {"title": "Buka aplikasi 5 hari berturut-turut",                                         "xp_reward": 30},
    15: {"title": "Cek status pinjaman setiap hari selama 7 hari berturut-turut",                "xp_reward": 40},
    16: {"title": "Tidak mengajukan pinjaman baru bulan ini",                                    "xp_reward": 50},
    17: {"title": "Bayar cicilan pada hari pertama jatuh tempo atau lebih awal, 2x bulan ini",  "xp_reward": 70},
    18: {"title": "Total cicilan yang dibayar bulan ini melebihi 50% dari limit rank-mu",        "xp_reward": 90},
    19: {"title": "Tidak ada pinjaman dengan status Unpaid bulan ini",                           "xp_reward": 110},
    20: {"title": "Bayar cicilan untuk semua pinjaman aktif setidaknya 1 kali bulan ini",        "xp_reward": 60},
}

# Quests that can be evaluated automatically from repayment data
AUTO_EVAL_QUEST_IDS: frozenset[int] = frozenset({1, 3, 4, 5, 20})


def ensure_monthly_quests(db: Session) -> MonthlyQuest:
    today = date.today()
    record = (
        db.query(MonthlyQuest)
        .filter(MonthlyQuest.year == today.year, MonthlyQuest.month == today.month)
        .first()
    )
    if not record:
        selected = sorted(random.sample(list(QUEST_POOL.keys()), 5))
        record = MonthlyQuest(year=today.year, month=today.month, quest_ids=selected)
        db.add(record)
        db.commit()
        db.refresh(record)
    return record


def get_active_quests(db: Session, user: User) -> ActiveQuestsResponse:
    today = date.today()
    monthly = ensure_monthly_quests(db)
    quests: list[QuestResponse] = []
    for qid in monthly.quest_ids:
        progress = (
            db.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user.id,
                UserQuestProgress.year == today.year,
                UserQuestProgress.month == today.month,
                UserQuestProgress.quest_id == qid,
            )
            .first()
        )
        info = QUEST_POOL[qid]
        quests.append(QuestResponse(
            quest_id=qid,
            title=info["title"],
            xp_reward=info["xp_reward"],
            completed=progress.completed if progress else False,
            completed_at=progress.completed_at if progress else None,
        ))
    return ActiveQuestsResponse(year=today.year, month=today.month, quests=quests)


def evaluate_quests_for_user(db: Session, user: User) -> None:
    today = date.today()
    monthly = ensure_monthly_quests(db)
    to_check = set(monthly.quest_ids) & AUTO_EVAL_QUEST_IDS
    if not to_check:
        return

    month_start = datetime(today.year, today.month, 1)
    paid_this_month = (
        db.query(Repayment)
        .join(LoanApplication, Repayment.loan_id == LoanApplication.id)
        .filter(
            LoanApplication.user_id == user.id,
            Repayment.status == "paid",
            Repayment.paid_at >= month_start,
        )
        .all()
    )

    changed = False
    for qid in to_check:
        progress = (
            db.query(UserQuestProgress)
            .filter(
                UserQuestProgress.user_id == user.id,
                UserQuestProgress.year == today.year,
                UserQuestProgress.month == today.month,
                UserQuestProgress.quest_id == qid,
            )
            .first()
        )
        if progress and progress.completed:
            continue

        if _check_quest_condition(qid, paid_this_month, db, user):
            now = datetime.now(timezone.utc)
            if not progress:
                progress = UserQuestProgress(
                    user_id=user.id,
                    year=today.year,
                    month=today.month,
                    quest_id=qid,
                )
                db.add(progress)
            progress.completed = True
            progress.completed_at = now
            xp_service.add_xp(db, user, QUEST_POOL[qid]["xp_reward"], "quest_complete")
            changed = True

    if changed:
        db.commit()


def _check_quest_condition(
    qid: int, paid_reps: list, db: Session, user: User
) -> bool:
    if qid == 1:
        return any(
            r.paid_at is not None and r.paid_at.date() <= r.due_date
            for r in paid_reps
        )
    if qid == 3:
        return sum(float(r.amount) for r in paid_reps) >= 500_000
    if qid == 4:
        return sum(float(r.amount) for r in paid_reps) >= 1_000_000
    if qid == 5:
        return sum(float(r.amount) for r in paid_reps) >= 5_000_000
    if qid == 20:
        active_loans = (
            db.query(LoanApplication)
            .filter(
                LoanApplication.user_id == user.id,
                LoanApplication.loan_status == "disbursed",
            )
            .all()
        )
        if not active_loans:
            return False
        paid_loan_ids = {r.loan_id for r in paid_reps}
        return all(loan.id in paid_loan_ids for loan in active_loans)
    return False
