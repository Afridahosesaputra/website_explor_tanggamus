/**
 * SEWA AJA - Client Helper Script
 * Workshop PjBL SMK Telkom Lampung
 * Light Theme & Interactive Item Selection Modal
 */

// State penyimpanan busana yang dipilih: Map of id -> Item Object
const selectedItemsMap = new Map();

document.addEventListener('DOMContentLoaded', () => {
  // 1. Auto Kalkulasi Tanggal (H-1 Tanggal Ambil, Hari H, H+1 Tanggal Kembali)
  const eventDateInput = document.getElementById('eventDate');
  const pickupDateInput = document.getElementById('pickupDate');
  const returnDateInput = document.getElementById('returnDate');

  if (eventDateInput && pickupDateInput && returnDateInput) {
    eventDateInput.addEventListener('change', () => {
      const selected = new Date(eventDateInput.value);
      if (!isNaN(selected.getTime())) {
        // H - 1
        const pickup = new Date(selected);
        pickup.setDate(selected.getDate() - 1);
        pickupDateInput.value = pickup.toISOString().split('T')[0];

        // H + 1
        const ret = new Date(selected);
        ret.setDate(selected.getDate() + 1);
        returnDateInput.value = ret.toISOString().split('T')[0];
      }
    });
  }

  // 2. Event Listeners Biaya & Pembayaran Kasir
  const additionalChargeInput = document.getElementById('additionalCharge');
  const discountInput = document.getElementById('discount');
  const paidAmountInput = document.getElementById('paidAmount');

  if (additionalChargeInput) additionalChargeInput.addEventListener('input', calculateRentalTotal);
  if (discountInput) discountInput.addEventListener('input', calculateRentalTotal);
  if (paidAmountInput) paidAmountInput.addEventListener('input', calculateRentalTotal);

  // Esc key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeItemModal();
    }
  });

  // Close modal when clicking outside dialog
  const itemModal = document.getElementById('itemModal');
  if (itemModal) {
    itemModal.addEventListener('click', (e) => {
      if (e.target === itemModal) {
        closeItemModal();
      }
    });
  }

  // Kalkulasi awal
  calculateRentalTotal();
});

/* ==========================================================
   Fungsi Modal Cari & Pilih Barang
   ========================================================== */

function openItemModal() {
  const modal = document.getElementById('itemModal');
  if (!modal) return;

  // Sinkronisasikan checkbox di dalam modal dengan item yang sedang terpilih
  const modalCheckboxes = document.querySelectorAll('.modal-item-checkbox');
  modalCheckboxes.forEach((cb) => {
    const id = cb.dataset.id;
    cb.checked = selectedItemsMap.has(id);
  });

  updateModalCounter();
  modal.style.display = 'flex';

  // Fokuskan pada input search
  setTimeout(() => {
    const searchInput = document.getElementById('modalSearchInput');
    if (searchInput) {
      searchInput.value = '';
      filterModalItems();
      searchInput.focus();
    }
  }, 100);
}

function closeItemModal() {
  const modal = document.getElementById('itemModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Filter pencarian dan kategori di dalam modal secara real-time
function filterModalItems() {
  const searchInput = document.getElementById('modalSearchInput');
  const categorySelect = document.getElementById('modalCategoryFilter');

  const query = (searchInput?.value || '').toLowerCase().trim();
  const selectedCat = categorySelect?.value || 'ALL';

  const rows = document.querySelectorAll('.modal-item-row');
  rows.forEach((row) => {
    const name = row.dataset.name || '';
    const code = (row.dataset.code || '').toLowerCase();
    const category = row.dataset.category || '';
    const size = (row.dataset.size || '').toLowerCase();

    const matchesSearch = query === '' || name.includes(query) || code.includes(query) || size.includes(query);
    const matchesCategory = selectedCat === 'ALL' || category === selectedCat;

    if (matchesSearch && matchesCategory) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function updateModalCounter() {
  const counterEl = document.getElementById('modalSelectedCounter');
  if (!counterEl) return;
  const checkedBoxes = document.querySelectorAll('.modal-item-checkbox:checked');
  counterEl.textContent = checkedBoxes.length;
}

// Konfirmasi pilihan barang dari modal ke form utama
function confirmModalSelection() {
  const checkedBoxes = document.querySelectorAll('.modal-item-checkbox:checked');

  // Bersihkan map lalu masukkan semua yang dicentang
  selectedItemsMap.clear();

  checkedBoxes.forEach((cb) => {
    const id = cb.dataset.id;
    selectedItemsMap.set(id, {
      id: id,
      code: cb.dataset.code,
      name: cb.dataset.name,
      category: cb.dataset.category,
      size: cb.dataset.size,
      price: Number(cb.dataset.price || 0)
    });
  });

  renderSelectedItems();
  closeItemModal();
  calculateRentalTotal();
}

// Hapus satu barang dari daftar pilihan di form utama
function removeSelectedItem(id) {
  selectedItemsMap.delete(String(id));
  renderSelectedItems();
  calculateRentalTotal();
}

// Render tabel barang yang telah dipilih di form utama
function renderSelectedItems() {
  const container = document.getElementById('selectedItemsContainer');
  const emptyBox = document.getElementById('emptyItemsBox');
  const tbody = document.getElementById('selectedItemsTbody');
  const hiddenInputs = document.getElementById('hiddenItemInputs');
  const badge = document.getElementById('selectedCountBadge');

  if (!container || !emptyBox || !tbody || !hiddenInputs) return;

  const count = selectedItemsMap.size;

  if (count === 0) {
    container.style.display = 'none';
    emptyBox.style.display = 'block';
    tbody.innerHTML = '';
    hiddenInputs.innerHTML = '';
    if (badge) badge.textContent = '0 Busana Dipilih';
    return;
  }

  // Tampilkan tabel
  emptyBox.style.display = 'none';
  container.style.display = 'block';

  let tableHtml = '';
  let inputsHtml = '';
  let idx = 1;

  selectedItemsMap.forEach((it) => {
    tableHtml += `
      <tr>
        <td>${idx++}</td>
        <td><span class="badge-code">${it.code}</span></td>
        <td><strong style="color: var(--text-main);">${it.name}</strong></td>
        <td>${it.category}</td>
        <td><span class="badge-size">${it.size}</span></td>
        <td><strong style="color: #0284c7;">Rp ${it.price.toLocaleString('id-ID')}</strong></td>
        <td style="text-align: right;">
          <button 
            type="button" 
            class="btn btn-danger btn-sm" 
            onclick="removeSelectedItem('${it.id}')"
            title="Hapus dari daftar pilihan"
          >
            🗑️ Hapus
          </button>
        </td>
      </tr>
    `;

    // Hidden input agar dikirim saat submit form POST
    inputsHtml += `<input type="hidden" name="itemIds" value="${it.id}">`;
  });

  tbody.innerHTML = tableHtml;
  hiddenInputs.innerHTML = inputsHtml;

  if (badge) {
    badge.textContent = `${count} Busana Dipilih`;
  }
}

/* ==========================================================
   Fungsi Kalkulasi Keuangan Sewa
   ========================================================== */

function calculateRentalTotal() {
  const additionalChargeInput = document.getElementById('additionalCharge');
  const discountInput = document.getElementById('discount');
  const paidAmountInput = document.getElementById('paidAmount');

  const totalBasePriceEl = document.getElementById('totalBasePriceDisplay');
  const finalPriceEl = document.getElementById('finalPriceDisplay');
  const remainingAmountEl = document.getElementById('remainingAmountDisplay');
  const paymentTypeBadge = document.getElementById('paymentTypeBadge');

  if (!totalBasePriceEl || !finalPriceEl || !remainingAmountEl) return;

  // Hitung total dari selectedItemsMap
  let baseTotal = 0;
  selectedItemsMap.forEach((it) => {
    baseTotal += it.price;
  });

  const charge = Number(additionalChargeInput?.value || 0);
  const disc = Number(discountInput?.value || 0);
  const finalTotal = Math.max(0, baseTotal + charge - disc);

  const paid = Number(paidAmountInput?.value || 0);
  const remaining = Math.max(0, finalTotal - paid);

  const formatIdr = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

  totalBasePriceEl.textContent = formatIdr(baseTotal);
  finalPriceEl.textContent = formatIdr(finalTotal);
  remainingAmountEl.textContent = formatIdr(remaining);

  if (paymentTypeBadge) {
    if (remaining === 0 && finalTotal > 0) {
      paymentTypeBadge.textContent = 'LUNAS';
      paymentTypeBadge.className = 'badge badge-available';
    } else {
      paymentTypeBadge.textContent = 'DP (Uang Muka)';
      paymentTypeBadge.className = 'badge badge-booking';
    }
  }
}

/* ==========================================================
   Fungsi Struk Thermal Bluetooth & Cetak Nota
   ========================================================== */

function setReceiptMode(mode) {
  const thermalWrapper = document.getElementById('thermalReceiptWrapper');
  const standardWrapper = document.getElementById('standardInvoiceWrapper');
  const btnThermal = document.getElementById('btnModeThermal');
  const btnStandard = document.getElementById('btnModeStandard');
  const widthControl = document.getElementById('thermalWidthControl');

  if (mode === 'thermal') {
    if (thermalWrapper) thermalWrapper.style.display = 'flex';
    if (standardWrapper) standardWrapper.style.display = 'none';
    if (btnThermal) btnThermal.classList.add('active');
    if (btnStandard) btnStandard.classList.remove('active');
    if (widthControl) widthControl.style.display = 'inline-flex';
    document.body.classList.remove('print-standard');
  } else {
    if (thermalWrapper) thermalWrapper.style.display = 'none';
    if (standardWrapper) standardWrapper.style.display = 'block';
    if (btnThermal) btnThermal.classList.remove('active');
    if (btnStandard) btnStandard.classList.add('active');
    if (widthControl) widthControl.style.display = 'none';
    document.body.classList.add('print-standard');
  }
}

function changeReceiptWidth(widthClass) {
  const thermalReceipt = document.getElementById('thermalReceipt');
  if (!thermalReceipt) return;
  thermalReceipt.classList.remove('width-80mm', 'width-58mm');
  thermalReceipt.classList.add(widthClass);
}

// Helper cetak nota
function printInvoice() {
  window.print();
}

