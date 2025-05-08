const BASE_URL = window.API_BASE_URL;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('page2-teaching').style.display = 'none';
  document.getElementById('page2-admin').style.display = 'none';

  loadLocations();
  loadLanguages();

  document.getElementById('teaching-form').addEventListener('submit', submitTeaching);
  document.getElementById('admin-form').addEventListener('submit', submitAdmin);
});

function validateForm() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const enable = name !== '' && email !== '';
  document.getElementById('enter-teaching-hours').disabled = !enable;
  document.getElementById('enter-admin-hours').disabled = !enable;
}

function nextPage(type) {
  document.getElementById('page1').style.display = 'none';
  document.getElementById(`page2-${type}`).style.display = 'block';
}

function previousPage() {
  document.getElementById('page2-teaching').style.display = 'none';
  document.getElementById('page2-admin').style.display = 'none';
  document.getElementById('page1').style.display = 'block';
}
window.previousPage = previousPage;

function addRow(type) {
  const tbody = document.getElementById(`${type}-table`).querySelector('tbody');
  const row = document.createElement('tr');

  if (type === 'teaching') {
    row.innerHTML = `
      <td class="action-column"><button type="button" onclick="removeRow(this)">Remove</button></td>
      <td><input type="date" name="teaching-date" required /></td>
      <td><select name="teaching-location" required><option value="">Choose a location</option></select></td>
      <td><input type="number" name="teaching-hours" min="1" required /></td>
      <td><select name="teaching-language" required><option value="">Choose a language</option></select></td>
      <td><input type="checkbox" name="teaching-bridge-toll" /></td>
      <td><input type="number" name="teaching-reimbursement-amount" step="0.01" /></td>
      <td><input type="number" name="teaching-mileage-reimbursement" step="0.01" /></td>
      <td><input type="checkbox" name="teaching-supervision" /></td>
      <td><input type="checkbox" name="teaching-substitution" /></td>
    `;
    tbody.appendChild(row);
    populateDropdowns(row, 'teaching');
  } else if (type === 'admin') {
    row.innerHTML = `
      <td class="action-column"><button type="button" onclick="removeRow(this)">Remove</button></td>
      <td><input type="date" name="admin-date" required /></td>
      <td><input type="text" name="admin-location" required /></td>
      <td><input type="number" name="admin-hours" min="0.25" step="0.25" required /></td>
      <td><input type="checkbox" name="admin-bridge-toll" /></td>
      <td><input type="number" name="admin-reimbursement-amount" step="0.01" /></td>
      <td><input type="number" name="admin-mileage-reimbursement" step="0.01" /></td>
    `;
    tbody.appendChild(row);
  }
}
window.addRow = addRow;

function removeRow(btn) {
  btn.closest('tr').remove();
}
window.removeRow = removeRow;

function populateDropdowns(row, type) {
  fetch('${BASE_URL}/api/locations')
    .then(res => res.json())
    .then(locations => {
      const select = row.querySelector(`select[name="${type}-location"]`);
      select.innerHTML = '<option value="">Choose a location</option>';
      locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = loc;
        select.appendChild(opt);
      });
    });

  fetch('${BASE_URL}/api/languages')
    .then(res => res.json())
    .then(langs => {
      const select = row.querySelector(`select[name="${type}-language"]`);
      if (select) {
        select.innerHTML = '<option value="">Choose a language</option>';
        langs.forEach(lang => {
          const opt = document.createElement('option');
          opt.value = opt.textContent = lang;
          select.appendChild(opt);
        });
      }
    });
}

function loadLocations() {
  fetch('${BASE_URL}/api/locations')
    .then(res => res.json())
    .then(locations => {
      const select = document.getElementById('teaching-location');
      select.innerHTML = '<option value="">Choose a location</option>';
      locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = loc;
        select.appendChild(opt);
      });
    });
}

function loadLanguages() {
  fetch('${BASE_URL}/api/languages')
    .then(res => res.json())
    .then(langs => {
      const select = document.getElementById('teaching-language');
      select.innerHTML = '<option value="">Choose a language</option>';
      langs.forEach(lang => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = lang;
        select.appendChild(opt);
      });
    });
}

let teachingSelectedFiles = [];
let adminSelectedFiles = [];

document.getElementById('attachments-teaching').addEventListener('change', function () {
  const fileList = document.getElementById('file-list-teaching');
  const files = Array.from(this.files);
  teachingSelectedFiles = teachingSelectedFiles.concat(files);
  fileList.innerHTML = '';

  if (teachingSelectedFiles.length === 0) {
    fileList.textContent = 'No files selected.';
  } else {
    const ul = document.createElement('ul');
    teachingSelectedFiles.forEach((file, index) => {
      const li = document.createElement('li');
      li.textContent = file.name + ' ';
      const removeSpan = document.createElement('span');
      removeSpan.textContent = '✖';
      removeSpan.style.color = 'red';
      removeSpan.style.cursor = 'pointer';
      removeSpan.onclick = function () {
        teachingSelectedFiles.splice(index, 1);
        document.getElementById('attachments-teaching').dispatchEvent(new Event('change'));
      };
      li.appendChild(removeSpan);
      ul.appendChild(li);
    });
    fileList.appendChild(ul);
  }

  this.value = '';
});

document.getElementById('attachments-admin').addEventListener('change', function () {
  const fileList = document.getElementById('file-list-admin');
  const files = Array.from(this.files);
  adminSelectedFiles = adminSelectedFiles.concat(files);
  fileList.innerHTML = '';

  if (adminSelectedFiles.length === 0) {
    fileList.textContent = 'No files selected.';
  } else {
    const ul = document.createElement('ul');
    adminSelectedFiles.forEach((file, index) => {
      const li = document.createElement('li');
      li.textContent = file.name + ' ';
      const removeSpan = document.createElement('span');
      removeSpan.textContent = '✖';
      removeSpan.style.color = 'red';
      removeSpan.style.cursor = 'pointer';
      removeSpan.onclick = function () {
        adminSelectedFiles.splice(index, 1);
        document.getElementById('attachments-admin').dispatchEvent(new Event('change'));
      };
      li.appendChild(removeSpan);
      ul.appendChild(li);
    });
    fileList.appendChild(ul);
  }

  this.value = '';
});

function submitTeaching(e) {
  e.preventDefault();

  const rows = document.querySelectorAll('#teaching-table tbody tr');
  const entries = Array.from(rows).map(row => ({
    date: row.querySelector('[name="teaching-date"]').value,
    location: row.querySelector('[name="teaching-location"]').value,
    hours: row.querySelector('[name="teaching-hours"]').value,
    language: row.querySelector('[name="teaching-language"]').value,
    bridgeToll: row.querySelector('[name="teaching-bridge-toll"]').checked,
    reimbursementAmount: row.querySelector('[name="teaching-reimbursement-amount"]').value || 0,
    mileageReimbursement: row.querySelector('[name="teaching-mileage-reimbursement"]').value || 0,
    supervision: row.querySelector('[name="teaching-supervision"]').checked,
    substitution: row.querySelector('[name="teaching-substitution"]').checked
  }));

  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    type: 'teaching',
    notes: document.getElementById('notes').value,
    timesheetEntries: entries,
    attachments: []
  };

  encodeAndSend(data, teachingSelectedFiles);
}

function submitAdmin(e) {
  e.preventDefault();

  const rows = document.querySelectorAll('#admin-table tbody tr');
  const entries = Array.from(rows).map(row => ({
    date: row.querySelector('[name="admin-date"]').value,
    location: row.querySelector('[name="admin-location"]').value,
    hours: row.querySelector('[name="admin-hours"]').value,
    bridgeToll: row.querySelector('[name="admin-bridge-toll"]').checked,
    reimbursementAmount: row.querySelector('[name="admin-reimbursement-amount"]').value || 0,
    mileageReimbursement: row.querySelector('[name="admin-mileage-reimbursement"]').value || 0
  }));

  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    type: 'admin',
    notes: document.getElementById('notes').value,
    timesheetEntries: entries,
    attachments: []
  };

  encodeAndSend(data, adminSelectedFiles);
}

function encodeAndSend(data, files) {
  if (!files.length) return postData(data);

  let loaded = 0;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onloadend = function () {
      data.attachments.push({
        name: file.name,
        mimeType: file.type,
        base64: reader.result.split(',')[1]
      });
      loaded++;
      if (loaded === files.length) {
        postData(data);
      }
    };
    reader.readAsDataURL(file);
  });
}

function postData(data) {
  fetch('${BASE_URL}/api/submit-timesheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .then(response => {
      if (response.success) {
        showToast('✅ Timesheet submitted successfully!', true);
      } else {
        showToast('❌ Submission failed: ' + (response.message || 'Unknown error'));
      }
    })
    .catch(err => {
      showToast('❌ Error: ' + err.message);
    });
}

function showToast(msg, reset = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'show';

  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
    if (reset) {
      document.getElementById('page1').style.display = 'block';
      document.getElementById('page2-teaching').style.display = 'none';
      document.getElementById('page2-admin').style.display = 'none';
      document.getElementById('teaching-form').reset();
      document.getElementById('admin-form').reset();
      teachingSelectedFiles = [];
      adminSelectedFiles = [];
      document.getElementById('file-list-teaching').textContent = 'No files selected.';
      document.getElementById('file-list-admin').textContent = 'No files selected.';
    }
  }, 4000);
}
