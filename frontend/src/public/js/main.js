// Автоматичне підсвічування активних посилань навігації
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    document.querySelectorAll('nav a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});

// Асинхронне відправлення коду на перевірку штучним інтелектом (Workspace)
async function submitCodeForEvaluation(taskId) {
    const codeContent = document.getElementById('codeEditor')?.value;
    const feedbackBox = document.getElementById('feedbackResult');
    const feedbackText = document.getElementById('feedbackText');
    const submitBtn = document.getElementById('submitCodeBtn');

    if (!codeContent) return alert('Будь ласка, напишіть рішення завдання перед відправкою!');

    try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'ШІ аналізує код...';
        
        const res = await fetch('/student/tasks/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, sourceCode: codeContent })
        });
        
        const data = await res.json();
        
        feedbackBox.style.display = 'block';
        if (data.success) {
            feedbackText.innerHTML = `<strong>Статус:</strong> ${data.status.toUpperCase()}<br>
                                      <strong>Оцінка:</strong> ${data.score}/100<br><br>
                                      ${data.feedback}`;
            feedbackBox.style.style.borderLeftColor = 'var(--success)';
        } else {
            feedbackText.innerText = data.error || 'Помилка виконання запиту.';
            feedbackBox.style.borderLeftColor = 'var(--error)';
        }
    } catch (err) {
        alert('Критична помилка зв'язку з сервером перевірки.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Відправити на перевірку';
    }
}