const amqp = require('amqplib');

let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();
        await channel.assertQueue('certificate_queue', { durable: true });
        console.log('RabbitMQ connected and queue initialized');
    } catch (error) {
        console.error('RabbitMQ connection error:', error);
    }
}

// Функція-тригер для відправки завдання в чергу
async function requestCertificateGeneration(data) {
    if (!channel) await connectRabbitMQ();
    
    try {
        channel.sendToQueue(
            'certificate_queue', 
            Buffer.from(JSON.stringify(data)),
            { persistent: true }
        );
        console.log(`[x] Завдання на сертифікат відправлено для користувача ${data.userId}`);
    } catch (error) {
        console.error('Error sending message to RabbitMQ:', error);
    }
}

module.exports = { connectRabbitMQ, requestCertificateGeneration };