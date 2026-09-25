/*
 * غيّر هذا لاحقًا إلى رابط الـ API العام
 *
 * أثناء الاختبار المحلي:
 */
const API_URL = 'https://charlie-milwaukee-possibilities-administrator.trycloudflare.com';


const phoneInput = document.getElementById('phone');

const pairBtn = document.getElementById('pairBtn');

const buttonText = document.getElementById('buttonText');

const buttonLoader = document.getElementById('buttonLoader');

const message = document.getElementById('message');

const pairResult = document.getElementById('pairResult');

const pairCode = document.getElementById('pairCode');

const copyBtn = document.getElementById('copyBtn');

const connectionStatus =
    document.getElementById('connectionStatus');


let currentPhone = '';

let statusTimer = null;


/* ==============================
   تنسيق الرقم
================================ */

phoneInput.addEventListener('input', () => {

    phoneInput.value =
        phoneInput.value.replace(/\D/g, '').slice(0, 9);

});


/* ==============================
   رسائل
================================ */

function showMessage(text, type = 'error') {

    message.textContent = text;

    message.className =
        `message ${type}`;

    message.classList.remove('hidden');

}


function hideMessage() {

    message.classList.add('hidden');

}


/* ==============================
   حالة الزر
================================ */

function loading(state) {

    pairBtn.disabled = state;

    buttonText.classList.toggle(
        'hidden',
        state
    );

    buttonLoader.classList.toggle(
        'hidden',
        !state
    );

}


/* ==============================
   طلب Pairing Code
================================ */

pairBtn.addEventListener('click', async () => {

    hideMessage();

    const localNumber =
        phoneInput.value.trim();


    if (!/^[0-9]{9}$/.test(localNumber)) {

        showMessage(
            'أدخل رقمًا سعوديًا صحيحًا، مثال: 512345678'
        );

        phoneInput.focus();

        return;
    }


    const selectedDial = (
        window.selectedCountry?.dial ||
        document.getElementById('countryCode')?.textContent ||
        '+966'
    ).toString().replace(/\D/g, '');

    currentPhone =
        selectedDial + localNumber.replace(/^0+/, '');


    loading(true);


    pairResult.classList.add('hidden');


    try {

        const response =
            await fetch(`${API_URL}/api/pair`, {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    phone: currentPhone
                })

            });


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                data.message ||
                'تعذر إنشاء جلسة الربط'
            );

        }


        if (!data.code) {

            throw new Error(
                'لم يتم استلام كود الربط'
            );

        }


        pairCode.textContent =
            data.code;


        pairResult.classList.remove(
            'hidden'
        );


        showMessage(
            'تم إنشاء كود الربط. أدخله في واتساب لإكمال الربط.',
            'success'
        );


        startStatusChecking();


    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            'حدث خطأ أثناء طلب كود الربط'
        );

    } finally {

        loading(false);

    }

});


/* ==============================
   فحص حالة الاتصال
================================ */

function startStatusChecking() {

    stopStatusChecking();

    checkStatus();

    statusTimer =
        setInterval(checkStatus, 3000);

}


async function checkStatus() {

    if (!currentPhone) return;


    try {

        const response =
            await fetch(
                `${API_URL}/api/pair/status/${currentPhone}`
            );


        const data =
            await response.json();


        if (
            data.success &&
            data.status === 'connected'
        ) {

            setConnected();

            stopStatusChecking();

        }

    } catch (error) {

        console.log(
            'Status check failed:',
            error
        );

    }

}


function stopStatusChecking() {

    if (statusTimer) {

        clearInterval(statusTimer);

        statusTimer = null;

    }

}


/* ==============================
   اتصال ناجح
================================ */

function setConnected() {

    connectionStatus.classList.add(
        'connected'
    );


    connectionStatus.innerHTML =
        '<span></span> تم ربط واتساب بنجاح ✓';


    showMessage(
        '🎉 تم ربط حساب واتساب بنجاح!',
        'success'
    );

}


/* ==============================
   نسخ الكود
================================ */

copyBtn.addEventListener('click', async () => {

    const code =
        pairCode.textContent.trim();


    try {

        await navigator.clipboard.writeText(
            code
        );


        copyBtn.textContent =
            '✓ تم النسخ';


        setTimeout(() => {

            copyBtn.textContent =
                'نسخ الكود';

        }, 1500);


    } catch {

        showMessage(
            'تعذر نسخ الكود تلقائيًا'
        );

    }

});

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('countryButton');
    const picker = document.getElementById('countryPicker');
    const search = document.getElementById('countrySearch');

    if (!btn || !picker) {
        console.error('❌ countryButton أو countryPicker غير موجود');
        return;
    }

    btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        picker.classList.toggle('hidden');

        if (!picker.classList.contains('hidden') && search) {
            setTimeout(() => search.focus(), 100);
        }
    });

    picker.addEventListener('click', function (e) {
        e.stopPropagation();
    });

    document.addEventListener('click', function (e) {
        if (!picker.contains(e.target) && !btn.contains(e.target)) {
            picker.classList.add('hidden');
        }
    });

    console.log('✅ Country button is working');
});

/* FIX: render countries */
fetch('./countries.json')
    .then(r => r.json())
    .then(countries => {
        const list = document.getElementById('countryList');
        if (!list) return;

        list.innerHTML = '';

        countries.forEach(c => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'country-option';

            const flag = c.iso ? c.iso.toUpperCase().replace(/./g, x =>
                String.fromCodePoint(127397 + x.charCodeAt())
            ) : '🌐';

            item.innerHTML = `
                <span class="country-option-flag">${flag}</span>
                <span class="country-option-name">${c.name || c.country || c.iso}</span>
                <span class="country-option-code">+${String(c.dial || c.code || '').replace('+','')}</span>
            `;

            item.addEventListener('click', function () {
                const dial = String(c.dial || c.code || '').replace('+','');
                document.getElementById('countryFlag').textContent = flag;
                document.getElementById('countryCode').textContent = '+' + dial;
                document.getElementById('countryPicker').classList.add('hidden');
            });

            list.appendChild(item);
        });

        console.log('✅ تم عرض ' + countries.length + ' دولة');
    })
    .catch(err => {
        console.error('❌ خطأ تحميل الدول:', err);
    });

/* FIX: country search */
(function () {
    const search = document.getElementById('countrySearch');
    const list = document.getElementById('countryList');

    if (!search || !list) return;

    search.addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();

        list.querySelectorAll('.country-option').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
        });
    });
})();

/* =========================
   SESSION DELETE BUTTON
   ========================= */
(function () {
    const phoneInput = document.getElementById('phone');
    const pairResult = document.getElementById('pairResult');

    if (!phoneInput || !pairResult) return;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.id = 'deleteSessionBtn';
    deleteBtn.textContent = '🗑️ حذف الجلسة';
    deleteBtn.style.cssText = `
        display:none;
        width:100%;
        margin-top:12px;
        padding:13px;
        border:1px solid #ff4d4d;
        border-radius:12px;
        background:rgba(255,77,77,.08);
        color:#ff6b6b;
        font-size:15px;
        font-weight:700;
        cursor:pointer;
    `;

    pairResult.appendChild(deleteBtn);

    let lastPhone = '';

    async function checkSession() {
        const code = (window.selectedCountry?.dial || document.getElementById('countryCode')?.textContent || '+966')
            .replace(/\D/g, '');

        const number = phoneInput.value.replace(/\D/g, '').replace(/^0+/, '');
        if (!number) {
            deleteBtn.style.display = 'none';
            return;
        }

        const fullPhone = code + number;
        if (fullPhone === lastPhone) return;
        lastPhone = fullPhone;

        try {
            const res = await fetch(
                API_URL + '/api/pair/status/' + encodeURIComponent(fullPhone)
            );
            const data = await res.json();

            if (data.status === 'connected' || data.status === 'waiting') {
                deleteBtn.style.display = 'block';
            } else {
                deleteBtn.style.display = 'none';
            }
        } catch {
            deleteBtn.style.display = 'none';
        }
    }

    phoneInput.addEventListener('input', checkSession);
    phoneInput.addEventListener('change', checkSession);

    deleteBtn.addEventListener('click', async function () {
        const code = (document.getElementById('countryCode')?.textContent || '+966')
            .replace(/\D/g, '');

        const number = phoneInput.value.replace(/\D/g, '').replace(/^0+/, '');
        const fullPhone = code + number;

        if (!fullPhone) return;

        const confirmed = confirm(
            '⚠️ هل أنت متأكد من حذف جلسة واتساب لهذا الرقم؟\n\n' +
            '+' + fullPhone +
            '\n\nسيتم فصل الجلسة وحذف بياناتها، ويمكن ربط الرقم من جديد.'
        );

        if (!confirmed) return;

        deleteBtn.disabled = true;
        deleteBtn.textContent = '⏳ جارٍ حذف الجلسة...';

        try {
            const res = await fetch(API_URL + '/api/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: fullPhone
                })
            });

            const data = await res.json();

            if (data.status === 'stopped' || data.success) {
                deleteBtn.textContent = '✅ تم حذف الجلسة';
                setTimeout(() => {
                    deleteBtn.style.display = 'none';
                    deleteBtn.textContent = '🗑️ حذف الجلسة';
                    deleteBtn.disabled = false;
                }, 1500);
            } else {
                throw new Error(data.error || 'Delete failed');
            }
        } catch (error) {
            alert('❌ تعذر حذف الجلسة');
            deleteBtn.textContent = '🗑️ حذف الجلسة';
            deleteBtn.disabled = false;
        }
    });
})();

/* FIX: always show delete button when a session exists */
(function () {
    const phoneInput = document.getElementById('phone');
    const deleteBtn = document.getElementById('deleteSessionBtn');

    if (!phoneInput || !deleteBtn) return;

    phoneInput.addEventListener('input', async function () {
        const code = (document.getElementById('countryCode')?.textContent || '+966')
            .replace(/\D/g, '');

        const number = this.value.replace(/\D/g, '').replace(/^0+/, '');
        if (!number) {
            deleteBtn.style.display = 'none';
            return;
        }

        const fullPhone = code + number;

        try {
            const res = await fetch(
                API_URL + '/api/pair/status/' + encodeURIComponent(fullPhone)
            );

            const data = await res.json();

            /* Show delete for any existing session/status */
            if (
                data.status === 'connected' ||
                data.status === 'waiting' ||
                data.status === 'pairing' ||
                data.status === 'exists' ||
                data.session === true
            ) {
                deleteBtn.style.display = 'block';
            }
        } catch (e) {
            console.log('Session check:', e);
        }
    });
})();

/* FINAL FIX: move delete button outside hidden result */
(function () {
    const phone = document.getElementById('phone');
    const pairBtn = document.getElementById('pairBtn');
    let deleteBtn = document.getElementById('deleteSessionBtn');

    if (!phone || !pairBtn) return;

    if (!deleteBtn) {
        deleteBtn = document.createElement('button');
        deleteBtn.id = 'deleteSessionBtn';
        deleteBtn.type = 'button';
        deleteBtn.textContent = '🗑️ حذف الجلسة القديمة';
    }

    deleteBtn.style.cssText = `
        display:none;
        width:100%;
        margin-top:12px;
        padding:14px;
        border:1px solid #ff4d4d;
        border-radius:12px;
        background:rgba(255,77,77,.10);
        color:#ff7070;
        font-size:15px;
        font-weight:700;
        cursor:pointer;
    `;

    pairBtn.parentElement.appendChild(deleteBtn);

    phone.addEventListener('input', function () {
        const number = this.value.replace(/\D/g, '').replace(/^0+/, '');

        if (number.length >= 5) {
            deleteBtn.style.display = 'block';
        } else {
            deleteBtn.style.display = 'none';
        }
    });

    deleteBtn.onclick = async function () {
        const code = (document.getElementById('countryCode')?.textContent || '+966')
            .replace(/\D/g, '');

        const number = phone.value.replace(/\D/g, '').replace(/^0+/, '');
        const fullPhone = code + number;

        if (!number) return;

        if (!confirm(
            '⚠️ حذف الجلسة القديمة؟\n\n' +
            '+' + fullPhone +
            '\n\nسيتم فصل الجلسة وحذف بياناتها.'
        )) return;

        deleteBtn.disabled = true;
        deleteBtn.textContent = '⏳ جارٍ حذف الجلسة...';

        try {
            const response = await fetch(API_URL + '/api/stop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: fullPhone })
            });

            const data = await response.json();

            if (response.ok && (data.status === 'stopped' || data.success)) {
                deleteBtn.textContent = '✅ تم حذف الجلسة';
                setTimeout(() => {
                    deleteBtn.style.display = 'none';
                    deleteBtn.textContent = '🗑️ حذف الجلسة القديمة';
                    deleteBtn.disabled = false;
                }, 1200);
            } else {
                throw new Error(data.error || 'Delete failed');
            }
        } catch (error) {
            alert('❌ تعذر حذف الجلسة: ' + error.message);
            deleteBtn.textContent = '🗑️ حذف الجلسة القديمة';
            deleteBtn.disabled = false;
        }
    };
})();

/* === DELETE SESSION BUTTON - FORCE VISIBLE === */
(function () {
    function setupDeleteButton() {
        const phone = document.getElementById('phone');
        const pairBtn = document.getElementById('pairBtn');

        if (!phone || !pairBtn) return;

        let btn = document.getElementById('forceDeleteSessionBtn');

        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'forceDeleteSessionBtn';
            btn.type = 'button';
            btn.textContent = '🗑️ حذف الجلسة القديمة';

            pairBtn.insertAdjacentElement('afterend', btn);
        }

        btn.style.cssText = `
            display: none !important;
            width: 100% !important;
            margin-top: 12px !important;
            padding: 14px !important;
            border: 1px solid #ff4d4d !important;
            border-radius: 12px !important;
            background: rgba(255,77,77,.12) !important;
            color: #ff7070 !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
        `;

        function updateButton() {
            const number = phone.value.replace(/\D/g, '').replace(/^0+/, '');

            if (number.length >= 5) {
                btn.style.setProperty('display', 'block', 'important');
            } else {
                btn.style.setProperty('display', 'none', 'important');
            }
        }

        phone.addEventListener('input', updateButton);
        phone.addEventListener('change', updateButton);

        btn.onclick = async function () {
            const code = (document.getElementById('countryCode')?.textContent || '+966')
                .replace(/\D/g, '');

            const number = phone.value.replace(/\D/g, '').replace(/^0+/, '');
            const fullPhone = code + number;

            if (!number) return;

            if (!confirm(
                '⚠️ هل تريد حذف الجلسة القديمة؟\n\n' +
                '+' + fullPhone +
                '\n\nسيتم فصل الجلسة وحذف بياناتها.'
            )) return;

            btn.disabled = true;
            btn.textContent = '⏳ جارٍ حذف الجلسة...';

            try {
                const response = await fetch(API_URL + '/api/stop', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phone: fullPhone })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'فشل حذف الجلسة');
                }

                btn.textContent = '✅ تم حذف الجلسة';

                setTimeout(() => {
                    btn.textContent = '🗑️ حذف الجلسة القديمة';
                    btn.disabled = false;
                    btn.style.setProperty('display', 'none', 'important');
                }, 1500);

            } catch (error) {
                alert('❌ ' + error.message);
                btn.textContent = '🗑️ حذف الجلسة القديمة';
                btn.disabled = false;
            }
        };

        updateButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDeleteButton);
    } else {
        setupDeleteButton();
    }
})();
