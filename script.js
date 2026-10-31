let products = JSON.parse(localStorage.getItem('shop_products')) || [];
let expenseSettings = JSON.parse(localStorage.getItem('shop_expense_settings')) || {
    packaging: 20,
    decoration: 15,
    platformFee: 5,
    orderFee: 3,
    growthFee: 3,
    other: 0,
    shippingRounds: [{ total: 100, qty: 10 }]
};

let currentSetItems = [];
let comparisonSets = JSON.parse(localStorage.getItem('shop_comparisons')) || [];

// ฟังก์ชันสลับหน้า Tab (Phase 2, 3, 4)
window.switchTab = function(tab) {
    const sec2 = document.getElementById('section-phase2');
    const sec3 = document.getElementById('section-phase3');
    const sec4 = document.getElementById('section-phase4');
    const btn2 = document.getElementById('btn-tab-phase2');
    const btn3 = document.getElementById('btn-tab-phase3');
    const btn4 = document.getElementById('btn-tab-phase4');
    const mainTitle = document.getElementById('main-title');
    const mainSub = document.getElementById('main-subtitle');
    const badge = document.getElementById('phase-badge');

    if (!sec2 || !sec3 || !sec4) return;

    sec2.style.display = 'none';
    sec3.style.display = 'none';
    sec4.style.display = 'none';
    if (btn2) btn2.classList.remove('active');
    if (btn3) btn3.classList.remove('active');
    if (btn4) btn4.classList.remove('active');

    if (tab === 'phase2') {
        sec2.style.display = 'block';
        if (btn2) btn2.classList.add('active');
        mainTitle.textContent = 'My Shop Manager';
        mainSub.textContent = 'Product Database';
        badge.textContent = 'Phase 2';
        renderProducts();
    } else if (tab === 'phase3') {
        sec3.style.display = 'block';
        if (btn3) btn3.classList.add('active');
        mainTitle.textContent = 'Expense Management';
        mainSub.textContent = 'จัดการค่าใช้จ่ายของร้านค้า';
        badge.textContent = 'Phase 3';
        initExpenseValues();
    } else if (tab === 'phase4') {
        sec4.style.display = 'block';
        if (btn4) btn4.classList.add('active');
        mainTitle.textContent = 'Pricing Calculator';
        mainSub.textContent = 'ระบบคำนวณต้นทุนและราคาขาย';
        badge.textContent = 'Phase 4';
        initPricingCalculator();
    }
};

// --- LOGIC PHASE 2 ---
function calculateProductTier(cost, minCost, maxCost) {
    if (products.length < 2 || minCost === maxCost) return { text: 'รอจัดระดับ', class: 'default' };
    const range = maxCost - minCost;
    if (cost >= minCost + (range * 2) / 3) return { text: 'Big', class: 'big' };
    if (cost >= minCost + range / 3) return { text: 'Medium', class: 'medium' };
    return { text: 'Small', class: 'small' };
}

window.deleteProduct = function(id) {
    if (confirm('คุณต้องการลบรายการสินค้านี้ใช่หรือไม่?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('shop_products', JSON.stringify(products));
        renderProducts();
    }
};

window.editProduct = function(id) {
    const p = products.find(item => item.id === id);
    if (!p) return;
    document.getElementById('modal-title').textContent = 'แก้ไขข้อมูลสินค้า';
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-sku').value = p.sku === 'ไม่มี SKU' ? '' : p.sku;
    document.getElementById('prod-cost').value = p.cost;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-price').value = p.price.replace(' ฿', '') === 'ยังไม่ระบุ' ? '' : p.price.replace(' ฿', '');
    document.getElementById('product-modal').style.display = 'flex';
};

function renderProducts(filter = '') {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    productList.innerHTML = '';
    const filtered = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
    
    const totalItemsEl = document.getElementById('total-items');
    const totalCostEl = document.getElementById('total-cost');
    const tierMessage = document.getElementById('tier-message');

    if (totalItemsEl) totalItemsEl.textContent = products.length;
    if (totalCostEl) totalCostEl.textContent = products.reduce((sum, p) => sum + (p.cost * p.stock), 0).toLocaleString();

    const costs = products.map(p => p.cost);
    const minCost = costs.length ? Math.min(...costs) : 0;
    const maxCost = costs.length ? Math.max(...costs) : 0;

    if (tierMessage) {
        tierMessage.textContent = products.length >= 2 ? `วิเคราะห์จากข้อมูลสินค้า ${products.length} รายการ` : `ต้องมีข้อมูลอย่างน้อย 2 รายการขึ้นไปเพื่อจัดกลุ่ม`;
    }

    if (filtered.length === 0) {
        productList.innerHTML = `<p style="text-align:center; color:#888; padding: 20px;">ยังไม่มีรายการสินค้า</p>`;
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const tier = calculateProductTier(p.cost, minCost, maxCost);
        card.innerHTML = `
            <img src="${p.image || 'https://via.placeholder.com/60?text=No+Img'}" class="product-img">
            <div class="product-info">
                <div class="product-header">
                    <span class="product-name">${p.name}</span>
                    <span class="status-badge ${tier.class}">${tier.text}</span>
                </div>
                <div class="product-details">
                    <div>${p.sku}</div>
                    <div>ราคาทุน: <strong>${p.cost.toLocaleString()} ฿</strong> | คงเหลือ: <strong>${p.stock} ชิ้น</strong></div>
                    <div>ราคาขายปลีก: <strong>${p.price}</strong></div>
                </div>
                <button class="edit-btn" onclick="editProduct(${p.id})">แก้ไข</button>
            </div>
            <button class="delete-btn" onclick="deleteProduct(${p.id})">ลบรายการ</button>
        `;
        productList.appendChild(card);
    });
}

// --- LOGIC PHASE 3 ---
function initExpenseValues() {
    const inputPkg = document.getElementById('input-packaging');
    const inputDec = document.getElementById('input-decoration');
    const inputFee = document.getElementById('input-platform-fee');
    const inputOrderFee = document.getElementById('input-order-fee');
    const inputGrowthFee = document.getElementById('input-growth-fee');
    const inputOth = document.getElementById('input-other');

    if (!inputPkg) return;

    inputPkg.value = expenseSettings.packaging;
    inputDec.value = expenseSettings.decoration;
    inputFee.value = expenseSettings.platformFee;
    if (inputOrderFee) inputOrderFee.value = expenseSettings.orderFee !== undefined ? expenseSettings.orderFee : 3;
    if (inputGrowthFee) inputGrowthFee.value = expenseSettings.growthFee !== undefined ? expenseSettings.growthFee : 3;
    inputOth.value = expenseSettings.other;

    updateExpenseCalc();
    updateShippingDisplay();
}

function updateExpenseCalc() {
    const pkg = parseFloat(document.getElementById('input-packaging')?.value) || 0;
    const dec = parseFloat(document.getElementById('input-decoration')?.value) || 0;
    const fee = parseFloat(document.getElementById('input-platform-fee')?.value) || 0;
    const orderFee = parseFloat(document.getElementById('input-order-fee')?.value) || 0;
    const growthFee = parseFloat(document.getElementById('input-growth-fee')?.value) || 0;
    const oth = parseFloat(document.getElementById('input-other')?.value) || 0;
    
    const totalSet = pkg + dec + oth;
    const totalFeePercent = fee + orderFee + growthFee;

    if (document.getElementById('sum-packaging')) document.getElementById('sum-packaging').textContent = `${pkg.toFixed(2)} ฿`;
    if (document.getElementById('sum-decoration')) document.getElementById('sum-decoration').textContent = `${dec.toFixed(2)} ฿`;
    if (document.getElementById('sum-other')) document.getElementById('sum-other').textContent = `${oth.toFixed(2)} ฿`;
    if (document.getElementById('sum-total-fee')) document.getElementById('sum-total-fee').textContent = `${totalFeePercent.toFixed(2)} %`;
    if (document.getElementById('sum-total-set')) document.getElementById('sum-total-set').textContent = `${totalSet.toFixed(2)} ฿`;
    if (document.getElementById('top-expense-per-set')) document.getElementById('top-expense-per-set').textContent = totalSet.toFixed(2);
    if (document.getElementById('top-platform-fee')) document.getElementById('top-platform-fee').textContent = totalFeePercent.toFixed(2);

    const sTotal = parseFloat(document.getElementById('shipping-total')?.value) || 0;
    const sQty = parseInt(document.getElementById('shipping-qty')?.value) || 0;
    if (document.getElementById('shipping-per-piece')) {
        document.getElementById('shipping-per-piece').textContent = `${(sQty > 0 ? sTotal / sQty : 0).toFixed(2)} ฿`;
    }
}

function updateShippingDisplay() {
    const rounds = expenseSettings.shippingRounds || [];
    const editingIndexInput = document.getElementById('editing-round-index');
    const editingIndex = editingIndexInput ? parseInt(editingIndexInput.value) || -1 : -1;
    const targetIndex = editingIndex >= 0 ? editingIndex : rounds.length - 1;
    const currentRound = rounds[targetIndex] || { total: 0, qty: 0 };
    const totalRounds = rounds.length;
    const grandTotal = rounds.reduce((sum, r) => sum + r.total, 0);
    const perPiece = currentRound.qty > 0 ? (currentRound.total / currentRound.qty) : 0;

    if (document.getElementById('hist-record-title')) document.getElementById('hist-record-title').textContent = `SHIPPING RECORD #${String(targetIndex + 1).padStart(3, '0')}`;
    if (document.getElementById('hist-round-num')) document.getElementById('hist-round-num').textContent = targetIndex + 1;
    if (document.getElementById('hist-amount')) document.getElementById('hist-amount').textContent = `${currentRound.total.toFixed(2)} ฿`;
    if (document.getElementById('hist-qty')) document.getElementById('hist-qty').textContent = `${currentRound.qty} ชิ้น`;
    if (document.getElementById('hist-per-piece')) document.getElementById('hist-per-piece').textContent = `${perPiece.toFixed(2)} ฿`;
    if (document.getElementById('hist-total-rounds')) document.getElementById('hist-total-rounds').textContent = `${totalRounds} รอบ`;
    if (document.getElementById('hist-grand-total')) document.getElementById('hist-grand-total').textContent = `${grandTotal.toFixed(2)} ฿`;
}

// --- LOGIC PHASE 4 ---
function initPricingCalculator() {
    const selector = document.getElementById('product-selector');
    if (!selector) return;

    selector.innerHTML = '<option value="">-- กรุณาเลือกสินค้าจากคลัง --</option>';
    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (ทุน: ${p.cost} ฿)`;
        selector.appendChild(opt);
    });

    renderSetItems();
    updatePricingCalculation('margin');
    renderComparisons();
}

window.removeSetItem = function(index) {
    currentSetItems.splice(index, 1);
    renderSetItems();
    updatePricingCalculation('margin');
};

function renderSetItems() {
    const container = document.getElementById('set-items-list');
    const countEl = document.getElementById('set-items-count');
    if (!container) return;

    if (countEl) countEl.textContent = `${currentSetItems.length} รายการ`;

    if (currentSetItems.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#888; font-size:13px; padding:10px;">ยังไม่มีสินค้าในเซ็ต</p>`;
        return;
    }

    container.innerHTML = '';
    currentSetItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'set-item-row';
        row.innerHTML = `
            <span>${item.name} (${item.cost} ฿) x ${item.qty} ชิ้น</span>
            <button type="button" onclick="removeSetItem(${index})" style="color:red; background:none; border:none; cursor:pointer;">ลบ</button>
        `;
        container.appendChild(row);
    });
}

// ระบบคำนวณราคาขาย กำไรบาท และ % Gross Margin
function updatePricingCalculation(triggerSource = 'margin') {
    const prodCostTotal = currentSetItems.reduce((sum, item) => sum + (item.cost * item.qty), 0);

    const pkg = expenseSettings.packaging || 0;
    const dec = expenseSettings.decoration || 0;
    const oth = expenseSettings.other || 0;
    
    const rounds = expenseSettings.shippingRounds || [{ total: 100, qty: 10 }];
    const lastRound = rounds[rounds.length - 1] || { total: 100, qty: 10 };
    const shippingPerPiece = lastRound.qty > 0 ? (lastRound.total / lastRound.qty) : 0;
    const totalSetQty = currentSetItems.reduce((sum, item) => sum + item.qty, 0);
    const totalShipping = shippingPerPiece * totalSetQty;

    const expenseTotal = pkg + dec + oth + totalShipping;
    const baseCost = prodCostTotal + expenseTotal;

    const totalFeePct = (expenseSettings.platformFee || 0) + (expenseSettings.orderFee || 0) + (expenseSettings.growthFee || 0);

    const targetMarginInput = document.getElementById('target-margin');
    const customPriceInput = document.getElementById('custom-price-input');

    let finalPrice = 0;
    let netProfit = 0;
    let profitMarginPct = 0;

    if (triggerSource === 'custom' && customPriceInput && parseFloat(customPriceInput.value) > 0) {
        // คำนวณจากราคาขายที่ผู้ใช้กำหนดเอง (Custom Price)
        finalPrice = parseFloat(customPriceInput.value);
        const feeAmount = finalPrice * (totalFeePct / 100);
        netProfit = finalPrice - baseCost - feeAmount;
        profitMarginPct = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0;
    } else {
        // คำนวณจาก % กำไรเป้าหมาย (% Margin)
        const targetMargin = targetMarginInput ? parseFloat(targetMarginInput.value) || 25 : 25;
        const marginDecimal = targetMargin / 100;
        const feeDecimal = totalFeePct / 100;

        finalPrice = (1 - marginDecimal - feeDecimal > 0) ? baseCost / (1 - marginDecimal - feeDecimal) : baseCost * 2;
        const feeAmount = finalPrice * feeDecimal;
        netProfit = finalPrice - baseCost - feeAmount;
        profitMarginPct = targetMargin;

        if (triggerSource === 'margin' && customPriceInput) {
            customPriceInput.value = '';
        }
    }

    const feeAmountFinal = finalPrice * (totalFeePct / 100);

    // อัปเดตแสดงผลตัวเลขบนหน้าจอ
    if (document.getElementById('calc-total-cost')) document.getElementById('calc-total-cost').textContent = baseCost.toFixed(2);
    if (document.getElementById('calc-recommended-price')) document.getElementById('calc-recommended-price').textContent = finalPrice.toFixed(2);
    if (document.getElementById('summary-prod-cost')) document.getElementById('summary-prod-cost').textContent = `${prodCostTotal.toFixed(2)} ฿`;
    if (document.getElementById('summary-exp-cost')) document.getElementById('summary-exp-cost').textContent = `${expenseTotal.toFixed(2)} ฿`;
    if (document.getElementById('summary-fee-pct')) document.getElementById('summary-fee-pct').textContent = totalFeePct.toFixed(2);
    if (document.getElementById('summary-fee-amount')) document.getElementById('summary-fee-amount').textContent = `${feeAmountFinal.toFixed(2)} ฿`;
    
    // แสดงกำไรสุทธิเป็น บาท + %
    if (document.getElementById('summary-net-profit')) document.getElementById('summary-net-profit').textContent = `${netProfit.toFixed(2)} ฿`;
    if (document.getElementById('summary-profit-details')) document.getElementById('summary-profit-details').textContent = `(คิดเป็น Gross Margin: ${profitMarginPct.toFixed(1)}%)`;
    
    if (document.getElementById('summary-final-price')) document.getElementById('summary-final-price').textContent = `${finalPrice.toFixed(2)} ฿`;
}

function renderComparisons() {
    const list = document.getElementById('comparison-list');
    if (!list) return;

    if (comparisonSets.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888; font-size:13px;">ยังไม่มีการบันทึกเซ็ตเปรียบเทียบ</p>`;
        return;
    }

    list.innerHTML = '';
    comparisonSets.forEach((set) => {
        const card = document.createElement('div');
        card.className = 'comparison-card';
        card.innerHTML = `
            <div>
                <strong>${set.name}</strong><br>
                <small style="color:#666;">${set.itemsSummary}</small>
            </div>
            <div style="text-align:right;">
                <span style="color:#0f9d58; font-weight:600;">กำไร: ${set.profit}</span><br>
                <small>ราคาขาย: ${set.price}</small>
            </div>
        `;
        list.appendChild(card);
    });
}

// BIND EVENTS ON DOM READY
document.addEventListener('DOMContentLoaded', () => {
    // Form Product Add/Edit Modal
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const productForm = document.getElementById('product-form');
    const modal = document.getElementById('product-modal');

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'เพิ่มสินค้าใหม่';
            productForm.reset();
            document.getElementById('prod-id').value = '';
            modal.style.display = 'flex';
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    }

    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('prod-id').value;
            const name = document.getElementById('prod-name').value;
            const sku = document.getElementById('prod-sku').value;
            const cost = parseFloat(document.getElementById('prod-cost').value) || 0;
            const stock = parseInt(document.getElementById('prod-stock').value) || 0;
            const price = document.getElementById('prod-price').value;
            const imageFile = document.getElementById('prod-image').files[0];

            const saveProductData = (imageUrl) => {
                if (id) {
                    products = products.map(p => p.id == id ? { ...p, name, sku: sku || 'ไม่มี SKU', cost, stock, price: price ? `${price} ฿` : 'ยังไม่ระบุ', image: imageUrl || p.image } : p);
                } else {
                    products.push({ id: Date.now(), name, sku: sku || 'ไม่มี SKU', cost, stock, price: price ? `${price} ฿` : 'ยังไม่ระบุ', image: imageUrl || null });
                }
                localStorage.setItem('shop_products', JSON.stringify(products));
                renderProducts();
                productForm.reset();
                modal.style.display = 'none';
            };

            if (imageFile) {
                const reader = new FileReader();
                reader.onload = ev => saveProductData(ev.target.result);
                reader.readAsDataURL(imageFile);
            } else {
                saveProductData(null);
            }
        });
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', e => renderProducts(e.target.value));
    }

    // Phase 3 Inputs
    ['input-packaging', 'input-decoration', 'input-platform-fee', 'input-order-fee', 'input-growth-fee', 'input-other', 'shipping-total', 'shipping-qty'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateExpenseCalc);
    });

    const saveShipBtn = document.getElementById('save-shipping-btn');
    if (saveShipBtn) {
        saveShipBtn.addEventListener('click', () => {
            const total = parseFloat(document.getElementById('shipping-total').value) || 0;
            const qty = parseInt(document.getElementById('shipping-qty').value) || 0;
            const editingIndex = parseInt(document.getElementById('editing-round-index').value) || -1;
            
            if (!expenseSettings.shippingRounds) expenseSettings.shippingRounds = [];
            
            if (editingIndex >= 0) {
                expenseSettings.shippingRounds[editingIndex] = { total, qty };
                document.getElementById('editing-round-index').value = -1;
                document.getElementById('form-shipping-label').textContent = 'ค่าขนส่งรวมรอบนี้ (บาท)';
                saveShipBtn.textContent = 'บันทึกรอบขนส่ง';
                alert('อัปเดตข้อมูลรอบขนส่งเรียบร้อยแล้ว!');
            } else {
                expenseSettings.shippingRounds.push({ total, qty });
                alert('บันทึกรอบขนส่งใหม่เรียบร้อยแล้ว!');
            }

            localStorage.setItem('shop_expense_settings', JSON.stringify(expenseSettings));
            updateShippingDisplay();
        });
    }

    const editCurrentRoundBtn = document.getElementById('edit-current-round-btn');
    if (editCurrentRoundBtn) {
        editCurrentRoundBtn.addEventListener('click', () => {
            const rounds = expenseSettings.shippingRounds || [];
            if (rounds.length === 0) return;
            const editingIndex = parseInt(document.getElementById('editing-round-index').value) || -1;
            const targetIndex = editingIndex >= 0 ? editingIndex : rounds.length - 1;
            const round = rounds[targetIndex];

            document.getElementById('shipping-total').value = round.total;
            document.getElementById('shipping-qty').value = round.qty;
            document.getElementById('editing-round-index').value = targetIndex;
            document.getElementById('form-shipping-label').textContent = `แก้ไขค่าขนส่งรวม (รอบที่ ${targetIndex + 1})`;
            document.getElementById('save-shipping-btn').textContent = 'บันทึกการแก้ไข';
            updateExpenseCalc();
            updateShippingDisplay();
        });
    }

    const addRoundBtn = document.getElementById('add-new-round-btn');
    if (addRoundBtn) {
        addRoundBtn.addEventListener('click', () => {
            if (!expenseSettings.shippingRounds) expenseSettings.shippingRounds = [];
            expenseSettings.shippingRounds.push({ total: 100, qty: 10 });
            localStorage.setItem('shop_expense_settings', JSON.stringify(expenseSettings));
            
            document.getElementById('editing-round-index').value = -1;
            document.getElementById('form-shipping-label').textContent = 'ค่าขนส่งรวมรอบนี้ (บาท)';
            document.getElementById('save-shipping-btn').textContent = 'บันทึกรอบขนส่ง';
            document.getElementById('shipping-total').value = 100;
            document.getElementById('shipping-qty').value = 10;
            updateExpenseCalc();
            updateShippingDisplay();
            alert('เปิดรอบขนส่งใหม่สำเร็จ!');
        });
    }

    const deleteRoundBtn = document.getElementById('delete-round-btn');
    if (deleteRoundBtn) {
        deleteRoundBtn.addEventListener('click', () => {
            const rounds = expenseSettings.shippingRounds || [];
            if (rounds.length <= 1) {
                alert('ต้องมีข้อมูลรอบขนส่งอย่างน้อย 1 รอบ');
                return;
            }
            if (confirm('คุณต้องการลบรอบขนส่งนี้ใช่หรือไม่?')) {
                const editingIndex = parseInt(document.getElementById('editing-round-index').value) || -1;
                const targetIndex = editingIndex >= 0 ? editingIndex : rounds.length - 1;
                
                rounds.splice(targetIndex, 1);
                expenseSettings.shippingRounds = rounds;
                document.getElementById('editing-round-index').value = -1;
                document.getElementById('form-shipping-label').textContent = 'ค่าขนส่งรวมรอบนี้ (บาท)';
                document.getElementById('save-shipping-btn').textContent = 'บันทึกรอบขนส่ง';

                localStorage.setItem('shop_expense_settings', JSON.stringify(expenseSettings));
                
                const last = rounds[rounds.length - 1];
                document.getElementById('shipping-total').value = last.total;
                document.getElementById('shipping-qty').value = last.qty;

                updateExpenseCalc();
                updateShippingDisplay();
                alert('ลบรอบขนส่งสำเร็จ!');
            }
        });
    }

    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            expenseSettings.packaging = parseFloat(document.getElementById('input-packaging').value) || 0;
            expenseSettings.decoration = parseFloat(document.getElementById('input-decoration').value) || 0;
            expenseSettings.platformFee = parseFloat(document.getElementById('input-platform-fee').value) || 0;
            expenseSettings.orderFee = parseFloat(document.getElementById('input-order-fee').value) || 0;
            expenseSettings.growthFee = parseFloat(document.getElementById('input-growth-fee').value) || 0;
            expenseSettings.other = parseFloat(document.getElementById('input-other').value) || 0;

            localStorage.setItem('shop_expense_settings', JSON.stringify(expenseSettings));
            alert('บันทึกการตั้งค่าค่าใช้จ่ายเรียบร้อยแล้ว!');
        });
    }

    // Phase 4 Event Listeners
    const addToSetBtn = document.getElementById('add-to-set-btn');
    if (addToSetBtn) {
        addToSetBtn.addEventListener('click', () => {
            const selector = document.getElementById('product-selector');
            const qtyInput = document.getElementById('selector-qty');
            if (!selector || !qtyInput) return;

            const prodId = parseInt(selector.value);
            const qty = parseInt(qtyInput.value) || 1;

            if (!prodId) {
                alert('กรุณาเลือกสินค้าก่อนครับ');
                return;
            }

            const product = products.find(p => p.id === prodId);
            if (!product) return;

            const existing = currentSetItems.find(item => item.id === prodId);
            if (existing) {
                existing.qty += qty;
            } else {
                currentSetItems.push({ ...product, qty });
            }

            renderSetItems();
            updatePricingCalculation('margin');
        });
    }

    const targetMarginEl = document.getElementById('target-margin');
    if (targetMarginEl) {
        targetMarginEl.addEventListener('input', () => updatePricingCalculation('margin'));
    }

    const customPriceEl = document.getElementById('custom-price-input');
    if (customPriceEl) {
        customPriceEl.addEventListener('input', () => updatePricingCalculation('custom'));
    }

    const saveSetComparisonBtn = document.getElementById('save-set-comparison-btn');
    if (saveSetComparisonBtn) {
        saveSetComparisonBtn.addEventListener('click', () => {
            if (currentSetItems.length === 0) {
                alert('กรุณาเลือกสินค้าใส่เซ็ตก่อนบันทึกเปรียบเทียบครับ');
                return;
            }
            const setName = prompt('ตั้งชื่อเซ็ตสินค้า (เช่น เซ็ตของขวัญ A, เซ็ตตุ๊กตาหมี Big):', `เซ็ตที่ ${comparisonSets.length + 1}`);
            if (!setName) return;

            const finalPriceText = document.getElementById('summary-final-price').textContent;
            const netProfitText = document.getElementById('summary-net-profit').textContent;

            comparisonSets.push({
                name: setName,
                itemsSummary: currentSetItems.map(i => `${i.name} x${i.qty}`).join(', '),
                price: `${finalPriceText}`,
                profit: `${netProfitText}`
            });

            localStorage.setItem('shop_comparisons', JSON.stringify(comparisonSets));
            renderComparisons();
            alert('บันทึกเซ็ตเปรียบเทียบเรียบร้อยแล้ว!');
        });
    }

    renderProducts();
});