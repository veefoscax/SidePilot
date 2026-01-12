# S08: Shortcuts System - Design

## Types

```typescript
// src/lib/shortcuts.ts

interface SavedPrompt {
  id: string;
  command: string;           // Without leading /
  name?: string;             // Display name
  prompt: string;            // Actual prompt content
  url?: string;              // Optional URL context
  usageCount: number;
  createdAt: number;
  updatedAt: number;
  // Optional scheduling
  schedule?: {
    type: 'none' | 'once' | 'daily' | 'weekly' | 'monthly';
    time?: string;           // HH:MM
    date?: string;           // YYYY-MM-DD
    dayOfWeek?: number;      // 0-6
    dayOfMonth?: number;     // 1-31
  };
  model?: string;            // Use specific model
  skipPermissions?: boolean;
}

// Chip syntax regex
const SHORTCUT_CHIP_REGEX = /\[\[shortcut:([^:]+):([^\]]+)\]\]/g;
```

## Shortcuts Store

```typescript
// src/stores/shortcuts.ts
interface ShortcutsState {
  shortcuts: SavedPrompt[];
  isLoaded: boolean;
  
  loadShortcuts(): Promise<void>;
  createShortcut(prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<SavedPrompt>;
  updateShortcut(id: string, updates: Partial<SavedPrompt>): Promise<void>;
  deleteShortcut(id: string): Promise<void>;
  recordUsage(id: string): Promise<void>;
  getByCommand(command: string): SavedPrompt | undefined;
  getById(id: string): SavedPrompt | undefined;
}

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set, get) => ({
      shortcuts: [],
      isLoaded: false,
      
      loadShortcuts: async () => {
        const stored = await storage.get<SavedPrompt[]>('savedPrompts') || [];
        set({ shortcuts: stored, isLoaded: true });
      },
      
      createShortcut: async (prompt) => {
        const newPrompt: SavedPrompt = {
          ...prompt,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usageCount: 0,
        };
        set(state => {
          const updated = [...state.shortcuts, newPrompt];
          storage.set('savedPrompts', updated);
          return { shortcuts: updated };
        });
        return newPrompt;
      },
      
      recordUsage: async (id) => {
        set(state => {
          const updated = state.shortcuts.map(s =>
            s.id === id ? { ...s, usageCount: s.usageCount + 1 } : s
          );
          storage.set('savedPrompts', updated);
          return { shortcuts: updated };
        });
      },
      // ... more actions
    }),
    { name: 'shortcuts-storage' }
  )
);
```

## Slash Menu Component

```tsx
// src/components/SlashMenu.tsx
interface SlashMenuItem {
  id: string;
  name: string;
  icon?: ComponentType;
  action: 'chip' | 'submenu' | 'open-modal';
  groupId: 'system' | 'shortcuts' | 'actions';
  keywords?: string;
}

export function SlashMenu({ 
  query, 
  onSelect, 
  onClose 
}: Props) {
  const { shortcuts } = useShortcutsStore();
  
  const items: SlashMenuItem[] = [
    // System items
    { id: 'screenshot', name: 'Screenshot', groupId: 'system', action: 'chip' },
    { id: 'navigate', name: 'Navigate', groupId: 'system', action: 'chip' },
    
    // User shortcuts
    ...shortcuts.map(s => ({
      id: s.id,
      name: s.command,
      groupId: 'shortcuts' as const,
      action: 'chip' as const,
    })),
    
    // Actions
    { id: 'record-workflow', name: 'Record workflow', groupId: 'actions', action: 'open-modal' },
    { id: 'create-shortcut', name: 'Create shortcut', groupId: 'actions', action: 'open-modal' },
  ];
  
  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(query.toLowerCase())
  );
  
  return (
    <Command>
      <CommandList>
        {['system', 'shortcuts', 'actions'].map(group => (
          <CommandGroup key={group} heading={group}>
            {filtered.filter(i => i.groupId === group).map(item => (
              <CommandItem key={item.id} onSelect={() => onSelect(item)}>
                {item.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
```

## Shortcut Chip

```tsx
// src/components/ShortcutChip.tsx
export function ShortcutChip({ id, name }: { id: string; name: string }) {
  const [expanded, setExpanded] = useState(false);
  const { getById } = useShortcutsStore();
  const shortcut = getById(id);
  
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <Command className="w-3 h-3" />
      /{name}
      {expanded && shortcut && (
        <Popover>
          <pre className="text-xs">{shortcut.prompt}</pre>
        </Popover>
      )}
    </span>
  );
}

// Parser for message content
export function parseShortcutChips(content: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  
  content.replace(SHORTCUT_CHIP_REGEX, (match, id, name, offset) => {
    if (offset > lastIndex) {
      parts.push(content.slice(lastIndex, offset));
    }
    parts.push(<ShortcutChip key={id} id={id} name={name} />);
    lastIndex = offset + match.length;
    return match;
  });
  
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts;
}
```
