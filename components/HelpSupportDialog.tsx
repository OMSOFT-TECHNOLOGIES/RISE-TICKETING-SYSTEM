import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from './ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { 
  HelpCircle, 
  MessageSquare, 
  Book, 
  Video, 
  Search,
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  ArrowRight,
  FileText,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
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
    answer: 'To book a trip, go to the Trip Booking page from the navigation menu. Fill in the passenger details, select the route and departure time, then confirm the booking. You can also use the Quick Actions (+ button) in the header for faster booking.'
  },
  {
    id: 'faq2',
    question: 'How can I register a new vehicle?',
    answer: 'Navigate to Vehicle Management and click "Add Vehicle". Fill in the registration number, make, model, capacity, and assign it to a station. Ensure all required documents are available for verification.'
  },
  {
    id: 'faq3',
    question: 'What should I do if a trip is cancelled?',
    answer: 'Go to Trip Booking, find the trip, and update its status to cancelled. The system will automatically notify passengers and process refunds according to the cancellation policy.'
  },
  {
    id: 'faq4',
    question: 'How do I generate reports?',
    answer: 'Visit the Reports section where you can generate various reports including passenger lists, revenue summaries, and trip analytics. Use the filters to customize your reports and export them as needed.'
  },
  {
    id: 'faq5',
    question: 'How can I view passenger complaints?',
    answer: 'Administrators can access the Ratings & Complaints page to view all customer feedback and complaints. You can respond to complaints and track their resolution status.'
  }
];

const tutorialVideos = [
  {
    id: 'video1',
    title: 'Getting Started with RISE',
    description: 'Learn the basics of navigating the RISE system',
    duration: '5:30',
    category: 'basics'
  },
  {
    id: 'video2',
    title: 'Booking and Managing Trips',
    description: 'Step-by-step guide to trip booking and management',
    duration: '8:45',
    category: 'trips'
  },
  {
    id: 'video3',
    title: 'Vehicle and Driver Management',
    description: 'How to add and manage vehicles and drivers',
    duration: '6:20',
    category: 'fleet'
  },
  {
    id: 'video4',
    title: 'Generating Reports and Analytics',
    description: 'Creating and customizing reports',
    duration: '7:15',
    category: 'reports'
  }
];

const userGuides = [
  {
    id: 'guide1',
    title: 'RISE User Manual',
    description: 'Complete user guide for all system features',
    type: 'PDF',
    size: '2.5 MB'
  },
  {
    id: 'guide2',
    title: 'Trip Booking Quick Reference',
    description: 'Quick reference for booking trips',
    type: 'PDF',
    size: '1.2 MB'
  },
  {
    id: 'guide3',
    title: 'Fleet Management Guide',
    description: 'Guide for managing vehicles and drivers',
    type: 'PDF',
    size: '1.8 MB'
  }
];

export function HelpSupportDialog({ open, onOpenChange }: HelpSupportDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [supportForm, setSupportForm] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium'
  });

  const filteredFAQs = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupportSubmit = () => {
    if (!supportForm.category || !supportForm.subject || !supportForm.description) {
      notify.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      notify.success('Support ticket submitted successfully. We\'ll get back to you soon!');
      setSupportForm({
        category: '',
        subject: '',
        description: '',
        priority: 'medium'
      });
    }, 500);
  };

  const handleDownload = (guide: any) => {
    notify.success(`Downloading ${guide.title}...`);
    // Simulate download
  };

  const handleVideoPlay = (video: any) => {
    notify.info(`Opening ${video.title}...`);
    // Here you would open the video or navigate to video page
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </DialogTitle>
          <DialogDescription>
            Get help with using RISE, find answers to common questions, or contact support
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="faq" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
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
                  <CardDescription>
                    Find quick answers to common questions about using RISE
                  </CardDescription>
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
                      <p className="text-sm text-muted-foreground">
                        Try different search terms or browse all FAQs
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  User Guides & Documentation
                </CardTitle>
                <CardDescription>
                  Download comprehensive guides and documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userGuides.map((guide) => (
                    <div key={guide.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <h3 className="font-medium">{guide.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {guide.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <Badge variant="outline">{guide.type}</Badge>
                            <span>{guide.size}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(guide)}
                          className="ml-4"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Tutorial Videos
                </CardTitle>
                <CardDescription>
                  Watch step-by-step video tutorials to learn RISE features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tutorialVideos.map((video) => (
                    <div key={video.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          onClick={() => handleVideoPlay(video)}
                          className="gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Play Video
                        </Button>
                      </div>
                      <h3 className="font-medium mb-1">{video.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {video.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{video.category}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {video.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Get in touch with our support team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-muted-foreground">+233 XXX XXX XXX</p>
                      <p className="text-xs text-muted-foreground">Mon-Fri, 8:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">support@rise.com</p>
                      <p className="text-xs text-muted-foreground">Response within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Live Chat</p>
                      <p className="text-sm text-muted-foreground">Available 24/7</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Ticket Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Submit Support Ticket</CardTitle>
                  <CardDescription>
                    Describe your issue and we'll help you resolve it
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="support-category">Category *</Label>
                    <Select value={supportForm.category} onValueChange={(value) => setSupportForm({...supportForm, category: value})}>
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
                      onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-description">Description *</Label>
                    <Textarea
                      id="support-description"
                      value={supportForm.description}
                      onChange={(e) => setSupportForm({...supportForm, description: e.target.value})}
                      placeholder="Please provide detailed information about your issue..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-priority">Priority</Label>
                    <Select value={supportForm.priority} onValueChange={(value) => setSupportForm({...supportForm, priority: value})}>
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
                    Submit Ticket
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