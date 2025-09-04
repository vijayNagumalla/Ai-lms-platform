import React from 'react';
import { Textarea } from '@/components/ui/textarea';

const MarkdownEditor = ({ value, onChange, placeholder = 'Write your description here...' }) => {
  return (
    <div className="border rounded-md p-4">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="border-0 focus-visible:ring-0 resize-none"
      />
    </div>
  );
};

export default MarkdownEditor; 