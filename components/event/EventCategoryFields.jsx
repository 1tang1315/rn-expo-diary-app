import React from 'react';
import DietEventFields from '@/components/event/diet/DietEventFields';

export default function EventCategoryFields({
  category,
  extras,
  onExtrasChange,
  onSuggestTimeKind,
  onSuggestIcon,
}) {
  if (category === 'diet') {
    return (
      <DietEventFields
        extras={extras}
        onExtrasChange={onExtrasChange}
        onSuggestTimeKind={onSuggestTimeKind}
        onSuggestIcon={onSuggestIcon}
      />
    );
  }
  return null;
}
