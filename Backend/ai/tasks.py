import time

from celery import shared_task

@shared_task
def send_email():
    for x in range(5):
        print(x)
        time.sleep(1)