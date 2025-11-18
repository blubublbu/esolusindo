const API_BASE = '/perpustakaan/api';

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
        loadUsers();
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
    const judul = judul.value.trim();
    const penulis = penulis.value.trim();
    const stokValue = parseInt(stok.value);

    if (!judul || !penulis || isNaN(stokValue)) {
        showMessage('Isi form dengan benar', 'error');
        return;
    }

    try {
        await fetchJSON(`${API_BASE}/books.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ judul, penulis, stok: stokValue })
        });
        showMessage('Buku ditambahkan', 'success');
        addBookForm.reset();
        loadBooks();
        loadAvailableBooks();
    } catch (e) {
        showMessage('Gagal menambah buku: ' + e.message, 'error');
    }
};

async function deleteBook(id) {
    if (!confirm('Yakin?')) return;
    try {
        await fetchJSON(`${API_BASE}/books.php`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
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
        fillDropdown('user_id', users, u => ({ value: u.id, label: u.nama }));
    } catch (e) {
        showMessage('Error memuat user: ' + e.message, 'error');
    }
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
    const namaValue = nama.value.trim();
    const emailValue = email.value.trim();

    if (!namaValue) {
        showMessage('Nama wajib diisi', 'error');
        return;
    }

    try {
        await fetchJSON(`${API_BASE}/users.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nama: namaValue, email: emailValue })
        });
        showMessage('User ditambahkan', 'success');
        addUserForm.reset();
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
        showMessage('Error memuat stok buku: ' + e.message, 'error');
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
        ? loans.map(l => `
            <div class="loan-item">
                <div class="loan-info">
                    <strong>${l.judul}</strong>
                    <div class="loan-details">
                        <span>User: ${l.nama || 'ID ' + l.user_id}</span>
                        <div>
                            Tanggal Pinjam: ${l.tanggal_pinjam} | 
                            Tanggal Kembali: ${l.tanggal_kembali || 'Belum'}
                            <span class="status-badge status-${l.status}">
                                ${l.status === 'dipinjam' ? 'Dipinjam' : 'Dikembalikan'}
                            </span>
                        </div>
                    </div>
                </div>
                ${l.status === 'dipinjam'
                    ? `<button class="return-btn" onclick="returnBook(${l.id})">Kembalikan</button>`
                    : ''}
            </div>
        `).join('')
        : '<div class="message">Tidak ada peminjaman</div>';
}

document.getElementById('addLoanForm').onsubmit = async e => {
    e.preventDefault();
    const userValue = user_id.value;
    const bookValue = book_id.value;

    if (!userValue || !bookValue) {
        showMessage('Pilih user dan buku', 'error');
        return;
    }

    try {
        await fetchJSON(`${API_BASE}/loans.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: Number(userValue), book_id: Number(bookValue) })
        });
        showMessage('Peminjaman berhasil', 'success');
        addLoanForm.reset();
        loadLoans();
        loadBooks();
        loadAvailableBooks();
    } catch (e) {
        showMessage('Gagal meminjam: ' + e.message, 'error');
    }
};

async function returnBook(id) {
    if (!confirm('Yakin?')) return;
    try {
        await fetchJSON(`${API_BASE}/loans.php`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        showMessage('Dikembalikan', 'success');
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

    const old = select.value;
    select.innerHTML = '<option value="">Pilih</option>';

    data.forEach(item => {
        const optData = mapFn(item);
        const opt = document.createElement('option');
        opt.value = optData.value;
        opt.textContent = optData.label;
        select.appendChild(opt);
    });

    if ([...select.options].some(o => o.value === old)) {
        select.value = old;
    }
}

function showMessage(message, type) {
    document.querySelectorAll('.message').forEach(m => m.remove());

    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = message;

    const container = document.querySelector('.container');
    const tabs = document.querySelector('.tabs');
    container.insertBefore(div, tabs);

    setTimeout(() => div.remove(), 5000);
}

function setLoading(loading) {
    document.querySelectorAll('button[type="submit"]').forEach(btn => {
        btn.disabled = loading;
        btn.classList.toggle('loading', loading);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    loadUsers();
    loadAvailableBooks();

    document.querySelectorAll('form').forEach(f => {
        f.addEventListener('submit', () => {
            setLoading(true);
            setTimeout(() => setLoading(false), 10000);
        });
    });

    const nativeFetch = window.fetch;
    window.fetch = async (...args) => {
        const res = await nativeFetch(...args);
        setLoading(false);
        return res;
    };
});
