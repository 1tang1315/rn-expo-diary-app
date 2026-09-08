/** 饮食记录子类型 */
const DIET_RECORD_TYPES = {
  MEAL: 'meal',
  SNACK: 'snack',
  BEVERAGE: 'beverage',
  FRUIT: 'fruit',
  WATER: 'water',
};

const DIET_RECORD_TYPE_OPTIONS = [
  { id: DIET_RECORD_TYPES.MEAL, label: '正餐', emoji: '🍽️' },
  { id: DIET_RECORD_TYPES.SNACK, label: '零食', emoji: '🍿' },
  { id: DIET_RECORD_TYPES.BEVERAGE, label: '饮料', emoji: '🥤' },
  { id: DIET_RECORD_TYPES.FRUIT, label: '水果', emoji: '🍎' },
  { id: DIET_RECORD_TYPES.WATER, label: '喝水', emoji: '💧' },
];

const MEAL_SLOTS = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
};

const MEAL_SLOT_OPTIONS = [
  { id: MEAL_SLOTS.BREAKFAST, label: '早餐' },
  { id: MEAL_SLOTS.LUNCH, label: '午餐' },
  { id: MEAL_SLOTS.DINNER, label: '晚餐' },
];

const WATER_MODES = {
  SIP: 'sip',
  BOTTLE: 'bottle',
};

const WATER_MODE_OPTIONS = [
  { id: WATER_MODES.SIP, label: '喝几口', hint: '记一个时刻' },
  { id: WATER_MODES.BOTTLE, label: '喝完一瓶', hint: '记开始~结束' },
];

const DEFAULT_WATER_CONTAINERS = [
  { id: 'cup-300', name: '水杯', volumeMl: 300 },
  { id: 'bottle-500', name: '水瓶', volumeMl: 500 },
];

const WATER_CONTAINERS_STORAGE_KEY = 'water_containers';

const MEAL_SLOT_ICONS = {
  [MEAL_SLOTS.BREAKFAST]: 'breakfast-dining',
  [MEAL_SLOTS.LUNCH]: 'lunch-dining',
  [MEAL_SLOTS.DINNER]: 'dinner-dining',
};

const RECORD_TYPE_ICONS = {
  [DIET_RECORD_TYPES.MEAL]: 'restaurant',
  [DIET_RECORD_TYPES.SNACK]: 'fastfood',
  [DIET_RECORD_TYPES.BEVERAGE]: 'local-drink',
  [DIET_RECORD_TYPES.FRUIT]: 'emoji-food-beverage',
  [DIET_RECORD_TYPES.WATER]: 'water-drop',
};

module.exports = {
  DIET_RECORD_TYPES,
  DIET_RECORD_TYPE_OPTIONS,
  MEAL_SLOTS,
  MEAL_SLOT_OPTIONS,
  WATER_MODES,
  WATER_MODE_OPTIONS,
  DEFAULT_WATER_CONTAINERS,
  WATER_CONTAINERS_STORAGE_KEY,
  MEAL_SLOT_ICONS,
  RECORD_TYPE_ICONS,
};
module.exports.default = module.exports;
