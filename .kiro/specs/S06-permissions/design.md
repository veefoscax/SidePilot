# S06: Permission System - Design

## Types

```typescript
// src/lib/permissions.ts

type PermissionMode = 'always_allow' | 'ask_once' | 'ask_always' | 'deny';

interface DomainPermission {
  domain: string;
  defaultMode: PermissionMode;
  toolOverrides: Record<string, PermissionMode>;  // Per-tool rules
  lastUsed: number;
  createdAt: number;
}

interface PermissionRequest {
  id: string;
  toolName: string;
  domain: string;
  actionData?: {
    screenshot?: string;
    coordinate?: [number, number];
    text?: string;
  };
  timestamp: number;
}

interface PermissionResult {
  allowed: boolean;
  needsPrompt: boolean;
  rememberChoice?: boolean;
}
```

## Permission Manager

```typescript
class PermissionManager {
  private permissions: Map<string, DomainPermission> = new Map();

  async checkPermission(url: string, toolName: string): Promise<PermissionResult> {
    const domain = this.extractDomain(url);
    const permission = await this.getPermission(domain);
    
    if (!permission) {
      return { allowed: false, needsPrompt: true };
    }
    
    // Check tool-specific override first
    const toolMode = permission.toolOverrides[toolName] ?? permission.defaultMode;
    
    switch (toolMode) {
      case 'always_allow':
        return { allowed: true, needsPrompt: false };
      case 'deny':
        return { allowed: false, needsPrompt: false };
      case 'ask_once':
        // Check if already approved this session
        const approved = this.sessionApprovals.has(`${domain}:${toolName}`);
        return { allowed: approved, needsPrompt: !approved };
      case 'ask_always':
      default:
        return { allowed: false, needsPrompt: true };
    }
  }
  
  async setPermission(domain: string, mode: PermissionMode): Promise<void> {
    const existing = await this.getPermission(domain) || {
      domain,
      defaultMode: mode,
      toolOverrides: {},
      createdAt: Date.now(),
      lastUsed: Date.now()
    };
    existing.defaultMode = mode;
    existing.lastUsed = Date.now();
    await this.savePermission(existing);
  }
  
  async setToolPermission(domain: string, tool: string, mode: PermissionMode): Promise<void> {
    const permission = await this.getPermission(domain);
    if (permission) {
      permission.toolOverrides[tool] = mode;
      await this.savePermission(permission);
    }
  }
  
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
}
```

## Zustand Store

```typescript
// src/stores/permissions.ts
interface PermissionState {
  permissions: DomainPermission[];
  pendingRequest: PermissionRequest | null;
  
  loadPermissions(): Promise<void>;
  setPendingRequest(request: PermissionRequest | null): void;
  approveRequest(remember: boolean): Promise<void>;
  denyRequest(remember: boolean): Promise<void>;
  updateDomainPermission(domain: string, mode: PermissionMode): Promise<void>;
  deletePermission(domain: string): Promise<void>;
}
```

## Permission Dialog

```tsx
// src/components/PermissionDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function PermissionDialog({ request, onApprove, onDeny }: Props) {
  const [remember, setRemember] = useState(false);
  
  return (
    <Dialog open={!!request}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permission Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>
            Allow <strong>{request.toolName}</strong> on{' '}
            <strong>{request.domain}</strong>?
          </p>
          
          {request.actionData?.screenshot && (
            <div className="relative">
              <img src={request.actionData.screenshot} className="rounded" />
              {request.actionData.coordinate && (
                <div 
                  className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white"
                  style={{
                    left: `${request.actionData.coordinate[0]}px`,
                    top: `${request.actionData.coordinate[1]}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}
            </div>
          )}
          
          {request.actionData?.text && (
            <pre className="bg-muted p-2 rounded text-sm">
              {request.actionData.text}
            </pre>
          )}
          
          <div className="flex items-center gap-2">
            <Checkbox checked={remember} onCheckedChange={setRemember} />
            <span className="text-sm">Remember for this domain</span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onDeny(remember)}>
            Deny
          </Button>
          <Button onClick={() => onApprove(remember)}>
            Allow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```
