const API_BASE = '/nabhan/api';   

async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
    return data;
}

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabName === 'books') loadBooks();
    if (tabName === 'users') loadUsers();
    if (tabName === 'loans') {
        loadAvailableBooks();
        loadUsersForLoan();
        loadLoans();
    }
}


async function loadBooks() {
    try {
        const books = await fetchJSON(`${API_BASE}/books.php`);
        displayBooks(books);
    } catch (e) {
        showMessage('Error memuat buku: ' + e.message, 'error');
    }
}

function displayBooks(books) {
    const el = document.getElementById('booksList');
    el.innerHTML = books.length
        ? books.map(b => `
            <div class="book-item">
               <img src="${b.cover}" class="book-cover" onclick="showCover('${b.cover}')">
                <div class="book-info">
                    <strong>${b.judul}</strong>
                    <div class="book-details">
                        <span>ID: ${b.id}</span>
                        <span>Stok: ${b.stok}</span>
                        <div>Penulis: ${b.penulis}</div>
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteBook(${b.id})">Hapus</button>
            </div>
        `).join('')
        : '<div class="message">Tidak ada data buku</div>';
}

document.getElementById('addBookForm').onsubmit = async e => {
    e.preventDefault();

    const judul = document.getElementById('judul').value.trim();
    const penulis = document.getElementById('penulis').value.trim();
    const stokValue = parseInt(document.getElementById('stok').value);
    const coverFile = document.getElementById('cover').files[0];

    if (!judul || !penulis || isNaN(stokValue) || stokValue < 0 || !coverFile) {
        showMessage('Isi form dengan benar', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('judul', judul);
    formData.append('penulis', penulis);
    formData.append('stok', stokValue);
    formData.append('cover', coverFile);

    try {
        await fetch(`${API_BASE}/books.php`, {
            method: 'POST',
            body: formData
        });
        showMessage('Buku ditambahkan', 'success');
        e.target.reset();
        loadBooks();
        loadAvailableBooks();
    } catch (e) {
        showMessage('Gagal menambah buku: ' + e.message, 'error');
    }
};


async function deleteBook(id) {
    if (!confirm('Yakin hapus buku ini?')) return;
    try {
        await fetchJSON(`${API_BASE}/books.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        showMessage('Buku dihapus', 'success');
        loadBooks();
        loadAvailableBooks();
    } catch (e) {
        showMessage('Gagal menghapus: ' + e.message, 'error');
    }
}


async function loadUsers() {
    try {
        const users = await fetchJSON(`${API_BASE}/users.php`);
        displayUsers(users);
        loadUsersForLoan(); 
    } catch (e) {
        showMessage('Error memuat user: ' + e.message, 'error');
    }
}

async function loadUsersForLoan() {
    try {
        const users = await fetchJSON(`${API_BASE}/users.php`);
        fillDropdown('user_id', users, u => ({ value: u.id, label: u.nama }));
    } catch (e) { }
}

function displayUsers(users) {
    const el = document.getElementById('usersList');
    el.innerHTML = users.length
        ? users.map(u => `
            <div class="user-item">
                <div class="user-info">
                    <strong>${u.nama}</strong>
                    <div class="user-details">
                        <span>ID: ${u.id}</span>
                        <div>Email: ${u.email || 'Tidak ada email'}</div>
                    </div>
                </div>
            </div>
        `).join('')
        : '<div class="message">Tidak ada data user</div>';
}

document.getElementById('addUserForm').onsubmit = async e => {
    e.preventDefault();
    const namaValue = document.getElementById('nama').value.trim();
    const emailValue = document.getElementById('email').value.trim();

    if (!namaValue) {
        showMessage('Nama wajib diisi', 'error');
        return;
    }

    try {
        await fetchJSON(`${API_BASE}/users.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: namaValue, email: emailValue })
        });
        showMessage('User ditambahkan', 'success');
        e.target.reset();
        loadUsers();
    } catch (e) {
        showMessage('Gagal menambah user: ' + e.message, 'error');
    }
};


async function loadAvailableBooks() {
    try {
        const books = await fetchJSON(`${API_BASE}/books.php?available=1`);
        fillDropdown('book_id', books, b => ({ value: b.id, label: `${b.judul} (Stok: ${b.stok})` }));
    } catch (e) {
        showMessage('Error memuat buku tersedia: ' + e.message, 'error');
    }
}

async function loadLoans() {
    try {
        const loans = await fetchJSON(`${API_BASE}/loans.php`);
        displayLoans(loans);
    } catch (e) {
        showMessage('Error memuat peminjaman: ' + e.message, 'error');
    }
}

function displayLoans(loans) {
    const el = document.getElementById('loansList');
    el.innerHTML = loans.length
        ? loans.map(l => {
            const statusText = l.status === 'dikembalikan' ? 'Dikembalikan' : 'Dipinjam';
            const statusClass = l.status === 'dikembalikan' ? 'dikembalikan' : 'dipinjam';
            return `
                <div class="loan-item">
                    <div class="loan-info">
                        <strong>${l.judul}</strong>
                        <div class="loan-details">
                            <span>User: ${l.nama || 'ID ' + l.user_id}</span>
                            <div>
                                Pinjam: ${l.tanggal_pinjam} | 
                                Kembali: ${l.tanggal_kembali || 'Belum'}
                                <span class="status-badge status-${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>
                    ${l.status !== 'dikembalikan' ? `<button class="return-btn" onclick="returnBook(${l.id})">Kembalikan</button>` : ''}
                </div>
            `;
        }).join('')
        : '<div class="message">Tidak ada peminjaman</div>';
}

document.getElementById('addLoanForm').onsubmit = async e => {
    e.preventDefault();
    const userValue = document.getElementById('user_id').value;
    const bookValue = document.getElementById('book_id').value;

    if (!userValue || !bookValue) {
        showMessage('Pilih user dan buku', 'error');
        return;
    }

    try {
        await fetchJSON(`${API_BASE}/loans.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: Number(userValue), book_id: Number(bookValue) })
        });
        showMessage('Peminjaman berhasil', 'success');
        e.target.reset();
        loadLoans();
        loadBooks();
        loadAvailableBooks();
    } catch (e) {
        showMessage(e.message || 'Gagal meminjam', 'error');
    }
};

async function returnBook(id) {
    if (!confirm('Yakin buku sudah dikembalikan?')) return;
    try {
        await fetchJSON(`${API_BASE}/loans.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        showMessage('Buku dikembalikan', 'success');
        loadLoans();
        loadBooks();
        loadAvailableBooks();
    } catch (e) {
        showMessage('Gagal mengembalikan: ' + e.message, 'error');
    }
}

function fillDropdown(id, data, mapFn) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '<option value="">Pilih</option>';
    data.forEach(item => {
        const optData = mapFn(item);
        const opt = document.createElement('option');
        opt.value = optData.value;
        opt.textContent = optData.label;
        select.appendChild(opt);
    });
}

function showMessage(message, type = 'success') {
    document.querySelectorAll('.message').forEach(m => m.remove());
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = message;
    const container = document.querySelector('.container');
    const tabs = document.querySelector('.tabs');
    container.insertBefore(div, tabs);
    setTimeout(() => div.remove(), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    loadUsers();
    loadAvailableBooks();
});

async function autoSearchBooks() {
    const key = document.getElementById('searchBook').value.trim();
    const url = key 
        ? `${API_BASE}/books.php?search=${encodeURIComponent(key)}`
        : `${API_BASE}/books.php`;

    try {
        const books = await fetchJSON(url);
        displayBooks(books);
    } catch (e) {
        showMessage('Gagal mencari: ' + e.message, 'error');
    }
}

function showCover(src) {
const modal = document.getElementById('imageModal');
const img = document.getElementById('modalImage');
img.src = src;
modal.style.display = 'flex';
}

document.getElementById('imageModal').addEventListener('click', function() {
this.style.display = 'none';
});