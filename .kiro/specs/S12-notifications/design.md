# S12: Notifications - Design

## Notification Manager

```typescript
// src/lib/notifications.ts

interface NotificationConfig {
  enabled: boolean;
  types: {
    taskComplete: boolean;
    permissionRequired: boolean;
    error: boolean;
  };
}

class NotificationManager {
  private config: NotificationConfig = {
    enabled: true,
    types: { taskComplete: true, permissionRequired: true, error: true }
  };
  
  async loadConfig(): Promise<void> {
    const stored = await storage.get<NotificationConfig>('notificationConfig');
    if (stored) this.config = stored;
  }
  
  async updateConfig(updates: Partial<NotificationConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await storage.set('notificationConfig', this.config);
  }
  
  private async notify(
    type: keyof NotificationConfig['types'], 
    title: string, 
    message: string
  ): Promise<string | null> {
    if (!this.config.enabled || !this.config.types[type]) return null;
    
    return new Promise(resolve => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon128.png',
        title,
        message,
        priority: 2
      }, (id) => resolve(id));
    });
  }
  
  async notifyTaskComplete(taskName: string): Promise<void> {
    await this.notify('taskComplete', 'Task Complete', `"${taskName}" has finished`);
  }
  
  async notifyPermissionRequired(tool: string): Promise<void> {
    await this.notify('permissionRequired', 'Permission Required', 
      `Action "${tool}" needs your approval`);
  }
  
  async notifyError(error: string): Promise<void> {
    await this.notify('error', 'Error', error.substring(0, 100));
  }
}

export const notifications = new NotificationManager();
```

## Settings Integration

```tsx
// In Settings.tsx
function NotificationSettings() {
  const [enabled, setEnabled] = useState(true);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable notifications</Label>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <Button 
          variant="outline" 
          onClick={() => notifications.notifyTaskComplete('Test Task')}
        >
          Test Notification
        </Button>
      </CardContent>
    </Card>
  );
}
```
