async function handleAdminLogout() {
    if (!window.fb) return;
    const { auth, signOut } = window.fb;
    await signOut(auth);
    showToast('已登出管理員身分');
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    const card = document.getElementById('loginModalCard');
    document.getElementById('loginError').classList.add('hidden');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    const card = document.getElementById('loginModalCard');
    modal.classList.add('opacity-0', 'pointer-events-none');
    card.classList.add('scale-95');
    document.body.style.overflow = '';
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const errorElem = document.getElementById('loginError');
    errorElem.classList.add('hidden');

    if (!window.fb) return;
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const { auth, signInWithEmailAndPassword } = window.fb;
        await signInWithEmailAndPassword(auth, email, password);
        closeLoginModal();
        e.target.reset();
    } catch (err) {
        console.error('登入失敗：', err);
        errorElem.textContent = '登入失敗，請確認帳號密碼是否正確';
        errorElem.classList.remove('hidden');
    }
}
