export const sortViewData = (list, sortType) => {
  const arr = [...list];
  
  switch (sortType) {
    case 'name_asc':
      return arr.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
    case 'name_desc':
      return arr.sort((a, b) => b.title.localeCompare(a.title, 'zh-CN'));
    case 'count_asc':
      return arr.sort((a, b) => a.count - b.count);
    case 'count_desc':
      return arr.sort((a, b) => b.count - a.count);
    case 'duration_asc':
      return arr.sort((a, b) => a.totalMinutes - b.totalMinutes);
    case 'duration_desc':
      return arr.sort((a, b) => b.totalMinutes - a.totalMinutes);
    default:
      return arr;
  }
};
