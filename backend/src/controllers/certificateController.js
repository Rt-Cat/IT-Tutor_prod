const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { requestCertificateGeneration } = require('../utils/rabbitmq');

exports.downloadUserCertificates = (req, res) => {
    try {
        const userId = req.params.userId;
        const userCertsDir = path.join(__dirname, '../../certs', String(userId));

        // Перевіряємо, чи існує папка
        if (!fs.existsSync(userCertsDir)) {
            return res.status(404).json({ error: 'Сертифікати не знайдені або ще генеруються' });
        }

        // 1. Ініціалізуємо новий ZIP-архів
        const zip = new AdmZip();

        // 2. Додаємо всю папку із сертифікатами в архів
        zip.addLocalFolder(userCertsDir);

        // 3. Генеруємо архів у вигляді буфера (пам'яті)
        const zipBuffer = zip.toBuffer();

        // 4. Відправляємо файл клієнту
        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="certificates_${userId}.zip"`,
            'Content-Length': zipBuffer.length
        });

        res.end(zipBuffer);

    } catch (error) {
        console.error('Помилка завантаження сертифікатів (AdmZip):', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Внутрішня помилка сервера: ' + error.message });
        }
    }
};

exports.triggerGeneration = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // 1. Шукаємо курси, де всі завдання виконані, але сертифікату ще немає
        const query = `
            WITH CourseTaskCounts AS (
                SELECT c.COURSEID, c.TITLE AS COURSE_TITLE, COUNT(t.TASKID) AS TOTAL_TASKS
                FROM AI_MENTOR.COURSES c
                JOIN AI_MENTOR.TASKS t ON c.COURSEID = t.COURSEID
                GROUP BY c.COURSEID, c.TITLE
            ),
            UserCompletedTasks AS (
                SELECT p.USERID, t.COURSEID, COUNT(p.TASKID) AS COMPLETED_TASKS, SUM(p.SCORE) AS FINAL_SCORE
                FROM AI_MENTOR.PROGRESS p
                JOIN AI_MENTOR.TASKS t ON p.TASKID = t.TASKID
                WHERE p.STATUS = 'completed' AND p.USERID = :userId
                GROUP BY p.USERID, t.COURSEID
            )
            SELECT uct.COURSEID, ct.COURSE_TITLE, uct.FINAL_SCORE
            FROM UserCompletedTasks uct
            JOIN CourseTaskCounts ct ON uct.COURSEID = ct.COURSEID
            WHERE uct.COMPLETED_TASKS = ct.TOTAL_TASKS
              AND NOT EXISTS (
                  SELECT 1 FROM AI_MENTOR.CERTIFICATES cert 
                  WHERE cert.USERID = uct.USERID AND cert.COURSEID = uct.COURSEID
              )
        `;
        
        const result = await db.execute(query, { userId });
        
        if (result.rows && result.rows.length > 0) {
            // Отримуємо поточний максимальний ID сертифікату
            const maxIdRes = await db.execute('SELECT NVL(MAX(CERTIFICATEID), 0) AS MAX_ID FROM AI_MENTOR.CERTIFICATES', {});
            let nextId = maxIdRes.rows[0].MAX_ID || 0;

            for (const row of result.rows) {
                nextId++;
                // Генеруємо унікальний код сертифікату
                const certCode = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                
                // Записуємо в базу
                await db.execute(`
                    INSERT INTO AI_MENTOR.CERTIFICATES 
                    (CERTIFICATEID, USERID, COURSEID, CERTIFICATECODE, ISSUEDAT, FINALSCORE)
                    VALUES (:certId, :userId, :courseId, :code, SYSTIMESTAMP, :score)
                `, {
                    certId: nextId,
                    userId: userId,
                    courseId: row.COURSEID, // Враховуйте регістр ключів згідно з вашим DB драйвером
                    code: certCode,
                    score: row.FINAL_SCORE || 0
                }, { autoCommit: true });

                // Відправляємо завдання воркеру в RabbitMQ
                requestCertificateGeneration({
                    userId: userId,
                    certificateId: nextId,
                    courseTitle: row.COURSE_TITLE
                });
            }
            // Повертаємо статус, що процес генерації пішов
            return res.json({ status: 'generating', count: result.rows.length });
        }

        // 2. Якщо нових сертифікатів немає, перевіряємо, чи є хоча б старі
        const checkQuery = `SELECT 1 FROM AI_MENTOR.CERTIFICATES WHERE USERID = :userId FETCH FIRST 1 ROWS ONLY`;
        const checkResult = await db.execute(checkQuery, { userId });

        if (checkResult.rows && checkResult.rows.length > 0) {
            return res.json({ status: 'ready' }); // Є готові старі сертифікати
        } else {
            return res.json({ status: 'empty' }); // Немає ні старих, ні нових
        }

    } catch (error) {
        console.error('Trigger Generation Error:', error);
        res.status(500).json({ error: 'Помилка при перевірці статусу сертифікатів' });
    }
};