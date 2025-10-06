import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, TrendingUp, FileText, Zap, Users, Mic, FileCheck, MessageSquare, Workflow, Sparkles, Edit3, MicOff, Send, Upload, Eye, RefreshCw, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { generateObject, generateText } from '@rork/toolkit-sdk';
import { z } from 'zod';
import { runAITool } from '@/hooks/aiTools';
import { db, storage } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';

const loadDraftSchema = z.object({
  pickup: z.string().describe('Pickup location in format: City, State'),
  delivery: z.string().describe('Delivery location in format: City, State'),
  equipment: z.string().describe('Equipment type (e.g., Flatbed, Dry Van, Reefer)'),
  notes: z.string().describe('Special notes, timing requirements, or additional details'),
});

type LoadDraft = z.infer<typeof loadDraftSchema>;

interface DriverMessage {
  id: string;
  loadId: string;
  driverId: string;
  driverName: string;
  messageText: string;
  createdAt: string;
}

interface ReplySuggestion {
  text: string;
  tone: 'professional' | 'friendly' | 'firm';
}

interface RecommendedDriver {
  id: string;
  name: string;
  companyName?: string;
  equipment: string;
  onTimePercentage: number;
  lastCompletedLoad: {
    route: string;
    date: string;
  };
  status: 'Available' | 'Busy' | 'Available Soon';
  laneHistory: string[];
}

interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  docType: 'BOL' | 'Insurance' | 'Permit' | 'Other';
  createdAt: string;
  loadId?: string;
  size?: number;
  mimeType?: string;
}

type AutomationType = 'pickup_reminder' | 'late_delivery_alert' | 'insurance_expiry' | 'document_expiry' | 'load_status_change';

interface WorkflowAutomation {
  id: string;
  type: AutomationType;
  trigger: string;
  message: string;
  createdAt: string;
  isActive: boolean;
}

interface AutomationNotification {
  id: string;
  automationId: string;
  message: string;
  loadId?: string;
  createdAt: string;
  isRead: boolean;
}

export default function AIToolsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const [showListingAssistant, setShowListingAssistant] = useState(false);
  const [showVoiceToPost, setShowVoiceToPost] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<LoadDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState<LoadDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [showReplyDrafts, setShowReplyDrafts] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<DriverMessage | null>(null);
  const [replySuggestions, setReplySuggestions] = useState<ReplySuggestion[]>([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [customReply, setCustomReply] = useState('');
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [editedReplyText, setEditedReplyText] = useState('');
  const [showMatchmaker, setShowMatchmaker] = useState(false);
  const [selectedLoadForMatch, setSelectedLoadForMatch] = useState<string | null>(null);
  const [recommendedDrivers, setRecommendedDrivers] = useState<RecommendedDriver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [showSmartDocs, setShowSmartDocs] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'BOL' | 'Insurance' | 'Permit' | 'Other'>('BOL');
  const [showWorkflowAutomations, setShowWorkflowAutomations] = useState(false);
  const [automations, setAutomations] = useState<WorkflowAutomation[]>([]);
  const [isLoadingAutomations, setIsLoadingAutomations] = useState(false);
  const [notifications, setNotifications] = useState<AutomationNotification[]>([]);

  const stats = [
    {
      icon: Clock,
      value: '25–45%',
      label: 'Ops Time Saved',
      description: 'drafting posts, docs, follow-ups',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: TrendingUp,
      value: '1.8–2.6x',
      label: 'Faster Tender → Book',
      description: 'respond quicker with AI assist',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: FileText,
      value: '60%+',
      label: 'Manual Entry Reduced',
      description: 'auto extract from BOL/COI/RC',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      icon: Zap,
      value: '+10–18%',
      label: 'Forecast Accuracy',
      description: 'lane trends & seasonality',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
  ];

  const handleSaveDraft = async () => {
    if (!editedDraft || !user?.id) {
      Alert.alert('Error', 'Unable to save draft. Please try again.');
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'loads', 'drafts', user.id), {
        ...editedDraft,
        createdAt: serverTimestamp(),
        shipperId: user.id,
      });

      Alert.alert('Success', 'Load draft saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowListingAssistant(false);
            setShowVoiceToPost(false);
            setRawInput('');
            setGeneratedDraft(null);
            setEditedDraft(null);
            setIsEditing(false);
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Save Failed', 'Unable to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        console.log('Web recording started');
      } else {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync({
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });

        recordingRef.current = recording;
        setIsRecording(true);
        console.log('Mobile recording started');
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Unable to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      if (Platform.OS === 'web') {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder) {
          throw new Error('No media recorder found');
        }

        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.stop();
        });

        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Web recording stopped, blob size:', audioBlob.size);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const result = await response.json();
        console.log('Transcription result:', result);
        setRawInput(result.text);
        await handleGenerateDraft(result.text);
      } else {
        const recording = recordingRef.current;
        if (!recording) {
          throw new Error('No recording found');
        }

        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

        const uri = recording.getURI();
        if (!uri) {
          throw new Error('No recording URI');
        }

        console.log('Mobile recording stopped, URI:', uri);

        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        const formData = new FormData();
        formData.append('audio', {
          uri,
          name: `recording.${fileType}`,
          type: `audio/${fileType}`,
        } as any);

        const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const result = await response.json();
        console.log('Transcription result:', result);
        setRawInput(result.text);
        await handleGenerateDraft(result.text);
      }
    } catch (error) {
      console.error('Failed to stop recording or transcribe:', error);
      Alert.alert('Transcription Error', 'Unable to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
      recordingRef.current = null;
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
  };

  const handleGenerateDraft = async (inputText?: string) => {
    const textToProcess = inputText || rawInput;
    if (!textToProcess.trim()) {
      Alert.alert('Input Required', 'Please enter load details to generate a draft.');
      return;
    }

    setIsGenerating(true);
    try {
      const toolName = showVoiceToPost ? 'voiceToPost' : 'listingAssistant';
      const aiResponse = await runAITool(toolName, textToProcess);
      
      const result = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Extract load information from this text and structure it properly. Text: "${textToProcess}"
            
Extract:
            - Pickup location (City, State format)
            - Delivery location (City, State format)
            - Equipment type
            - Any special notes, timing requirements, or details
            
If information is missing, use "Not specified" for that field.`,
          },
        ],
        schema: loadDraftSchema,
      });

      setGeneratedDraft(result);
      setEditedDraft(result);
      console.log('Generated draft:', result);
      console.log('AI Tool Response:', aiResponse);
    } catch (error) {
      console.error('Error generating draft:', error);
      Alert.alert('Generation Failed', 'Unable to generate draft. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const tools = [
    {
      icon: Zap,
      title: 'Listing Assistant',
      description: 'Turn rough details into polished posts with clear requirements, lane notes, and compliance flags.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      onPress: () => setShowListingAssistant(true),
    },
    {
      icon: Users,
      title: 'Matchmaker',
      description: 'Recommends best-fit carriers by lane history, equipment, and on-time performance.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      onPress: () => setShowMatchmaker(true),
    },
    {
      icon: Mic,
      title: 'Voice-to-Post',
      description: 'Speak a load or update and we generate structured fields and messages automatically.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      onPress: () => setShowVoiceToPost(true),
    },
    {
      icon: FileCheck,
      title: 'Smart Docs',
      description: 'Extracts key fields from BOL/COI, detects mismatches, and suggests corrections.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      onPress: () => setShowSmartDocs(true),
    },
    {
      icon: MessageSquare,
      title: 'Reply Drafts',
      description: 'One-tap responses for common carrier questions, rate counters, and appointment changes.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      onPress: () => setShowReplyDrafts(true),
    },
    {
      icon: Workflow,
      title: 'Workflow Automations',
      description: 'Triggers alerts, status moves, and check calls based on context—no manual steps.',
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      onPress: () => setShowWorkflowAutomations(true),
    },
  ];

  const driverMessages: DriverMessage[] = [
    {
      id: '1',
      loadId: 'load_001',
      driverId: 'driver_001',
      driverName: 'John Smith',
      messageText: 'Can I deliver early?',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      loadId: 'load_002',
      driverId: 'driver_002',
      driverName: 'Sarah Johnson',
      messageText: 'Is the rate negotiable?',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      loadId: 'load_003',
      driverId: 'driver_003',
      driverName: 'Mike Davis',
      messageText: 'What are the loading dock hours?',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '4',
      loadId: 'load_004',
      driverId: 'driver_004',
      driverName: 'Emily Brown',
      messageText: 'Do you need a liftgate for this delivery?',
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: '5',
      loadId: 'load_005',
      driverId: 'driver_005',
      driverName: 'David Wilson',
      messageText: 'Can I get detention pay if I wait more than 2 hours?',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
  ];

  const generateReplySuggestions = async (message: string) => {
    setIsGeneratingReplies(true);
    try {
      const aiResponse = await runAITool('replyDrafts', message);
      console.log('Reply Drafts AI Response:', aiResponse);
      
      const prompt = `You are a professional logistics coordinator. Generate 3 different reply suggestions for this driver message: "${message}"

Provide 3 different tones:
1. Professional and formal
2. Friendly and accommodating
3. Firm but polite

Each reply should be concise (1-2 sentences) and address the driver's question directly. Format your response as JSON with this structure:
{
  "replies": [
    { "text": "reply text here", "tone": "professional" },
    { "text": "reply text here", "tone": "friendly" },
    { "text": "reply text here", "tone": "firm" }
  ]
}`;

      const response = await generateText({ messages: [{ role: 'user', content: prompt }] });
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setReplySuggestions(parsed.replies || []);
      } else {
        setReplySuggestions([
          { text: 'Thank you for your message. Let me check on that and get back to you shortly.', tone: 'professional' },
          { text: 'Great question! I\'ll look into this for you right away.', tone: 'friendly' },
          { text: 'I\'ll need to verify this information. Please allow me some time to respond.', tone: 'firm' },
        ]);
      }
    } catch (error) {
      console.error('Error generating replies:', error);
      setReplySuggestions([
        { text: 'Thank you for your message. Let me check on that and get back to you shortly.', tone: 'professional' },
        { text: 'Great question! I\'ll look into this for you right away.', tone: 'friendly' },
        { text: 'I\'ll need to verify this information. Please allow me some time to respond.', tone: 'firm' },
      ]);
    } finally {
      setIsGeneratingReplies(false);
    }
  };

  const handleSelectMessage = async (message: DriverMessage) => {
    setSelectedMessage(message);
    setReplySuggestions([]);
    setCustomReply('');
    setIsEditingReply(false);
    await generateReplySuggestions(message.messageText);
  };

  const handleSendReply = async (replyText: string) => {
    if (!selectedMessage || !user?.id) {
      Alert.alert('Error', 'Unable to send reply. Please try again.');
      return;
    }

    setIsSendingReply(true);
    try {
      const messageRef = doc(db, 'messages', selectedMessage.loadId, selectedMessage.driverId, Date.now().toString());
      await setDoc(messageRef, {
        messageText: replyText,
        createdAt: serverTimestamp(),
        senderRole: 'shipper',
        senderId: user.id,
        loadId: selectedMessage.loadId,
        driverId: selectedMessage.driverId,
      });

      Alert.alert('Success', 'Reply sent successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedMessage(null);
            setReplySuggestions([]);
            setCustomReply('');
            setIsEditingReply(false);
          },
        },
      ]);
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Send Failed', 'Unable to send reply. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleEditReply = (replyText: string) => {
    setEditedReplyText(replyText);
    setIsEditingReply(true);
  };

  const mockDrivers: RecommendedDriver[] = [
    {
      id: 'driver_001',
      name: 'Mike Johnson',
      companyName: 'Johnson Trucking LLC',
      equipment: 'Flatbed',
      onTimePercentage: 98,
      lastCompletedLoad: {
        route: 'Dallas, TX → Phoenix, AZ',
        date: '2025-10-01',
      },
      status: 'Available',
      laneHistory: ['Dallas, TX → Phoenix, AZ', 'Houston, TX → Los Angeles, CA'],
    },
    {
      id: 'driver_002',
      name: 'Sarah Martinez',
      companyName: 'Martinez Transport',
      equipment: 'Reefer',
      onTimePercentage: 96,
      lastCompletedLoad: {
        route: 'Chicago, IL → Atlanta, GA',
        date: '2025-09-30',
      },
      status: 'Available Soon',
      laneHistory: ['Chicago, IL → Atlanta, GA', 'Detroit, MI → Nashville, TN'],
    },
    {
      id: 'driver_003',
      name: 'David Chen',
      companyName: 'Chen Logistics',
      equipment: 'Dry Van',
      onTimePercentage: 97,
      lastCompletedLoad: {
        route: 'Los Angeles, CA → Seattle, WA',
        date: '2025-10-02',
      },
      status: 'Available',
      laneHistory: ['Los Angeles, CA → Seattle, WA', 'San Francisco, CA → Portland, OR'],
    },
    {
      id: 'driver_004',
      name: 'Robert Williams',
      companyName: 'Williams Freight',
      equipment: 'Hotshot',
      onTimePercentage: 95,
      lastCompletedLoad: {
        route: 'Houston, TX → Memphis, TN',
        date: '2025-09-29',
      },
      status: 'Busy',
      laneHistory: ['Houston, TX → Memphis, TN', 'Dallas, TX → New Orleans, LA'],
    },
    {
      id: 'driver_005',
      name: 'Jennifer Lopez',
      companyName: 'Lopez Express',
      equipment: 'Flatbed',
      onTimePercentage: 99,
      lastCompletedLoad: {
        route: 'Portland, OR → Denver, CO',
        date: '2025-10-03',
      },
      status: 'Available',
      laneHistory: ['Portland, OR → Denver, CO', 'Seattle, WA → Salt Lake City, UT'],
    },
  ];

  const availableLoads = [
    {
      id: 'load_001',
      route: 'Dallas, TX → Phoenix, AZ',
      equipment: 'Flatbed',
      pickup: 'Dallas, TX',
      delivery: 'Phoenix, AZ',
    },
    {
      id: 'load_002',
      route: 'Chicago, IL → Atlanta, GA',
      equipment: 'Reefer',
      pickup: 'Chicago, IL',
      delivery: 'Atlanta, GA',
    },
    {
      id: 'load_003',
      route: 'Los Angeles, CA → Seattle, WA',
      equipment: 'Dry Van',
      pickup: 'Los Angeles, CA',
      delivery: 'Seattle, WA',
    },
  ];

  const handleSelectLoadForMatch = async (loadId: string) => {
    setSelectedLoadForMatch(loadId);
    setIsLoadingDrivers(true);
    
    const selectedLoad = availableLoads.find(load => load.id === loadId);
    if (selectedLoad) {
      try {
        const aiResponse = await runAITool('matchmaker', selectedLoad);
        console.log('Matchmaker AI Response:', aiResponse);
      } catch (error) {
        console.error('Error calling matchmaker AI:', error);
      }
      
      const filteredDrivers = mockDrivers.filter(driver => 
        driver.equipment === selectedLoad.equipment ||
        driver.laneHistory.some(lane => 
          lane.includes(selectedLoad.pickup) || lane.includes(selectedLoad.delivery)
        )
      );
      
      setTimeout(() => {
        setRecommendedDrivers(filteredDrivers.length > 0 ? filteredDrivers : mockDrivers.slice(0, 3));
        setIsLoadingDrivers(false);
      }, 800);
    }
  };

  const handleMatchDriver = async (driverId: string, driverName: string) => {
    if (!selectedLoadForMatch || !user?.id) {
      Alert.alert('Error', 'Unable to assign driver. Please try again.');
      return;
    }

    setIsAssigningDriver(true);
    try {
      const loadRef = doc(db, 'loads', selectedLoadForMatch);
      await setDoc(loadRef, {
        assignedDriver: {
          driverId,
          driverName,
          assignedAt: serverTimestamp(),
        },
        status: 'matched',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      Alert.alert('Success', `Driver ${driverName} has been assigned to this load!`, [
        {
          text: 'OK',
          onPress: () => {
            setShowMatchmaker(false);
            setSelectedLoadForMatch(null);
            setRecommendedDrivers([]);
          },
        },
      ]);
    } catch (error) {
      console.error('Error assigning driver:', error);
      Alert.alert('Assignment Failed', 'Unable to assign driver. Please try again.');
    } finally {
      setIsAssigningDriver(false);
    }
  };

  const loadDocuments = async () => {
    if (!user?.id) return;

    setIsLoadingDocs(true);
    try {
      const docsRef = collection(db, 'docs', user.id, 'documents');
      const docsSnapshot = await getDocs(query(docsRef));
      
      const docs: UploadedDocument[] = [];
      docsSnapshot.forEach((docSnap) => {
        docs.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as UploadedDocument);
      });
      
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUploadedDocs(docs);
      console.log('Loaded documents:', docs.length);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Load Failed', 'Unable to load documents. Please try again.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('Document picker cancelled');
        return;
      }

      const file = result.assets[0];
      if (!file) {
        Alert.alert('Error', 'No file selected.');
        return;
      }

      console.log('Selected file:', file.name, file.size, file.mimeType);
      setIsUploadingDoc(true);

      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `docs/${user.id}/${fileName}`);

      let fileBlob: Blob;
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
      } else {
        const response = await fetch(file.uri);
        fileBlob = await response.blob();
      }

      console.log('Uploading to Firebase Storage...');
      await uploadBytes(storageRef, fileBlob);
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Upload complete, URL:', downloadURL);

      try {
        const aiResponse = await runAITool('smartDocs', `Document: ${file.name}, Type: ${selectedDocType}`);
        console.log('Smart Docs AI Response:', aiResponse);
      } catch (error) {
        console.error('Error calling smart docs AI:', error);
      }

      const docData = {
        fileName: file.name,
        fileUrl: downloadURL,
        docType: selectedDocType,
        createdAt: new Date().toISOString(),
        size: file.size,
        mimeType: file.mimeType,
      };

      const docRef = collection(db, 'docs', user.id, 'documents');
      await addDoc(docRef, docData);
      console.log('Document metadata saved to Firestore');

      Alert.alert('Success', 'Document uploaded successfully!', [
        {
          text: 'OK',
          onPress: () => loadDocuments(),
        },
      ]);
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Upload Failed', 'Unable to upload document. Please try again.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleViewDocument = (fileUrl: string) => {
    if (Platform.OS === 'web') {
      window.open(fileUrl, '_blank');
    } else {
      Alert.alert('View Document', 'Document viewing on mobile will be implemented with a document viewer.');
    }
  };

  const handleDeleteDocument = async (docId: string, fileName: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(db, 'docs', user.id, 'documents', docId);
              await deleteDoc(docRef);
              console.log('Document deleted:', docId);
              await loadDocuments();
              Alert.alert('Success', 'Document deleted successfully.');
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Delete Failed', 'Unable to delete document. Please try again.');
            }
          },
        },
      ]
    );
  };

  const loadAutomations = async () => {
    if (!user?.id) return;

    setIsLoadingAutomations(true);
    try {
      const automationsRef = collection(db, 'automations', user.id, 'rules');
      const automationsSnapshot = await getDocs(query(automationsRef));
      
      const loadedAutomations: WorkflowAutomation[] = [];
      automationsSnapshot.forEach((docSnap) => {
        loadedAutomations.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as WorkflowAutomation);
      });
      
      loadedAutomations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAutomations(loadedAutomations);
      console.log('Loaded automations:', loadedAutomations.length);
    } catch (error) {
      console.error('Error loading automations:', error);
      Alert.alert('Load Failed', 'Unable to load automations. Please try again.');
    } finally {
      setIsLoadingAutomations(false);
    }
  };

  const handleToggleAutomation = async (automationId: string, currentState: boolean) => {
    if (!user?.id) return;

    try {
      const automationRef = doc(db, 'automations', user.id, 'rules', automationId);
      await setDoc(automationRef, {
        isActive: !currentState,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setAutomations(prev => prev.map(auto => 
        auto.id === automationId ? { ...auto, isActive: !currentState } : auto
      ));

      console.log(`Automation ${automationId} ${!currentState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling automation:', error);
      Alert.alert('Update Failed', 'Unable to update automation. Please try again.');
    }
  };

  const simulateTrigger = (automation: WorkflowAutomation) => {
    const notification: AutomationNotification = {
      id: Date.now().toString(),
      automationId: automation.id,
      message: automation.message,
      loadId: 'load_001',
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setNotifications(prev => [notification, ...prev]);
    Alert.alert('Automation Triggered', automation.message);
  };

  const initializeDefaultAutomations = async () => {
    if (!user?.id) return;

    const defaultAutomations: Omit<WorkflowAutomation, 'id'>[] = [
      {
        type: 'pickup_reminder',
        trigger: '2 hours before pickup',
        message: '🚚 Load #123: Pickup in 2 hours',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        type: 'late_delivery_alert',
        trigger: 'Driver is late to delivery',
        message: '⚠️ Load #123: Driver is running late',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        type: 'insurance_expiry',
        trigger: 'Insurance expires in 30 days',
        message: '📄 Insurance expires in 30 days - renew now',
        createdAt: new Date().toISOString(),
        isActive: false,
      },
      {
        type: 'document_expiry',
        trigger: 'Document expires soon',
        message: '📋 Document expiring soon - action required',
        createdAt: new Date().toISOString(),
        isActive: false,
      },
      {
        type: 'load_status_change',
        trigger: 'Load status changes',
        message: '✅ Load #123: Status updated to In Transit',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    try {
      const automationsRef = collection(db, 'automations', user.id, 'rules');
      const existingSnapshot = await getDocs(query(automationsRef));
      
      if (existingSnapshot.empty) {
        for (const automation of defaultAutomations) {
          try {
            const aiResponse = await runAITool('workflowAutomations', automation.trigger);
            console.log('Workflow Automation AI Response:', aiResponse);
          } catch (error) {
            console.error('Error calling workflow automation AI:', error);
          }
          await addDoc(automationsRef, automation);
        }
        console.log('Default automations initialized');
        await loadAutomations();
      }
    } catch (error) {
      console.error('Error initializing automations:', error);
    }
  };

  React.useEffect(() => {
    if (showSmartDocs) {
      loadDocuments();
    }
  }, [showSmartDocs]);

  React.useEffect(() => {
    if (showWorkflowAutomations) {
      loadAutomations();
      initializeDefaultAutomations();
    }
  }, [showWorkflowAutomations]);

  if (showWorkflowAutomations) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowWorkflowAutomations(false);
              setAutomations([]);
              setNotifications([]);
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Workflow Automations</Text>
          
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.workflowSection}>
            <View style={styles.workflowHeader}>
              <View style={styles.assistantIconContainer}>
                <Workflow size={24} color="#3B82F6" />
              </View>
              <Text style={styles.assistantTitle}>Automated Alerts & Reminders</Text>
              <Text style={styles.assistantDescription}>
                Set up automated notifications for your loads. Phase 1 uses simulated triggers.
              </Text>
            </View>

            {notifications.length > 0 && (
              <View style={styles.notificationsSection}>
                <Text style={styles.notificationsSectionTitle}>Recent Notifications</Text>
                {notifications.slice(0, 3).map((notification) => (
                  <View key={notification.id} style={styles.notificationCard}>
                    <View style={styles.notificationIcon}>
                      <Zap size={18} color="#F59E0B" />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                      <Text style={styles.notificationTime}>
                        {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.automationsListSection}>
              <Text style={styles.automationsListTitle}>Active Automations</Text>
              
              {isLoadingAutomations ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading automations...</Text>
                </View>
              ) : automations.length === 0 ? (
                <View style={styles.emptyAutomationsContainer}>
                  <Workflow size={48} color="#D1D5DB" />
                  <Text style={styles.emptyAutomationsText}>No automations configured</Text>
                  <Text style={styles.emptyAutomationsSubtext}>
                    Default automations will be created automatically
                  </Text>
                </View>
              ) : (
                <View style={styles.automationsList}>
                  {automations.map((automation) => (
                    <View key={automation.id} style={styles.automationCard}>
                      <View style={styles.automationCardHeader}>
                        <View style={styles.automationInfo}>
                          <Text style={styles.automationTrigger}>{automation.trigger}</Text>
                          <Text style={styles.automationMessage}>{automation.message}</Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.toggleSwitch,
                            automation.isActive && styles.toggleSwitchActive,
                          ]}
                          onPress={() => handleToggleAutomation(automation.id, automation.isActive)}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.toggleThumb,
                            automation.isActive && styles.toggleThumbActive,
                          ]} />
                        </TouchableOpacity>
                      </View>
                      
                      {automation.isActive && (
                        <TouchableOpacity
                          style={styles.testTriggerButton}
                          onPress={() => simulateTrigger(automation)}
                          activeOpacity={0.7}
                        >
                          <Zap size={14} color="#3B82F6" />
                          <Text style={styles.testTriggerButtonText}>Test Trigger</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.phase2InfoSection}>
              <View style={styles.phase2InfoHeader}>
                <Sparkles size={20} color="#F59E0B" />
                <Text style={styles.phase2InfoTitle}>Phase 2: Real-Time Triggers</Text>
              </View>
              <Text style={styles.phase2InfoDescription}>
                Coming soon: Automations will connect to real-time driver/load events:
              </Text>
              <View style={styles.phase2FeaturesList}>
                <View style={styles.phase2FeatureItem}>
                  <View style={styles.phase2FeatureBullet} />
                  <Text style={styles.phase2FeatureText}>GPS-based pickup/delivery reminders</Text>
                </View>
                <View style={styles.phase2FeatureItem}>
                  <View style={styles.phase2FeatureBullet} />
                  <Text style={styles.phase2FeatureText}>Automatic late delivery detection</Text>
                </View>
                <View style={styles.phase2FeatureItem}>
                  <View style={styles.phase2FeatureBullet} />
                  <Text style={styles.phase2FeatureText}>Document expiry monitoring</Text>
                </View>
                <View style={styles.phase2FeatureItem}>
                  <View style={styles.phase2FeatureBullet} />
                  <Text style={styles.phase2FeatureText}>Load status change notifications</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (showSmartDocs) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowSmartDocs(false);
              setUploadedDocs([]);
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Smart Docs</Text>
          
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.smartDocsSection}>
            <View style={styles.smartDocsHeader}>
              <View style={styles.assistantIconContainer}>
                <FileCheck size={24} color="#3B82F6" />
              </View>
              <Text style={styles.assistantTitle}>Smart Document Manager</Text>
              <Text style={styles.assistantDescription}>
                Upload and manage your shipping documents. AI extraction coming in Phase 2.
              </Text>
            </View>

            <View style={styles.uploadSection}>
              <Text style={styles.inputLabel}>Document Type</Text>
              <View style={styles.docTypeSelector}>
                {(['BOL', 'Insurance', 'Permit', 'Other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.docTypeButton,
                      selectedDocType === type && styles.docTypeButtonActive,
                    ]}
                    onPress={() => setSelectedDocType(type)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.docTypeButtonText,
                        selectedDocType === type && styles.docTypeButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.uploadButton, isUploadingDoc && styles.uploadButtonDisabled]}
                onPress={handleUploadDocument}
                disabled={isUploadingDoc}
                activeOpacity={0.8}
              >
                {isUploadingDoc ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Upload size={20} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>Upload Document</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.uploadHint}>Supported: PDF, JPG, PNG</Text>
            </View>

            <View style={styles.documentsListSection}>
              <View style={styles.documentsListHeader}>
                <Text style={styles.documentsListTitle}>Uploaded Documents</Text>
                {uploadedDocs.length > 0 && (
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={loadDocuments}
                    disabled={isLoadingDocs}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={16} color="#3B82F6" />
                  </TouchableOpacity>
                )}
              </View>

              {isLoadingDocs ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Loading documents...</Text>
                </View>
              ) : uploadedDocs.length === 0 ? (
                <View style={styles.emptyDocsContainer}>
                  <FileText size={48} color="#D1D5DB" />
                  <Text style={styles.emptyDocsText}>No documents uploaded yet</Text>
                  <Text style={styles.emptyDocsSubtext}>
                    Upload your first document to get started
                  </Text>
                </View>
              ) : (
                <View style={styles.documentsList}>
                  {uploadedDocs.map((doc) => (
                    <View key={doc.id} style={styles.documentCard}>
                      <View style={styles.documentCardHeader}>
                        <View style={styles.documentInfo}>
                          <View style={styles.documentIconContainer}>
                            <FileText size={20} color="#3B82F6" />
                          </View>
                          <View style={styles.documentDetails}>
                            <Text style={styles.documentFileName} numberOfLines={1}>
                              {doc.fileName}
                            </Text>
                            <View style={styles.documentMeta}>
                              <View style={[
                                styles.docTypeBadge,
                                doc.docType === 'BOL' && styles.docTypeBadgeBOL,
                                doc.docType === 'Insurance' && styles.docTypeBadgeInsurance,
                                doc.docType === 'Permit' && styles.docTypeBadgePermit,
                                doc.docType === 'Other' && styles.docTypeBadgeOther,
                              ]}>
                                <Text style={[
                                  styles.docTypeBadgeText,
                                  doc.docType === 'BOL' && styles.docTypeBadgeTextBOL,
                                  doc.docType === 'Insurance' && styles.docTypeBadgeTextInsurance,
                                  doc.docType === 'Permit' && styles.docTypeBadgeTextPermit,
                                  doc.docType === 'Other' && styles.docTypeBadgeTextOther,
                                ]}>
                                  {doc.docType}
                                </Text>
                              </View>
                              <Text style={styles.documentDate}>
                                {new Date(doc.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.documentActions}>
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => handleViewDocument(doc.fileUrl)}
                          activeOpacity={0.7}
                        >
                          <Eye size={16} color="#3B82F6" />
                          <Text style={styles.viewButtonText}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteDocument(doc.id, doc.fileName)}
                          activeOpacity={0.7}
                        >
                          <X size={16} color="#EF4444" />
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.aiPhase2Section}>
              <View style={styles.aiPhase2Header}>
                <Sparkles size={20} color="#F59E0B" />
                <Text style={styles.aiPhase2Title}>AI Extraction (Phase 2)</Text>
              </View>
              <Text style={styles.aiPhase2Description}>
                Coming soon: Automatic extraction of key fields from BOL, COI, and permits. AI will detect:
              </Text>
              <View style={styles.aiFeaturesList}>
                <View style={styles.aiFeatureItem}>
                  <View style={styles.aiFeatureBullet} />
                  <Text style={styles.aiFeatureText}>Shipper & Consignee details</Text>
                </View>
                <View style={styles.aiFeatureItem}>
                  <View style={styles.aiFeatureBullet} />
                  <Text style={styles.aiFeatureText}>Dates & Signatures</Text>
                </View>
                <View style={styles.aiFeatureItem}>
                  <View style={styles.aiFeatureBullet} />
                  <Text style={styles.aiFeatureText}>Policy expiry & coverage type</Text>
                </View>
                <View style={styles.aiFeatureItem}>
                  <View style={styles.aiFeatureBullet} />
                  <Text style={styles.aiFeatureText}>Missing or expired fields (highlighted in red)</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (showMatchmaker) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (selectedLoadForMatch) {
                setSelectedLoadForMatch(null);
                setRecommendedDrivers([]);
              } else {
                setShowMatchmaker(false);
              }
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{selectedLoadForMatch ? 'Recommended Drivers' : 'Matchmaker'}</Text>
          
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {!selectedLoadForMatch ? (
            <View style={styles.matchmakerSection}>
              <View style={styles.matchmakerHeader}>
                <View style={styles.assistantIconContainer}>
                  <Users size={24} color="#3B82F6" />
                </View>
                <Text style={styles.assistantTitle}>AI Matchmaker</Text>
                <Text style={styles.assistantDescription}>
                  Select a load to get AI-powered driver recommendations based on lane history, equipment match, and performance.
                </Text>
              </View>

              <View style={styles.loadsList}>
                <Text style={styles.loadsListTitle}>Select a Load</Text>
                {availableLoads.map((load) => (
                  <TouchableOpacity
                    key={load.id}
                    style={styles.loadCard}
                    onPress={() => handleSelectLoadForMatch(load.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.loadCardHeader}>
                      <Text style={styles.loadRoute}>{load.route}</Text>
                      <View style={styles.equipmentBadge}>
                        <Text style={styles.equipmentBadgeText}>{load.equipment}</Text>
                      </View>
                    </View>
                    <View style={styles.loadCardDetails}>
                      <Text style={styles.loadDetailText}>Pickup: {load.pickup}</Text>
                      <Text style={styles.loadDetailText}>Delivery: {load.delivery}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.driversSection}>
              {isLoadingDrivers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Finding best-fit drivers...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.driversHeader}>
                    <Sparkles size={20} color="#3B82F6" />
                    <Text style={styles.driversHeaderText}>
                      {recommendedDrivers.length} Recommended Driver{recommendedDrivers.length !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <View style={styles.driversList}>
                    {recommendedDrivers.map((driver) => (
                      <View key={driver.id} style={styles.driverCard}>
                        <View style={styles.driverCardHeader}>
                          <View style={styles.driverInfo}>
                            <Text style={styles.matchDriverName}>{driver.name}</Text>
                            {driver.companyName && (
                              <Text style={styles.companyName}>{driver.companyName}</Text>
                            )}
                          </View>
                          <View style={[
                            styles.statusBadge,
                            driver.status === 'Available' && styles.statusBadgeAvailable,
                            driver.status === 'Busy' && styles.statusBadgeBusy,
                            driver.status === 'Available Soon' && styles.statusBadgeSoon,
                          ]}>
                            <Text style={[
                              styles.statusBadgeText,
                              driver.status === 'Available' && styles.statusBadgeTextAvailable,
                              driver.status === 'Busy' && styles.statusBadgeTextBusy,
                              driver.status === 'Available Soon' && styles.statusBadgeTextSoon,
                            ]}>
                              {driver.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.driverStats}>
                          <View style={styles.driverStat}>
                            <Text style={styles.driverStatLabel}>Equipment</Text>
                            <Text style={styles.driverStatValue}>{driver.equipment}</Text>
                          </View>
                          <View style={styles.driverStat}>
                            <Text style={styles.driverStatLabel}>On-Time %</Text>
                            <Text style={styles.driverStatValue}>{driver.onTimePercentage}%</Text>
                          </View>
                        </View>

                        <View style={styles.lastLoadSection}>
                          <Text style={styles.lastLoadLabel}>Last Completed Load</Text>
                          <Text style={styles.lastLoadRoute}>{driver.lastCompletedLoad.route}</Text>
                          <Text style={styles.lastLoadDate}>
                            {new Date(driver.lastCompletedLoad.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.matchButton,
                            (isAssigningDriver || driver.status === 'Busy') && styles.matchButtonDisabled,
                          ]}
                          onPress={() => handleMatchDriver(driver.id, driver.name)}
                          disabled={isAssigningDriver || driver.status === 'Busy'}
                          activeOpacity={0.8}
                        >
                          {isAssigningDriver ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <>
                              <Users size={18} color="#FFFFFF" />
                              <Text style={styles.matchButtonText}>
                                {driver.status === 'Busy' ? 'Currently Busy' : 'Match This Driver'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (showReplyDrafts) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (selectedMessage) {
                setSelectedMessage(null);
                setReplySuggestions([]);
                setCustomReply('');
                setIsEditingReply(false);
              } else {
                setShowReplyDrafts(false);
              }
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{selectedMessage ? 'Reply to Driver' : 'Reply Drafts'}</Text>
          
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {!selectedMessage ? (
            <View style={styles.messagesSection}>
              <View style={styles.replyDraftsHeader}>
                <View style={styles.assistantIconContainer}>
                  <MessageSquare size={24} color="#3B82F6" />
                </View>
                <Text style={styles.assistantTitle}>Driver Messages</Text>
                <Text style={styles.assistantDescription}>
                  Select a message to generate AI-powered reply suggestions.
                </Text>
              </View>

              <View style={styles.messagesList}>
                {driverMessages.map((message) => (
                  <TouchableOpacity
                    key={message.id}
                    style={styles.messageCard}
                    onPress={() => handleSelectMessage(message)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={styles.driverName}>{message.driverName}</Text>
                      <Text style={styles.messageTime}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.messageText}>{message.messageText}</Text>
                    <View style={styles.loadBadge}>
                      <Text style={styles.loadBadgeText}>Load #{message.loadId.split('_')[1]}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.replySection}>
              <View style={styles.originalMessageCard}>
                <Text style={styles.originalMessageLabel}>Driver Message</Text>
                <View style={styles.messageHeader}>
                  <Text style={styles.driverName}>{selectedMessage.driverName}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(selectedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.originalMessageText}>{selectedMessage.messageText}</Text>
                <View style={styles.loadBadge}>
                  <Text style={styles.loadBadgeText}>Load #{selectedMessage.loadId.split('_')[1]}</Text>
                </View>
              </View>

              {isGeneratingReplies ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Generating reply suggestions...</Text>
                </View>
              ) : isEditingReply ? (
                <View style={styles.editReplySection}>
                  <Text style={styles.inputLabel}>Edit Your Reply</Text>
                  <TextInput
                    style={styles.replyTextArea}
                    value={editedReplyText}
                    onChangeText={setEditedReplyText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholder="Type your reply..."
                    placeholderTextColor={Colors.light.textSecondary}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setIsEditingReply(false);
                        setEditedReplyText('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sendReplyButton, isSendingReply && styles.sendReplyButtonDisabled]}
                      onPress={() => handleSendReply(editedReplyText)}
                      disabled={isSendingReply || !editedReplyText.trim()}
                      activeOpacity={0.8}
                    >
                      {isSendingReply ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Send size={18} color="#FFFFFF" />
                          <Text style={styles.sendReplyButtonText}>Send Reply</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsTitle}>AI-Generated Suggestions</Text>
                  <Text style={styles.suggestionsDescription}>
                    Tap to send or edit before sending
                  </Text>

                  {replySuggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionCard}>
                      <View style={styles.suggestionHeader}>
                        <View style={styles.toneBadge}>
                          <Text style={styles.toneBadgeText}>
                            {suggestion.tone.charAt(0).toUpperCase() + suggestion.tone.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.suggestionText}>{suggestion.text}</Text>
                      <View style={styles.suggestionActions}>
                        <TouchableOpacity
                          style={styles.editSuggestionButton}
                          onPress={() => handleEditReply(suggestion.text)}
                          activeOpacity={0.7}
                        >
                          <Edit3 size={16} color="#3B82F6" />
                          <Text style={styles.editSuggestionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.useReplyButton, isSendingReply && styles.useReplyButtonDisabled]}
                          onPress={() => handleSendReply(suggestion.text)}
                          disabled={isSendingReply}
                          activeOpacity={0.8}
                        >
                          {isSendingReply ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <>
                              <Send size={16} color="#FFFFFF" />
                              <Text style={styles.useReplyButtonText}>Use Reply</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <View style={styles.customReplySection}>
                    <Text style={styles.inputLabel}>Or Write Custom Reply</Text>
                    <TextInput
                      style={styles.replyTextArea}
                      value={customReply}
                      onChangeText={setCustomReply}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      placeholder="Type your custom reply..."
                      placeholderTextColor={Colors.light.textSecondary}
                    />
                    <TouchableOpacity
                      style={[styles.sendCustomReplyButton, (isSendingReply || !customReply.trim()) && styles.sendCustomReplyButtonDisabled]}
                      onPress={() => handleSendReply(customReply)}
                      disabled={isSendingReply || !customReply.trim()}
                      activeOpacity={0.8}
                    >
                      {isSendingReply ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Send size={18} color="#FFFFFF" />
                          <Text style={styles.sendCustomReplyButtonText}>Send Custom Reply</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (showListingAssistant || showVoiceToPost) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowListingAssistant(false);
              setShowVoiceToPost(false);
              setRawInput('');
              setGeneratedDraft(null);
              setEditedDraft(null);
              setIsEditing(false);
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{showVoiceToPost ? 'Voice-to-Post' : 'Listing Assistant'}</Text>
          
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.assistantSection}>
            <View style={styles.assistantHeader}>
              <View style={styles.assistantIconContainer}>
                {showVoiceToPost ? <Mic size={24} color="#3B82F6" /> : <Sparkles size={24} color="#3B82F6" />}
              </View>
              <Text style={styles.assistantTitle}>
                {showVoiceToPost ? 'Voice-to-Post' : 'AI Load Draft Generator'}
              </Text>
              <Text style={styles.assistantDescription}>
                {showVoiceToPost
                  ? 'Speak your load details and AI will transcribe and structure them into a clean draft.'
                  : 'Paste or type rough load details and let AI structure them into a clean draft.'}
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {showVoiceToPost ? 'Transcribed Text' : 'Raw Load Details'}
              </Text>
              
              {showVoiceToPost && (
                <View style={styles.voiceControls}>
                  <TouchableOpacity
                    style={[
                      styles.micButton,
                      isRecording && styles.micButtonRecording,
                      (isTranscribing || isGenerating) && styles.micButtonDisabled,
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing || isGenerating}
                    activeOpacity={0.8}
                  >
                    {isTranscribing ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : isRecording ? (
                      <>
                        <MicOff size={24} color="#FFFFFF" />
                        <Text style={styles.micButtonText}>Stop Recording</Text>
                      </>
                    ) : (
                      <>
                        <Mic size={24} color="#FFFFFF" />
                        <Text style={styles.micButtonText}>Start Recording</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>Recording...</Text>
                    </View>
                  )}
                  {isTranscribing && (
                    <Text style={styles.transcribingText}>Transcribing audio...</Text>
                  )}
                </View>
              )}
              
              <TextInput
                style={styles.textArea}
                placeholder={showVoiceToPost
                  ? "Transcribed text will appear here..."
                  : "Example: pickup Dallas, drop Phoenix, need flatbed, ASAP"}
                placeholderTextColor={Colors.light.textSecondary}
                value={rawInput}
                onChangeText={setRawInput}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!isGenerating && !isRecording && !isTranscribing}
              />
              
              {!showVoiceToPost && (
                <TouchableOpacity
                  style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                  onPress={() => handleGenerateDraft()}
                  disabled={isGenerating}
                  activeOpacity={0.8}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Sparkles size={20} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>Generate Clean Draft</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {generatedDraft && (
              <View style={styles.draftPreview}>
                <View style={styles.draftHeader}>
                  <Text style={styles.draftTitle}>Generated Draft</Text>
                  {!isEditing && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setIsEditing(true)}
                      activeOpacity={0.7}
                    >
                      <Edit3 size={16} color="#3B82F6" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isEditing ? (
                  <View style={styles.editForm}>
                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Pickup</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={editedDraft?.pickup}
                        onChangeText={(text) => setEditedDraft(prev => prev ? { ...prev, pickup: text } : null)}
                        placeholder="City, State"
                        placeholderTextColor={Colors.light.textSecondary}
                      />
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Delivery</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={editedDraft?.delivery}
                        onChangeText={(text) => setEditedDraft(prev => prev ? { ...prev, delivery: text } : null)}
                        placeholder="City, State"
                        placeholderTextColor={Colors.light.textSecondary}
                      />
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Equipment</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={editedDraft?.equipment}
                        onChangeText={(text) => setEditedDraft(prev => prev ? { ...prev, equipment: text } : null)}
                        placeholder="Equipment Type"
                        placeholderTextColor={Colors.light.textSecondary}
                      />
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Notes</Text>
                      <TextInput
                        style={[styles.fieldInput, styles.fieldInputMultiline]}
                        value={editedDraft?.notes}
                        onChangeText={(text) => setEditedDraft(prev => prev ? { ...prev, notes: text } : null)}
                        placeholder="Special notes, timing, requirements"
                        placeholderTextColor={Colors.light.textSecondary}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>

                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setEditedDraft(generatedDraft);
                          setIsEditing(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => setIsEditing(false)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.draftContent}>
                    <View style={styles.draftField}>
                      <Text style={styles.draftFieldLabel}>Pickup:</Text>
                      <Text style={styles.draftFieldValue}>{editedDraft?.pickup}</Text>
                    </View>
                    <View style={styles.draftField}>
                      <Text style={styles.draftFieldLabel}>Delivery:</Text>
                      <Text style={styles.draftFieldValue}>{editedDraft?.delivery}</Text>
                    </View>
                    <View style={styles.draftField}>
                      <Text style={styles.draftFieldLabel}>Equipment:</Text>
                      <Text style={styles.draftFieldValue}>{editedDraft?.equipment}</Text>
                    </View>
                    <View style={styles.draftField}>
                      <Text style={styles.draftFieldLabel}>Notes:</Text>
                      <Text style={styles.draftFieldValue}>{editedDraft?.notes}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                      onPress={handleSaveDraft}
                      disabled={isSaving}
                      activeOpacity={0.8}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save & Post Draft</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>AI-Powered Tools</Text>
        
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Work Smarter With AI</Text>
          <Text style={styles.heroDescription}>
            Built for trucking operations—cut busywork, move faster on tenders, and make better lane decisions.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                  <Icon size={20} color={stat.iconColor} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statDescription}>{stat.description}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          
          <View style={styles.toolsList}>
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.toolItem}
                  onPress={tool.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.toolIconContainer, { backgroundColor: tool.iconBg }]}>
                    <Icon size={20} color={tool.iconColor} />
                  </View>
                  <View style={styles.toolContent}>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.whySection}>
          <Text style={styles.whySectionTitle}>Why It Matters In Trucking</Text>
          <Text style={styles.whyDescription}>
            Rates move hourly and ops is nonstop. AI closes the gap: faster listings mean earlier carrier interest, auto-extracted documents avoid rekeying errors, and trend guidance helps you price confidently for seasonality. Teams ship more with less manual overhead and fewer misses.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  signOutButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.danger,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.danger,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  heroSection: {
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  statDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 20,
  },
  toolsList: {
    gap: 20,
  },
  toolItem: {
    flexDirection: 'row',
    gap: 14,
  },
  toolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  whySection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  whySectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  whyDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  assistantSection: {
    paddingTop: 20,
  },
  assistantHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  assistantIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  assistantTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  assistantDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  draftPreview: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  draftTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  draftContent: {
    gap: 16,
  },
  draftField: {
    gap: 4,
  },
  draftFieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  draftFieldValue: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
  },
  editForm: {
    gap: 16,
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  fieldInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  doneButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  voiceControls: {
    marginBottom: 16,
    gap: 12,
  },
  micButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  micButtonDisabled: {
    opacity: 0.6,
  },
  micButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  transcribingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  messagesSection: {
    paddingTop: 20,
  },
  replyDraftsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  messagesList: {
    gap: 12,
  },
  messageCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  messageTime: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  messageText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  loadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  loadBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  replySection: {
    paddingTop: 20,
    gap: 20,
  },
  originalMessageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  originalMessageLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase' as const,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  originalMessageText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: '500' as const,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  suggestionsSection: {
    gap: 16,
  },
  suggestionsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  suggestionsDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  suggestionCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionHeader: {
    marginBottom: 12,
  },
  toneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toneBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  suggestionText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  suggestionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editSuggestionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  editSuggestionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  useReplyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  useReplyButtonDisabled: {
    opacity: 0.6,
  },
  useReplyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  customReplySection: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  replyTextArea: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  sendCustomReplyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendCustomReplyButtonDisabled: {
    opacity: 0.6,
  },
  sendCustomReplyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  editReplySection: {
    gap: 12,
  },
  sendReplyButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sendReplyButtonDisabled: {
    opacity: 0.6,
  },
  sendReplyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  matchmakerSection: {
    paddingTop: 20,
  },
  matchmakerHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadsList: {
    gap: 12,
  },
  loadsListTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  loadCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadRoute: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  equipmentBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  equipmentBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  loadCardDetails: {
    gap: 4,
  },
  loadDetailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  driversSection: {
    paddingTop: 20,
  },
  driversHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  driversHeaderText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  driversList: {
    gap: 16,
  },
  driverCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  driverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  driverInfo: {
    flex: 1,
    gap: 4,
  },
  matchDriverName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  companyName: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 12,
  },
  statusBadgeAvailable: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeBusy: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeSoon: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusBadgeTextAvailable: {
    color: '#059669',
  },
  statusBadgeTextBusy: {
    color: '#DC2626',
  },
  statusBadgeTextSoon: {
    color: '#D97706',
  },
  driverStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  driverStat: {
    flex: 1,
    gap: 4,
  },
  driverStatLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  driverStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  lastLoadSection: {
    marginBottom: 16,
    gap: 4,
  },
  lastLoadLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  lastLoadRoute: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  lastLoadDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  matchButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  matchButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
    opacity: 0.6,
  },
  matchButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  smartDocsSection: {
    paddingTop: 20,
  },
  smartDocsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadSection: {
    marginBottom: 32,
  },
  docTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  docTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  docTypeButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  docTypeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  docTypeButtonTextActive: {
    color: '#3B82F6',
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  uploadHint: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  documentsListSection: {
    marginBottom: 24,
  },
  documentsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentsListTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDocsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyDocsText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDocsSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  documentsList: {
    gap: 12,
  },
  documentCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  documentCardHeader: {
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentDetails: {
    flex: 1,
    gap: 6,
  },
  documentFileName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  docTypeBadgeBOL: {
    backgroundColor: '#DBEAFE',
  },
  docTypeBadgeInsurance: {
    backgroundColor: '#D1FAE5',
  },
  docTypeBadgePermit: {
    backgroundColor: '#FEF3C7',
  },
  docTypeBadgeOther: {
    backgroundColor: '#F3F4F6',
  },
  docTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  docTypeBadgeTextBOL: {
    color: '#1E40AF',
  },
  docTypeBadgeTextInsurance: {
    color: '#059669',
  },
  docTypeBadgeTextPermit: {
    color: '#D97706',
  },
  docTypeBadgeTextOther: {
    color: '#6B7280',
  },
  documentDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  aiPhase2Section: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  aiPhase2Header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiPhase2Title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#92400E',
  },
  aiPhase2Description: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 12,
  },
  aiFeaturesList: {
    gap: 8,
  },
  aiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiFeatureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  aiFeatureText: {
    fontSize: 13,
    color: '#78350F',
    flex: 1,
  },
  workflowSection: {
    paddingTop: 20,
  },
  workflowHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  notificationsSection: {
    marginBottom: 24,
  },
  notificationsSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationMessage: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#78350F',
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#92400E',
  },
  automationsListSection: {
    marginBottom: 24,
  },
  automationsListTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  emptyAutomationsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyAutomationsText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyAutomationsSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  automationsList: {
    gap: 12,
  },
  automationCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  automationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  automationInfo: {
    flex: 1,
    gap: 6,
  },
  automationTrigger: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  automationMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  testTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
  },
  testTriggerButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  phase2InfoSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  phase2InfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  phase2InfoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#92400E',
  },
  phase2InfoDescription: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 12,
  },
  phase2FeaturesList: {
    gap: 8,
  },
  phase2FeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phase2FeatureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  phase2FeatureText: {
    fontSize: 13,
    color: '#78350F',
    flex: 1,
  },
});
