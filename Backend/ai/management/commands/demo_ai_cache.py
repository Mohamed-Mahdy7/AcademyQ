import time

from django.core.cache import cache
from django.core.management.base import BaseCommand

from ai.models import AIUsageLog
from ai.utils.gemini_client import generate_text
from core.models import Academy


class Command(BaseCommand):
    help = "Runs real generate_text() calls to visibly demonstrate cache hit/miss behavior."

    def add_arguments(self, parser):
        parser.add_argument("--academy-id", type=str, default=None)
        parser.add_argument("--clear-cache", action="store_true")

    def handle(self, *args, **options):
        if options["clear_cache"]:
            cache.clear()
            self.stdout.write(self.style.WARNING("Cache cleared.\n"))

        academy = (
            Academy.objects.get(id=options["academy_id"])
            if options["academy_id"]
            else Academy.objects.first()
        )
        if not academy:
            self.stdout.write(self.style.ERROR("No academy found."))
            return

        prompt_a = "Write one sentence about student attendance habits."
        prompt_b = "Write one sentence about classroom punctuality."

        self._run_call("CALL 1 — new prompt (expect MISS)", prompt_a, academy)
        self._run_call("CALL 2 — same prompt again (expect HIT)", prompt_a, academy)
        self._run_call("CALL 3 — different prompt (expect MISS)", prompt_b, academy)
        self._run_call("CALL 4 — repeat of call 3 (expect HIT)", prompt_b, academy)
        self._print_summary(academy)

    def _run_call(self, label, prompt, academy):
        self.stdout.write(self.style.MIGRATE_HEADING(f"\n{label}"))
        self.stdout.write(f"  prompt: {prompt!r}")

        start = time.time()
        result = generate_text(prompt=prompt, feature="report_card", academy=academy)
        duration = round(time.time() - start, 3)

        log = AIUsageLog.objects.first()  # newest, ordering = ["-called_at"]

        self.stdout.write(f"  response:  {result[:80]}{'...' if len(result) > 80 else ''}")
        self.stdout.write(f"  duration:  {duration}s")
        self.stdout.write(f"  cache_hit: {log.cache_hit}")
        self.stdout.write(f"  tokens:    {log.prompt_token} in / {log.completion_token} out")
        self.stdout.write(f"  cost:      ${log.total_cost_usd}")

        if log.cache_hit:
            self.stdout.write(self.style.SUCCESS("  -> served from Redis, no API call made"))
        else:
            self.stdout.write(self.style.WARNING("  -> real API call made"))

    def _print_summary(self, academy):
        logs = list(AIUsageLog.objects.filter(academy=academy).order_by("called_at"))[-4:]
        total_cost = sum(log.total_cost_usd for log in logs)
        cache_hits = sum(1 for log in logs if log.cache_hit)

        self.stdout.write(self.style.MIGRATE_HEADING("\nSUMMARY"))
        self.stdout.write(f"  calls this run: {len(logs)}")
        self.stdout.write(f"  cache hits:     {cache_hits}")
        self.stdout.write(f"  total cost:     ${total_cost}")
