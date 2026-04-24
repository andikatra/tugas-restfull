const API_URL = 'http://localhost:8000/api/siswa';

let currentMode = 'create';
let cachedSiswaList = [];

function normalizeSiswaList(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
}

function populateTable(siswaList) {
    const tbody = document.querySelector('.table tbody');
    cachedSiswaList = normalizeSiswaList(siswaList);
    tbody.innerHTML = '';

    if (cachedSiswaList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Tidak ada data siswa</td></tr>';
        return;
    }

    cachedSiswaList.forEach((siswa, index) => {
        const siswaId = siswa.id || siswa.nis;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${siswa.nama_kelas || siswa.nama || '-'}</td>
            <td>${siswa.jurusan || '-'}</td>
            <td>${siswa.lokasi_ruangan || '-'}</td>
            <td>${siswa.wali_kelas || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="goToEditForm(${JSON.stringify(siswaId)})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteData(${JSON.stringify(siswaId)})">Hapus</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function fetchDataSiswa() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Data siswa:', data);
        populateTable(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        showError('Gagal mengambil data dari API');
    }
}

function showError(message) {
    const tbody = document.querySelector('.table tbody');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">${message}</td></tr>`;
}

function setFormMode(mode) {
    currentMode = mode;
    const formTitle = document.getElementById('formTitle');
    const submitButton = document.getElementById('submitButton');
    const cancelButton = document.getElementById('cancelButton');
    const formMessage = document.getElementById('formMessage');

    formMessage.classList.add('hidden');
    formMessage.textContent = '';
    formMessage.className = 'form-message hidden';

    if (mode === 'edit') {
        formTitle.textContent = 'Edit Data Siswa';
        submitButton.textContent = 'Update Data';
        cancelButton.classList.remove('hidden');
    } else {
        formTitle.textContent = 'Tambah Data Siswa';
        submitButton.textContent = 'Simpan Data';
        cancelButton.classList.add('hidden');
    }
}

function getFormData() {
    return {
        nama_kelas: document.getElementById('nama_kelas').value.trim(),
        jurusan: document.getElementById('jurusan').value.trim(),
        lokasi_ruangan: document.getElementById('lokasi_ruangan').value.trim(),
        wali_kelas: document.getElementById('wali_kelas').value.trim()
    };
}

function resetForm(preserveMessage = false) {
    document.getElementById('siswaForm').reset();
    document.getElementById('siswaId').value = '';

    if (preserveMessage) {
        currentMode = 'create';
        document.getElementById('formTitle').textContent = 'Tambah Data Siswa';
        document.getElementById('submitButton').textContent = 'Simpan Data';
        document.getElementById('cancelButton').classList.add('hidden');
        return;
    }

    setFormMode('create');
}

function showFormMessage(message, type = 'success') {
    const formMessage = document.getElementById('formMessage');
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

function goToAddForm() {
    resetForm();
    document.getElementById('formSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToEditForm(id) {
    const siswa = cachedSiswaList.find(item => String(item.id || item.nis) === String(id));

    if (!siswa) {
        showFormMessage('Data yang akan diedit tidak ditemukan.', 'error');
        return;
    }

    document.getElementById('siswaId').value = siswa.id || siswa.nis || '';
    document.getElementById('nama_kelas').value = siswa.nama_kelas || siswa.nama || '';
    document.getElementById('jurusan').value = siswa.jurusan || '';
    document.getElementById('lokasi_ruangan').value = siswa.lokasi_ruangan || '';
    document.getElementById('wali_kelas').value = siswa.wali_kelas || '';

    setFormMode('edit');
    document.getElementById('formSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
    resetForm();
}

async function saveData(event) {
    event.preventDefault();

    const siswaId = document.getElementById('siswaId').value;
    const payload = getFormData();
    const isEditMode = currentMode === 'edit' && siswaId;
    const requestUrl = isEditMode ? `${API_URL}/${siswaId}` : API_URL;
    const requestMethod = isEditMode ? 'PUT' : 'POST';

    try {
        const response = await fetch(requestUrl, {
            method: requestMethod,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showFormMessage(
            isEditMode ? 'Data siswa berhasil diperbarui.' : 'Data siswa berhasil ditambahkan.'
        );
        resetForm(true);
        await fetchDataSiswa();
    } catch (error) {
        console.error(`Error ${isEditMode ? 'updating' : 'creating'} data:`, error);
        showFormMessage(
            isEditMode ? 'Gagal memperbarui data siswa.' : 'Gagal menambahkan data siswa.',
            'error'
        );
    }
}

async function deleteData(id) {
    const confirmed = window.confirm('Yakin ingin menghapus data ini?');

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (String(document.getElementById('siswaId').value) === String(id)) {
            resetForm();
        }

        showFormMessage('Data siswa berhasil dihapus.');
        await fetchDataSiswa();
    } catch (error) {
        console.error('Error deleting data:', error);
        showFormMessage('Gagal menghapus data siswa.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('siswaForm').addEventListener('submit', saveData);
    setFormMode('create');
    fetchDataSiswa();
});
