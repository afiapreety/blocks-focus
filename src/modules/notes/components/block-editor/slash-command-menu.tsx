import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';

interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: () => void;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandMenu = forwardRef<any, SlashCommandMenuProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  if (!props.items || props.items.length === 0) {
    return null;
  }

  return (
    <div className="slash-command-menu bg-card border border-border rounded-lg shadow-lg p-2 min-w-[300px] max-h-[400px] overflow-y-auto">
      <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">Basic</div>
      {props.items.map((item, index) => (
        <button
          key={index}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md flex items-start gap-3 hover:bg-muted transition-colors',
            index === selectedIndex && 'bg-muted'
          )}
          onClick={() => selectItem(index)}
        >
          <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-md flex-shrink-0 text-lg">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-card-foreground">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';
