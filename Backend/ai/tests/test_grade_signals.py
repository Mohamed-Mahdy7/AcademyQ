from decimal import Decimal
from django.test import TestCase
from datetime import date

from core.models import Academy, User, Students
from structure.models import Subject, Class
from financial_operations.models import Enrollment
from grades.models import Grade

from ai.agent.helpers.grade_signal import get_avg_score_last_2


class GetAvgScoreLast2Tests(TestCase):
    def setUp(self):
        self.academy = Academy.objects.create(
            name="Test Academy", email="academy@test.com"
        )
        self.subject = Subject.objects.create(
            academy=self.academy, name="Math", description="Math"
        )
        self.cls = Class.objects.create(
            academy=self.academy,
            subject=self.subject,
            name="Math G7",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            session_count=20,
            session_price=100,
        )
        self.student = User.objects.create_user(
            email="student@test.com",
            password="test1234",
            full_name="Test Student",
            phone="01000000000",
            role="S",
            academy=self.academy,
        )
        self.student_obj = Students.objects.create(
            user=self.student,
            academy=self.academy,
            parent_email="parent@test.com",
            educational_level=7,
            status="A",
            enrolled_at=date(2026, 1, 1),
        )
        self.enrollment = Enrollment.objects.create(
            class_id=self.cls,
            student_id=self.student_obj,
            start_date=date(2026, 1, 1),
            status="active",
        )

    def _make_grade(self, score, max_score, assigned_at):
        return Grade.objects.create(
            enrollment=self.enrollment,
            session=None,
            subject_name="Math",
            score=Decimal(str(score)),
            max_score=Decimal(str(max_score)),
            assigned_at=assigned_at,
        )

    def test_no_grades_returns_none(self):
        result = get_avg_score_last_2(self.enrollment.id)
        self.assertIsNone(result)

    def test_single_grade_returns_none(self):
        self._make_grade(8, 10, date(2026, 1, 5))
        result = get_avg_score_last_2(self.enrollment.id)
        self.assertIsNone(result)

    def test_two_grades_returns_average(self):
        self._make_grade(8, 10, date(2026, 1, 5))   # 80%
        self._make_grade(6, 10, date(2026, 1, 12))  # 60%
        result = get_avg_score_last_2(self.enrollment.id)
        self.assertEqual(result, 70.0)

    def test_uses_only_last_two_by_assigned_at(self):
        self._make_grade(10, 10, date(2026, 1, 1))  # 100% - oldest, excluded
        self._make_grade(4, 10, date(2026, 1, 10))  # 40%
        self._make_grade(2, 10, date(2026, 1, 20))  # 20% - most recent
        result = get_avg_score_last_2(self.enrollment.id)
        # average of 40% and 20% = 30%, not influenced by the 100%
        self.assertEqual(result, 30.0)

    def test_different_enrollment_not_included(self):
        other_student = User.objects.create_user(
            email="other@test.com",
            password="test1234",
            full_name="Other Student",
            phone="01000000001",
            role="S",
            academy=self.academy,
        )
        other_student_obj = Students.objects.create(
            user=other_student,
            academy=self.academy,
            parent_email="other_parent@test.com",
            educational_level=7,
            status="A",
            enrolled_at=date(2026, 1, 1),
        )
        other_enrollment = Enrollment.objects.create(
            class_id=self.cls,
            student_id=other_student_obj,
            start_date=date(2026, 1, 1),
            status="active",
        )
        Grade.objects.create(
            enrollment=other_enrollment,
            session=None,
            subject_name="Math",
            score=Decimal("1"),
            max_score=Decimal("10"),
            assigned_at=date(2026, 1, 5),
        )

        # original enrollment still has no grades
        result = get_avg_score_last_2(self.enrollment.id)
        self.assertIsNone(result)

    def test_zero_max_score_treated_as_zero_percent(self):
        self._make_grade(5, 10, date(2026, 1, 1))
        self._make_grade(0, 0, date(2026, 1, 10))  # edge case: max_score=0
        result = get_avg_score_last_2(self.enrollment.id)
        # (50% + 0%) / 2 = 25%
        self.assertEqual(result, 25.0)