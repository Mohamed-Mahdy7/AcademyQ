FROM python:latest
# show logs
ENV PYTHONUNBUFFERED=1
# update kernal + install dep
RUN apt-get update && apt-get -y install gcc libpq-dev
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt
# copy project code => docker
COPY . /app/