import os
import time
import json
import pika
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4

# Спільний том для збереження
BASE_CERTS_DIR = "/app/certs"

def generate_pdf(user_id, cert_id, course_title):
    # 1. Створюємо директорії: certs / userId / certificateId
    user_cert_dir = os.path.join(BASE_CERTS_DIR, str(user_id), str(cert_id))
    os.makedirs(user_cert_dir, exist_ok=True)
    
    # Очищуємо назву курсу для назви файлу
    safe_title = "".join(c for c in course_title if c.isalnum() or c in (' ', '_', '-')).strip()
    file_path = os.path.join(user_cert_dir, f"{safe_title}.pdf")
    
    # 2. Генеруємо PDF
    c = canvas.Canvas(file_path, pagesize=landscape(A4))
    
    # ПРИМІТКА: Для української мови потрібно зареєструвати TTF шрифт, 
    # наприклад: pdfmetrics.registerFont(TTFont('DejaVu', 'DejaVuSans.ttf'))
    # Поки що використовуємо стандартний шрифт.
    
    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(420, 450, "CERTIFICATE OF COMPLETION")
    
    c.setFont("Helvetica", 24)
    c.drawCentredString(420, 380, f"Course: {course_title}")
    c.drawCentredString(420, 330, f"Certificate ID: {cert_id}")
    c.drawCentredString(420, 280, f"Issued to User ID: {user_id}")
    
    c.save()
    print(f"[*] Сертифікат збережено: {file_path}")

def callback(ch, method, properties, body):
    try:
        data = json.loads(body)
        print(f"[>] Отримано завдання: {data}")
        
        generate_pdf(
            user_id=data.get('userId'),
            cert_id=data.get('certificateId'),
            course_title=data.get('courseTitle', 'Unknown Course')
        )
        
        # Підтверджуємо успішне виконання
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"[!] Помилка обробки: {e}")
        # Повертаємо в чергу у разі помилки
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def main():
    rabbitmq_url = os.environ.get('RABBITMQ_URL', 'amqp://localhost')
    
    # Чекаємо, поки RabbitMQ підніметься
    connection = None
    while not connection:
        try:
            params = pika.URLParameters(rabbitmq_url)
            connection = pika.BlockingConnection(params)
        except pika.exceptions.AMQPConnectionError:
            print("[!] RabbitMQ недоступний, очікування 5 секунд...")
            time.sleep(5)

    channel = connection.channel()
    channel.queue_declare(queue='certificate_queue', durable=True)
    
    # Воркер бере по одному завданню
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='certificate_queue', on_message_callback=callback)

    print("[*] Worker запущено. Очікування повідомлень...")
    channel.start_consuming()

if __name__ == '__main__':
    main()