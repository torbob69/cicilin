from datetime import date, datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import distinct
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.credit_history import CreditHistory
from app.models.loan_application import LoanApplication
from app.models.repayment import Repayment
from app.models.user import User
from app.services import leaderboard_service, quest_service, xp_service

_DRAIN_PER_RANK: dict[str, int] = {
    "Ruby": 3, "Diamond": 3, "Platinum": 2, "Gold": 2,
    "Silver": 1, "Bronze": 1, "Iron": 0,
}

_scheduler: BackgroundScheduler | None = None


def _mark_default_on_file(db: Session, user_id: int) -> None:
    credit = db.query(CreditHistory).filter(CreditHistory.user_id == user_id).first()
    if credit:
        credit.default_on_file = "Y"
    else:
        db.add(CreditHistory(user_id=user_id, default_on_file="Y", cred_hist_length=0))


def run_overdue_detect() -> None:
    """
    Detect overdue repayments and apply tiered XP penalties:
      Tier 1 — pending → overdue (1–7 days past due):   −40 XP
      Tier 2 — 8–30 days past due (penalty still < 100): −100 XP
      Tier 3 — 31+ days past due (default, penalty < 250): −250 XP + credit flag
    penalty column on Repayment tracks the highest tier applied (40 / 100 / 250).
    """
    db = SessionLocal()
    try:
        today = date.today()

        # ── Tier 1: pending → overdue ─────────────────────────────────────────
        newly_overdue: list[tuple] = (
            db.query(Repayment, User)
            .join(LoanApplication, Repayment.loan_id == LoanApplication.id)
            .join(User, LoanApplication.user_id == User.id)
            .filter(Repayment.status == "pending", Repayment.due_date < today)
            .all()
        )
        for rep, user in newly_overdue:
            rep.status  = "overdue"
            rep.penalty = 40
            xp_service.add_xp(db, user, -40, "late_1_7_days")

        # ── Tier 2: 8–30 days overdue ────────────────────────────────────────
        # autoflush=False means DB still has the old status for newly-overdue rows,
        # so Tier 1 repayments are not double-processed here in the same run.
        cutoff_8 = today - timedelta(days=7)
        tier2: list[tuple] = (
            db.query(Repayment, User)
            .join(LoanApplication, Repayment.loan_id == LoanApplication.id)
            .join(User, LoanApplication.user_id == User.id)
            .filter(
                Repayment.status == "overdue",
                Repayment.due_date <= cutoff_8,
                Repayment.penalty < 100,
            )
            .all()
        )
        for rep, user in tier2:
            rep.penalty = 100
            xp_service.add_xp(db, user, -100, "late_8_30_days")

        # ── Tier 3: 31+ days overdue → default ───────────────────────────────
        cutoff_30 = today - timedelta(days=30)
        tier3: list[tuple] = (
            db.query(Repayment, User)
            .join(LoanApplication, Repayment.loan_id == LoanApplication.id)
            .join(User, LoanApplication.user_id == User.id)
            .filter(
                Repayment.status == "overdue",
                Repayment.due_date <= cutoff_30,
                Repayment.penalty < 250,
            )
            .all()
        )
        defaulted_ids: set[int] = set()
        for rep, user in tier3:
            rep.penalty = 250
            xp_service.add_xp(db, user, -250, "default_30plus")
            defaulted_ids.add(user.id)

        for uid in defaulted_ids:
            _mark_default_on_file(db, uid)

        db.commit()

        total = len(newly_overdue) + len(tier2) + len(tier3)
        if total:
            leaderboard_service.invalidate_cache()
        print(
            f"[overdue_detect] tier1={len(newly_overdue)}, "
            f"tier2={len(tier2)}, tier3={len(tier3)}"
        )
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
