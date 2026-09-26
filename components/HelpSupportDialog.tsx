import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { HelpCircle, MessageSquare, Search, Send, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { notify } from './utils/notify';

interface HelpSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqData = [
  {
    id: 'faq1',
    question: 'How do I book a trip for a passenger?',
    answer:
      'Go to Trip Booking or Passenger Management, select a trip, enter passenger details, and use Book & print ticket. Each booking is saved to the server and the e-ticket prints immediately.',
  },
  {
    id: 'faq2',
    question: 'How can I register a new vehicle?',
    answer:
      'Open Vehicle Management, choose your station if prompted, then Add Vehicle and submit the registration form. Data is stored via the RISE API.',
  },
  {
    id: 'faq3',
    question: 'What should I do if a trip is cancelled?',
    answer:
      'In Trip Booking, find the trip and update its status to cancelled. Passengers and revenue reports reflect live backend data.',
  },
  {
    id: 'faq4',
    question: 'How do I generate reports?',
    answer:
      'Use Reports & Analytics. Filters use stations and routes from the API; charts load from report endpoints for the selected date range.',
  },
  {
    id: 'faq5',
    question: 'How can I view passenger complaints?',
    answer:
      'Open Ratings & Complaints to list ratings and complaints from the feedback API, respond to complaints, and track resolution status.',
  },
];

const SUPPORT_EMAIL = 'support@rise.com';

export function HelpSupportDialog({ open, onOpenChange }: HelpSupportDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [supportForm, setSupportForm] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium',
  });

  const filteredFAQs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupportSubmit = () => {
    if (!supportForm.category || !supportForm.subject || !supportForm.description) {
      notify.error('Please fill in all required fields');
      return;
    }

    const body = [
      `Category: ${supportForm.category}`,
      `Priority: ${supportForm.priority}`,
      '',
      supportForm.description,
    ].join('\n');

    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      supportForm.subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    notify.success('Opening your email client to send the support request');
    setSupportForm({
      category: '',
      subject: '',
      description: '',
      priority: 'medium',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </DialogTitle>
          <DialogDescription>
            Product help and contact options — no simulated tickets or downloads
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="faq" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search frequently asked questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Answers aligned with the live RISE workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFAQs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-left hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFAQs.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="font-medium">No results found</p>
                      <p className="text-sm text-muted-foreground">Try different search terms</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Reach the operations support team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-muted-foreground">Contact your regional RISE office</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">{SUPPORT_EMAIL}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Support ticket</p>
                      <p className="text-sm text-muted-foreground">
                        Use the form to open an email with your issue details
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Support Request</CardTitle>
                  <CardDescription>We will respond via email when ticketing API is enabled</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-category">Category *</Label>
                    <Select
                      value={supportForm.category}
                      onValueChange={(value) => setSupportForm({ ...supportForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account Problem</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="training">Training/How-to</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-subject">Subject *</Label>
                    <Input
                      id="support-subject"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-description">Description *</Label>
                    <Textarea
                      id="support-description"
                      value={supportForm.description}
                      onChange={(e) =>
                        setSupportForm({ ...supportForm, description: e.target.value })
                      }
                      placeholder="Please provide detailed information about your issue..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-priority">Priority</Label>
                    <Select
                      value={supportForm.priority}
                      onValueChange={(value) => setSupportForm({ ...supportForm, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleSupportSubmit} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send via Email
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
