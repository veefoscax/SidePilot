import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModelSelector } from './ModelSelector';

export function MultiProviderSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Provider Settings</CardTitle>
          <CardDescription>This is a test to see if the component loads</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Component is working!</p>
        </CardContent>
      </Card>
    </div>
  );
}