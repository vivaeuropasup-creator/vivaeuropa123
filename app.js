// VivaEuropa - CTA & Lead Management
// Конфигурация с актуальными данными
const WA_URL = "https://wa.me/79039910369?text=Здравствуйте,%20хочу%20получить%20ВНЖ%20в%20Испании";
const TG_URL = "https://t.me/vivaeu";
const MAILTO_URL = "mailto:vivaeuropa.sup@gmail.com?subject=Запрос%20по%20ВНЖ%20Испании&body=Имя:%0AСпособ%20связи:%0AГород/страна:%0AКратко%20суть:%0A";
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/.../exec?key=SECRET';
const LEGAL_NOTE_RU = 'Статистика основана на реальных обращениях 2024–2025. Решение принимает орган по делам иностранцев Испании.';
const LEGAL_NOTE_EN = 'Statistics based on actual cases in 2024–2025. The final decision is made by the Spanish immigration authority.';

// Функция для получения UTM параметров из URL
function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        utm_source: urlParams.get('utm_source') || 'direct',
        utm_medium: urlParams.get('utm_medium') || 'none',
        utm_campaign: urlParams.get('utm_campaign') || 'none',
        utm_content: urlParams.get('utm_content') || 'none',
        utm_term: urlParams.get('utm_term') || 'none'
    };
}

// Функция для определения текущего языка страницы
function getCurrentLanguage() {
    const html = document.documentElement;
    return html.lang || 'ru';
}

// Функция для получения названия текущей страницы
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename.replace('.html', '');
}

// Основная функция отправки лида
async function sendLead(cta, locale = null) {
    try {
        // Определяем язык
        const language = locale || getCurrentLanguage();
        
        // Собираем данные
        const utmParams = getUTMParams();
        const currentPage = getCurrentPage();
        const timestamp = new Date().toISOString();
        
        const payload = {
            timestamp: timestamp,
            cta: cta,
            page: currentPage,
            language: language,
            utm_source: utmParams.utm_source,
            utm_medium: utmParams.utm_medium,
            utm_campaign: utmParams.utm_campaign,
            utm_content: utmParams.utm_content,
            utm_term: utmParams.utm_term,
            user_agent: navigator.userAgent,
            referrer: document.referrer || 'direct'
        };

        // Отправляем данные через sendBeacon (приоритетный метод)
        if (navigator.sendBeacon && GOOGLE_SHEETS_WEBHOOK_URL !== 'https://script.google.com/macros/s/.../exec?key=SECRET') {
            const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
            navigator.sendBeacon(GOOGLE_SHEETS_WEBHOOK_URL, blob);
        } else if (GOOGLE_SHEETS_WEBHOOK_URL !== 'https://script.google.com/macros/s/.../exec?key=SECRET') {
            // Fallback к fetch
            try {
                await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify(payload)
                });
            } catch (error) {
                console.warn('Failed to send lead data:', error);
            }
        }
        
        console.log('Lead sent:', payload);
        return true;
    } catch (error) {
        console.error('Error sending lead:', error);
        return false;
    }
}

// ПРАВИЛЬНЫЙ обработчик кликов без preventDefault - только аналитика
function initializeCTAButtons() {
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-cta], .contact-actions a, .btn-wa, .btn-tg, .btn-mail, .cta-btn');
        if (!a) return;
        
        try {
            // Определяем тип CTA
            let ctaType = a.dataset.cta;
            if (!ctaType) {
                if (a.classList.contains('whatsapp') || a.href.includes('wa.me')) ctaType = 'whatsapp';
                else if (a.classList.contains('telegram') || a.href.includes('t.me')) ctaType = 'telegram';
                else if (a.classList.contains('email') || a.href.includes('mailto:')) ctaType = 'email';
            }
            
            // Отправляем аналитику
            const payload = {
                event: 'cta',
                cta: ctaType || a.className,
                href: a.href,
                ts: Date.now()
            };
            
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/lead', new Blob([JSON.stringify(payload)], {type: 'application/json'}));
            }
            
            // Отправляем через нашу систему аналитики
            sendLead(ctaType || 'unknown_cta');
            
        } catch(_) {}
        
        // НЕ вызываем preventDefault, НЕ подменяем URL — браузер сам перейдёт по a.href
    }, true);
}

// Функция для отслеживания скроллинга (опциональная аналитика)
function trackScrollDepth() {
    let maxScroll = 0;
    let scrollTimer = null;
    
    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            // Отправляем событие скролла с задержкой
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                if (maxScroll >= 25 && maxScroll % 25 === 0) {
                    sendLead(`scroll_${maxScroll}%`);
                }
            }, 1000);
        }
    });
}

// Функция для инициализации мобильного меню
function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
        
        // Закрытие меню при клике на ссылку
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
    }
}

// Функция для плавного скроллинга к якорям
function initializeSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('VivaEuropa app initialized');
    
    // Инициализируем все функции
    initializeCTAButtons();
    initializeMobileMenu();
    initializeSmoothScroll();
    
    // Опционально включаем отслеживание скролла
    // trackScrollDepth();


    
    // Отправляем событие просмотра страницы
    setTimeout(() => {
        sendLead('page_view');
    }, 1000);
});

// Email copy to clipboard functionality
document.addEventListener('click', function(e) {
    const el = e.target.closest('.cta-email');
    if (!el) return;
    
    const value = el.getAttribute('data-copy') || 'vivaeuropa.sup@gmail.com';
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(() => {
            const originalHTML = el.innerHTML;
            el.style.background = 'linear-gradient(135deg, #2d5016 0%, #4a7c59 100%)';
            el.style.borderColor = 'rgba(76, 175, 80, 0.6)';
            el.style.boxShadow = '0 6px 25px rgba(76, 175, 80, 0.3)';
            el.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><path fill="#4CAF50" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>Скопировано!`;
            setTimeout(() => { 
                el.innerHTML = originalHTML;
                el.style.background = '';
                el.style.borderColor = '';
                el.style.boxShadow = '';
            }, 1500);
        }).catch(err => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = value;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalHTML = el.innerHTML;
            el.style.background = 'linear-gradient(135deg, #2d5016 0%, #4a7c59 100%)';
            el.style.borderColor = 'rgba(76, 175, 80, 0.6)';
            el.style.boxShadow = '0 6px 25px rgba(76, 175, 80, 0.3)';
            el.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><path fill="#4CAF50" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>Скопировано!`;
            setTimeout(() => { 
                el.innerHTML = originalHTML;
                el.style.background = '';
                el.style.borderColor = '';
                el.style.boxShadow = '';
            }, 1500);
        });
    }
});

// Экспорт функций для использования в HTML
window.VivaEuropa = {
    sendLead,
    getUTMParams,
    getCurrentLanguage,
    getCurrentPage,
    WA_URL,
    TG_URL,
    MAILTO_URL
};

// Функция копирования email в буфер обмена
function copyEmail(email) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(() => {
            // Показываем уведомление об успешном копировании
            showCopyNotification('Email скопирован!', 'success');
        }).catch(err => {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = email;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopyNotification('Email скопирован!', 'success');
        });
    } else {
        // Fallback для очень старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = email;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyNotification('Email скопирован!', 'success');
    }
}

// Функция показа уведомления о копировании
function showCopyNotification(message, type = 'success') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}