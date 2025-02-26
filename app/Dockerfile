FROM python:3.12-alpine

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

ENV PYTHONPATH=/app
CMD ["fastapi", "run", "main.py"]