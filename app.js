// 🍳 CuteOrder Web — gogo & putato 专属点菜 Web 应用 💕

// ===== Save references to data layer functions (before we override any) =====
const dataDeleteDish = window.deleteDish
const dataDeleteCategory = window.deleteCategory
const dataInitMenuData = window.initMenuData
const dataPlaceOrder = window.placeOrder

// ===== Toast Helper =====
function showToast(msg, icon) {
  const container = document.getElementById('toast-container')
  const el = document.createElement('div')
  el.className = 'toast-msg'
  el.textContent = (icon || '') + ' ' + msg
  container.appendChild(el)
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300) }, 1500)
}

// ===== Cart (Global) =====
const Cart = {
  _items: JSON.parse(localStorage.getItem('web_cart') || '[]'),

  get items() { return this._items.filter(i => i && i.dishId && i.quantity > 0) },
  get count() { return this.items.reduce((s, i) => s + i.quantity, 0) },

  save() {
    this._items = this.items
    localStorage.setItem('web_cart', JSON.stringify(this._items))
  },

  add(dish) {
    const dishId = dish._id || dish.dishId
    if (!dishId) return false
    const idx = this._items.findIndex(i => i.dishId === dishId)
    if (idx > -1) {
      this._items[idx].quantity++
    } else {
      this._items.push({ dishId, name: dish.name, emoji: dish.emoji || '🍽️', quantity: 1 })
    }
    this.save()
    return true
  },

  remove(dishId) {
    const idx = this._items.findIndex(i => i.dishId === dishId)
    if (idx > -1) {
      if (this._items[idx].quantity > 1) this._items[idx].quantity--
      else this._items.splice(idx, 1)
    }
    this.save()
  },

  setQty(dishId, qty) {
    const idx = this._items.findIndex(i => i.dishId === dishId)
    if (qty <= 0) {
      if (idx > -1) this._items.splice(idx, 1)
    } else {
      if (idx > -1) this._items[idx].quantity = qty
    }
    this.save()
  },

  clear() { this._items = []; this.save() }
}

// ===== Router =====
function navigateTo(page) {
  window.location.hash = page
}

function getCurrentPage() {
  return window.location.hash.replace('#', '') || 'index'
}

// ===== Render Functions =====

function render() {
  const page = getCurrentPage()
  const app = document.getElementById('app')
  app.innerHTML = ''

  switch (page) {
    case 'index': renderIndex(app); break
    case 'orders': renderOrders(app); break
    case 'admin': renderAdmin(app); break
    case 'report': renderReport(app); break
    default: navigateTo('index')
  }
}

// ==========================================
// INDEX PAGE
// ==========================================

var indexState = null

function renderIndex(container) {
  indexState = {
    categories: [],
    allDishes: [],
    filteredDishes: [],
    activeCategory: null,
    searchQuery: '',
    showFavOnly: false,
    favMap: JSON.parse(localStorage.getItem('web_fav') || '{}'),
    wishMap: JSON.parse(localStorage.getItem('web_wish') || '{}'),
    showCart: false,
    orderNote: '',
    showSuccess: false,
    orderDishes: '',
    showPick: false,
    pickMode: false,
    pickCombo: [],
    pickDish: {},
    pickHasDessert: false,
    loveStats: null,
    showAnniversaryModal: false,
    anniversaryDateInput: '',
    showShoppingList: false,
    shoppingList: [],
    dailySpecial: [],
    dailySpecialText: '',
    festivalMode: null,
    festivalEmoji: '',
    festivalText: '',
    loading: true,
    submitting: false,
  }

  renderIndexHTML(container)
  loadCategories()
}

function renderIndexHTML(container) {
  container.innerHTML = `
    <div class="page" id="index-page">
      <div class="header-wave">
        <div class="header-toolbar">
          <div class="header-toolbar-left">
            <span class="header-random-btn" data-action="randomPick">🎲</span>
          </div>
          <div class="header-toolbar-right">
            <span class="header-nav-btn" data-action="goToOrders">📋 订单</span>
            <span class="header-nav-btn" data-action="goToAdmin">⚙️ 后台</span>
          </div>
        </div>
        <div class="header-content">
          <div class="festival-banner" id="festival-banner" style="display:none"></div>
          <span class="header-greeting">嗨 putato~ 🥰</span>
          <span class="header-question">今天想吃什么呀？</span>
          <div class="header-gogo">狗狗 已就绪，等你点单 🍳</div>
          <div class="love-stats" id="love-stats" style="display:none"></div>
        </div>
      </div>

      <div class="daily-special" id="daily-special" style="display:none" onclick="orderDailySpecial()">
        <span class="special-emoji">🍱</span>
        <div class="special-info">
          <span class="special-title">狗狗 今日精选</span>
          <span class="special-dishes" id="special-dishes"></span>
        </div>
        <span class="special-action">一键下单 →</span>
      </div>

      <div class="search-bar-wrap">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input class="search-input" id="search-input" placeholder="搜一搜想吃的..." oninput="onSearchInput(this.value)" />
          <span class="search-clear" id="search-clear" style="display:none" onclick="clearSearch()">✕</span>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-chip" id="filter-fav" onclick="toggleFavFilter()">❤️ 收藏</div>
        <div class="filter-chip filter-chip-pick" onclick="randomPick()">🎲 今天吃什么</div>
      </div>

      <div class="category-bar" id="category-bar">
        <div class="category-inner" id="category-inner"></div>
      </div>

      <div class="dish-section" id="dish-section">
        <div class="loading-state"><span class="loading-text">加载中...</span></div>
      </div>
    </div>

    <!-- Cart FAB -->
    <div class="cart-fab" id="cart-fab" onclick="openCart()">
      <div class="cart-fab-inner">
        <span class="cart-fab-icon">🛒</span>
        <span class="cart-fab-text" id="cart-fab-text">点菜</span>
      </div>
    </div>

    <!-- Pick Modal -->
    <div class="modal-mask" id="pick-mask" style="display:none" onclick="closePick()"></div>
    <div class="pick-modal" id="pick-modal">
      <div class="pick-inner" id="pick-inner"></div>
    </div>

    <!-- Cart Panel -->
    <div class="modal-mask" id="cart-mask" style="display:none" onclick="closeCart()"></div>
    <div class="cart-panel" id="cart-panel">
      <div class="cart-panel-handle"><div class="handle-bar"></div></div>
      <div class="cart-panel-header">
        <span class="cart-panel-title">🛒 确认点的菜</span>
        <span class="cart-panel-clear" onclick="clearCart()">清空</span>
      </div>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-note">
        <span class="cart-note-label">💬 对狗狗说：</span>
        <input class="cart-note-input" id="cart-note-input" placeholder="比如：不要辣、多放葱花~" oninput="indexState.orderNote = this.value" />
      </div>
      <div class="cart-footer safe-area-bottom">
        <div class="cart-total"><span class="cart-total-text" id="cart-total-text">共 0 份</span></div>
        <div class="cart-order-btn" id="cart-order-btn" onclick="placeOrder()">
          <span id="cart-order-text">下单！让狗狗去做饭 🍳</span>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div class="modal-mask" id="success-mask" style="display:none" onclick="closeSuccess()"></div>
    <div class="success-modal" id="success-modal">
      <div class="success-icon">🎉</div>
      <span class="success-title">下单成功！</span>
      <span class="success-dishes" id="success-dishes"></span>
      <div class="success-msg">已通知 狗狗 去做饭啦~ 💕</div>
      <div class="success-hearts">💜 🧡 💜</div>
      <div class="btn btn-primary success-btn" onclick="closeSuccess()">好的，等他做好~ 🥰</div>
      <div class="btn btn-outline btn-small success-list-btn" onclick="showShoppingList()">📋 看看需要买什么</div>
    </div>

    <!-- Anniversary Modal -->
    <div class="modal-mask" id="anniversary-mask" style="display:none" onclick="closeAnniversaryModal()"></div>
    <div class="anniversary-modal" id="anniversary-modal">
      <div class="anniversary-inner">
        <span class="anniversary-title">💕 输入纪念日</span>
        <span class="anniversary-desc">输入你们在一起的日子，首页会显示相爱天数~</span>
        <input class="anniversary-input" id="anniversary-input" placeholder="比如 2025-01-15" oninput="indexState.anniversaryDateInput = this.value" />
        <div class="anniversary-actions">
          <div class="btn btn-outline" onclick="closeAnniversaryModal()">稍后再说</div>
          <div class="btn btn-pink" onclick="confirmAnniversary()">确定 💕</div>
        </div>
      </div>
    </div>

    <!-- Shopping List Panel -->
    <div class="modal-mask" id="shopping-mask" style="display:none" onclick="closeShoppingList()"></div>
    <div class="shopping-panel" id="shopping-panel">
      <div class="shopping-handle"><div class="handle-bar"></div></div>
      <span class="shopping-title">🛒 买菜单</span>
      <div class="shopping-scroll" id="shopping-scroll"></div>
      <div class="btn btn-primary" onclick="closeShoppingList()">知道了 🥰</div>
    </div>
  `
}

// ===== Index Page Logic =====

function loadCategories() {
  const cats = getCategories()
  const allDishes = getDishes()
  indexState.categories = cats
  indexState.allDishes = allDishes
  indexState.activeCategory = cats.length > 0 ? cats[0]._id : null

  renderCategories()
  if (indexState.activeCategory) applyFilters()
  indexState.loading = false

  loadFavs()
  loadWishlist()
  loadDailySpecial()
  checkFirstDate()
  loadLoveStats()
  checkFestival()
  checkOrderReady()
  updateCartUI()
}

function renderCategories() {
  const container = document.getElementById('category-inner')
  if (indexState.searchQuery || indexState.showFavOnly) {
    document.getElementById('category-bar').style.display = 'none'
    return
  }
  document.getElementById('category-bar').style.display = ''
  container.innerHTML = indexState.categories.map(cat =>
    `<div class="category-pill ${cat._id === indexState.activeCategory ? 'category-active' : ''}" onclick="onCategoryTap('${cat._id}')">
      <span class="category-emoji">${cat.emoji}</span>
      <span class="category-name">${cat.name}</span>
    </div>`
  ).join('')
}

function applyFilters() {
  let dishes = indexState.allDishes
  const query = (indexState.searchQuery || '').trim().toLowerCase()

  if (query) {
    dishes = dishes.filter(d => {
      if (d.name.includes(query) || (d.description && d.description.toLowerCase().includes(query))) return true
      if (d.tags && d.tags.some(t => t.includes(query))) return true
      const fullPinyin = getPinyin(d.name).toLowerCase()
      const initials = getInitials(d.name).toLowerCase()
      if (fullPinyin.includes(query) || initials.includes(query)) return true
      return false
    })
  } else if (indexState.activeCategory) {
    dishes = dishes.filter(d => d.categoryId === indexState.activeCategory)
  }

  if (indexState.showFavOnly) {
    dishes = dishes.filter(d => indexState.favMap[d._id])
  }

  indexState.filteredDishes = dishes
  renderDishGrid()
}

function renderDishGrid() {
  const container = document.getElementById('dish-section')
  const dishes = indexState.filteredDishes

  if (indexState.loading) {
    container.innerHTML = '<div class="loading-state"><span class="loading-text">加载中...</span></div>'
    return
  }

  if (dishes.length === 0) {
    const q = indexState.searchQuery
    const f = indexState.showFavOnly
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-emoji">${q ? '🔍' : f ? '💔' : '🍽️'}</span>
        <span class="empty-text">${q ? `没找到 "${q}" 相关的菜~` : f ? '还没有收藏的菜哦~' : '这个分类还没有菜呢~'}</span>
        <span class="empty-hint">${f ? '点菜的时候点 ❤️ 收藏吧！' : '让 狗狗 去管理后台加菜吧！'}</span>
      </div>`
    return
  }

  container.innerHTML = `<div class="dish-grid">${dishes.map(d => `
    <div class="dish-card card">
      <div class="dish-emoji-wrap"><span class="dish-emoji">${d.emoji}</span></div>
      <div class="dish-info">
        <span class="dish-name">${d.name}</span>
        ${d.description ? `<span class="dish-desc">${d.description}</span>` : ''}
      </div>
      <div class="dish-price-row">
        ${d.price ? `<span class="dish-price">${d.price}元</span>` : ''}
        ${(d.cookTime || d.difficulty) ? `
          <div class="dish-meta-row">
            ${d.cookTime ? `<span class="dish-cooktime">⏱${d.cookTime}</span>` : ''}
            ${d.difficulty ? `<span class="dish-difficulty">${['','⚪','🔵','🔴'][d.difficulty]}</span>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="dish-add-btn" onclick="event.stopPropagation(); addToCart('${d._id}')">
        <span class="dish-add-icon">+</span>
      </div>
      <div class="dish-actions">
        <div class="dish-fav" onclick="event.stopPropagation(); toggleFav('${d._id}')">
          <span>${indexState.favMap[d._id] ? '❤️' : '🤍'}</span>
        </div>
        <div class="dish-wish" onclick="event.stopPropagation(); toggleWish('${d._id}')">
          <span>${indexState.wishMap[d._id] ? '🌟' : '⭐'}</span>
        </div>
      </div>
      ${Cart.items.find(i => i.dishId === d._id) ? `<div class="dish-badge"><div class="badge-dot"><span>${Cart.items.find(i => i.dishId === d._id).quantity}</span></div></div>` : ''}
    </div>
  `).join('')}</div>`
}

function onCategoryTap(id) {
  indexState.activeCategory = id
  indexState.searchQuery = ''
  indexState.showFavOnly = false
  document.getElementById('search-input').value = ''
  renderCategories()
  applyFilters()
}

function onSearchInput(value) {
  indexState.searchQuery = value
  indexState.showFavOnly = false
  document.getElementById('search-clear').style.display = value ? '' : 'none'
  renderCategories()
  applyFilters()
}

function clearSearch() {
  indexState.searchQuery = ''
  indexState.showFavOnly = false
  document.getElementById('search-input').value = ''
  document.getElementById('search-clear').style.display = 'none'
  renderCategories()
  applyFilters()
}

// ===== Fav =====
function toggleFav(dishId) {
  const map = { ...indexState.favMap }
  if (map[dishId]) {
    delete map[dishId]
    showToast('取消收藏', '💔')
  } else {
    map[dishId] = true
    showToast('已收藏', '❤️')
  }
  indexState.favMap = map
  localStorage.setItem('web_fav', JSON.stringify(map))
  if (indexState.showFavOnly) applyFilters()
  else renderDishGrid()
}

function loadFavs() {
  indexState.favMap = JSON.parse(localStorage.getItem('web_fav') || '{}')
}

function toggleFavFilter() {
  indexState.showFavOnly = !indexState.showFavOnly
  indexState.searchQuery = ''
  document.getElementById('search-input').value = ''
  document.getElementById('filter-fav').className = 'filter-chip' + (indexState.showFavOnly ? ' filter-chip-active' : '')
  renderCategories()
  applyFilters()
}

// ===== Wish =====
function toggleWish(dishId) {
  const stats = getStats()
  let wishlist = (stats.wishlist || []).slice()
  const map = { ...indexState.wishMap }

  if (map[dishId]) {
    wishlist = wishlist.filter(id => id !== dishId)
    delete map[dishId]
    showToast('从心愿单移除')
  } else {
    wishlist.push(dishId)
    map[dishId] = true
    showToast('已加入心愿单！', '🌟')
  }
  saveStats({ ...stats, wishlist })
  indexState.wishMap = map
  renderDishGrid()
}

function loadWishlist() {
  const stats = getStats()
  const wishlist = stats.wishlist || []
  const map = {}
  wishlist.forEach(id => { map[id] = true })
  indexState.wishMap = map
}

// ===== Daily Special =====
function loadDailySpecial() {
  const special = JSON.parse(localStorage.getItem('web_daily_special') || 'null')
  if (special && special.dishIds && special.dishIds.length > 0) {
    const allDishes = getDishes()
    const dishes = special.dishIds.map(id => allDishes.find(d => d._id === id)).filter(Boolean)
    const text = dishes.map(d => d.emoji + d.name).join(' · ')
    indexState.dailySpecial = dishes
    indexState.dailySpecialText = text
    const el = document.getElementById('daily-special')
    if (el) { el.style.display = ''; document.getElementById('special-dishes').textContent = text }
    return
  }
  const allDishes = getDishes()
  if (!allDishes || allDishes.length === 0) return
  const shuffled = [...allDishes].sort(() => 0.5 - Math.random())
  const dishes = shuffled.slice(0, 3)
  const text = dishes.map(d => d.emoji + d.name).join(' · ')
  indexState.dailySpecial = dishes
  indexState.dailySpecialText = text
  const el = document.getElementById('daily-special')
  if (el) { el.style.display = ''; document.getElementById('special-dishes').textContent = text }
}

// ===== Love Stats =====
function loadLoveStats() {
  const stats = getLoveStats()
  indexState.loveStats = stats
  const el = document.getElementById('love-stats')
  if (!el) return
  if (!stats) { el.style.display = 'none'; return }
  el.style.display = ''
  el.innerHTML = `
    <div class="love-stat-item"><span class="love-stat-num">${stats.days}</span><span class="love-stat-label">天</span></div>
    <div class="love-stat-divider"></div>
    <div class="love-stat-item"><span class="love-stat-num">${stats.orders}</span><span class="love-stat-label">次下厨</span></div>
    ${stats.topDish ? `<div class="love-stat-divider"></div><div class="love-stat-item"><span class="love-stat-label">最爱</span><span class="love-stat-num">${stats.topDish.emoji}</span></div>` : ''}
  `
}

function checkFirstDate() {
  const stats = getStats()
  if (!stats || !stats.firstDate) {
    indexState.showAnniversaryModal = true
    const el = document.getElementById('anniversary-modal')
    const mask = document.getElementById('anniversary-mask')
    if (el) { el.style.display = ''; setTimeout(() => el.classList.add('anniversary-modal-show'), 10) }
    if (mask) mask.style.display = ''
  }
}

function confirmAnniversary() {
  const date = (indexState.anniversaryDateInput || '').trim()
  if (!date) { showToast('请输入日期哦~'); return }
  saveStats({ firstDate: date, wishlist: [] })
  closeAnniversaryModal()
  loadLoveStats()
}

function closeAnniversaryModal() {
  indexState.showAnniversaryModal = false
  const el = document.getElementById('anniversary-modal')
  const mask = document.getElementById('anniversary-mask')
  if (el) { el.classList.remove('anniversary-modal-show'); setTimeout(() => el.style.display = 'none', 350) }
  if (mask) mask.style.display = 'none'
}

function checkFestival() {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const stats = getStats()

  if (stats && stats.firstDate) {
    const first = new Date(stats.firstDate)
    if (first.getMonth() === now.getMonth() && first.getDate() === day) {
      showFestival('🎂', '周年快乐！💕'); return
    }
  }
  const festivals = {
    '2-14': '💕 情人节快乐！', '3-8': '🌸 女神节快乐！',
    '5-20': '💝 520快乐！', '12-24': '🎄 圣诞快乐！',
    '12-31': '🎉 跨年快乐！', '1-1': '🎆 新年快乐！'
  }
  const key = `${month}-${day}`
  if (festivals[key]) showFestival(festivals[key].split(' ')[0], festivals[key])
}

function showFestival(emoji, text) {
  const el = document.getElementById('festival-banner')
  if (el) { el.style.display = ''; el.textContent = `${emoji} ${text} ${emoji}` }
}

function checkOrderReady() {
  const ready = JSON.parse(localStorage.getItem('web_order_ready') || 'null')
  if (!ready) return
  const items = ready.items || []
  const detail = items.map(i => `${i.emoji} ${i.name}×${i.quantity}`).join('、')
  // Show alert as simple modal
  const msg = `狗狗 已经把饭做好啦~\n${detail}`
  if (confirm(msg + '\n\n去吃吧！🥰')) {
    localStorage.removeItem('web_order_ready')
  }
}

// ===== Random Pick =====
function randomPick() {
  const allDishes = getDishes()
  if (allDishes.length === 0) { showToast('还没有菜哦~'); return }

  const categories = getCategories()
  const grouped = {}
  categories.forEach(cat => { grouped[cat._id] = { ...cat, dishes: allDishes.filter(d => d.categoryId === cat._id) } })

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const combo = []
  let hasDessert = false

  categories.forEach(cat => {
    const g = grouped[cat._id]
    if (!g || g.dishes.length === 0) return
    if (cat._id === 'cat_5') {
      if (Math.random() < 0.2 && g.dishes.length > 0) {
        combo.push({ ...pick(g.dishes), comboType: '🍰 甜品' })
        hasDessert = true
      }
    } else if (cat._id === 'cat_6') {
      const shuffled = [...g.dishes].sort(() => 0.5 - Math.random())
      if (shuffled.length >= 2) {
        combo.push({ ...shuffled[0], comboType: '🥤 饮品' })
        combo.push({ ...shuffled[1], comboType: '🥤 饮品' })
      } else { shuffled.forEach(d => combo.push({ ...d, comboType: '🥤 饮品' })) }
    } else {
      combo.push({ ...pick(g.dishes), comboType: cat.emoji + ' ' + cat.name })
    }
  })

  const dish = combo.length > 0 ? combo[0] : allDishes[Math.floor(Math.random() * allDishes.length)]
  indexState.pickMode = 'combo'
  indexState.pickCombo = combo
  indexState.pickDish = dish
  indexState.pickHasDessert = hasDessert
  indexState.showPick = true

  const mask = document.getElementById('pick-mask')
  const modal = document.getElementById('pick-modal')
  const inner = document.getElementById('pick-inner')

  if (mask) mask.style.display = ''
  if (modal) {
    modal.style.display = ''
    const dessertHtml = hasDessert
      ? '<div class="dessert-surprise"><span class="dessert-surprise-emoji">🎉</span><span class="dessert-surprise-text">幸运加持！今天送一份甜品～</span></div>'
      : ''
    inner.innerHTML = `
      ${dessertHtml}
      <span class="pick-label">🎲 今天推荐套餐~</span>
      <div class="combo-items">
        ${combo.map(item => `
          <div class="combo-item">
            <div class="combo-item-left">
              <span class="combo-emoji">${item.emoji}</span>
              <div class="combo-info">
                <span class="combo-name">${item.name}</span>
                <span class="combo-type">${item.comboType}</span>
              </div>
            </div>
            ${item.price ? `<span class="combo-price">${item.price}元</span>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="pick-actions">
        <div class="btn btn-pink" onclick="pickComboAddAll()">全部加入 🛒</div>
        <div class="btn btn-outline" onclick="randomPick()">换一套 🎲</div>
      </div>
    `
    setTimeout(() => modal.classList.add('pick-modal-show'), 10)
  }
}

function closePick() {
  indexState.showPick = false
  const mask = document.getElementById('pick-mask')
  const modal = document.getElementById('pick-modal')
  if (modal) { modal.classList.remove('pick-modal-show'); setTimeout(() => modal.style.display = 'none', 350) }
  if (mask) mask.style.display = 'none'
}

function pickComboAddAll() {
  const combo = indexState.pickCombo || []
  combo.forEach(dish => Cart.add({ _id: dish._id, name: dish.name, emoji: dish.emoji }))
  closePick()
  updateCartUI()
  showToast(`已加入 ${combo.length} 道菜`, '🎉')
  openCart()
}

// ===== Cart =====
function addToCart(dishId) {
  // Find dish by id
  const allDishes = [...indexState.allDishes, ...indexState.dailySpecial, ...getDishes()]
  const dish = allDishes.find(d => d._id === dishId)
  if (!dish) { showToast('这道菜暂时点不了~'); return }
  if (!Cart.add(dish)) return
  updateCartUI()
  showToast(`已加入 ${dish.name}`, '🛒')
}

function openCart() {
  if (Cart.count === 0) { showToast('先点上面的 + 选菜吧~ 🥰'); return }
  indexState.showCart = true
  const mask = document.getElementById('cart-mask')
  const panel = document.getElementById('cart-panel')
  if (mask) mask.style.display = ''
  if (panel) {
    panel.style.display = ''
    setTimeout(() => panel.classList.add('cart-panel-show'), 10)
  }
  renderCartItems()
  document.getElementById('cart-note-input').value = ''
  indexState.orderNote = ''
}

function closeCart() {
  indexState.showCart = false
  const mask = document.getElementById('cart-mask')
  const panel = document.getElementById('cart-panel')
  if (panel) { panel.classList.remove('cart-panel-show'); setTimeout(() => panel.style.display = 'none', 350) }
  if (mask) mask.style.display = 'none'
}

function renderCartItems() {
  const container = document.getElementById('cart-items')
  const items = Cart.items
  container.innerHTML = items.map(item => `
    <div class="cart-item">
      <span class="cart-item-emoji">${item.emoji}</span>
      <span class="cart-item-name">${item.name}</span>
      <div class="cart-item-qty">
        <div class="qty-btn" onclick="cartItemRemove('${item.dishId}')">-</div>
        <span class="qty-num">${item.quantity}</span>
        <div class="qty-btn qty-btn-add" onclick="cartItemAdd('${item.dishId}')">+</div>
      </div>
    </div>
  `).join('')
  document.getElementById('cart-total-text').textContent = `共 ${Cart.count} 份`
}

function cartItemAdd(dishId) {
  const dish = getDishes().find(d => d._id === dishId)
  if (dish) Cart.add(dish)
  renderCartItems()
  updateCartUI()
}

function cartItemRemove(dishId) {
  Cart.remove(dishId)
  if (Cart.count === 0) closeCart()
  else renderCartItems()
  updateCartUI()
}

function clearCart() {
  Cart.clear()
  closeCart()
  updateCartUI()
  showToast('已清空', '🧹')
}

function updateCartUI() {
  const fab = document.getElementById('cart-fab')
  const text = document.getElementById('cart-fab-text')
  if (!fab || !text) return
  const count = Cart.count
  if (count > 0) {
    fab.classList.add('cart-fab-active')
    text.textContent = count + '份'
  } else {
    fab.classList.remove('cart-fab-active')
    text.textContent = '点菜'
  }
  renderDishGrid()
}

// ===== Place Order =====
function placeOrder() {
  if (indexState.submitting) return
  const items = Cart.items
  if (items.length === 0) return

  indexState.submitting = true
  document.getElementById('cart-order-text').textContent = '提交中...'

  const orderItems = items.map(item => ({
    dishId: item.dishId, name: item.name, emoji: item.emoji, quantity: item.quantity
  }))

  // Place order locally
  dataPlaceOrder(orderItems, indexState.orderNote || '')

  const dishList = orderItems.map(i => `${i.emoji} ${i.name}×${i.quantity}`).join('、')
  Cart.clear()
  updateCartUI()

  indexState.submitting = false
  indexState.showCart = false
  indexState.showSuccess = true
  indexState.orderDishes = dishList

  const cartMask = document.getElementById('cart-mask')
  const cartPanel = document.getElementById('cart-panel')
  if (cartPanel) { cartPanel.classList.remove('cart-panel-show'); setTimeout(() => cartPanel.style.display = 'none', 350) }
  if (cartMask) cartMask.style.display = 'none'

  const successMask = document.getElementById('success-mask')
  const successModal = document.getElementById('success-modal')
  const successDishes = document.getElementById('success-dishes')
  if (successDishes) successDishes.textContent = dishList
  if (successMask) successMask.style.display = ''
  if (successModal) {
    successModal.style.display = ''
    setTimeout(() => successModal.classList.add('success-modal-show'), 10)
  }
  loadLoveStats()
}

function closeSuccess() {
  indexState.showSuccess = false
  const mask = document.getElementById('success-mask')
  const modal = document.getElementById('success-modal')
  if (modal) { modal.classList.remove('success-modal-show'); setTimeout(() => modal.style.display = 'none', 350) }
  if (mask) mask.style.display = 'none'
}

// ===== Shopping List =====
function showShoppingList() {
  const items = Cart.items.length > 0 ? Cart.items : []
  if (items.length === 0) return
  const list = generateShoppingList(items.map(i => ({ name: i.name, quantity: i.quantity })))
  indexState.shoppingList = list
  indexState.showShoppingList = true

  const mask = document.getElementById('shopping-mask')
  const panel = document.getElementById('shopping-panel')
  const scroll = document.getElementById('shopping-scroll')

  if (scroll) {
    scroll.innerHTML = list.map(section => `
      <div class="shopping-section">
        <span class="shopping-section-title">${section.label}</span>
        ${section.items.map(item => `
          <div class="shopping-item">
            <span class="shopping-checkbox">☐</span>
            <span>${item}</span>
          </div>
        `).join('')}
      </div>
    `).join('')
  }
  if (mask) mask.style.display = ''
  if (panel) {
    panel.style.display = ''
    setTimeout(() => panel.classList.add('shopping-panel-show'), 10)
  }

  // Close success first
  closeSuccess()
}

function closeShoppingList() {
  indexState.showShoppingList = false
  const mask = document.getElementById('shopping-mask')
  const panel = document.getElementById('shopping-panel')
  if (panel) { panel.classList.remove('shopping-panel-show'); setTimeout(() => panel.style.display = 'none', 350) }
  if (mask) mask.style.display = 'none'
}

// ===== Navigation =====
function goToOrders() { navigateTo('orders') }
function goToAdmin() { navigateTo('admin') }

// Index page event handlers (defined globally for onclick)
window.onSearchInput = onSearchInput
window.clearSearch = clearSearch
window.toggleFavFilter = toggleFavFilter
window.randomPick = randomPick
window.onCategoryTap = onCategoryTap
window.addToCart = addToCart
window.toggleFav = toggleFav
window.toggleWish = toggleWish
window.openCart = openCart
window.closeCart = closeCart
window.clearCart = clearCart
window.cartItemAdd = cartItemAdd
window.cartItemRemove = cartItemRemove
window.placeOrder = placeOrder
window.closeSuccess = closeSuccess
window.closePick = closePick
window.pickComboAddAll = pickComboAddAll
window.closeAnniversaryModal = closeAnniversaryModal
window.confirmAnniversary = confirmAnniversary
window.showShoppingList = showShoppingList
window.closeShoppingList = closeShoppingList
window.goToOrders = goToOrders
window.goToAdmin = goToAdmin
window.indexState = indexState

// ==========================================
// ORDERS PAGE
// ==========================================

var ordersState = null

function renderOrders(container) {
  ordersState = { orders: [], loading: true, showDetail: false, detailOrder: null }
  container.innerHTML = `
    <div class="page" style="min-height:100vh">
      <div class="page-header">
        <div class="page-header-bg"></div>
        <div class="orders-toolbar">
          <span class="orders-back-btn" onclick="navigateTo('index')">← 🍽️ 菜单</span>
          <span class="orders-admin-btn" onclick="navigateTo('admin')">⚙️ 后台</span>
        </div>
        <span class="page-title">📋 订单记录</span>
        <span class="page-subtitle">putato 点过的好吃的~</span>
      </div>
      <div class="report-entry" id="report-entry" style="display:none" onclick="navigateTo('report')">
        <span>📊 查看年度美食报告</span>
        <span>→</span>
      </div>
      <div class="loading-state" id="orders-loading" style="display:block;padding:60px 0;text-align:center">
        <span class="loading-text">加载中...</span>
      </div>
      <div class="order-list safe-area-bottom" id="order-list" style="display:none"></div>
      <div class="empty-state" id="orders-empty" style="display:none">
        <span class="empty-emoji">📭</span>
        <span class="empty-text">还没有订单呢~</span>
        <span class="empty-hint">快去点菜吧！🥰</span>
      </div>
    </div>

    <!-- Detail Panel -->
    <div class="modal-mask" id="order-detail-mask" style="display:none"></div>
    <div class="detail-panel" id="order-detail-panel">
      <div class="detail-handle"><div class="handle-bar"></div></div>
      <div id="order-detail-content"></div>
      <div class="detail-footer safe-area-bottom">
        <div class="btn btn-primary" onclick="closeOrderDetail()">知道了 🥰</div>
      </div>
    </div>
  `
  loadOrders()
}

function loadOrders() {
  const orders = getOrders()
  ordersState.orders = orders

  document.getElementById('orders-loading').style.display = 'none'

  if (orders.length === 0) {
    document.getElementById('orders-empty').style.display = ''
    document.getElementById('order-list').style.display = 'none'
    return
  }

  document.getElementById('report-entry').style.display = ''
  document.getElementById('order-list').style.display = ''

  document.getElementById('order-list').innerHTML = orders.map(order => `
    <div class="order-card card" onclick="showOrderDetail('${order._id}')">
      <div class="order-header">
        <span class="order-time">${formatTime(order.createdAt)}</span>
        <span class="tag ${getStatusTag(order.status)}">${getStatusText(order.status)}</span>
      </div>
      <div class="order-items">
        ${(order.items || []).map(item => `
          <div class="order-item">
            <span class="order-item-emoji">${item.emoji || '🍽️'}</span>
            <span class="order-item-name">${item.name}</span>
            <span class="order-item-qty">×${item.quantity}</span>
          </div>
        `).join('')}
      </div>
      ${order.note ? `<div class="order-note">💬 ${order.note}</div>` : ''}
      ${order.photoPath ? `<div class="order-photo"><img class="order-photo-thumb" src="${order.photoPath}" /></div>` : ''}
      ${order.rating && order.rating.score ? `
        <div class="order-rating-display">
          <span class="rating-stars">${'★'.repeat(order.rating.score)}${'☆'.repeat(5 - order.rating.score)}</span>
          ${order.rating.comment ? `<span class="rating-comment">"${order.rating.comment}"</span>` : ''}
        </div>
      ` : ''}
      <div class="order-reorder" onclick="event.stopPropagation(); reorder('${order._id}')">
        <span class="reorder-btn">🔄 再来一单</span>
      </div>
    </div>
  `).join('')
}

function showOrderDetail(orderId) {
  const order = ordersState.orders.find(o => o._id === orderId)
  if (!order) { showToast('没有找到这个订单~'); return }
  ordersState.detailOrder = order

  const stars = order.rating && order.rating.score ? '★'.repeat(order.rating.score) + '☆'.repeat(5 - order.rating.score) : ''
  const hasRating = order.rating && order.rating.score

  document.getElementById('order-detail-content').innerHTML = `
    <div class="detail-header">
      <span class="detail-title">订单详情</span>
      <span class="tag ${getStatusTag(order.status)}">${getStatusText(order.status)}</span>
    </div>
    <div class="detail-time">${formatTime(order.createdAt)}</div>
    <div class="detail-items">
      ${(order.items || []).map(item => `
        <div class="detail-item">
          <span class="detail-item-emoji">${item.emoji || '🍽️'}</span>
          <span class="detail-item-name">${item.name}</span>
          <span class="detail-item-qty">×${item.quantity}</span>
        </div>
      `).join('')}
    </div>
    ${order.note ? `<div class="detail-note"><span class="detail-note-label">💬 备注：</span><span class="detail-note-text">${order.note}</span></div>` : ''}
    ${order.photoPath ? `<div class="detail-photo"><img class="detail-photo-img" src="${order.photoPath}" /></div>` : ''}
    ${order.status === 'done' ? `
      <div class="detail-rating">
        <div class="rating-title">🍽️ 味道怎么样？</div>
        ${hasRating ? `
          <div class="rating-result">
            <span class="rating-stars-display">${stars}</span>
            ${order.rating.comment ? `<span class="rating-comment-text">"${order.rating.comment}"</span>` : ''}
          </div>
        ` : `
          <div class="rating-stars">
            ${[1,2,3,4,5].map(s => `<span class="star" onclick="rateOrder('${order._id}', ${s})">★</span>`).join('')}
          </div>
        `}
      </div>
    ` : ''}
  `

  const mask = document.getElementById('order-detail-mask')
  const panel = document.getElementById('order-detail-panel')
  ordersState.showDetail = true
  if (mask) mask.style.display = ''
  if (panel) {
    panel.style.display = ''
    setTimeout(() => panel.classList.add('detail-panel-show'), 10)
  }
}

function closeOrderDetail() {
  ordersState.showDetail = false
  const mask = document.getElementById('order-detail-mask')
  const panel = document.getElementById('order-detail-panel')
  if (panel) { panel.classList.remove('detail-panel-show'); setTimeout(() => panel.style.display = 'none', 350) }
  if (mask) mask.style.display = 'none'
}

function getStatusTag(status) {
  return { pending: 'tag-pending', cooking: 'tag-cooking', done: 'tag-done' }[status] || 'tag-pending'
}
function getStatusText(status) {
  return { pending: '等待中 ⏳', cooking: '烹饪中 🍳', done: '已做好 ✅' }[status] || '未知'
}
function formatTime(time) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function reorder(orderId) {
  const order = ordersState.orders.find(o => o._id === orderId)
  if (!order) { showToast('没有找到这个订单~'); return }
  const items = order.items || []
  items.forEach(item => {
    Cart.add({ _id: item.dishId, name: item.name, emoji: item.emoji || '🍽️' })
  })
  updateCartUI()
  showToast('已加入购物车', '🛒')
  setTimeout(() => navigateTo('index'), 800)
}

function rateOrder(orderId, score) {
  const comment = prompt(`评分 ${'★'.repeat(score)}${'☆'.repeat(5 - score)}\n想对 狗狗 说点什么？`)
  if (comment === null) return

  const db = getDB()
  const order = db.orders.find(o => o._id === orderId)
  if (!order) { showToast('订单不存在~'); return }
  order.rating = { score, comment: comment || '', ratedAt: new Date().toISOString() }

  order.items.forEach(item => {
    const dish = db.dishes.find(d => d._id === item.dishId)
    if (dish) {
      dish.totalCooked = (dish.totalCooked || 0) + 1
      dish.totalRatings = (dish.totalRatings || 0) + 1
      dish.avgRating = ((dish.avgRating || 0) * (dish.totalRatings - 1) + score) / dish.totalRatings
    }
  })
  saveDB(db)
  showToast(`已评价 ${'★'.repeat(score)}`, '🎉')
  closeOrderDetail()
  loadOrders()
}

// ==========================================
// ADMIN PAGE
// ==========================================

var adminState = null
const ADMIN_PWD = 'gogo520'

function renderAdmin(container) {
  adminState = {
    locked: true,
    pwdInput: '',
    pwdError: false,
    tab: 'dishes',
    dishes: [],
    categories: [],
    orders: [],
    showDishEdit: false,
    editDish: { name: '', emoji: '🍽️', description: '', categoryId: '', price: '', cookTime: '', difficulty: 0, tags: '', isSignature: false },
    isNewDish: true,
    editDishCategoryName: '',
    editDishCategoryIndex: 0,
    showCategoryEdit: false,
    editCategory: { name: '', emoji: '📂' },
    isNewCategory: true,
    wishDishes: [],
    wishText: '',
    allDishes: [],
    dailySpecialIds: [],
    dailySpecialMap: {},
  }

  container.innerHTML = `
    <div class="lock-page" id="admin-lock">
      <div class="lock-content">
        <span class="lock-icon">🔐</span>
        <span class="lock-title">管理后台</span>
        <span class="lock-desc">狗狗 专属，输入密码进入~</span>
        <input class="lock-input" type="password" id="admin-pwd" placeholder="请输入密码" oninput="adminState.pwdInput = this.value" onkeydown="if(event.key==='Enter')unlock()" />
        <div class="lock-error" id="admin-pwd-error" style="display:none">❌ 密码不对哦，再试试~</div>
        <div class="btn btn-primary lock-btn" onclick="unlock()">进入后台</div>
      </div>
    </div>
    <div class="admin-page" id="admin-page" style="display:none">
      <div class="admin-header">
        <div class="admin-header-bg"></div>
        <span class="admin-title">⚙️ 管理后台</span>
        <span class="admin-subtitle">狗狗 的料理台</span>
      </div>
      <div class="admin-wish-banner" id="admin-wish-banner" style="display:none" onclick="switchAdminTab('dishes')"></div>
      <div class="admin-tabs">
        <div class="admin-tab admin-tab-active" onclick="switchAdminTab('dishes')">🍽️ 菜品</div>
        <div class="admin-tab" onclick="switchAdminTab('categories')">📂 分类</div>
        <div class="admin-tab" onclick="switchAdminTab('orders')">📋 订单</div>
        <div class="admin-tab" onclick="switchAdminTab('special')">🍱 精选</div>
      </div>
      <div class="admin-content" id="admin-content"></div>
      <div class="admin-bottom safe-area-bottom">
        <div class="admin-bottom-row">
          <div class="btn btn-outline btn-small" onclick="adminInitMenuData()">📦 初始化菜单</div>
          <div class="btn btn-outline btn-small" onclick="navigateTo('index')">🍽️ 菜单</div>
        </div>
        <span class="admin-bottom-hint">putato 和 狗狗 的专属点菜应用 💕</span>
      </div>
    </div>

    <!-- Dish Edit Modal -->
    <div class="modal-mask" id="dish-edit-mask" style="display:none"></div>
    <div class="edit-modal" id="dish-edit-modal">
      <div class="edit-handle"><div class="handle-bar"></div></div>
      <span class="edit-title" id="dish-edit-title">添加菜品</span>
      <div id="dish-edit-fields"></div>
      <div class="edit-actions">
        <div class="btn btn-outline" onclick="closeDishEdit()">取消</div>
        <div class="btn btn-primary" onclick="saveDish()">添加</div>
      </div>
    </div>

    <!-- Category Edit Modal -->
    <div class="modal-mask" id="category-edit-mask" style="display:none"></div>
    <div class="edit-modal" id="category-edit-modal">
      <div class="edit-handle"><div class="handle-bar"></div></div>
      <span class="edit-title" id="category-edit-title">添加分类</span>
      <div id="category-edit-fields"></div>
      <div class="edit-actions">
        <div class="btn btn-outline" onclick="closeCategoryEdit()">取消</div>
        <div class="btn btn-primary" onclick="saveCategory()">添加</div>
      </div>
    </div>
  `
}

function unlock() {
  if (adminState.pwdInput === ADMIN_PWD) {
    adminState.locked = false
    document.getElementById('admin-lock').style.display = 'none'
    document.getElementById('admin-page').style.display = ''
    loadAdminData()
  } else {
    adminState.pwdError = true
    document.getElementById('admin-pwd-error').style.display = ''
  }
}

function loadAdminData() {
  loadAdminDishes()
  loadAdminCategories()
  loadAdminOrders()
  loadAdminAllDishes()
  loadDailySpecialData()
  loadWishDishes()
}

function loadAdminDishes() {
  adminState.dishes = getDishes()
  renderAdminContent()
}
function loadAdminCategories() {
  adminState.categories = getCategories()
  renderAdminContent()
}
function loadAdminOrders() {
  adminState.orders = getOrders()
  renderAdminContent()
}
function loadAdminAllDishes() {
  adminState.allDishes = getDishes()
}
function loadDailySpecialData() {
  const special = JSON.parse(localStorage.getItem('web_daily_special') || 'null')
  const ids = special ? special.dishIds : []
  const map = {}
  ids.forEach(id => { map[id] = true })
  adminState.dailySpecialIds = ids
  adminState.dailySpecialMap = map
}
function loadWishDishes() {
  const stats = getStats()
  if (!stats || !stats.wishlist || stats.wishlist.length === 0) {
    adminState.wishDishes = []
    adminState.wishText = ''
    document.getElementById('admin-wish-banner').style.display = 'none'
    return
  }
  const allDishes = getDishes()
  const wishDishes = stats.wishlist.map(id => allDishes.find(d => d._id === id)).filter(Boolean)
  const wishText = wishDishes.map(d => d.emoji + d.name).join('、')
  adminState.wishDishes = wishDishes
  adminState.wishText = wishText
  const banner = document.getElementById('admin-wish-banner')
  if (banner) { banner.style.display = ''; banner.innerHTML = `🌟 putato 想吃：${wishText}` }
}

function switchAdminTab(tab) {
  adminState.tab = tab
  document.querySelectorAll('.admin-tab').forEach((el, i) => {
    el.classList.toggle('admin-tab-active', ['dishes','categories','orders','special'][i] === tab)
  })
  renderAdminContent()
}

function renderAdminContent() {
  const container = document.getElementById('admin-content')
  if (!container) return

  switch (adminState.tab) {
    case 'dishes': renderAdminDishes(container); break
    case 'categories': renderAdminCategories(container); break
    case 'orders': renderAdminOrders(container); break
    case 'special': renderAdminSpecial(container); break
  }
}

function renderAdminDishes(container) {
  const dishes = adminState.dishes
  container.innerHTML = `
    <div class="admin-toolbar">
      <span class="admin-count">共 ${dishes.length} 道菜</span>
      <div class="btn btn-primary btn-small" onclick="newDish()">+ 添加菜品</div>
    </div>
    <div class="admin-list">
      ${dishes.map(d => `
        <div class="admin-list-item">
          <span class="admin-item-emoji">${d.emoji || '🍽️'}</span>
          <div class="admin-item-info">
            <span class="admin-item-name">${d.name}</span>
            ${d.description ? `<span class="admin-item-desc">${d.description}</span>` : ''}
          </div>
          <div class="admin-item-actions">
            <span class="admin-action-edit" onclick="editDish('${d._id}')">✏️</span>
            <span class="admin-action-del" onclick="adminDeleteDish('${d._id}')">🗑️</span>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function newDish() {
  const cats = adminState.categories
  adminState.isNewDish = true
  adminState.editDish = { name: '', emoji: '🍽️', description: '', categoryId: cats[0]?._id || '', price: '', cookTime: '', difficulty: 0, tags: '', isSignature: false }
  renderDishEditForm()
  const mask = document.getElementById('dish-edit-mask')
  const modal = document.getElementById('dish-edit-modal')
  document.getElementById('dish-edit-title').textContent = '添加菜品'
  if (mask) mask.style.display = ''
  if (modal) { modal.style.display = ''; setTimeout(() => modal.classList.add('edit-modal-show'), 10) }
}

function editDish(id) {
  const dish = adminState.dishes.find(d => d._id === id)
  if (!dish) { showToast('没有找到这道菜~'); return }
  adminState.isNewDish = false
  adminState.editDish = {
    _id: dish._id, name: dish.name, emoji: dish.emoji || '🍽️',
    description: dish.description || '', categoryId: dish.categoryId || '',
    price: (dish.price || '').toString(), cookTime: (dish.cookTime || '').toString(),
    difficulty: dish.difficulty || 0,
    tags: (dish.tags || []).join('、'), isSignature: dish.isSignature || false
  }
  renderDishEditForm()
  const mask = document.getElementById('dish-edit-mask')
  const modal = document.getElementById('dish-edit-modal')
  document.getElementById('dish-edit-title').textContent = '编辑菜品'
  if (mask) mask.style.display = ''
  if (modal) { modal.style.display = ''; setTimeout(() => modal.classList.add('edit-modal-show'), 10) }
}

function renderDishEditForm() {
  const ed = adminState.editDish
  const cats = adminState.categories
  const catIdx = cats.findIndex(c => c._id === ed.categoryId)
  adminState.editDishCategoryName = catIdx > -1 ? cats[catIdx].name : ''
  adminState.editDishCategoryIndex = catIdx > -1 ? catIdx : 0

  document.getElementById('dish-edit-fields').innerHTML = `
    <div class="edit-field">
      <span class="edit-label">Emoji</span>
      <input class="edit-input" value="${ed.emoji || ''}" oninput="adminState.editDish.emoji = this.value" />
    </div>
    <div class="edit-field">
      <span class="edit-label">菜名 *</span>
      <input class="edit-input" value="${ed.name || ''}" oninput="adminState.editDish.name = this.value" />
    </div>
    <div class="edit-field">
      <span class="edit-label">描述</span>
      <input class="edit-input" value="${ed.description || ''}" oninput="adminState.editDish.description = this.value" />
    </div>
    <div class="edit-field">
      <span class="edit-label">分类</span>
      <select class="edit-picker" onchange="onDishCategoryChange(this.value)">
        ${cats.map((c, i) => `<option value="${i}" ${i === catIdx ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="edit-field">
      <span class="edit-label">价格（可选）</span>
      <input class="edit-input" value="${ed.price || ''}" oninput="adminState.editDish.price = this.value" />
    </div>
    <div class="edit-field">
      <span class="edit-label">⏱ 烹饪时间（分钟）</span>
      <input class="edit-input" value="${ed.cookTime || ''}" oninput="adminState.editDish.cookTime = this.value" />
    </div>
    <div class="edit-field">
      <span class="edit-label">⭐ 难度</span>
      <select class="edit-picker" onchange="adminState.editDish.difficulty = parseInt(this.value)">
        <option value="0" ${ed.difficulty === 0 ? 'selected' : ''}>未设置</option>
        <option value="1" ${ed.difficulty === 1 ? 'selected' : ''}>简单</option>
        <option value="2" ${ed.difficulty === 2 ? 'selected' : ''}>中等</option>
        <option value="3" ${ed.difficulty === 3 ? 'selected' : ''}>困难</option>
      </select>
    </div>
    <div class="edit-field">
      <span class="edit-label">🏷️ 口味标签</span>
      <input class="edit-input" value="${ed.tags || ''}" placeholder="用顿号隔开，如：辣、下饭" oninput="adminState.editDish.tags = this.value" />
    </div>
    <div class="edit-field edit-field-row">
      <span class="edit-label">🌟 拿手菜</span>
      <label><input type="checkbox" ${ed.isSignature ? 'checked' : ''} onchange="adminState.editDish.isSignature = this.checked" /> 是</label>
    </div>
  `
}

function onDishCategoryChange(index) {
  const cat = adminState.categories[parseInt(index)]
  if (cat) { adminState.editDish.categoryId = cat._id; adminState.editDishCategoryIndex = parseInt(index) }
}

function saveDish() {
  const dish = adminState.editDish
  if (!dish.name) { showToast('请输入菜名~'); return }

  const dishData = {
    name: dish.name, emoji: dish.emoji || '🍽️', description: dish.description || '',
    categoryId: dish.categoryId || '', price: dish.price || '',
    cookTime: parseInt(dish.cookTime) || 0, difficulty: dish.difficulty || 0,
    tags: dish.tags ? dish.tags.split(/[、,，\s]+/).filter(t => t) : [],
    isSignature: dish.isSignature || false
  }

  if (adminState.isNewDish) {
    addDish(dishData)
    showToast('已添加', '🎉')
  } else {
    updateDish(dish._id, dishData)
    showToast('已更新', '✅')
  }
  closeDishEdit()
  loadAdminDishes()
}

function adminDeleteDish(id) {
  if (!confirm('确定要删除这个菜吗？')) return
  window.dataDeleteDish(id)
  showToast('已删除', '🗑️')
  loadAdminDishes()
}

function closeDishEdit() {
  adminState.showDishEdit = false
  const mask = document.getElementById('dish-edit-mask')
  const modal = document.getElementById('dish-edit-modal')
  if (modal) { modal.classList.remove('edit-modal-show'); setTimeout(() => modal.style.display = 'none', 350) }
  if (mask) mask.style.display = 'none'
}

// Categories
function renderAdminCategories(container) {
  const cats = adminState.categories
  container.innerHTML = `
    <div class="admin-toolbar">
      <span class="admin-count">共 ${cats.length} 个分类</span>
      <div class="btn btn-primary btn-small" onclick="newCategory()">+ 添加分类</div>
    </div>
    <div class="admin-list">
      ${cats.map(c => `
        <div class="admin-list-item">
          <span class="admin-item-emoji">${c.emoji || '📂'}</span>
          <div class="admin-item-info">
            <span class="admin-item-name">${c.name}</span>
          </div>
          <div class="admin-item-actions">
            <span class="admin-action-edit" onclick="editCategory('${c._id}')">✏️</span>
            <span class="admin-action-del" onclick="adminDeleteCategory('${c._id}')">🗑️</span>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function newCategory() {
  adminState.isNewCategory = true
  adminState.editCategory = { name: '', emoji: '📂' }
  document.getElementById('category-edit-title').textContent = '添加分类'
  document.getElementById('category-edit-fields').innerHTML = `
    <div class="edit-field">
      <span class="edit-label">Emoji</span>
      <input class="edit-input" oninput="adminState.editCategory.emoji = this.value" />
    </div>
    <div class="edit-field">
      <span class="edit-label">分类名 *</span>
      <input class="edit-input" oninput="adminState.editCategory.name = this.value" />
    </div>
  `
  const mask = document.getElementById('category-edit-mask')
  const modal = document.getElementById('category-edit-modal')
  if (mask) mask.style.display = ''
  if (modal) { modal.style.display = ''; setTimeout(() => modal.classList.add('edit-modal-show'), 10) }
}

function editCategory(id) {
  const cat = adminState.categories.find(c => c._id === id)
  if (!cat) { showToast('没有找到这个分类~'); return }
  adminState.isNewCategory = false
  adminState.editCategory = { _id: cat._id, name: cat.name, emoji: cat.emoji || '📂' }
  document.getElementById('category-edit-title').textContent = '编辑分类'
  document.getElementById('category-edit-fields').innerHTML = `
    <div class="edit-field">
      <span class="edit-label">Emoji</span>
      <input class="edit-input" value="${cat.emoji || ''}" oninput="adminState.editCategory.emoji = this.value" />
    </div>
    <div class="edit-field">
      <span class="edit-label">分类名 *</span>
      <input class="edit-input" value="${cat.name}" oninput="adminState.editCategory.name = this.value" />
    </div>
  `
  const mask = document.getElementById('category-edit-mask')
  const modal = document.getElementById('category-edit-modal')
  if (mask) mask.style.display = ''
  if (modal) { modal.style.display = ''; setTimeout(() => modal.classList.add('edit-modal-show'), 10) }
}

function saveCategory() {
  const cat = adminState.editCategory
  if (!cat.name) { showToast('请输入分类名~'); return }
  if (adminState.isNewCategory) {
    addCategory({ name: cat.name, emoji: cat.emoji || '📂' })
    showToast('已添加', '🎉')
  } else {
    updateCategory(cat._id, { name: cat.name, emoji: cat.emoji || '📂' })
    showToast('已更新', '✅')
  }
  closeCategoryEdit()
  loadAdminCategories()
  loadAdminAllDishes()
}

function adminDeleteCategory(id) {
  if (!confirm('确定要删除这个分类吗？（菜品不会被删除）')) return
  dataDeleteCategory(id)
  showToast('已删除', '🗑️')
  loadAdminCategories()
}

function closeCategoryEdit() {
  const mask = document.getElementById('category-edit-mask')
  const modal = document.getElementById('category-edit-modal')
  if (modal) { modal.classList.remove('edit-modal-show'); setTimeout(() => modal.style.display = 'none', 350) }
  if (mask) mask.style.display = 'none'
}

// Orders tab
function renderAdminOrders(container) {
  const orders = adminState.orders
  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-emoji">📭</span><span class="empty-text">还没有订单~</span></div>'
    return
  }
  container.innerHTML = `
    <div class="admin-toolbar"><span class="admin-count">共 ${orders.length} 个订单</span></div>
    <div class="admin-list">
      ${orders.map(o => `
        <div class="admin-order-card card">
          <div class="admin-order-header">
            <span class="admin-order-time">${formatTime(o.createdAt)}</span>
            <span class="tag ${getStatusTag(o.status)}">${getStatusText(o.status)}</span>
          </div>
          <div class="admin-order-items">
            ${(o.items || []).map(item => `<span class="admin-order-item">${item.emoji} ${item.name}×${item.quantity}</span>`).join('')}
          </div>
          ${o.note ? `<div class="admin-order-note">💬 ${o.note}</div>` : ''}
          ${o.photoPath ? `<div class="admin-order-photo"><img src="${o.photoPath}" /></div>` : ''}
          ${(o.status === 'pending' || o.status === 'cooking') ? `
            <div class="admin-order-actions">
              ${o.status === 'pending' ? `<div class="btn btn-small btn-outline" onclick="updateStatus('${o._id}','cooking')">🍳 开始做</div>` : ''}
              ${o.status === 'cooking' ? `<div class="btn btn-small btn-outline" onclick="uploadPhoto('${o._id}')">📸 上传成品</div>` : ''}
              ${o.status === 'cooking' ? `<div class="btn btn-small btn-outline" onclick="updateStatus('${o._id}','done')">✅ 做好了</div>` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `
}

function updateStatus(orderId, status) {
  updateOrderStatus(orderId, status)
  if (status === 'cooking') showToast('已接单', '🍳')
  else if (status === 'done') {
    showToast('已做好', '✅')
    const db = getDB()
    const order = db.orders.find(o => o._id === orderId)
    if (order) {
      localStorage.setItem('web_order_ready', JSON.stringify({
        orderId, readyAt: new Date().toISOString(),
        items: order.items.map(i => ({ emoji: i.emoji, name: i.name, quantity: i.quantity }))
      }))
    }
  }
  loadAdminOrders()
}

function uploadPhoto(orderId) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const db = getDB()
      const order = db.orders.find(o => o._id === orderId)
      if (order) {
        order.photoPath = ev.target.result
        saveDB(db)
        showToast('📸 照片已保存')
        loadAdminOrders()
      }
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

// Special
function renderAdminSpecial(container) {
  const allDishes = adminState.allDishes
  const map = adminState.dailySpecialMap

  const toggleHtml = allDishes.map(d => `
    <div class="special-dish-item">
      <input type="checkbox" ${map[d._id] ? 'checked' : ''} onchange="toggleDailySpecial('${d._id}')" />
      <span class="special-dish-emoji">${d.emoji || '🍽️'}</span>
      <span class="special-dish-name">${d.name}</span>
    </div>
  `).join('')

  container.innerHTML = `
    <div class="admin-toolbar">
      <span class="admin-count">🍱 今日精选套餐</span>
      <div class="btn btn-primary btn-small" onclick="saveDailySpecial()">保存精选</div>
    </div>
    <span class="admin-hint">选 2-4 道菜，组成今日推荐套餐，putato 首页会看到</span>
    <div class="special-dish-list">
      ${toggleHtml}
    </div>
  `
}

function toggleDailySpecial(id) {
  const ids = [...adminState.dailySpecialIds]
  const map = { ...adminState.dailySpecialMap }
  const idx = ids.indexOf(id)
  if (idx > -1) {
    ids.splice(idx, 1); delete map[id]
  } else {
    if (ids.length >= 4) { showToast('精选套餐最多4道菜~'); return }
    ids.push(id); map[id] = true
  }
  adminState.dailySpecialIds = ids
  adminState.dailySpecialMap = map
}

function saveDailySpecial() {
  const ids = adminState.dailySpecialIds
  if (ids.length < 2) { showToast('至少选 2 道菜~'); return }
  localStorage.setItem('web_daily_special', JSON.stringify({ dishIds: ids, updatedAt: new Date().toISOString() }))
  showToast('精选套餐已保存', '🍱')
}

function adminInitMenuData() {
  if (!confirm('将初始化示例菜单数据，确定吗？')) return
  const result = dataInitMenuData()
  showToast(`已初始化 ${result.categories} 个分类，${result.dishes} 道菜`, '🎉')
  loadAdminData()
  loadDailySpecial()
}

// Admin global functions
window.unlock = unlock
window.switchAdminTab = switchAdminTab
window.newDish = newDish
window.editDish = editDish
window.saveDish = saveDish
window.adminDeleteDish = adminDeleteDish
window.closeDishEdit = closeDishEdit
window.onDishCategoryChange = onDishCategoryChange
window.newCategory = newCategory
window.editCategory = editCategory
window.saveCategory = saveCategory
window.adminDeleteCategory = adminDeleteCategory
window.closeCategoryEdit = closeCategoryEdit
window.updateStatus = updateStatus
window.uploadPhoto = uploadPhoto
window.toggleDailySpecial = toggleDailySpecial
window.saveDailySpecial = saveDailySpecial
window.adminInitMenuData = adminInitMenuData
window.showOrderDetail = showOrderDetail
window.closeOrderDetail = closeOrderDetail
window.reorder = reorder
window.rateOrder = rateOrder

// ==========================================
// REPORT PAGE
// ==========================================

function renderReport(container) {
  const orders = getOrders()
  const db = getDB()
  const dishes = db.dishes
  const doneOrders = orders.filter(o => o.status === 'done')

  const report = {
    year: new Date().getFullYear(),
    totalOrders: doneOrders.length,
    totalDishes: doneOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
    praiseCount: doneOrders.filter(o => o.rating && o.rating.score >= 4).length,
    gogoPraise: doneOrders.filter(o => o.rating && o.rating.comment).length,
    putatoFavorites: [],
    gogoMostCooked: [],
    bestRatedDish: null,
    progress: -1,
    progressText: '',
    monthlyHeatmap: []
  }

  const dishCount = {}
  doneOrders.forEach(o => { o.items.forEach(item => {
    const key = item.dishId || item.name
    if (!dishCount[key]) dishCount[key] = { name: item.name, emoji: item.emoji || '🍽️', count: 0 }
    dishCount[key].count += item.quantity
  })})
  report.putatoFavorites = Object.values(dishCount).sort((a, b) => b.count - a.count).slice(0, 5)

  const cookCount = {}
  doneOrders.forEach(o => { o.items.forEach(item => {
    const key = item.dishId || item.name
    if (!cookCount[key]) cookCount[key] = { name: item.name, emoji: item.emoji || '🍽️', count: 0 }
    cookCount[key].count += item.quantity
  })})
  report.gogoMostCooked = Object.values(cookCount).sort((a, b) => b.count - a.count).slice(0, 5)

  const rated = dishes.filter(d => d.totalRatings > 0 && d.avgRating > 0).sort((a, b) => b.avgRating - a.avgRating)
  if (rated.length > 0) report.bestRatedDish = rated[0]

  const firstHalf = doneOrders.slice(Math.floor(doneOrders.length / 2))
  const secondHalf = doneOrders.slice(0, Math.floor(doneOrders.length / 2))
  const avgScore = (list) => { const r = list.filter(o => o.rating && o.rating.score); return r.length === 0 ? 0 : r.reduce((s, o) => s + o.rating.score, 0) / r.length }
  const firstAvg = avgScore(firstHalf)
  const secondAvg = avgScore(secondHalf)
  if (firstAvg > 0 && secondAvg > 0) {
    const p = Math.round((secondAvg - firstAvg) * 10) / 10
    report.progress = p
    report.progressText = p > 0 ? `狗狗 今年进步了 ${p} 分！从 ${firstAvg.toFixed(1)} 分到 ${secondAvg.toFixed(1)} 分 🎉` : `狗狗 稳定发挥，平均分 ${secondAvg.toFixed(1)} 分 👏`
  }

  const monthMap = {}
  for (let m = 1; m <= 12; m++) monthMap[m] = 0
  doneOrders.forEach(o => { const d = new Date(o.createdAt); const m = d.getMonth() + 1; if (monthMap[m] !== undefined) monthMap[m]++ })
  const maxCount = Math.max(...Object.values(monthMap), 1)
  report.monthlyHeatmap = Object.entries(monthMap).map(([month, count]) => ({ month, count, height: Math.max(10, (count / maxCount) * 40) }))

  container.innerHTML = `
    <div class="report-page">
      <div class="report-header">
        <div class="report-header-bg"></div>
        <span class="report-back" onclick="navigateTo('orders')">← 📋 订单</span>
        <span class="report-title">📊 美食报告</span>
        <span class="report-year">${report.year}</span>
      </div>
      <div class="report-body">
        <div class="report-section">
          <span class="section-title">📊 年度总览</span>
          <div class="stat-cards">
            <div class="stat-card"><span class="stat-num">${report.totalOrders}</span><span class="stat-label">次下单</span></div>
            <div class="stat-card"><span class="stat-num">${report.totalDishes}</span><span class="stat-label">道菜</span></div>
            <div class="stat-card"><span class="stat-num">${report.praiseCount}</span><span class="stat-label">次好评</span></div>
            <div class="stat-card"><span class="stat-num">${report.gogoPraise}</span><span class="stat-label">次夸狗狗</span></div>
          </div>
        </div>
        ${report.putatoFavorites.length > 0 ? `
          <div class="report-section">
            <span class="section-title">🏆 putato 最爱点的</span>
            <div class="rank-list">
              ${report.putatoFavorites.map((item, i) => `
                <div class="rank-item">
                  <span class="rank-num">${i + 1}</span>
                  <span class="rank-emoji">${item.emoji}</span>
                  <span class="rank-name">${item.name}</span>
                  <span class="rank-count">×${item.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${report.gogoMostCooked.length > 0 ? `
          <div class="report-section">
            <span class="section-title">👨‍🍳 狗狗 最常做的</span>
            <div class="rank-list">
              ${report.gogoMostCooked.map((item, i) => `
                <div class="rank-item">
                  <span class="rank-num">${i + 1}</span>
                  <span class="rank-emoji">${item.emoji}</span>
                  <span class="rank-name">${item.name}</span>
                  <span class="rank-count">×${item.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div class="report-section highlight-section">
          <span class="section-title">🌟 狗狗 的高光时刻</span>
          ${report.bestRatedDish ? `
            <div class="highlight-card">
              <span class="highlight-label">🏅 最高分菜</span>
              <span class="highlight-value">${report.bestRatedDish.emoji} ${report.bestRatedDish.name}（${report.bestRatedDish.avgRating ? report.bestRatedDish.avgRating.toFixed(1) : '0.0'}分）</span>
            </div>
          ` : ''}
          ${report.progress >= 0 ? `
            <div class="highlight-card">
              <span class="highlight-label">📈 厨艺进步</span>
              <span class="highlight-value">${report.progressText}</span>
            </div>
          ` : ''}
          <div class="highlight-card">
            <span class="highlight-label">❤️ 爱的下厨</span>
            <span class="highlight-value">${report.totalOrders} 次下单，${report.totalDishes} 道菜</span>
          </div>
        </div>
        <div class="report-section">
          <span class="section-title">📅 月度下厨热力图</span>
          <div class="heatmap">
            ${report.monthlyHeatmap.map(m => `
              <div class="heatmap-item">
                <div class="heatmap-bar" style="height:${m.height}px">
                  ${m.count > 0 ? `<span class="heatmap-count">${m.count}</span>` : ''}
                </div>
                <span class="heatmap-month">${m.month}月</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="report-footer">
          <span class="footer-heart">💕</span>
          <span class="footer-text">每一顿饭，都是爱的味道</span>
          <span class="footer-sub">期待下一年，一起吃更多好吃的~</span>
        </div>
      </div>
    </div>
  `
}

// ==========================================
// INIT
// ==========================================

window.addEventListener('hashchange', render)
window.addEventListener('load', render)
