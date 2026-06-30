// 📦 数据层 - 使用 localStorage 代替 wx.setStorageSync
const MOCK_KEY = 'cute_order_db'

// ===== 种子数据 =====
const SEED_CATEGORIES = [
  { _id: 'cat_1', name: '荤菜', emoji: '🥩', sortOrder: 1 },
  { _id: 'cat_2', name: '素菜', emoji: '🥬', sortOrder: 2 },
  { _id: 'cat_3', name: '汤羹', emoji: '🍲', sortOrder: 3 },
  { _id: 'cat_4', name: '主食', emoji: '🍜', sortOrder: 4 },
  { _id: 'cat_5', name: '甜品', emoji: '🍰', sortOrder: 5 },
  { _id: 'cat_6', name: '饮品', emoji: '🥤', sortOrder: 6 },
]

const SEED_DISHES = (() => {
  let id = 0
  const d = (catId, name, emoji, desc, price = 0, cookTime = 0, difficulty = 0, tags = []) => ({
    _id: `dish_${++id}`, name, emoji, description: desc,
    categoryId: catId, price, sortOrder: id, cookTime, difficulty, tags,
    isSignature: false, totalCooked: 0, totalRatings: 0, avgRating: 0, bestNote: ''
  })

  return [
    d('cat_1', '番茄牛腩',     '🍅', '浓郁番茄汤底，软烂牛腩，配饭一绝', 38, 60, 2, ['下饭', '酸甜', '浓郁']),
    d('cat_1', '可乐鸡翅',     '🥤', '甜香入味，鸡翅嫩滑，putato最爱', 28, 30, 1, ['甜香', '嫩滑', '快手']),
    d('cat_1', '糖醋排骨',     '🍖', '酸甜可口，外酥里嫩', 42, 40, 2, ['酸甜', '下饭', '外酥里嫩']),
    d('cat_1', '宫保鸡丁',     '🌶️', '花生脆香，鸡肉嫩滑，微微辣', 32, 25, 2, ['微辣', '下饭', '快手']),
    d('cat_1', '红烧肉',       '🥩', '肥而不腻，入口即化，配上卤蛋', 45, 90, 2, ['浓郁', '下饭', '肥而不腻']),
    d('cat_1', '黑椒牛柳',     '🐮', '嫩滑牛肉配黑椒汁，西餐中做', 48, 20, 1, ['黑椒', '嫩滑', '快手']),
    d('cat_1', '蒜香排骨',     '🦴', '蒜香四溢，外焦里嫩', 38, 45, 2, ['蒜香', '外焦里嫩']),
    d('cat_1', '葱爆羊肉',     '🐑', '葱香扑鼻，羊肉鲜嫩不膻', 42, 15, 1, ['葱香', '嫩滑', '快手']),
    d('cat_1', '红烧猪蹄',     '🐷', '软糯Q弹，满满的胶原蛋白', 36, 90, 2, ['软糯', '浓郁', 'Q弹']),
    d('cat_1', '酱香大骨',     '🦴', '酱香浓郁，大口吃肉超满足', 52, 90, 2, ['酱香', '浓郁']),
    d('cat_1', '麻辣水煮鱼',   '🐟', '麻辣鲜香，鱼片嫩滑入味', 48, 30, 3, ['麻辣', '鲜香', '嫩滑']),
    d('cat_1', '牙签牛肉',     '🥩', '一口一个，香辣过瘾', 32, 30, 2, ['香辣', '下饭']),
    d('cat_1', '回锅肉',       '🥓', '肥瘦相间，蒜苗飘香', 34, 25, 2, ['香辣', '下饭']),
    d('cat_1', '啤酒鸭',       '🦆', '啤酒焖煮，鸭肉酥烂不腥', 42, 50, 2, ['浓郁', '入味']),
    d('cat_1', '椒盐皮皮虾',   '🦐', '外壳酥脆，虾肉鲜甜', 58, 30, 3, ['酥脆', '鲜甜', '椒盐']),
    d('cat_1', '剁椒鱼头',     '🐟', '剁椒鲜辣，鱼头嫩滑', 52, 25, 2, ['鲜辣', '嫩滑']),
    d('cat_1', '叉烧肉',       '🥩', '蜜汁香甜，外焦里嫩', 36, 60, 2, ['蜜汁', '香甜', '外焦里嫩']),
    d('cat_1', '酱牛肉',       '🐂', '卤香浓郁，切片下酒绝配', 38, 120, 2, ['酱香', '浓郁']),
    d('cat_1', '干锅肥肠',     '🌶️', '肥肠Q弹，香辣入味', 42, 30, 3, ['香辣', 'Q弹']),
    d('cat_1', '蜜汁烧鸡',     '🍗', '蜜汁刷面，皮脆肉嫩', 35, 50, 2, ['蜜汁', '皮脆肉嫩']),
    d('cat_1', '鱼香肉丝',     '🥢', '酸甜微辣，下饭神器', 28, 20, 1, ['酸甜', '微辣', '下饭', '快手']),
    d('cat_1', '红烧狮子头',   '🧆', '个大肉嫩，酱汁浓郁', 38, 45, 2, ['浓郁', '下饭']),
    d('cat_2', '西红柿炒蛋',   '🍳', '经典家常菜，酸甜嫩滑', 18, 10, 1, ['酸甜', '嫩滑', '快手']),
    d('cat_2', '地三鲜',       '🥔', '茄子土豆青椒，酱香浓郁', 22, 20, 1, ['酱香', '下饭']),
    d('cat_2', '蒜蓉西兰花',   '🥦', '清脆爽口，蒜香扑鼻', 20, 10, 1, ['清脆', '蒜香', '快手']),
    d('cat_2', '麻婆豆腐',     '🫘', '麻辣鲜香，下饭神器', 18, 15, 1, ['麻辣', '下饭', '快手']),
    d('cat_2', '干煸四季豆',   '🫛', '干香微辣，越嚼越香', 22, 15, 1, ['干香', '微辣']),
    d('cat_2', '凉拌黄瓜',     '🥒', '清爽解腻，夏日必备', 14, 10, 1, ['清爽', '凉菜', '快手']),
    d('cat_2', '虎皮青椒',     '🫑', '煎出虎皮，酱汁入味', 16, 15, 1, ['微辣', '下饭', '快手']),
    d('cat_2', '蚝油生菜',     '🥬', '脆嫩爽口，蚝油提鲜', 16, 5, 1, ['脆嫩', '快手']),
    d('cat_2', '蒜蓉空心菜',   '🥗', '清炒脆嫩，蒜香四溢', 16, 8, 1, ['脆嫩', '蒜香', '快手']),
    d('cat_2', '酸辣土豆丝',   '🥔', '酸辣开胃，脆爽可口', 15, 12, 1, ['酸辣', '脆爽', '快手']),
    d('cat_2', '松仁玉米',     '🌽', '香甜松仁，玉米清甜', 22, 10, 1, ['清甜', '香甜', '快手']),
    d('cat_2', '糖拌西红柿',   '🍅', '冰镇爽口，儿时味道', 12, 5, 1, ['清甜', '凉菜', '快手']),
    d('cat_2', '家常豆腐',     '🫘', '煎至金黄，酱汁入味', 20, 15, 1, ['酱香', '下饭']),
    d('cat_2', '酸辣白菜',     '🥬', '酸辣脆嫩，简单下饭', 14, 10, 1, ['酸辣', '脆嫩', '快手']),
    d('cat_2', '素炒豆苗',     '🌱', '清脆鲜嫩，清淡爽口', 18, 8, 1, ['清脆', '清淡', '快手']),
    d('cat_2', '红烧茄子',     '🍆', '软糯入味，酱香浓郁', 20, 15, 1, ['软糯', '酱香']),
    d('cat_2', '手撕包菜',     '🥬', '干锅风味，脆嫩微辣', 18, 10, 1, ['脆嫩', '微辣', '快手']),
    d('cat_2', '蒜蓉秋葵',     '🫒', '滑嫩爽口，营养健康', 22, 10, 1, ['滑嫩', '清爽', '快手']),
    d('cat_3', '紫菜蛋花汤',   '🥣', '清淡鲜美，暖胃首选', 12, 10, 1, ['清淡', '鲜美', '快手']),
    d('cat_3', '番茄蛋汤',     '🍅', '酸甜开胃，putato喜欢', 14, 10, 1, ['酸甜', '开胃', '快手']),
    d('cat_3', '玉米排骨汤',   '🌽', '清甜浓郁，炖出骨胶原', 32, 90, 2, ['清甜', '浓郁']),
    d('cat_3', '鲫鱼豆腐汤',   '🐟', '奶白鱼汤，鲜香嫩滑', 28, 30, 2, ['鲜香', '嫩滑']),
    d('cat_3', '酸辣汤',       '🥘', '酸辣开胃，料足味浓', 16, 15, 1, ['酸辣', '开胃']),
    d('cat_3', '冬瓜薏米汤',   '🫒', '清润祛湿，温润好喝', 18, 30, 2, ['清淡', '清润']),
    d('cat_3', '南瓜浓汤',     '🎃', '绵密香甜，暖胃暖心', 16, 20, 1, ['香甜', '绵密']),
    d('cat_3', '莲藕排骨汤',   '🪷', '粉糯莲藕，骨汤浓郁', 32, 90, 2, ['浓郁', '粉糯']),
    d('cat_3', '菌菇豆腐汤',   '🍄', '菌菇鲜美，豆腐嫩滑', 20, 15, 1, ['鲜美', '清淡']),
    d('cat_3', '绿豆汤',       '🫘', '清热解暑，夏日必备', 10, 30, 1, ['清甜', '清爽']),
    d('cat_3', '罗宋汤',       '🥫', '酸甜浓郁，牛肉蔬菜满满', 26, 60, 2, ['酸甜', '浓郁']),
    d('cat_3', '鸡汤',         '🐔', '原汁原味，鲜香滋补', 28, 120, 2, ['鲜香', '浓郁']),
    d('cat_4', '蛋炒饭',       '🍚', '粒粒分明，简单但好吃', 15, 10, 1, ['快手', '经典']),
    d('cat_4', '葱油拌面',     '🍜', '葱香四溢，简单美味', 14, 10, 1, ['葱香', '快手']),
    d('cat_4', '手工水饺',     '🥟', '皮薄馅大，猪肉白菜馅', 22, 40, 2, ['经典', '皮薄馅大']),
    d('cat_4', '番茄意面',     '🍝', '酸甜番茄酱配意大利面', 24, 20, 1, ['酸甜', '快手']),
    d('cat_4', '红烧牛腩面',   '🐂', '浓汤牛腩，面条筋道', 28, 15, 1, ['浓郁', '下饭']),
    d('cat_4', '咖喱鸡肉饭',   '🍛', '浓郁咖喱，鸡肉土豆', 26, 25, 2, ['浓郁', '下饭']),
    d('cat_4', '日式拉面',     '🍜', '叉烧溏心蛋，浓汤拉面', 30, 20, 2, ['浓郁', '经典']),
    d('cat_4', '烤面包',       '🍞', '外酥里软，早餐首选', 10, 10, 1, ['酥脆', '快手']),
    d('cat_4', '扬州炒饭',     '🍚', '虾仁火腿，粒粒飘香', 22, 15, 2, ['经典', '鲜香']),
    d('cat_4', '酸辣粉',       '🍜', '酸辣爽滑，嗦粉快乐', 18, 10, 1, ['酸辣', '爽滑']),
    d('cat_4', '炒河粉',       '🍜', '干炒牛河，镬气十足', 20, 10, 2, ['鲜香', '经典']),
    d('cat_4', '煎饺',         '🥟', '底部金黄，鲜嫩多汁', 20, 15, 1, ['酥脆', '鲜嫩']),
    d('cat_4', '鸡汤馄饨',     '🥟', '鸡汤鲜美，馄饨皮薄馅嫩', 18, 15, 1, ['鲜美', '清淡']),
    d('cat_4', '肉夹馍',       '🥙', '馍酥肉香，一口满足', 16, 15, 2, ['酥脆', '酱香']),
    d('cat_4', '炸酱面',       '🍝', '老北京炸酱，面条筋道', 20, 20, 1, ['酱香', '经典']),
    d('cat_4', '泡菜炒饭',     '🍛', '泡菜酸辣，开胃爽口', 18, 10, 1, ['酸辣', '开胃', '快手']),
    d('cat_4', '热干面',       '🍜', '芝麻酱香，武汉味道', 16, 10, 1, ['酱香', '快手']),
    d('cat_4', '煲仔饭',       '🍚', '锅巴焦香，腊味浓郁', 26, 30, 3, ['焦香', '浓郁']),
    d('cat_5', '芒果布丁',     '🥭', '芒果香甜，布丁嫩滑', 18, 15, 1, ['香甜', '嫩滑']),
    d('cat_5', '双皮奶',       '🍮', '奶香浓郁，滑嫩如丝', 16, 30, 1, ['奶香', '滑嫩']),
    d('cat_5', '蛋挞',         '🥧', '酥脆外皮，嫩滑蛋奶馅', 12, 25, 2, ['酥脆', '嫩滑']),
    d('cat_5', '红豆沙',       '🫘', '绵密细腻，暖胃甜蜜', 14, 30, 1, ['绵密', '香甜']),
    d('cat_5', '红糖糍粑',     '🍡', '外酥里糯，红糖飘香', 18, 15, 2, ['酥脆', '软糯']),
    d('cat_5', '草莓酸奶',     '🍓', '酸甜清爽，饭后解腻', 14, 5, 1, ['酸甜', '清爽', '快手']),
    d('cat_5', '芒果糯米饭',   '🥭', '芒果清甜，糯米软糯', 22, 25, 1, ['清甜', '软糯']),
    d('cat_5', '焦糖布丁',     '🍮', '焦糖微苦，布丁丝滑', 16, 30, 2, ['香甜', '滑嫩']),
    d('cat_5', '雪媚娘',       '🍰', '外皮软糯，奶油轻盈', 18, 30, 2, ['软糯', '清甜']),
    d('cat_5', '芋圆仙草',     '🧋', 'Q弹芋圆，清凉仙草', 20, 20, 1, ['Q弹', '清甜']),
    d('cat_5', '提拉米苏',     '🍰', '浓郁咖啡味，入口即化', 28, 30, 3, ['浓郁', '入口即化']),
    d('cat_5', '水果蛋糕',     '🎂', '新鲜水果，奶油绵密', 32, 60, 3, ['清甜', '绵密']),
    d('cat_5', '冰粉',         '🧊', '冰爽滑嫩，红糖芝麻香', 12, 5, 1, ['冰爽', '滑嫩', '快手']),
    d('cat_5', '烤红薯',       '🍠', '软糯香甜，冬日暖手宝', 10, 40, 1, ['软糯', '香甜']),
    d('cat_5', '糖葫芦',       '🍡', '冰糖外衣，酸甜山楂', 8, 15, 1, ['酸甜', '酥脆']),
    d('cat_6', '红豆奶茶',     '🧋', '丝滑奶茶配软糯红豆', 16, 10, 1, ['香甜', '丝滑']),
    d('cat_6', '鲜榨橙汁',     '🍊', '新鲜现榨，维C满满', 16, 5, 1, ['清爽', '快手']),
    d('cat_6', '冰可乐',       '🥤', '快乐肥宅水，冰镇yyds', 6, 1, 1, ['冰爽', '快手']),
    d('cat_6', '柠檬蜂蜜水',   '🍋', '清爽解渴，美容养颜', 10, 5, 1, ['酸甜', '清爽', '快手']),
    d('cat_6', '热巧克力',     '☕', '浓郁丝滑，暖心暖胃', 14, 5, 1, ['浓郁', '丝滑']),
    d('cat_6', '抹茶拿铁',     '🍵', '抹茶清香，拿铁丝滑', 18, 5, 2, ['清香', '丝滑']),
    d('cat_6', '冰美式',       '☕', '冰爽提神，微苦回甘', 16, 3, 1, ['清爽', '快手']),
    d('cat_6', '西瓜汁',       '🍉', '新鲜西瓜现榨，清甜解暑', 14, 3, 1, ['清甜', '快手']),
    d('cat_6', '柠檬茶',       '🍋', '冰爽柠檬，茶香清新', 12, 5, 1, ['清爽', '快手']),
    d('cat_6', '芒果冰沙',     '🥭', '芒果香甜，冰沙绵密', 20, 8, 1, ['香甜', '冰爽']),
    d('cat_6', '椰汁',         '🥥', '清甜椰汁，解渴健康', 10, 1, 1, ['清甜', '快手']),
    d('cat_6', '奶昔',         '🥤', '奶油香浓，冰凉顺滑', 18, 5, 1, ['香甜', '丝滑']),
    d('cat_6', '酸梅汤',       '🫙', '酸甜解暑，古法熬制', 10, 15, 1, ['酸甜', '清爽']),
    d('cat_6', '百香果绿茶',   '🫖', '百香果酸甜，茶香清爽', 14, 8, 1, ['酸甜', '清爽']),
    d('cat_6', '桂花酒酿',     '🌸', '桂花飘香，酒酿微醺', 16, 10, 1, ['清香', '清甜']),
  ]
})()

// ===== localStorage 操作 =====
function storageGet(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) || def }
  catch { return def }
}
function storageSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

function getDB() {
  let db = storageGet(MOCK_KEY, null)
  if (!db || !db.categories || !db.dishes) {
    db = { categories: [...SEED_CATEGORIES], dishes: [...SEED_DISHES], orders: [] }
    storageSet(MOCK_KEY, db)
  }
  return db
}

function saveDB(db) { storageSet(MOCK_KEY, db) }

// ===== 对外接口 =====
function getCategories() { return getDB().categories }
function getDishes(categoryId) {
  const db = getDB()
  if (categoryId) return db.dishes.filter(d => d.categoryId === categoryId)
  return db.dishes
}
function getOrders() { return getDB().orders }

function addCategory(cat) {
  const db = getDB()
  const _id = 'cat_' + Date.now()
  db.categories.push({ _id, ...cat })
  saveDB(db); return _id
}
function updateCategory(id, data) {
  const db = getDB()
  const idx = db.categories.findIndex(c => c._id === id)
  if (idx > -1) { db.categories[idx] = { ...db.categories[idx], ...data }; saveDB(db); return true }
  return false
}
function deleteCategory(id) {
  const db = getDB(); db.categories = db.categories.filter(c => c._id !== id); saveDB(db); return true
}

function addDish(dish) {
  const db = getDB(); const _id = 'dish_' + Date.now()
  db.dishes.push({ _id, ...dish, totalCooked: 0, totalRatings: 0, avgRating: 0 })
  saveDB(db); return _id
}
function updateDish(id, data) {
  const db = getDB(); const idx = db.dishes.findIndex(d => d._id === id)
  if (idx > -1) { db.dishes[idx] = { ...db.dishes[idx], ...data }; saveDB(db); return true }
  return false
}
function deleteDish(id) {
  const db = getDB(); db.dishes = db.dishes.filter(d => d._id !== id); saveDB(db); return true
}

function placeOrder(items, note) {
  const db = getDB()
  const order = { _id: 'order_' + Date.now(), items, note: note || '', status: 'pending', createdAt: new Date().toISOString(), completedAt: null, cookNote: '', photoPath: '', rating: null }
  db.orders.unshift(order); saveDB(db); return order
}
function updateOrderStatus(orderId, status) {
  const db = getDB(); const idx = db.orders.findIndex(o => o._id === orderId)
  if (idx > -1) { db.orders[idx].status = status; if (status === 'done') db.orders[idx].completedAt = new Date().toISOString(); saveDB(db); return true }
  return false
}

function initMenuData() {
  localStorage.removeItem(MOCK_KEY); const db = getDB()
  return { categories: db.categories.length, dishes: db.dishes.length }
}

function getLoveStats() {
  const stats = storageGet('cute_order_stats', null)
  if (!stats || !stats.firstDate) return null
  const first = new Date(stats.firstDate)
  const now = new Date()
  const days = Math.floor((now - first) / (1000 * 60 * 60 * 24))
  const db = getDB()
  const doneOrders = db.orders.filter(o => o.status === 'done')
  const dishCount = {}
  doneOrders.forEach(o => { o.items.forEach(item => {
    const key = item.dishId
    if (!dishCount[key]) dishCount[key] = { name: item.name, emoji: item.emoji, count: 0 }
    dishCount[key].count += item.quantity
  })})
  const sorted = Object.entries(dishCount).sort((a, b) => b[1].count - a[1].count)
  const topDish = sorted.length > 0 ? sorted[0][1] : null
  const signatureDishes = db.dishes.filter(d => d.isSignature && d.avgRating > 0)
    .sort((a, b) => b.avgRating - a.avgRating).slice(0, 3)
  return { days, orders: doneOrders.length, topDish, signatureDishes }
}

// 统计存储
function getStats() { return storageGet('cute_order_stats', {}) }
function saveStats(s) { storageSet('cute_order_stats', s) }
