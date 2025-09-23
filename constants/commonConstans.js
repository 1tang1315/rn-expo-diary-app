// 分类与图标列表（固定配置）
export const categories = [
  { id: 'all', name: '全部', icon: 'view-list', isFixed: true },
  { id: 'daily', name: '日常', icon: 'access-time' },
  { id: 'work', name: '工作', icon: 'work' },
  { id: 'study', name: '学习', icon: 'book' },
  { id: 'entertainment', name: '娱乐', icon: 'gamepad' },
  { id: 'sports', name: '运动健康', icon: 'fitness-center' },
  { id: 'sleep', name: '睡眠', icon: 'bed' },
  { id: 'diet', name: '饮食', icon: 'restaurant' },
  { id: 'shopping', name: '购物', icon: 'shopping-cart' },
  { id: 'travel', name: '出行', icon: 'flight' }
];

// 事件图标选择（按分类划分）
export const categoryIcons = {
  daily: [
    'access-time', 'face', 'bathtub', 'bathroom', 'local-laundry-service',
    'cleaning-services', 'home', 'air', 'child-care', 'pets', 'smoke-free',
    'free-breakfast', 'mood', 'sentiment-very-satisfied'
  ],
  work: [
    'work', 'meeting-room', 'file-copy', 'task', 'business', 'call',
    'email', 'present-to-all', 'group', 'laptop', 'print', 'event-available', 'logout'
  ],
  study: [
    'book', 'school', 'code', 'quiz', 'library-books', 'edit',
    'record-voice-over', 'ondemand-video', 'assignment', 'language', 'lightbulb', 'grade'
  ],
  entertainment: [
    'gamepad', 'movie', 'music-note', 'sports-esports', 'party-mode',
    'photo-camera', 'tv', 'newspaper', 'book-online', 'videogame-asset', 'pool'
  ],
  sports: [
    'fitness-center', 'directions-run', 'pool', 'sports-tennis', 'self-improvement',
    'directions-bike', 'sports-golf', 'directions-walk', 'medication', 'spa'
  ],
  sleep: [
    'bed', 'nightlight', 'do-not-disturb', 'hotel', 'schedule', 'alarm',
    'brightness-3', 'brightness-5'
  ],
  diet: [
    'breakfast-dining', 'lunch-dining', 'dinner-dining', 'restaurant', 'fastfood',
    'emoji-food-beverage', 'water-drop', 'local-drink', 'coffee', 'liquor', 'cake', 'icecream'
  ],
  shopping: [
    'shopping-cart', 'local-mall', 'shopping-bag', 'attach-money', 'store',
    'local-grocery-store', 'fastfood', 'local-cafe', 'local-drink', 'add-shopping-cart', 'paid'
  ],
  travel: [
    'flight', 'directions-car', 'train', 'navigation', 'subway',
    'directions-bike', 'directions-walk', 'hotel', 'local-gas-station'
  ]
};

// 图表随机颜色
export const statisticsColors = [
  "#3498db", "#2ecc71", "#9b59b6", "#f1c40f",
  "#e74c3c", "#34495e", "#1abc9c", "#e67e22",
  "#16a085", "#f39c12", "#d35400", "#c0392b"
];

// 状态颜色映射
export const statusColors = {
  early: '#9E9E9E',        // 时间还早
  upcoming: '#4CAF50',     // 即将开始
  inProgress: '#FF9800',   // 进行中
  completed: '#2196F3',    // 已完成
  notCompleted: '#F44336', // 未完成
};

// 状态文本映射
export const statusTextMap = {
  upcoming: '即将开始',
  inProgress: '进行中',
  completed: '已完成',
  notCompleted: '未完成',
  early: '时间还早着呢~'
};