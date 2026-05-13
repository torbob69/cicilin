from datetime import date, datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import distinct

from app.core.database import SessionLocal
from app.models.loan_application import LoanApplication
from app.models.repayment import Repayment
from app.models.user import User
from app.services import leaderboard_service, quest_service, xp_service

_DRAIN_PER_RANK: dict[str, int] = {
    "Ruby": 3, "Diamond": 3, "Platinum": 2, "Gold": 2,
    "Silver": 1, "Bronze": 1, "Iron": 0,
}

_scheduler: BackgroundScheduler | None = None


def run_overdue_detect() -> None:
    """Mark pending repayments past their due date as overdue."""
    db = SessionLocal()
    try:
        today = date.today()
        updated = (
            db.query(Repayment)
            .filter(Repayment.due_date < today, Repayment.status == "pending")
            .update({"status": "overdue"}, synchronize_session=False)
        )
        db.commit()
        print(f"[overdue_detect] Marked {updated} repayments as overdue.")
    except Exception as e:
        db.rollback()
        print(f"[overdue_detect] Error: {e}")
    finally:
        db.close()


def run_daily_drain() -> None:
    """Apply passive XP drain to users with at least one overdue repayment."""
    db = SessionLocal()
    try:
        user_ids = [
            uid
            for (uid,) in (
                db.query(distinct(LoanApplication.user_id))
                .join(Repayment, Repayment.loan_id == LoanApplication.id)
                .filter(Repayment.status == "overdue")
                .all()
            )
        ]
        if not user_ids:
            return
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        drained = 0
        for user in users:
            drain = _DRAIN_PER_RANK.get(user.rank, 0)
            if drain > 0:
                xp_service.add_xp(db, user, -drain, "daily_drain")
                drained += 1
        if drained:
            db.commit()
            leaderboard_service.invalidate_cache()
        print(f"[daily_drain] Applied XP drain to {drained} users.")
    except Exception as e:
        db.rollback()
        print(f"[daily_drain] Error: {e}")
    finally:
        db.close()


def run_quest_eval() -> None:
    """Evaluate auto-checkable quests for users who made payments this month."""
    db = SessionLocal()
    try:
        today = date.today()
        month_start = datetime(today.year, today.month, 1)
        user_ids = [
            uid
            for (uid,) in (
                db.query(distinct(LoanApplication.user_id))
                .join(Repayment, Repayment.loan_id == LoanApplication.id)
                .filter(Repayment.paid_at >= month_start)
                .all()
            )
        ]
        if not user_ids:
            return
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        for user in users:
            quest_service.evaluate_quests_for_user(db, user)
        print(f"[quest_eval] Evaluated quests for {len(users)} users.")
    except Exception as e:
        db.rollback()
        print(f"[quest_eval] Error: {e}")
    finally:
        db.close()


def run_quest_randomize() -> None:
    """Initialize the monthly quest list for the current month (runs on the 1st)."""
    db = SessionLocal()
    try:
        quest_service.ensure_monthly_quests(db)
        print("[quest_randomize] Monthly quests initialized.")
    except Exception as e:
        db.rollback()
        print(f"[quest_randomize] Error: {e}")
    finally:
        db.close()


def start_scheduler() -> None:
    global _scheduler
    _scheduler = BackgroundScheduler(timezone="Asia/Jakarta")
    _scheduler.add_job(run_overdue_detect,  CronTrigger(hour=6,  minute=0))
    _scheduler.add_job(run_daily_drain,     CronTrigger(hour=0,  minute=0))
    _scheduler.add_job(run_quest_eval,      CronTrigger(hour=0,  minute=30))
    _scheduler.add_job(run_quest_randomize, CronTrigger(day=1,   hour=0,  minute=5))
    _scheduler.start()
    print("[scheduler] Background jobs started.")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        print("[scheduler] Background jobs stopped.")
