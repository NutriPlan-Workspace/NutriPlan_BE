export const getWeekRange = (date: Date) => {
  const dayOfWeek = date.getUTCDay();
  const diffToStartOfWeek = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const diffToEndOfWeek = 7 - dayOfWeek;

  const startOfWeek = new Date(date);
  startOfWeek.setUTCDate(date.getUTCDate() + diffToStartOfWeek);

  const endOfWeek = new Date(date);
  endOfWeek.setUTCDate(date.getUTCDate() + diffToEndOfWeek);

  return { startOfWeek, endOfWeek };
};
