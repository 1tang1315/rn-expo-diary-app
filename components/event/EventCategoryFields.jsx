import React from 'react';
import DietEventFields from '@/components/event/diet/DietEventFields';
import SportsEventFields from '@/components/event/sports/SportsEventFields';
import EmotionEventFields from '@/components/event/emotion/EmotionEventFields';
import JournalEventFields from '@/components/event/journal/JournalEventFields';

const FIELD_MAP = {
  diet: DietEventFields,
  sports: SportsEventFields,
  emotion: EmotionEventFields,
  daily: JournalEventFields,
};

export default function EventCategoryFields({
  category,
  extras,
  onExtrasChange,
  onSuggestTimeKind,
  onSuggestIcon,
}) {
  const Component = FIELD_MAP[category];
  if (!Component) return null;
  return (
    <Component
      extras={extras}
      onExtrasChange={onExtrasChange}
      onSuggestTimeKind={onSuggestTimeKind}
      onSuggestIcon={onSuggestIcon}
    />
  );
}
