class RecipeApp {
    norm(v) { return (v == null ? "" : String(v)).trim().toLowerCase(); }

    constructor() {
        this.recipes = [];
        this.filteredRecipes = [];
        this.currentView = 'grid';
        this.editTargetId = null;
        this.updateViewClass?.();
        this.pages = {
            browse: document.getElementById('browsePage'),
            add: document.getElementById('addPage'),
        };
        this.navButtons = Array.from(document.querySelectorAll('.nav-btn'));
        this.successMessage = null;
        this.imageURLCache = new Map();
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupNavTabs();
        this.setupAddForm();
        this.setupEditDrawer();
        this.renderEmptyWithHint();

        window.addEventListener('beforeunload', () => {
            for (const url of this.imageURLCache.values()) URL.revokeObjectURL(url);
            this.imageURLCache.clear();
        });
    }

    captureUIState() {
        return {
            scrollY: window.scrollY,
            search: document.getElementById('searchInput')?.value || '',
            category: document.getElementById('categorySelect')?.value || '',
            view: this.currentView
        };
    }
    restoreUIState(state) {
        if (!state) return;
        const s = document.getElementById('searchInput');
        const c = document.getElementById('categorySelect');
        if (s && s.value !== state.search) s.value = state.search;
        if (c && c.value !== state.category) c.value = state.category;
        this.currentView = state.view || 'grid';
        this.updateViewClass();
        requestAnimationFrame(() => window.scrollTo({ top: state.scrollY, left: 0, behavior: 'auto' }));
    }
    async withStableUI(updaterFn) {
        const ui = this.captureUIState();
        await Promise.resolve(updaterFn?.());
        this.render();
        this.restoreUIState(ui);
    }

    renderEmptyWithHint() {
        const stats = document.getElementById('stats');
        stats.textContent = '請先按「選擇資料夾」以載入本地 recipes.csv';
        const container = document.getElementById('recipesContainer');
        container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📂</div>
        <h3>尚未選擇資料夾</h3>
        <p>請點上方「選擇資料夾」，本 App 將讀取該資料夾中的 <code>recipes.csv</code> 與 <code>images/</code> 圖片。</p>
      </div>`;
    }

    async afterFolderPicked() {
        await this.ensureCSVExists();
        await this.loadCSVFromLocal();
        this.filteredRecipes = [...this.recipes];
        this.updateCategories();
        this.render();
    }

    async ensureCSVExists() {
        try {
            await __recipesDirHandle.getFileHandle('recipes.csv');
        } catch {
            const headers = ["id", "title", "category", "tags", "ingredients", "steps", "glass", "method", "servings", "calories", "image_url"];
            const bom = "\uFEFF";
            const csvText = bom + headers.join(",") + "\r\n";
            const fh = await __recipesDirHandle.getFileHandle("recipes.csv", { create: true });
            await writeFile(fh, new Blob([csvText], { type: "text/csv;charset=utf-8" }));
        }
    }

    async loadCSVFromLocal() {
        try {
            const fh = await __recipesDirHandle.getFileHandle('recipes.csv');
            const file = await fh.getFile();
            const text = await file.text();
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
            this.recipes = (parsed.data || []).map((x, i) => ({
                ...x,
                id: x.id && String(x.id).trim() ? x.id : this.makeId(i)
            }));
            if (!this.recipes.length) { this.recipes = []; }
        } catch (e) {
            console.error('讀取本地 recipes.csv 失敗：', e);
            alert('讀取本地 recipes.csv 失敗，請確認權限或檔案是否存在。');
            this.recipes = [];
        }
    }

    makeId(idx = 0) { return 'C' + String(this.recipes.length + idx + 1).padStart(3, '0'); }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const categorySelect = document.getElementById('categorySelect');
        const viewButtons = document.querySelectorAll('.view-btn');

        if (searchInput) {
            const onSearch = () => this.filterRecipes();
            searchInput.addEventListener('input', onSearch);
            searchInput.addEventListener('compositionend', onSearch);
        }
        if (categorySelect) {
            categorySelect.addEventListener('change', () => this.filterRecipes());
        }

        viewButtons.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                viewButtons.forEach((b) => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentView = e.currentTarget.dataset.view;
                this.updateViewClass();
            });
        });
    }

    setupNavTabs() {
        this.navButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                this.navButtons.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');

                const pageKey = btn.dataset.page; // "browse" | "add"
                Object.values(this.pages).forEach((p) => p.classList.remove('active'));
                if (this.pages[pageKey]) this.pages[pageKey].classList.add('active');

                if (pageKey === 'add' && this.successMessage) {
                    this.successMessage.style.display = 'none';
                }
            });
        });
    }

    setupAddForm() {
        const form = document.getElementById('addRecipeForm');
        this.successMessage = document.getElementById('successMessage');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!__recipesDirHandle || !__imagesDirHandle) {
                alert('尚未選擇資料夾，請先按「選擇資料夾」。');
                return;
            }

            const title = document.getElementById('recipeTitle').value.trim();
            const category = document.getElementById('recipeCategory').value.trim();
            const servings = document.getElementById('recipeServings').value.trim();
            const prep = document.getElementById('glass').value.trim();
            const cook = document.getElementById('method').value.trim();
            const calories = document.getElementById('calories').value.trim();

            const tagsInput = document.getElementById('tagsInput').value.trim();
            const chips = Array.from(document.querySelectorAll('#tagsDisplay .tag-chip')).map((x) => x.dataset.tag);
            const tags = [...chips, ...(tagsInput ? [tagsInput] : [])].join(';');

            const ingredients = Array.from(document.querySelectorAll('#ingredientsList .ingredient-item input'))
                .map((i) => i.value.trim()).filter(Boolean).join('|');

            const steps = Array.from(document.querySelectorAll('#stepsList .step-item input'))
                .map((i) => i.value.trim()).filter(Boolean).join('>');

            if (!title) { alert('請輸入酒名'); return; }
            if (!ingredients) { alert('請至少輸入一項材料'); return; }
            if (!steps) { alert('請至少輸入一個步驟'); return; }

            const newId = this.makeId();

            let imageUrl = '';
            const imageFile = document.getElementById('recipeImageFile').files[0];
            if (imageFile) {
                try {
                    const result = await saveImageToLocalFolder(imageFile, newId);
                    if (result.ok) imageUrl = result.relativePath;
                } catch (err) {
                    console.error('圖片上傳錯誤:', err);
                    alert('圖片上傳失敗；你仍可稍後在編輯中補上圖片。');
                }
            }

            const newRecipe = {
                id: newId, title, category, tags, ingredients, steps,
                glass: prep || '0', method: cook || '0',
                servings: servings || '', calories: calories || '', image_url: imageUrl,
            };

            await this.withStableUI(() => {
                this.recipes.unshift(newRecipe);
                this.filteredRecipes = this.recipes;
            });

            await writeCSVToLocal();

            this.successMessage.style.display = 'block';
            const browseBtn = this.navButtons.find((b) => b.dataset.page === 'browse');
            browseBtn?.click();
            this.clearForm();
        });

        const tagsInput = document.getElementById('tagsInput');
        const tagsDisplay = document.getElementById('tagsDisplay');
        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && tagsInput.value.trim()) {
                e.preventDefault();
                const tag = tagsInput.value.trim();
                const chip = document.createElement('span');
                chip.className = 'tag-chip';
                chip.dataset.tag = tag;
                chip.textContent = `#${tag} ×`;
                chip.addEventListener('click', () => chip.remove());
                tagsDisplay.appendChild(chip);
                tagsInput.value = '';
            }
        });

        const addImageInput = document.getElementById('recipeImageFile');
        const addImagePreview = document.getElementById('addImagePreview');
        addImageInput.addEventListener('change', (e) => {
            addImagePreview.innerHTML = '';
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                const img = document.createElement('img');
                img.src = url;
                Object.assign(img.style, { maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' });
                addImagePreview.appendChild(img);
            }
        });
    }

    setupEditDrawer() {
        const drawer = document.getElementById('editDrawer');
        const closeBtn = document.getElementById('closeDrawer');
        const saveBtn = document.getElementById('saveRecipe');
        const deleteBtn = document.getElementById('deleteRecipe');

        closeBtn.addEventListener('click', () => {
            drawer.classList.add('hidden'); drawer.setAttribute('aria-hidden', 'true'); this.editTargetId = null;
        });

        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!__recipesDirHandle) { alert('尚未選擇資料夾'); return; }
            await this.saveEditedRecipe();
            await writeCSVToLocal();
        });

        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!__recipesDirHandle) { alert('尚未選擇資料夾'); return; }
            if (confirm('確定要刪除這份酒譜嗎？')) {
                this.deleteRecipe();
                await writeCSVToLocal();
            }
        });
    }

    editRecipe(id) {
        if (!__recipesDirHandle) { alert('尚未選擇資料夾'); return; }
        const recipe = this.recipes.find(r => r.id === id);
        if (!recipe) return;
        this.editTargetId = id;

        const form = document.getElementById('editForm');
        form.title.value = recipe.title || '';
        form.category.value = recipe.category || '';
        form.tags.value = recipe.tags || '';
        form.ingredients.value = (recipe.ingredients || '').replace(/\|/g, '\n');
        form.steps.value = (recipe.steps || '').replace(/>/g, '\n');
        form.glass.value = recipe.glass || '';
        form.method.value = recipe.method || '';
        form.servings.value = recipe.servings || '';
        form.calories.value = recipe.calories || '';
        form.image_url.value = recipe.image_url || '';

        const preview = document.getElementById('imagePreview');
        preview.innerHTML = '';
        if (recipe.image_url) {
            this.resolveImageURL(recipe.image_url).then(src => {
                if (!src) return;
                const img = document.createElement('img');
                img.src = src;
                Object.assign(img.style, { maxWidth: '100%', borderRadius: '8px', marginBottom: '8px' });
                preview.appendChild(img);
                const caption = document.createElement('div');
                caption.textContent = '目前的圖片';
                Object.assign(caption.style, { fontSize: '0.9rem', color: '#666' });
                preview.appendChild(caption);
            }).catch(() => { });
        }

        const drawer = document.getElementById('editDrawer');
        drawer.classList.remove('hidden');
        drawer.setAttribute('aria-hidden', 'false');
    }

    async saveEditedRecipe() {
        const form = document.getElementById('editForm');
        const index = this.recipes.findIndex(r => r.id === this.editTargetId);
        if (index === -1) return;

        let imageUrl = form.image_url.value.trim();
        const imageFile = document.getElementById('imageFile').files[0];
        if (imageFile) {
            try {
                const result = await saveImageToLocalFolder(imageFile, this.editTargetId);
                if (result.ok) imageUrl = result.relativePath;
            } catch (err) {
                console.error('圖片上傳錯誤:', err);
                alert('圖片上傳失敗；將沿用原圖片網址/路徑。');
            }
        }

        this.recipes[index] = {
            ...this.recipes[index],
            title: form.title.value.trim(),
            category: form.category.value.trim(),
            tags: form.tags.value.trim(),
            ingredients: form.ingredients.value.trim().replace(/\n/g, '|'),
            steps: form.steps.value.trim().replace(/\n/g, '>'),
            glass: form.glass.value || '0',
            method: form.method.value || '0',
            servings: form.servings.value || '',
            calories: form.calories.value || '',
            image_url: imageUrl,
        };

        await this.withStableUI(() => { this.filteredRecipes = this.recipes; });

        const drawer = document.getElementById('editDrawer');
        drawer.classList.add('hidden');
        drawer.setAttribute('aria-hidden', 'true');
        this.editTargetId = null;
    }

    deleteRecipe() {
        const index = this.recipes.findIndex(r => r.id === this.editTargetId);
        if (index !== -1) {
            this.withStableUI(() => {
                this.recipes.splice(index, 1);
                this.filteredRecipes = this.recipes;
            });
            const drawer = document.getElementById('editDrawer');
            drawer.classList.add('hidden');
            drawer.setAttribute('aria-hidden', 'true');
            this.editTargetId = null;
        }
    }

    addIngredient() {
        const wrap = document.getElementById('ingredientsList');
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
      <input type="text" placeholder="例如：白蘭姆酒 45ml" required />
      <button type="button" class="remove-btn">移除</button>`;
        div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
        wrap.appendChild(div);
    }
    removeIngredient(btn) { btn.closest('.ingredient-item')?.remove(); }

    addStep() {
        const wrap = document.getElementById('stepsList');
        const idx = wrap.querySelectorAll('.step-item').length + 1;
        const div = document.createElement('div');
        div.className = 'step-item';
        div.innerHTML = `
      <span style="font-weight:bold;min-width:30px;">${idx}.</span>
      <input type="text" placeholder="詳細描述步驟（例：搖盪 10 秒）" required />
      <button type="button" class="remove-btn">移除</button>`;
        div.querySelector('.remove-btn').addEventListener('click', () => {
            div.remove();
            Array.from(wrap.querySelectorAll('.step-item span')).forEach((s, i) => (s.textContent = (i + 1) + '.'));
        });
        wrap.appendChild(div);
    }
    removeStep(btn) { btn.closest('.step-item')?.remove(); }

    clearForm() {
        document.getElementById('addRecipeForm').reset();
        document.getElementById('tagsDisplay').innerHTML = '';
        document.getElementById('addImagePreview').innerHTML = '';
        document.getElementById('ingredientsList').innerHTML = `
      <div class="ingredient-item">
        <input type="text" placeholder="例如：龍舌蘭 45ml" required />
        <button type="button" class="remove-btn" onclick="app.removeIngredient(this)">移除</button>
      </div>`;
        document.getElementById('stepsList').innerHTML = `
      <div class="step-item">
        <span style="font-weight: bold; min-width: 30px;">1.</span>
        <input type="text" placeholder="詳細描述第一個步驟（例：杯口抹鹽）" required />
        <button type="button" class="remove-btn" onclick="app.removeStep(this)">移除</button>
      </div>`;
    }

    updateCategories() {
        const categorySelect = document.getElementById('categorySelect');
        if (!categorySelect) return;
        const categories = [...new Set(
            this.recipes.map(r => (r.category || '').trim()).filter(Boolean)
        )].sort();

        categorySelect.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
        categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    filterRecipes() {
        const ui = this.captureUIState();
        const searchTerm = this.norm(document.getElementById('searchInput')?.value || '');
        const selectedCategoryRaw = document.getElementById('categorySelect')?.value || '';
        const selectedCategory = (selectedCategoryRaw || '').trim();

        if (!Array.isArray(this.recipes)) this.recipes = [];

        this.filteredRecipes = this.recipes.filter((r) => {
            const title = this.norm(r?.title);
            const tags = this.norm(r?.tags);
            const ingredients = this.norm(r?.ingredients);
            const category = (r?.category || '').trim();

            const matchesSearch =
                !searchTerm || title.includes(searchTerm) || tags.includes(searchTerm) || ingredients.includes(searchTerm);
            const matchesCategory = !selectedCategory || category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        this.render();
        this.restoreUIState(ui);
    }

    updateViewClass() {
        const container = document.getElementById('recipesContainer');
        container.className = this.currentView === 'grid' ? 'recipes-grid' : 'recipes-list';
    }

    async resolveImageURL(value) {
        if (!value) return '';
        const v = String(value).trim();
        if (/^(data:|blob:)/i.test(v)) return v;
        if (!__imagesDirHandle) return '';
        const name = v.replace(/^images\//i, '');
        if (this.imageURLCache.has(name)) return this.imageURLCache.get(name);
        try {
            const fh = await __imagesDirHandle.getFileHandle(name);
            const file = await fh.getFile();
            const url = URL.createObjectURL(file);
            this.imageURLCache.set(name, url);
            return url;
        } catch (e) {
            console.warn('找不到圖片於 images/：', v);
            return '';
        }
    }

    render() {
        this.updateStats();
        this.renderRecipes();
        this.updateViewClass();
    }

    updateStats() {
        const stats = document.getElementById('stats');
        const total = this.recipes.length;
        const showing = this.filteredRecipes.length;
        stats.textContent = `顯示 ${showing} / ${total} 份酒譜`;
    }

    renderRecipes() {
        const container = document.getElementById('recipesContainer');
        if (this.filteredRecipes.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <h3>找不到符合條件的酒譜</h3>
          <p>試著調整搜尋關鍵字或分類篩選</p>
        </div>`;
            return;
        }

        container.innerHTML = this.filteredRecipes.map((recipe) => {
            const totalMin = (parseInt(recipe.glass || 0, 10) || 0) + (parseInt(recipe.method || 0, 10) || 0);
            const tagsHtml = recipe.tags
                ? recipe.tags.split(';').map((tag) => `<span class="tag">${tag.trim()}</span>`).join('')
                : '';

            return `
      <div class="recipe-card">
        <div class="recipe-image">
          ${recipe.image_url ? `<img data-img="${recipe.id}" alt="${recipe.title}">` : '🍹'}
        </div>
        <div class="recipe-content">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <h3 class="recipe-title">${recipe.title || ''}</h3>
            <button onclick="app.editRecipe('${recipe.id}')" class="btn" style="font-size:.8rem;padding:4px 8px;">編輯</button>
          </div>
          <div class="recipe-meta">
            <span class="meta-item">⏱️ ${totalMin} 分鐘</span>
            <span class="meta-item">🥃 ${recipe.servings || '1'} 杯</span>
            ${recipe.calories ? `<span class="meta-item">🔥 ${recipe.calories} 卡</span>` : ''}
          </div>
          ${tagsHtml ? `<div class="recipe-tags">${tagsHtml}</div>` : ''}
          <div class="recipe-details">
            <details open>
              <summary>🍶 材料</summary>
              <div class="ingredients-list">
                ${(recipe.ingredients || '').split('|').map((i) => `<div>• ${i.trim()}</div>`).join('')}
              </div>
            </details>
            <details open>
              <summary>🧊 調製步驟</summary>
              <div class="steps-list">
                ${(recipe.steps || '').split('>').map((s) => `<div class="step">${s.trim()}</div>`).join('')}
              </div>
            </details>
          </div>
        </div>
      </div>`;
        }).join('');

        if (__imagesDirHandle) {
            this.filteredRecipes.forEach(async (recipe) => {
                if (!recipe.image_url) return;
                const imgEl = container.querySelector(`img[data-img="${recipe.id}"]`);
                if (!imgEl) return;
                try {
                    const src = await this.resolveImageURL(recipe.image_url);
                    if (src) imgEl.src = src;
                    imgEl.removeAttribute('data-img');
                } catch (e) {
                    console.warn('圖片載入失敗：', recipe.image_url, e);
                }
            });
        }
    }
}

// ====== 啟動 ======
const app = new RecipeApp();
window.app = app;

// ====== 本地檔案環境變數 ======
let __recipesDirHandle = null;
let __imagesDirHandle = null;

async function pickRecipesFolder() {
    if (!window.showDirectoryPicker) { alert("你的瀏覽器不支援選擇資料夾。請改用 Chrome/Edge。"); return; }
    try {
        __recipesDirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
        __imagesDirHandle = await __recipesDirHandle.getDirectoryHandle("images", { create: true });
        alert("已選擇資料夾：之後圖片會存到 images/，CSV 會讀/寫於該資料夾。");
        await app.afterFolderPicked();
    } catch (e) { console.error(e); }
}

async function writeFile(handle, data) {
    const w = await handle.createWritable();
    await w.write(data);
    await w.close();
}

function extFromFilename(n) {
    const m = (n || "").match(/\.([a-zA-Z0-9]+)$/);
    return m ? m[1].toLowerCase() : "png";
}

async function saveImageToLocalFolder(file, recipeId) {
    if (!__recipesDirHandle || !__imagesDirHandle) return { ok: false, reason: "NO_DIR" };
    const ext = extFromFilename(file.name);
    const filename = `${recipeId}-${Date.now()}.${ext}`;
    const fh = await __imagesDirHandle.getFileHandle(filename, { create: true });
    await writeFile(fh, await file.arrayBuffer());
    return { ok: true, relativePath: `images/${filename}` };
}

async function writeCSVToLocal() {
    if (!__recipesDirHandle) { alert("尚未選擇資料夾。請先按「選擇資料夾」。"); return; }
    const headers = ["id", "title", "category", "tags", "ingredients", "steps", "glass", "method", "servings", "calories", "image_url"];
    const esc = (s) => {
        if (s == null) return "";
        s = String(s);
        if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r"))
            return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const lines = [headers.join(",")];
    for (const r of app.recipes) { lines.push(headers.map(h => esc(r[h])).join(",")); }

    const bom = "\uFEFF";
    const csvText = bom + lines.join("\r\n");

    const csvHandle = await __recipesDirHandle.getFileHandle("recipes.csv", { create: true });
    await writeFile(csvHandle, new Blob([csvText], { type: "text/csv;charset=utf-8" }));
    alert("已寫入 recipes.csv (UTF-8 with BOM)，Excel 開啟不會亂碼。");
}

// ====== 頂部按鈕綁定 ======
document.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!t) return;
    if (t.id === "btnPickFolder") pickRecipesFolder();
    if (t.id === "btnWriteCSV") writeCSVToLocal();
    if (t.id === "btnExport") {
        const headers = ["id", "title", "category", "tags", "ingredients", "steps", "glass", "method", "servings", "calories", "image_url"];
        const esc = (s) => {
            if (s == null) return "";
            s = String(s);
            if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r"))
                return `"${s.replace(/"/g, '""')}"`;
            return s;
        };
        const lines = [headers.join(",")];
        for (const r of app.recipes) { lines.push(headers.map(h => esc(r[h])).join(",")); }
        const bom = "\uFEFF";
        const csvText = bom + lines.join("\r\n");
        const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "recipes.csv";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

// 編輯抽屜：新圖片預覽
document.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t && t.id === "imageFile") {
        const preview = document.getElementById("imagePreview");
        if (!preview) return;
        preview.innerHTML = "";
        const f = t.files && t.files[0];
        if (!f) return;
        const url = URL.createObjectURL(f);
        const img = document.createElement("img");
        img.src = url;
        Object.assign(img.style, { maxWidth: "100%", borderRadius: "12px" });
        preview.appendChild(img);
        const caption = document.createElement('div');
        caption.textContent = '新上傳的圖片預覽';
        Object.assign(caption.style, { fontSize: '0.9rem', color: '#666', marginTop: '8px' });
        preview.appendChild(caption);
    }
});

window.recipes = app.recipes;
window.filteredRecipes = app.filteredRecipes;
