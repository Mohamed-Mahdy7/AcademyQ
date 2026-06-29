"""
Unit tests for risk_scorer — pure function, fixture dicts only, no DB.
"""

import unittest
from ..agent.helpers.risk_scorer import (
    risk_scorer,
    ATTENDANCE_PENALTY,
    OVERDUE_PENALTY,
    LOW_SCORE_PENALTY,
)
from django.test import TestCase
from django.utils import translation
from ai.agent.helpers.risk_scorer import risk_scorer

class TestRiskScorerAllSafe(unittest.TestCase):
    def test_all_signals_healthy(self):
        context = {
            "attendance_pct_28d": 95,
            "overdue_days": 0,
            "avg_score_last_2": 85,
        }
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], 0)
        self.assertEqual(result["risk_level"], "low")
        self.assertEqual(result["primary_reason"], "No significant risk factors detected.")
        self.assertIn("No action needed", result["recommended_action"])


class TestRiskScorerIndividualTriggers(unittest.TestCase):
    def test_low_attendance_only(self):
        context = {
            "attendance_pct_28d": 60,
            "overdue_days": 0,
            "avg_score_last_2": 85,
        }
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], ATTENDANCE_PENALTY)
        self.assertEqual(result["risk_level"], "medium")
        self.assertIn("Attendance dropped", result["primary_reason"])
        self.assertIn("attendance", result["recommended_action"].lower())

    def test_overdue_fees_only(self):
        context = {
            "attendance_pct_28d": 95,
            "overdue_days": 20,
            "avg_score_last_2": 85,
        }
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], OVERDUE_PENALTY)
        self.assertEqual(result["risk_level"], "low")  # 35 <= 39
        self.assertIn("overdue", result["primary_reason"].lower())
        self.assertIn("payment", result["recommended_action"].lower())

    def test_low_scores_only(self):
        context = {
            "attendance_pct_28d": 95,
            "overdue_days": 0,
            "avg_score_last_2": 40,
        }
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], LOW_SCORE_PENALTY)
        self.assertEqual(result["risk_level"], "low")  # 25 <= 39
        self.assertIn("Average score", result["primary_reason"])
        self.assertIn("academic", result["recommended_action"].lower())


class TestRiskScorerCombinations(unittest.TestCase):
    def test_attendance_and_overdue(self):
        context = {
            "attendance_pct_28d": 60,
            "overdue_days": 20,
            "avg_score_last_2": 85,
        }
        result = risk_scorer(context)
        expected = ATTENDANCE_PENALTY + OVERDUE_PENALTY  # 75
        self.assertEqual(result["risk_score"], expected)
        self.assertEqual(result["risk_level"], "high")
        # attendance has priority over overdue for primary_reason
        self.assertIn("Attendance dropped", result["primary_reason"])
        self.assertIn("Urgent", result["recommended_action"])
        self.assertIn("attendance", result["recommended_action"].lower())
        self.assertIn("payment", result["recommended_action"].lower())

    def test_all_three_triggers(self):
        context = {
            "attendance_pct_28d": 50,
            "overdue_days": 30,
            "avg_score_last_2": 30,
        }
        result = risk_scorer(context)
        total = ATTENDANCE_PENALTY + OVERDUE_PENALTY + LOW_SCORE_PENALTY  # 100
        self.assertEqual(result["risk_score"], 100)
        self.assertEqual(result["risk_level"], "high")
        self.assertIn("Urgent", result["recommended_action"])
        self.assertIn("attendance", result["recommended_action"].lower())
        self.assertIn("payment", result["recommended_action"].lower())
        self.assertIn("academic", result["recommended_action"].lower())

    def test_score_caps_at_100(self):
        # Even if penalties summed > 100 theoretically, ensure cap holds
        context = {
            "attendance_pct_28d": 0,
            "overdue_days": 100,
            "avg_score_last_2": 0,
        }
        result = risk_scorer(context)
        self.assertLessEqual(result["risk_score"], 100)


class TestRiskScorerMissingData(unittest.TestCase):
    def test_empty_context(self):
        result = risk_scorer({})
        self.assertEqual(result["risk_score"], 0)
        self.assertEqual(result["risk_level"], "low")
        self.assertEqual(result["primary_reason"], "No significant risk factors detected.")

    def test_none_context(self):
        result = risk_scorer(None)
        self.assertEqual(result["risk_score"], 0)
        self.assertEqual(result["risk_level"], "low")

    def test_partial_context_attendance_missing(self):
        context = {
            "overdue_days": 0,
            "avg_score_last_2": 85,
            # attendance_pct_28d missing entirely
        }
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], 0)
        self.assertEqual(result["risk_level"], "low")

    def test_partial_context_only_overdue_present(self):
        context = {"overdue_days": 25}
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], OVERDUE_PENALTY)
        self.assertEqual(result["risk_level"], "low")


class TestRiskScorerBoundaries(unittest.TestCase):
    def test_attendance_exactly_at_threshold_not_triggered(self):
        # attendance_pct_28d < 70 triggers; == 70 should NOT trigger
        context = {"attendance_pct_28d": 70}
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], 0)

    def test_attendance_just_below_threshold_triggers(self):
        context = {"attendance_pct_28d": 69.9}
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], ATTENDANCE_PENALTY)

    def test_overdue_exactly_at_threshold_not_triggered(self):
        # overdue_days > 14 triggers; == 14 should NOT trigger
        context = {"overdue_days": 14}
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], 0)

    def test_overdue_just_above_threshold_triggers(self):
        context = {"overdue_days": 15}
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], OVERDUE_PENALTY)

    def test_avg_score_exactly_at_threshold_not_triggered(self):
        # avg_score_last_2 < 50 triggers; == 50 should NOT trigger
        context = {"avg_score_last_2": 50}
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], 0)

    def test_avg_score_just_below_threshold_triggers(self):
        context = {"avg_score_last_2": 49.9}
        result = risk_scorer(context)
        self.assertEqual(result["risk_score"], LOW_SCORE_PENALTY)

    def test_risk_level_band_boundaries(self):
        # 39 -> low, 40 -> medium, 69 -> medium, 70 -> high
        self.assertEqual(risk_scorer({"avg_score_last_2": 49})["risk_level"], "low")     # 25
        self.assertEqual(
            risk_scorer({"attendance_pct_28d": 60, "avg_score_last_2": 49})["risk_score"],
            65
        )
        self.assertEqual(
            risk_scorer({"attendance_pct_28d": 60, "avg_score_last_2": 49})["risk_level"],
            "medium"
        )
        self.assertEqual(
            risk_scorer({"attendance_pct_28d": 60, "overdue_days": 20})["risk_score"],
            75
        )
        self.assertEqual(
            risk_scorer({"attendance_pct_28d": 60, "overdue_days": 20})["risk_level"],
            "high"
        )

class TestRiskScorerArabicTranslations(TestCase):
    def test_primary_reason_arabic_attendance(self):
        context = {"attendance_pct_28d": 60, "overdue_days": None, "avg_score_last_2": None}
        with translation.override("ar"):
            result = risk_scorer(context)
        self.assertIn("28", result["primary_reason"])
        self.assertIn("60", result["primary_reason"])
        # confirm Arabic characters present
        self.assertTrue(any('\u0600' <= c <= '\u06ff' for c in result["primary_reason"]))

    def test_primary_reason_english_attendance(self):
        context = {"attendance_pct_28d": 60, "overdue_days": None, "avg_score_last_2": None}
        with translation.override("en"):
            result = risk_scorer(context)
        self.assertIn("Attendance dropped", result["primary_reason"])

    def test_no_risk_arabic(self):
        context = {"attendance_pct_28d": 95, "overdue_days": 0, "avg_score_last_2": 80}
        with translation.override("ar"):
            result = risk_scorer(context)
        self.assertTrue(any('\u0600' <= c <= '\u06ff' for c in result["primary_reason"]))

    def test_urgent_action_arabic(self):
        context = {"attendance_pct_28d": 50, "overdue_days": 20, "avg_score_last_2": 30}
        with translation.override("ar"):
            result = risk_scorer(context)
        self.assertIn("عاجل", result["recommended_action"])

if __name__ == "__main__":
    unittest.main()