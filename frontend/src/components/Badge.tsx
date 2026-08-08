import React from 'react';

interface BadgeProps {
  type: string;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label }) => {
  const text = label || type;
  const lower = type.toLowerCase();

  let className = 'badge';

  if (['admin', 'sales', 'warehouse', 'accounts'].includes(lower)) {
    className += ` badge-${lower}`;
  } else if (['lead', 'active', 'inactive'].includes(lower)) {
    className += ` badge-${lower}`;
  } else if (['in', 'out'].includes(lower)) {
    className += ` badge-${lower}`;
  } else if (['draft', 'confirmed', 'cancelled'].includes(lower)) {
    className += ` badge-${lower}`;
  } else {
    className += ' badge-draft';
  }

  return <span className={className}>{text}</span>;
};
