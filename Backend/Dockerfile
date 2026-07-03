FROM python:3.13-slim

# show logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# update kernal + install dep
RUN apt-get update && \
    apt-get install -y gcc libpq-dev gettext && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# copy project code => docker
COPY . .
RUN python manage.py collectstatic --noinput