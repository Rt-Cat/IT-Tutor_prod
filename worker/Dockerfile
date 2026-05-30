FROM python:3.11-slim

WORKDIR /app

# Копіюємо залежності та встановлюємо їх
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо код воркера
COPY main.py .

# Запускаємо слухача черги
CMD ["python", "-u", "main.py"]