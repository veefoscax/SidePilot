/**
 * Conversation Manager Component
 * 
 * Provides UI for managing conversations including save, load, delete,
 * export, import, and template functionality.
 */

import { useState } from 'react';
import { useChatStore, type Conversation } from '@/stores/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BookOpen01Icon,
  Delete01Icon,
  Download01Icon,
  Upload01Icon,
  BookmarkIcon,
  Search01Icon,
  MoreHorizontalIcon,
  Calendar01Icon,
  MessageIcon
} from '@hugeicons/core-free-icons';

interface ConversationManagerProps {
  className?: string;
}

export function ConversationManager({ className = '' }: ConversationManagerProps) {
  const {
    messages,
    savedConversations,
    conversationTemplates,
    currentConversationId,
    saveConversation,
    loadConversation,
    deleteConversation,
    exportConversation,
    importConversation,
    saveAsTemplate,
    loadTemplate,
    deleteTemplate,
    searchConversations,
    clearMessages,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [importData, setImportData] = useState('');

  // Filter conversations based on search
  const filteredConversations = searchQuery
    ? searchConversations(searchQuery)
    : savedConversations;

  const handleSaveConversation = () => {
    const title = conversationTitle.trim() || undefined;
    saveConversation(title);
    setConversationTitle('');
    setShowSaveDialog(false);
  };

  const handleSaveAsTemplate = () => {
    if (templateName.trim() && templateDescription.trim()) {
      saveAsTemplate(templateName.trim(), templateDescription.trim());
      setTemplateName('');
      setTemplateDescription('');
      setShowTemplateDialog(false);
    }
  };

  const handleImportConversation = () => {
    if (importData.trim()) {
      importConversation(importData.trim());
      setImportData('');
      setShowImportDialog(false);
    }
  };

  const handleExportConversation = (conversationId: string) => {
    const data = exportConversation(conversationId);
    if (data) {
      // Create download link
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sidepilot-conversation-${conversationId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageCount = (conversation: Conversation) => {
    return conversation.messages.length;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Save Current Conversation */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={messages.length === 0}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={BookOpen01Icon} className="h-4 w-4" />
              Save
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Conversation</DialogTitle>
              <DialogDescription>
                Give your conversation a memorable title.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={conversationTitle}
                  onChange={(e) => setConversationTitle(e.target.value)}
                  placeholder="Enter conversation title..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConversation}>
                Save Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save as Template */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={messages.length === 0}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={BookmarkIcon} className="h-4 w-4" />
              Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>
                Create a reusable template from this conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                />
              </div>
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe what this template is for..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAsTemplate}>
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Conversation */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Conversation</DialogTitle>
              <DialogDescription>
                Paste the exported conversation data below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="import-data">Conversation Data</Label>
                <Textarea
                  id="import-data"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste exported conversation JSON here..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleImportConversation}>
                Import Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Conversation */}
        <Button
          variant="outline"
          size="sm"
          onClick={clearMessages}
          className="flex items-center gap-2"
        >
          <HugeiconsIcon icon={MessageIcon} className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <HugeiconsIcon 
          icon={Search01Icon} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" 
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="pl-10"
        />
      </div>

      {/* Templates Section */}
      {conversationTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Templates</h3>
          <div className="grid gap-2">
            {conversationTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{template.name}</h4>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex gap-1">
                        {template.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {template.description}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadTemplate(template.id)}
                  >
                    Load
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => deleteTemplate(template.id)}
                        className="text-destructive"
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4 mr-2" />
                        Delete Template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations Section */}
      <div>
        <h3 className="text-sm font-medium mb-2">
          Saved Conversations ({filteredConversations.length})
        </h3>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  {searchQuery ? 'No conversations match your search.' : 'No saved conversations yet.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                    currentConversationId === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={MessageIcon} className="h-3 w-3" />
                        {getMessageCount(conversation)}
                      </div>
                      <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={Calendar01Icon} className="h-3 w-3" />
                        {formatDate(conversation.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportConversation(conversation.id);
                        }}
                      >
                        <HugeiconsIcon icon={Download01Icon} className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="text-destructive"
                      >
                        <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}