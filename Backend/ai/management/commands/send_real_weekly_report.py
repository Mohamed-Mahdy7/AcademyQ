from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.test.utils import override_settings

from ai.tasks import _send_report_for_academy
from core.models import Academy

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Sends ONE real weekly report email via real SMTP (overrides the "
        "console backend for this run only) to verify it actually reaches "
        "an inbox. Requires EMAIL_HOST/EMAIL_HOST_USER/EMAIL_HOST_PASSWORD "
        "to be set in .env -- this is NOT a unit test, run manually."
    )

    def add_arguments(self, parser):
        parser.add_argument("--academy-id", type=str, default=None)

    def handle(self, *args, **options):
        academy = (
            Academy.objects.get(id=options["academy_id"])
            if options["academy_id"] else Academy.objects.first()
        )
        if not academy:
            self.stdout.write(self.style.ERROR("No academy found."))
            return

        owner = User.objects.filter(academy=academy, role=User.Roles.OWNER).first()
        if not owner or not owner.email:
            self.stdout.write(self.style.ERROR(f"No owner email set for {academy.name}."))
            return

        self.stdout.write(self.style.WARNING(
            f"\nSending a REAL email to {owner.email} for academy: {academy.name}"
        ))

        with override_settings(EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend"):
            _send_report_for_academy(academy)

        self.stdout.write(self.style.SUCCESS(f"Sent. Check {owner.email}'s actual inbox now."))