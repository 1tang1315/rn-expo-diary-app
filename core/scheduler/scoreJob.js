import dayjs from 'dayjs';
import { AsyncStorage } from 'expo-sqlite/kv-store';
import { ScoreService } from '@/core/service';

const SCORE_JOB_LAST_RUN_KEY = 'score_job_last_run';
const RUN_HOUR = 0;
const RUN_MINUTE = 10;

export const runDailyScoreJob = async (targetDate = dayjs().subtract(1, 'day')) => {
  const date = dayjs(targetDate).format('YYYY-MM-DD');
  await ScoreService.cacheDailyScore(date);
  return date;
};

export const runScoreJobIfNeeded = async (now = dayjs()) => {
  const today = dayjs(now).format('YYYY-MM-DD');
  const lastRun = await AsyncStorage.getItem(SCORE_JOB_LAST_RUN_KEY);

  const afterSchedule = dayjs(now).hour() > RUN_HOUR
    || (dayjs(now).hour() === RUN_HOUR && dayjs(now).minute() >= RUN_MINUTE);

  if (!afterSchedule || lastRun === today) {
    return { executed: false, reason: 'not_due' };
  }

  const computedDate = await runDailyScoreJob(dayjs(now).subtract(1, 'day'));
  await AsyncStorage.setItem(SCORE_JOB_LAST_RUN_KEY, today);
  return { executed: true, date: computedDate };
};

export const startScoreJob = (intervalMs = 60 * 1000) => {
  runScoreJobIfNeeded().catch((error) => {
    console.error('score job initial run failed:', error);
  });

  const timer = setInterval(() => {
    runScoreJobIfNeeded().catch((error) => {
      console.error('score job interval run failed:', error);
    });
  }, intervalMs);

  return () => clearInterval(timer);
};
