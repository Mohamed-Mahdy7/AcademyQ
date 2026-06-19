# ai/management/commands/demo_weekly_report.py
from django.core.management.base import BaseCommand
from django.template.loader import render_to_string

from ai.tasks import _collect_weekly_metrics
from ai.utils.gemini_client import generate_text
from ai.utils.prompt_builder import build_management_summary_prompt
from core.models import Academy


class Command(BaseCommand):
    help = "Generates one real weekly report for inspection, without waiting for Sunday."

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

        self.stdout.write(self.style.MIGRATE_HEADING(f"\nGenerating weekly report: {academy.name}"))

        metrics = _collect_weekly_metrics(academy)
        for key, value in metrics.items():
            self.stdout.write(f"  {key}: {value}")

        prompt = build_management_summary_prompt(metrics)
        ai_summary = generate_text(prompt, feature="management_report", academy=academy)
        metrics["ai_summary"] = ai_summary

        self.stdout.write(self.style.MIGRATE_HEADING("\nAI SUMMARY"))
        self.stdout.write(ai_summary)

        html = render_to_string("ai/weekly_report.html", {"metrics": metrics})
        output_path = "/tmp/weekly_report_preview.html"
        with open(output_path, "w") as f:
            f.write(html)

        self.stdout.write(self.style.SUCCESS(f"\nSaved to {output_path}"))
        self.stdout.write("Copy it out to view in a browser:")
        self.stdout.write("  docker compose cp web:/tmp/weekly_report_preview.html ./weekly_report_preview.html")