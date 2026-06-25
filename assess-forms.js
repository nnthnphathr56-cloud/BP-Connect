/* ===== Student Health Self-Assessment Forms ===== */
(function () {
  const GRADES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
  const SEMS = ['ภาคเรียนที่ 1', 'ภาคเรียนที่ 2'];
  const STORAGE_PREFIX = 'bp_assess_';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function loadData(key) {
    try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + key) || '{}'); }
    catch (e) { return {}; }
  }

  function saveData(key, data) {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  }

  function getVal(data, id) {
    return data[id] !== undefined ? data[id] : '';
  }

  function gradeSemHeaderRow(colspan) {
    let h = '<tr><th rowspan="2" class="row-label">อวัยวะที่ตรวจ</th><th rowspan="2" class="row-desc">ลักษณะความผิดปกติ</th>';
    GRADES.forEach(g => { h += `<th colspan="${colspan}">${g}</th>`; });
    h += '</tr><tr>';
    GRADES.forEach(() => SEMS.forEach(s => { h += `<th>${s.replace('ภาคเรียนที่ ', 'ภ.')}</th>`; }));
    h += '</tr>';
    return h;
  }

  function cellSelect(id, data, opts) {
    const v = getVal(data, id);
    let html = `<select name="${id}" data-field="${id}">`;
    html += '<option value="">-</option>';
    opts.forEach(o => { html += `<option value="${o.v}"${v === o.v ? ' selected' : ''}>${o.l}</option>`; });
    html += '</select>';
    return html;
  }

  function cellInput(id, data, type, placeholder) {
    const v = getVal(data, id);
    return `<input type="${type}" name="${id}" data-field="${id}" value="${esc(v)}" placeholder="${placeholder || ''}">`;
  }

  function cellInput(id, data, type, placeholder) {
    const form = mount.querySelector('form');
    if (!form) return;
    function collect() {
      const data = {};
      form.querySelectorAll('[data-field]').forEach(el => {
        if (el.type === 'radio') {
          if (el.checked) data[el.dataset.field] = el.value;
        } else if (el.type === 'checkbox') {
          data[el.dataset.field] = el.checked ? (el.value || '1') : '';
        } else {
          data[el.dataset.field] = el.value;
        }
      });
      saveData(key, data);
      if (onCalc) onCalc(form, data);
      return data;
    }
    form.addEventListener('change', collect);
    form.addEventListener('submit', e => {
      e.preventDefault();
      collect();
      if (typeof showToast === 'function') showToast('✅', 'บันทึกแบบประเมินเรียบร้อยแล้ว');
    });
  }

  /* ---- Part 1: Disease Survey ---- */
  /* รูปอ้างอิงทางการแพทย์จาก Wikimedia Commons (ใช้เพื่อการศึกษา) */
  const WM = 'https://upload.wikimedia.org/wikipedia/commons';
  const DISEASE_REF_IMAGES = [
    { // ปาก ลิ้น
      normal: `${WM}/b/b8/Adult_human_mouth.jpg`,
      abnormal: `${WM}/6/69/Canker_sore_mouth_ulcer.jpg`,
      nAlt: 'ปากและลิ้นปกติ', aAlt: 'แผลในปาก / แผลมุมปาก'
    },
    { // ฟัน
      normal: `${WM}/c/ca/Healthy_gingiva.jpg`,
      abnormal: `${WM}/e/eb/Dental_Caries_Cavity_2_(cropped).JPG`,
      nAlt: 'ฟันสะอาด ไม่มีผุ', aAlt: 'ฟันผุ เป็นจุดดำ'
    },
    { // เหงือก
      normal: `${WM}/c/ca/Healthy_gingiva.jpg`,
      abnormal: `${WM}/1/17/Gingivitis_(crop).jpg`,
      nAlt: 'เหงือกชมพู แนบชิดฟัน', aAlt: 'เหงือกบวมแดง อักเสบ'
    },
    { // คอ
      normal: `${WM}/9/99/Male_human_mouth.jpg`,
      abnormal: `${WM}/b/ba/Streptococcal_pharyngitis.jpg`,
      nAlt: 'คอและทอนซิลปกติ', aAlt: 'คอแดง ทอนซิลอักเสบ'
    },
    { // ต่อมไทรอยด์
      normal: `${WM}/e/e9/Human_female_neck.jpg`,
      abnormal: `${WM}/4/43/Kone_med_stor_struma.jpg`,
      nAlt: 'คอเรียบ ไม่มีก้อน', aAlt: 'คอโต มีก้อนที่ต่อมไทรอยด์'
    },
    { // ผิวหนัง
      normal: `${WM}/5/5f/Human_skin_close-up.jpg`,
      abnormal: `${WM}/5/5c/Tinea_corporis.jpg`,
      nAlt: 'ผิวเรียบ ไม่มีผื่น', aAlt: 'กลาก ผื่นแดง'
    }
  ];

  function diseaseRefImg(src, alt) {
    return `<img src="${src}" alt="${esc(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  }

  function diseaseRefCell(ri) {
    const ref = DISEASE_REF_IMAGES[ri];
    if (!ref) return '-';
    return `<div class="assess-ref-pair">
      <div class="assess-ref-item"><span class="assess-ref-label">ปกติ</span>${diseaseRefImg(ref.normal, ref.nAlt)}</div>
      <div class="assess-ref-item"><span class="assess-ref-label abnormal">ผิดปกติ</span>${diseaseRefImg(ref.abnormal, ref.aAlt)}</div>
    </div>`;
  }

  function renderDisease(mount) {
    const key = 'disease';
    const data = loadData(key);
    const rows = [
      { organ: 'ปาก ลิ้น', desc: 'แผลมุมปาก แผลในปากหรือลิ้น' },
      { organ: 'ฟัน', desc: 'ฟันผุ เป็นจุดดำ ฟันผุ ปวดฟัน' },
      { organ: 'เหงือก', desc: 'บวมแดง มีหนอง เลือดออก' },
      { organ: 'คอ', desc: 'ไอ เจ็บคอ อ้าปากดูในกระจก พบว่าคอแดง หรือเป็นหนอง ทอนซิลโต' },
      { organ: 'ต่อมไทรอยด์', desc: 'มีก้อนบริเวณคอ (แหงนหน้าส่องกระจกแล้วกลืนน้ำลาย มองเห็นเป็นก้อนเคลื่อนที่ตามการกลืน)' },
      { organ: 'ผิวหนัง', desc: 'ด่างขาว กลาก เกลื้อน พุพอง แผล ผื่นแดง หิด' }
    ];
    let tbody = '';
    rows.forEach((r, ri) => {
      const fid = 'd' + ri + '_status';
      const v = getVal(data, fid);
      const noteFid = 'd' + ri + '_note';
      const descCell = r.hasNote
        ? `${r.desc}<br><input type="text" class="form-input" style="margin-top:0.4rem;font-size:0.75rem;" data-field="${noteFid}" value="${esc(getVal(data, noteFid))}" placeholder="ระบุอาการ (ถ้ามี)">`
        : r.desc;
      tbody += `<tr>
        <td class="row-label">${r.organ}</td>
        <td class="row-desc">${descCell}</td>
        <td>${diseaseRefCell(ri)}</td>
        <td><label class="assess-radio-opt"><input type="radio" name="${fid}" data-field="${fid}" value="ปกติ"${v === 'ปกติ' ? ' checked' : ''}></label></td>
        <td><label class="assess-radio-opt"><input type="radio" name="${fid}" data-field="${fid}" value="ผิดปกติ"${v === 'ผิดปกติ' ? ' checked' : ''}></label></td>
      </tr>`;
    });
    mount.innerHTML = `
      <span class="assess-part-badge">ตอนที่ 1</span>
      <h2 class="section-title">แบบสำรวจโรค หรือ ความผิดปกติของร่างกาย</h2>
      <div class="assess-instruction">
        <strong>คำแนะนำ:</strong> นักเรียนสำรวจร่างกายของตนเอง ทำเครื่องหมาย ✓ ในช่อง <strong>ปกติ</strong> หรือ <strong>ผิดปกติ</strong> หากพบความผิดปกติให้แจ้งครูประจำชั้นหรือครูที่ปรึกษา
      </div>
      <form id="assessForm-disease">
        <div class="assess-meta-row">
          <div class="form-group"><label class="form-label">วัน เดือน ปี ที่ตรวจ</label>${cellInput('check_date', data, 'date', '')}</div>
        </div>
        <div class="assess-table-wrap"><table class="assess-table" style="min-width:520px;">
          <thead><tr>
            <th class="row-label">อวัยวะที่ตรวจ</th>
            <th class="row-desc">ลักษณะความผิดปกติ</th>
            <th>รูปตัวอย่าง<br><span style="font-weight:400;font-size:0.6rem;">ปกติ / ผิดปกติ</span></th>
            <th>ปกติ</th>
            <th>ผิดปกติ</th>
          </tr></thead>
          <tbody>${tbody}</tbody>
        </table></div>
        <button type="submit" class="btn btn-gold btn-full" style="margin-top:1rem;">💾 บันทึกแบบสำรวจ</button>
      </form>`;
    bindForm(mount, key);
  }

  /* ---- Part 2: Vision & Hearing ---- */
  function renderVision(mount) {
    const key = 'vision';
    const data = loadData(key);
    const opts = [{ v: 'ปกติ', l: 'ปกติ' }, { v: 'ผิดปกติ', l: 'ผิดปกติ' }];
    const items = [
      { label: 'ตาขวา (วัดสายตา)', k: 'eye_r' },
      { label: 'ตาซ้าย (วัดสายตา)', k: 'eye_l' },
      { label: 'หูขวา (การได้ยิน)', k: 'ear_r' },
      { label: 'หูซ้าย (การได้ยิน)', k: 'ear_l' }
    ];
    let tbody = '';
    items.forEach(it => {
      tbody += `<tr><td class="row-label" colspan="2">${it.label}</td>`;
      GRADES.forEach((g, gi) => SEMS.forEach((s, si) => {
        tbody += `<td>${cellSelect(it.k + `_g${gi}_s${si}`, data, opts)}</td>`;
      }));
      tbody += '</tr>';
    });
    tbody += `<tr><td class="row-label" colspan="2">วัน เดือน ปี ที่ตรวจ</td>`;
    GRADES.forEach((g, gi) => SEMS.forEach((s, si) => {
      tbody += `<td>${cellInput('vdate_g' + gi + '_s' + si, data, 'date', '')}</td>`;
    }));
    tbody += '</tr>';
    mount.innerHTML = `
      <span class="assess-part-badge">ตอนที่ 2</span>
      <h2 class="section-title">แบบสำรวจภาวะสายตาและการได้ยิน</h2>
      <div class="assess-instruction">
        <strong>การวัดสายตา (แม่แบบอักษร E / ตัวเลข):</strong> ยืนห่างจากแผ่นวัด 6 เมตร ปิดตาซ้ายทดสอบตาขวาและสลับกัน อ่านบรรทัดที่ 6 ได้ ≥4 ตัว = ปกติ<br>
        <strong>การทดสอบการได้ยิน:</strong> นั่งหันหลังให้ผู้ทดสอบ ในห้องเงียบ ถูนิ้วโป้งกับนิ้วชี้ใกล้หู ได้ยิน = ปกติ ไม่ได้ยิน = ผิดปกติ (แจ้งครู)<br>
        <em>หมายเหตุ: หากสวมแว่นต้องสวมแว่นขณะทดสอบ และระบุ "สวมแว่นสายตา"</em>
      </div>
      <form id="assessForm-vision">
        <div class="form-group"><label class="form-label">หมายเหตุ (เช่น สวมแว่นสายตา)</label>
          <input type="text" class="form-input" data-field="note" value="${esc(getVal(data, 'note'))}" placeholder="สวมแว่นสายตา (ถ้ามี)">
        </div>
        <div class="assess-table-wrap"><table class="assess-table"><thead>${gradeSemHeaderRow(1)}</thead><tbody>${tbody}</tbody></table></div>
        <button type="submit" class="btn btn-gold btn-full" style="margin-top:1rem;">💾 บันทึกแบบสำรวจ</button>
      </form>`;
    bindForm(mount, key);
  }

  /* ---- Part 3: Oral Health ---- */
  function renderOral(mount) {
    const key = 'oral';
    const data = loadData(key);
    const rows = [
      { label: 'ฟันผุ/แตก/ร้าว', desc: 'ตรวจพบจุดดำ รูฟัน หรือฟันแตก' },
      { label: 'เหงือกอักเสบ', desc: 'เหงือกบวมแดง เลือดออกขณะแปรงฟัน' },
      { label: 'แผลในช่องปาก', desc: 'มีแผลขาว/เหลืองบนลิ้น แก้ม หรือริมฝีปาก' },
      { label: 'ความสะอาด', desc: '0=สะอาด 1=มีคราบจุลินทรีย์/เศษอาหารติดฟัน' }
    ];
    const opts = [{ v: '0', l: '0 ปกติ' }, { v: '1', l: '1 ผิดปกติ' }];
    let tbody = '';
    rows.forEach((r, ri) => {
      tbody += `<tr><td class="row-label">${r.label}</td><td class="row-desc">${r.desc}</td>`;
      GRADES.forEach((g, gi) => SEMS.forEach((s, si) => {
        tbody += `<td>${cellSelect('o' + ri + '_g' + gi + '_s' + si, data, opts)}</td>`;
      }));
      tbody += '</tr>';
    });
    mount.innerHTML = `
      <span class="assess-part-badge">ตอนที่ 3</span>
      <h2 class="section-title">แบบสำรวจภาวะในช่องปากด้วยตนเอง</h2>
      <div class="assess-instruction">
        ตรวจดูในปากด้วยกระจก บันทึก <strong>0 = ปกติ</strong> / <strong>1 = ผิดปกติ</strong> หากพบข้อใดเป็น 1 ควรไปพบทันตแพทย์
      </div>
      <form id="assessForm-oral">
        <div class="assess-table-wrap"><table class="assess-table"><thead>${gradeSemHeaderRow(1)}</thead><tbody>${tbody}</tbody></table></div>
        <div class="assess-instruction" style="background:#e8f5e9;border-color:#a5d6a7;">
          <strong>การแปลผล:</strong> ฟันผุ→พบทันตแพทย์ทันที | เหงือกอักเสบ→แปรงฟันเบาๆ หากเลือดออกเกิน 1 สัปดาห์พบทันตแพทย์ | แผล>4มม.หรือไม่หายใน 2 สัปดาห์→พบทันตแพทย์ | ไม่สะอาด→แปรงฟันและใช้ไหมขัดฟัน
        </div>
        <button type="submit" class="btn btn-gold btn-full" style="margin-top:1rem;">💾 บันทึกแบบสำรวจ</button>
      </form>`;
    bindForm(mount, key);
  }

  /* ---- Part 4: Growth ---- */
  const WEIGHT_STATUS = ['ผอม', 'สมส่วน', 'ท้วม', 'เริ่มอ้วน', 'อ้วน'];
  const HEIGHT_STATUS = ['เตี้ย', 'ค่อนข้างเตี้ย', 'ตามเกณฑ์', 'ค่อนข้างสูง', 'สูง'];

  function renderGrowth(mount) {
    const key = 'growth';
    const data = loadData(key);
    let tbody = '';
    for (let i = 0; i < 15; i++) {
      const p = 'r' + i + '_';
      tbody += `<tr>
        <td>${cellInput(p + 'date', data, 'date', '')}</td>
        <td>${cellInput(p + 'age', data, 'text', 'ปี/เดือน')}</td>
        <td>${cellInput(p + 'height', data, 'number', 'ซม.')}</td>
        <td>${cellInput(p + 'weight', data, 'number', 'กก.')}</td>`;
      WEIGHT_STATUS.forEach((s, si) => {
        const fid = p + 'ws' + si;
        const chk = getVal(data, fid) === '1' ? ' checked' : '';
        tbody += `<td><input type="checkbox" data-field="${fid}" data-exclusive-group="${p}ws" name="${fid}" value="1"${chk} title="${s}"></td>`;
      });
      HEIGHT_STATUS.forEach((s, si) => {
        const fid = p + 'hs' + si;
        const chk = getVal(data, fid) === '1' ? ' checked' : '';
        tbody += `<td><input type="checkbox" data-field="${fid}" data-exclusive-group="${p}hs" name="${fid}" value="1"${chk} title="${s}"></td>`;
      });
      tbody += `<td>${cellInput(p + 'sig', data, 'text', 'ลงชื่อ')}</td></tr>`;
    }
    mount.innerHTML = `
      <span class="assess-part-badge">ตอนที่ 4</span>
      <h2 class="section-title">การประเมินการเจริญเติบโตด้วยตนเอง</h2>
      <div class="assess-instruction">
        <strong>การชั่งน้ำหนัก:</strong> ชั่งบนพื้นเรียบ สวมชุดเบา ถอดรองเท้า บันทึกทศนิยม 1 ตำแหน่ง<br>
        <strong>การวัดส่วนสูง:</strong> ถอดรองเท้า ยืนติดผนัง ส้นเท้า ก้น ไหล่ หลังศีรษะชิดผนัง มองตรง<br>
        <strong>การคำนวณอายุ:</strong> วันเดือนปีที่ชั่ง − วันเดือนปีเกิด หากวันไม่พอให้ยืม 1 เดือน (30 วัน) หากเดือนไม่พอให้ยืม 1 ปี (12 เดือน) หากวันเกิน 15 วัน ปัดเดือนขึ้น 1
      </div>
      <div class="assess-meta-row">
        <div class="form-group"><label class="form-label">วันเดือนปีเกิด</label><input type="date" class="form-input" data-field="birthdate" id="growthBirth" value="${esc(getVal(data, 'birthdate'))}"></div>
        <div class="form-group"><label class="form-label">เพศ</label>
          <select class="form-input" data-field="gender" id="growthGender">
            <option value="male"${getVal(data, 'gender') === 'male' ? ' selected' : ''}>ชาย</option>
            <option value="female"${getVal(data, 'gender') === 'female' ? ' selected' : ''}>หญิง</option>
          </select>
        </div>
      </div>
      <form id="assessForm-growth">
        <div class="assess-table-wrap"><table class="assess-table assess-std-table" style="min-width:900px;">
          <thead><tr>
            <th rowspan="2">วัน/เดือน/ปี<br>ที่ชั่ง</th>
            <th rowspan="2">อายุ<br>ปี/เดือน</th>
            <th rowspan="2">ส่วนสูง<br>(ซม.)</th>
            <th rowspan="2">น้ำหนัก<br>(กก.)</th>
            <th colspan="5">น้ำหนักตามเกณฑ์ส่วนสูง</th>
            <th colspan="5">ส่วนสูงตามเกณฑ์อายุ</th>
            <th rowspan="2">ลงชื่อ</th>
          </tr><tr>
            ${WEIGHT_STATUS.map(s => '<th>' + s + '</th>').join('')}
            ${HEIGHT_STATUS.map(s => '<th>' + s + '</th>').join('')}
          </tr></thead><tbody>${tbody}</tbody>
        </table></div>
        <button type="submit" class="btn btn-gold btn-full" style="margin-top:1rem;">💾 บันทึกแบบประเมิน</button>
      </form>`;
    const form = mount.querySelector('form');
    if (!form) return;
    function onGrowthChange(e) {
      const el = e.target;
      if (el.type === 'checkbox' && el.checked && el.dataset.exclusiveGroup) {
        form.querySelectorAll(`[data-exclusive-group="${el.dataset.exclusiveGroup}"]`).forEach(cb => {
          if (cb !== el) cb.checked = false;
        });
      }
      collectGrowth(form, key);
    }
    form.addEventListener('change', onGrowthChange);
    form.addEventListener('submit', e => { e.preventDefault(); collectGrowth(form, key); if (typeof showToast === 'function') showToast('✅', 'บันทึกแบบประเมินเรียบร้อยแล้ว'); });
    mount.querySelectorAll('[data-field]').forEach(el => {
      if (!form.contains(el)) el.addEventListener('change', onGrowthChange);
    });
  }

  function collectGrowth(form, key) {
    const root = form.parentElement;
    const data = {};
    root.querySelectorAll('[data-field]').forEach(el => {
      if (el.type === 'checkbox') data[el.dataset.field] = el.checked ? '1' : '';
      else data[el.dataset.field] = el.value;
    });
    saveData(key, data);
  }

  /* ---- Part 5: Physical Fitness ---- */
  const FITNESS_STD = {
    male: {
      12: { sit: [10, 14], situp: [26, 34], push: [19, 24], step: [122, 145] },
      13: { sit: [11, 15], situp: [28, 37], push: [20, 26], step: [124, 149] },
      14: { sit: [12, 16], situp: [30, 38], push: [21, 27], step: [130, 154] },
      15: { sit: [14, 19], situp: [31, 39], push: [23, 29], step: [131, 155] },
      16: { sit: [14, 19], situp: [32, 40], push: [23, 29], step: [132, 156] },
      17: { sit: [14, 20], situp: [32, 41], push: [25, 32], step: [136, 161] },
      18: { sit: [16, 21], situp: [32, 41], push: [26, 32], step: [136, 162] }
    },
    female: {
      12: { sit: [11, 15], situp: [22, 28], push: [17, 22], step: [117, 138] },
      13: { sit: [12, 16], situp: [24, 32], push: [18, 23], step: [118, 139] },
      14: { sit: [12, 18], situp: [25, 33], push: [18, 24], step: [124, 146] },
      15: { sit: [14, 18], situp: [27, 35], push: [20, 26], step: [125, 147] },
      16: { sit: [15, 20], situp: [29, 37], push: [22, 28], step: [126, 149] },
      17: { sit: [16, 21], situp: [31, 39], push: [23, 29], step: [130, 153] },
      18: { sit: [16, 22], situp: [32, 40], push: [25, 31], step: [132, 156] }
    }
  };

  function fitnessResult(score, range) {
    if (!score || score === '') return '-';
    const n = parseFloat(score);
    if (isNaN(n)) return '-';
    if (n >= range[0]) return 'ผ่าน';
    return 'ไม่ผ่าน';
  }

  function renderFitness(mount) {
    const key = 'fitness';
    const data = loadData(key);
    const tests = [
      { k: 'sit', label: 'นั่งงอตัวไปข้างหน้า (ซม.)' },
      { k: 'situp', label: 'ลุกนั่ง 60 วินาที (ครั้ง)' },
      { k: 'push', label: 'ดันพื้นประยุกต์ 30 วินาที (ครั้ง)' },
      { k: 'step', label: 'ยืนยกเข่าขึ้นลง 3 นาที (ครั้ง)' }
    ];
    let recordRows = '';
    GRADES.forEach((g, gi) => {
      recordRows += `<tr><td class="row-label">${g}</td>`;
      tests.forEach(t => {
        SEMS.forEach((s, si) => {
          const fid = `f_${t.k}_g${gi}_s${si}`;
          recordRows += `<td>${cellInput(fid, data, 'number', '')}</td>`;
          recordRows += `<td id="res_${fid}" class="fit-res">-</td>`;
        });
      });
      recordRows += '</tr>';
    });
    mount.innerHTML = `
      <span class="assess-part-badge">ตอนที่ 5</span>
      <h2 class="section-title">การทดสอบสมรรถภาพทางกายเพื่อสุขภาพ</h2>
      <div class="assess-instruction">
        ทดสอบทุกภาคเรียน เปรียบเทียบกับเกณฑ์มาตรฐาน (กรมพลศึกษา ค.ศ. 2019) คะแนนอยู่ในช่วงหรือสูงกว่า = <strong>ผ่าน</strong>
      </div>
      <form id="assessForm-fitness">
        <div class="assess-meta-row">
          <div class="form-group"><label class="form-label">อายุ (ปี)</label>
            <select class="form-input" data-field="age" id="fitAge">${[12, 13, 14, 15, 16, 17, 18].map(a => `<option value="${a}"${getVal(data, 'age') == a ? ' selected' : ''}>${a}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">เพศ</label>
            <select class="form-input" data-field="gender" id="fitGender">
              <option value="male"${getVal(data, 'gender') === 'male' ? ' selected' : ''}>ชาย</option>
              <option value="female"${getVal(data, 'gender') === 'female' ? ' selected' : ''}>หญิง</option>
            </select>
          </div>
        </div>
        <div class="assess-table-wrap"><table class="assess-table assess-std-table">
          <thead><tr><th>อายุ</th><th>นั่งงอ (ซม.)</th><th>ลุกนั่ง 60 วิ.</th><th>ดันพื้น 30 วิ.</th><th>ยกเข่า 3 นาที</th></tr></thead>
          <tbody id="fitStdBody"></tbody>
        </table></div>
        <h3 class="section-title" style="font-size:0.95rem;margin:1rem 0 0.5rem;">แบบบันทึกผลการทดสอบ (ม.1–ม.6)</h3>
        <div class="assess-table-wrap"><table class="assess-table" style="min-width:800px;">
          <thead><tr><th rowspan="2">ชั้น</th>
            ${tests.map(t => `<th colspan="4">${t.label}</th>`).join('')}
          </tr><tr>
            ${tests.map(() => '<th>ภ.1 คะแนน</th><th>ภ.1 ผล</th><th>ภ.2 คะแนน</th><th>ภ.2 ผล</th>').join('')}
          </tr></thead><tbody>${recordRows}</tbody>
        </table></div>
        <div class="assess-instruction" style="background:#e3f2fd;border-color:#90caf9;">
          <strong>ข้อควรปฏิบัติ:</strong> ออกกำลังกายแบบแอโรบิก ≥60 นาที/วัน · เสริมกล้ามเนื้อวันเว้นวัน · ยืดเหยียดทุกวัน · วอร์มอัพก่อนทดสอบ
        </div>
        <button type="submit" class="btn btn-gold btn-full" style="margin-top:1rem;">💾 บันทึกผลการทดสอบ</button>
      </form>`;
    function updateFitStd() {
      const age = parseInt(mount.querySelector('#fitAge').value, 10);
      const gender = mount.querySelector('#fitGender').value;
      const std = FITNESS_STD[gender][age];
      const labels = ['sit', 'situp', 'push', 'step'];
      const names = ['นั่งงอตัวไปข้างหน้า', 'ลุกนั่ง 60 วินาที', 'ดันพื้นประยุกต์ 30 วินาที', 'ยืนยกเข่า 3 นาที'];
      let row = '<tr><td class="row-label">' + age + ' ปี</td>';
      labels.forEach((l, i) => { row += `<td>${std[l][0]} – ${std[l][1]}</td>`; });
      mount.querySelector('#fitStdBody').innerHTML = row + '</tr>';
      mount.querySelectorAll('[data-field^="f_"]').forEach(el => {
        const res = fitnessResult(el.value, std[el.dataset.field.split('_')[1]]);
        const resEl = document.getElementById('res_' + el.dataset.field);
        if (resEl) { resEl.textContent = res; resEl.className = 'fit-res ' + (res === 'ผ่าน' ? 'pass' : res === 'ไม่ผ่าน' ? 'fail' : ''); }
      });
    }
    bindForm(mount, key, () => updateFitStd());
    mount.querySelector('#fitAge').addEventListener('change', updateFitStd);
    mount.querySelector('#fitGender').addEventListener('change', updateFitStd);
    updateFitStd();
  }

  /* ---- Health Literacy ---- */
  const LITERACY_ITEMS = [
    'ทราบว่าควรรับประทานอาหารให้ครบ 5 หมู่',
    'ทราบว่าการออกกำลังกายสม่ำเสมอดีต่อสุขภาพ',
    'ทราบวิธีป้องกันโรคติดต่อทางเดินหายใจ (ล้างมือ สวมหน้ากาก)',
    'ทราบว่าการนอนหลับพักผ่อนเพียงพอสำคัญต่อสุขภาพ',
    'ทราบว่าการสูบบุหรี่เป็นอันตรายต่อสุขภาพ',
    'ทราบว่าการดื่มแอลกอฮอล์เป็นอันตรายต่อสุขภาพ',
    'ทราบวิธีเลือกรับประทานอาหารที่ปลอดภัยและถูกสุขลักษณะ',
    'ทราบว่าควรตรวจสุขภาพประจำปี',
    'ทราบว่าควรแปรงฟันวันละ 2 ครั้ง',
    'ทราบว่าควรดื่มน้ำสะอาดเพียงพอต่อวัน'
  ];

  function renderLiteracy(mount) {
    const key = 'literacy';
    const data = loadData(key);
    const opts = [{ v: '0', l: 'ไม่ทราบ' }, { v: '1', l: 'ทราบบ้าง' }, { v: '2', l: 'ทราบดี' }];
    let qs = '';
    LITERACY_ITEMS.forEach((q, i) => {
      qs += `<div class="assess-question"><div class="assess-question-text">${i + 1}. ${q}</div><div class="assess-radio-group">`;
      opts.forEach(o => {
        const fid = 'lit_' + i;
        qs += `<label class="assess-radio-opt"><input type="radio" name="${fid}" data-field="${fid}" value="${o.v}"${getVal(data, fid) === o.v ? ' checked' : ''}>${o.l}</label>`;
      });
      qs += '</div></div>';
    });
    mount.innerHTML = `
      <span class="assess-part-badge">ความรอบรู้ด้านสุขภาพ</span>
      <h2 class="section-title">แบบประเมินความรอบรู้ด้านสุขภาพ</h2>
      <div class="assess-instruction">เลือกระดับความรู้ที่ตรงกับตนเองมากที่สุด (0=ไม่ทราบ 1=ทราบบ้าง 2=ทราบดี) คะแนนเต็ม ${LITERACY_ITEMS.length * 2} คะแนน</div>
      <form id="assessForm-literacy">${qs}
        <div class="assess-result-box" id="litResult" style="display:none;">
          <div class="assess-result-score" id="litScore">0</div>
          <div class="assess-result-label" id="litLabel">-</div>
        </div>
        <button type="submit" class="btn btn-gold btn-full" style="margin-top:1rem;">💾 บันทึกและคำนวณคะแนน</button>
      </form>`;
    bindForm(mount, key, calcLiteracy);
    calcLiteracy(mount.querySelector('form'), data);
  }

  function calcLiteracy(form, data) {
    if (!form) return;
    let score = 0, count = 0;
    LITERACY_ITEMS.forEach((_, i) => {
      const v = data['lit_' + i];
      if (v !== undefined && v !== '') { score += parseInt(v, 10); count++; }
    });
    const max = LITERACY_ITEMS.length * 2;
    const pct = max ? Math.round(score / max * 100) : 0;
    const box = form.querySelector('#litResult');
    if (box) {
      box.style.display = count ? 'block' : 'none';
      form.querySelector('#litScore').textContent = score + ' / ' + max + ' (' + pct + '%)';
      let label = 'ควรเพิ่มความรู้ด้านสุขภาพ';
      if (pct >= 80) label = 'มีความรอบรู้ด้านสุขภาพดี';
      else if (pct >= 60) label = 'มีความรอบรู้ด้านสุขภาพปานกลาง';
      form.querySelector('#litLabel').textContent = label;
    }
  }

  /* ---- Part 6: Diet ---- */
  const DIET_ITEMS = [
  'กินอาหารเช้าที่มีกลุ่มอาหารอย่างน้อย 2 กลุ่ม (ข้าว-แป้ง และเนื้อสัตว์) เสริมผักหรือผลไม้ทุกวัน',
  'กินอาหารหลักวันละ 3 มื้อ (เช้า กลางวัน เย็น) ทุกวัน',
  'กินอาหารว่างวันละ 2 ครั้ง (ช่วงสายและบ่าย) ทุกวัน',
  'กินอาหารกลุ่มข้าว-แป้ง วันละ 10 ทัพพี ทุกวัน',
  'กินอาหารกลุ่มผัก วันละ 5 ทัพพี ทุกวัน',
  'กินอาหารกลุ่มผลไม้ วันละ 4 ส่วน ทุกวัน',
  'กินอาหารกลุ่มเนื้อสัตว์ วันละ 9 ช้อนกินข้าว ทุกวัน',
  'ดื่มนม วันละ 2 แก้วหรือกล่อง ทุกวัน',
  'กินปลา อย่างน้อย 3 วันต่อสัปดาห์',
  'กินไข่ วันละ 1 ฟอง',
  'กินอาหารแหล่งธาตุเหล็ก (ตับ เลือด) สัปดาห์ละ 1-2 วัน',
  'กินยาเม็ดเสริมธาตุเหล็กตามเกณฑ์',
  'เลี่ยงกินอาหารประเภทผัด ทอด และกะทิ ไม่เกิน 1-2 อย่างต่อวัน',
  'เลี่ยงกินเนื้อสัตว์ติดมัน เช่น หมูสามชั้น ขาหมู คอหมู หนังไก่ หนังเป็ด เป็นต้น',
  'เลี่ยงกินขนมที่มีรสหวาน เช่น ไอศกรีม หวานเย็น ช็อกโกแลต หมากฝรั่ง ลูกอัด เยลลี่ เป็นต้น',
  'เลี่ยงกินเครื่องดื่มที่มีรสหวาน เช่น น้ำอัดลม น้ำหวาน โกโก้เย็น ชาเย็น น้ำปั่น น้ำผลไม้ นมเปรี้ยว เป็นต้น',
  'เลี่ยงกินขนมเบเกอรี่ เช่น เค้ก พาย โดนัท เป็นต้น',
  'เลี่ยงกินขนมขบเคี้ยว เช่น ปลาเส้นปรุงรส มันฝรั่งทอด ขนมปังเวเฟอร์ ขนมปังแท่ง เป็นต้น',
  'ไม่เติมเครื่องปรุงรสเค็ม เช่น น้ำปลา ซีอิ๊ว แม็กกี้ ในอาหารที่ปรุงสุกแล้ว ทุกครั้ง',
  'ไม่เติมน้ำตาลในอาหารที่ปรุงสุกแล้ว'
  ];

  function renderDiet(mount) {
    const key = 'diet';
    const data = loadData(key);
    let rows = '<div class="assess-diet-cols"><span>พฤติกรรมการบริโภคอาหารที่เหมาะสม</span><span>ปฏิบัติ</span><span>ไม่ปฏิบัติ</span><span>น้อยกว่า</span><span>มากกว่า</span></div>';
    DIET_ITEMS.forEach((q, i) => {
      const base = 'diet_' + i + '_';
      rows += `<div class="assess-diet-row"><span>${i + 1}. ${q}</span>`;
      ['practice', 'not', 'less', 'more'].forEach((t, ti) => {
        const fid = base + t;
        const chk = getVal(data, fid) === '1' ? ' checked' : '';
        rows += `<label style="text-align:center"><input type="radio" name="diet_${i}" data-field="${fid}" value="1"${chk}></label>`;
      });
      rows += '</div>';
    });
    mount.innerHTML = `
      <span class="assess-part-badge">ตอนที่ 6</span>
      <h2 class="section-title">แบบประเมินพฤติกรรมการบริโภคอาหารของเด็กอายุ 14-18 ปี</h2>
      <div class="assess-instruction">
        <strong>ความหมาย:</strong> พฤติกรรมที่ระบุเป็นพฤติกรรมที่เหมาะสม ประเมินย้อนหลัง 1 สัปดาห์ ทำเครื่องหมาย ✓ ในช่อง <strong>ปฏิบัติ</strong> หรือ <strong>ไม่ปฏิบัติ</strong> (ถ้าไม่ปฏิบัติ ระบุน้อยกว่า/มากกว่า)
      </div>
      <form id="assessForm-diet">
        <div class="assess-meta-row">
          <div class="form-group"><label class="form-label">วันเดือนปีที่ประเมิน</label>${cellInput('diet_date', data, 'date', '')}</div>
          <div class="form-group"><label class="form-label">ครั้งที่ประเมิน</label>${cellInput('diet_round', data, 'number', '1')}</div>
        </div>
        ${rows}
        <div class="assess-result-box" id="dietResult" style="display:none;">
          <div>เหมาะสม: <strong id="dietGood">0</strong> ข้อ | ไม่เหมาะสม: <strong id="dietBad">0</strong> ข้อ</div>
        </div>
        <button type="submit" class="btn btn-gold btn-full" style="margin-top:1rem;">💾 บันทึกแบบประเมิน</button>
      </form>`;
    bindForm(mount, key, calcDiet);
    calcDiet(mount.querySelector('form'), data);
  }

  function calcDiet(form, data) {
    if (!form) return;
    let good = 0, bad = 0;
    DIET_ITEMS.forEach((_, i) => {
      if (data['diet_' + i + '_practice'] === '1') good++;
      else if (data['diet_' + i + '_not'] === '1' || data['diet_' + i + '_less'] === '1' || data['diet_' + i + '_more'] === '1') bad++;
    });
    const box = form.querySelector('#dietResult');
    if (box) {
      if (good || bad) {
        box.style.display = 'block';
        form.querySelector('#dietGood').textContent = good;
        form.querySelector('#dietBad').textContent = bad;
      } else {
        box.style.display = 'none';
      }
    }
  }

  /* ---- Part 7: Happiness ---- */
  const HAPPY_QS = [
    { q: 'นักเรียนรู้สึกพึงพอใจในชีวิต', rev: false },
    { q: 'นักเรียนรู้สึกสบายใจ', rev: false },
    { q: 'นักเรียนรู้สึกเบื่อหน่าย ท้อแท้กับการดำเนินชีวิตประจำวัน', rev: true },
    { q: 'นักเรียนรู้สึกผิดหวังในตัวเอง', rev: true },
    { q: 'นักเรียนรู้สึกว่าชีวิตของนักเรียนมีแต่ความทุกข์', rev: true },
    { q: 'นักเรียนสามารถทำใจยอมรับได้สำหรับปัญหาที่ยากจะแก้ไข', rev: false },
    { q: 'นักเรียนมั่นใจว่าจะสามารถควบคุมอารมณ์ได้เมื่อมีเหตุการณ์คับขันหรือร้ายแรง', rev: false },
    { q: 'นักเรียนมั่นใจที่จะเผชิญเหตุการณ์ร้ายแรงที่เกิดขึ้นในชีวิต', rev: false },
    { q: 'นักเรียนรู้สึกเห็นอกเห็นใจเมื่อผู้อื่นมีทุกข์', rev: false },
    { q: 'นักเรียนรู้สึกเป็นสุขในการช่วยเหลือผู้อื่นที่มีปัญหา', rev: false },
    { q: 'นักเรียนให้ความช่วยเหลือกับผู้อื่นเมื่อมีโอกาส', rev: false },
    { q: 'นักเรียนรู้สึกภูมิใจในตนเอง', rev: false },
    { q: 'นักเรียนรู้สึกมั่นคง ปลอดภัยเมื่ออยู่ในครอบครัว', rev: false },
    { q: 'หากนักเรียนป่วยหนัก นักเรียนเชื่อว่าครอบครัวจะดูแลนักเรียนเป็นอย่างดี', rev: false },
    { q: 'สมาชิกในครอบครัวมีความรักและผูกพันต่อกัน', rev: false }
  ];
  const HAPPY_OPTS = [
    { v: '0', l: 'ไม่เลย' }, { v: '1', l: 'เล็กน้อย' }, { v: '2', l: 'มาก' }, { v: '3', l: 'มากที่สุด' }
  ];

  function happyScore(qIdx, val) {
    const n = parseInt(val, 10);
    if (HAPPY_QS[qIdx].rev) return 3 - n;
    return n;
  }

  function renderHappiness(mount) {
    const key = 'happiness';
    const data = loadData(key);
    let qs = '';
    HAPPY_QS.forEach((item, i) => {
      qs += `<div class="assess-question"><div class="assess-question-text">${i + 1}. ${item.q}</div><div class="assess-radio-group">`;
      HAPPY_OPTS.forEach(o => {
        const fid = 'happy_' + i;
        qs += `<label class="assess-radio-opt"><input type="radio" name="${fid}" data-field="${fid}" value="${o.v}"${getVal(data, fid) === o.v ? ' checked' : ''}>${o.l}</label>`;
      });
      qs += '</div></div>';
    });
    let gradeTable = '<div class="assess-table-wrap" style="margin-top:1rem;"><table class="assess-table"><thead><tr><th>ระดับความสุข</th>';
    GRADES.forEach(g => { gradeTable += `<th colspan="2">${g}</th>`; });
    gradeTable += '</tr><tr><th></th>';
    GRADES.forEach(() => SEMS.forEach(s => { gradeTable += `<th>${s.replace('ภาคเรียนที่ ', 'ภ.')}</th>`; }));
    gradeTable += '</tr></thead><tbody>';
    const levels = [
      { label: 'มีความสุขมากกว่าคนทั่วไป (35-45)', k: 'high' },
      { label: 'มีความสุขเท่ากับคนทั่วไป (28-34)', k: 'mid' },
      { label: 'มีความสุขน้อยกว่าคนทั่วไป (0-27)', k: 'low' }
    ];
    levels.forEach(lv => {
      gradeTable += `<tr><td class="row-label">${lv.label}</td>`;
      GRADES.forEach((g, gi) => SEMS.forEach((s, si) => {
        const fid = 'hlv_' + lv.k + '_g' + gi + '_s' + si;
        gradeTable += `<td><input type="checkbox" data-field="${fid}" value="1"${getVal(data, fid) === '1' ? ' checked' : ''}></td>`;
      }));
      gradeTable += '</tr>';
    });
    gradeTable += '</tbody></table></div>';
    mount.innerHTML = `
      <span class="assess-part-badge">ตอนที่ 7</span>
      <h2 class="section-title">แบบประเมินความสุข (ดัชนีวัดความสุขคนไทยฉบับสั้น 15 ข้อ ปี 2550)</h2>
      <div class="assess-instruction">
        ทำเครื่องหมายในช่องที่ตรงกับความรู้สึกของท่าน <strong>ในระยะ 1 เดือนที่ผ่านมา</strong> (ไม่เลย=0 เล็กน้อย=1 มาก=2 มากที่สุด=3) ข้อ 3,4,5 คิดคะแนนย้อนกลับ
      </div>
      <form id="assessForm-happiness">${qs}
        <div class="assess-result-box" id="happyResult" style="display:none;">
          <div class="assess-result-score" id="happyScore">0 / 45</div>
          <div class="assess-result-label" id="happyLabel">-</div>
          <div class="assess-result-desc" id="happyDesc"></div>
        </div>
        <h3 class="section-title" style="font-size:0.9rem;margin-top:1.2rem;">บันทึกระดับความสุขรายภาคเรียน</h3>
        ${gradeTable}
        <button type="submit" class="btn btn-gold btn-full" style="margin-top:1rem;">💾 บันทึกและคำนวณคะแนน</button>
      </form>`;
    const form = mount.querySelector('form');
    if (!form) return;
    function collectHappy() {
      const d = {};
      form.querySelectorAll('[data-field]').forEach(el => {
        if (el.type === 'checkbox') d[el.dataset.field] = el.checked ? '1' : '';
        else if (el.type === 'radio') { if (el.checked) d[el.dataset.field] = el.value; }
        else d[el.dataset.field] = el.value;
      });
      saveData(key, d);
      calcHappiness(form, d);
    }
    form.addEventListener('change', collectHappy);
    form.addEventListener('submit', e => { e.preventDefault(); collectHappy(); if (typeof showToast === 'function') showToast('✅', 'บันทึกแบบประเมินความสุขเรียบร้อย'); });
    calcHappiness(form, data);
  }

  function calcHappiness(form, data) {
    if (!form) return;
    let score = 0, answered = 0;
    HAPPY_QS.forEach((_, i) => {
      const v = data['happy_' + i];
      if (v !== undefined && v !== '') { score += happyScore(i, v); answered++; }
    });
    const box = form.querySelector('#happyResult');
    if (!box || answered < 15) { if (box) box.style.display = 'none'; return; }
    box.style.display = 'block';
    form.querySelector('#happyScore').textContent = score + ' / 45 คะแนน';
    let label, desc, emoji;
    if (score >= 35) {
      label = '😊 มีความสุขมากกว่าคนทั่วไป'; desc = 'ระดับความสุขอยู่ในเกณฑ์ดี';
    } else if (score >= 28) {
      label = '😐 มีความสุขเท่ากับคนทั่วไป'; desc = 'ระดับความสุขอยู่ในเกณฑ์ปกติ';
    } else {
      label = '😔 มีความสุขน้อยกว่าคนทั่วไป'; desc = 'แนะนำปรึกษาครูที่ปรึกษา หรือบุคลากรสาธารณสุข หากรู้สึกทุกข์ใจต่อเนื่อง';
    }
    form.querySelector('#happyLabel').textContent = label;
    form.querySelector('#happyDesc').textContent = desc;
  }

  /* ---- Router ---- */
  const RENDERERS = {
    disease: { mount: 'assessMount-disease', fn: renderDisease, title: 'แบบสำรวจโรค/ความผิดปกติ' },
    vision: { mount: 'assessMount-vision', fn: renderVision, title: 'แบบสำรวจภาวะสายตาและการได้ยิน' },
    oral: { mount: 'assessMount-oral', fn: renderOral, title: 'แบบสำรวจภาวะในช่องปาก' },
    growth: { mount: 'assessMount-growth', fn: renderGrowth, title: 'การประเมินการเจริญเติบโต' },
    fitness: { mount: 'assessMount-fitness', fn: renderFitness, title: 'การทดสอบสมรรถภาพทางกาย' },
    literacy: { mount: 'assessMount-literacy', fn: renderLiteracy, title: 'ความรอบรู้ด้านสุขภาพ' },
    diet: { mount: 'assessMount-diet', fn: renderDiet, title: 'แบบประเมินพฤติกรรมการบริโภค' },
    happiness: { mount: 'assessMount-happiness', fn: renderHappiness, title: 'แบบประเมินความสุข' }
  };

  const rendered = {};
  const ASSESS_RENDER_VER = 2;

  window.renderHealthAssessment = function (type) {
    const cfg = RENDERERS[type];
    if (!cfg) return;
    const mount = document.getElementById(cfg.mount);
    if (!mount) return;
    const titleEl = document.getElementById('assessTitle-' + type);
    if (titleEl) titleEl.textContent = cfg.title;
    if (rendered[type] !== ASSESS_RENDER_VER) {
      cfg.fn(mount);
      rendered[type] = ASSESS_RENDER_VER;
    }
  };

  window.ASSESS_TAB_MAP = {
    assessDisease: 'disease',
    assessVision: 'vision',
    assessOral: 'oral',
    assessGrowth: 'growth',
    assessFitness: 'fitness',
    assessLiteracy: 'literacy',
    assessDiet: 'diet',
    assessHappiness: 'happiness'
  };
})();
