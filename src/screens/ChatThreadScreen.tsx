import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Heart, MessageCircle, Zap, Share2, ArrowLeft, CheckCheck } from 'lucide-react';
import { ChatBackground } from '../components/ChatBackground';
import { ChatHeader } from '../components/ChatHeader';
import { ChatCustomizationSheet } from '../components/ChatCustomizationSheet';
import { MessageList } from '../components/MessageList';
import { ChatInput } from '../components/ChatInput';
import { GameChallengePicker } from '../components/GameChallengePicker';
import { GameModal } from '../components/GameModal';
import { Message, Theme, Mood } from '../types';
import { AVAILABLE_GAMES } from '../constants/games';

import { SparkFlowDetailModal } from '../components/SparkFlowDetailModal';
import { SparkFlowMilestoneModal, BrokenSparkFlowScreen } from '../components/SparkFlowScreens';
import { getSparkFlow, updateSparkFlow, SparkFlowData } from '../lib/sparkFlowEngine';
import { CHAT_MOODS } from '../constants/moods';
import { CHAT_THEMES } from '../constants/themes';
import { useChatEnergy } from '../hooks/useChatEnergy';

import { getTranslation, detectLanguage } from '../lib/translationEngine';

import { getSmartReplies } from '../lib/smartRepliesEngine';

const generateWaveform = (barCount = 40) => {
  return Array.from({ length: barCount }, () => {
    const base = 0.2 + Math.random() * 0.4;
    const spike = Math.random() > 0.8 ? Math.random() * 0.4 : 0;
    return Math.min(base + spike, 1.0);
  });
};

const MOCK_MESSAGES: Message[] = [
  {
    id: "m1",
    sender: "them",
    text: "నమస్కారం! ఎలా ఉన్నావు?",
    language: "Telugu",
    translation: "Hello! How are you?",
    time: "10:30 AM",
    type: "text"
  },
  {
    id: "m2",
    sender: "me",
    text: "I'm great! How about you?",
    language: "English",
    time: "10:31 AM",
    type: "text",
    status: "read"
  },
  {
    id: "m3",
    sender: "them",
    text: "వైబ్ చూశావా? చాలా బాగుంది!",
    language: "Telugu",
    translation: "Did you see the vibe? It's really good!",
    time: "10:32 AM",
    type: "text"
  },
  {
    id: "m4",
    sender: "them",
    text: "आज रात गेम खेलते हैं?",
    language: "Hindi",
    translation: "Shall we play a game tonight?",
    time: "10:33 AM",
    type: "text"
  },
  {
    id: "m5",
    sender: "me",
    text: "Yes! Emoji Guess? 🎯",
    language: "English",
    time: "10:34 AM",
    type: "text",
    status: "read"
  },
  {
    id: "s1",
    sender: "them",
    text: "Did you see that vibe? 🔥",
    time: "10:32 AM",
    type: "text",
    language: "English"
  },
  {
    id: "s2",
    sender: "me",
    text: "Yes the vibe was amazing!",
    time: "10:33 AM",
    type: "text",
    status: "read",
    language: "English"
  },
  {
    id: "s3",
    sender: "them",
    text: "Game night at 8 PM! 🎮",
    time: "11:00 AM",
    type: "text",
    language: "English"
  },
  {
    id: "s4",
    sender: "me",
    text: "Game night sounds perfect!",
    time: "11:01 AM",
    type: "text",
    status: "read",
    language: "English"
  },
  {
    id: "s5",
    sender: "them",
    text: "Check this vibe I found 👀",
    time: "12:30 PM",
    type: "text",
    language: "English"
  },
  {
    id: "s6",
    sender: "them",
    text: "That vibe got 50K pulses! ⚡",
    time: "12:31 PM",
    type: "text",
    language: "English"
  },
  {
    id: "s7",
    sender: "me",
    text: "Sending you the vibe link",
    time: "12:32 PM",
    type: "text",
    status: "read",
    language: "English"
  }
];

export default function ChatThreadScreen() {
  const navigate = useNavigate();
  const { id: chatId } = useParams();
  
  // mock users 
  const recipientUser = { displayName: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200' };

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [showGamePicker, setShowGamePicker] = useState(false);
  
  const [customization, setCustomization] = useState(() => {
     const stored = localStorage.getItem(`chat_custom_${chatId || 'default'}`);
     if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
     }
     
     // Migration or default
     const storedTheme = localStorage.getItem(`chat_theme_${chatId || 'default'}`);
     let defaultWallpaper = 'dark_space';
     if (storedTheme) {
        try { defaultWallpaper = JSON.parse(storedTheme).themeId || 'dark_space'; } catch (e) {}
     }
     
     return {
        nickname: '',
        wallpaper: defaultWallpaper,
        bubbleColor: 'purple',
        theirBubbleStyle: 'glass',
        textSize: 'medium',
        font: 'default'
     };
  });
  
  const [showCustomization, setShowCustomization] = useState(false);

  // Keep energyOn logic if we want, or just assume it's true
  const [energyOn, setEnergyOn] = useState<boolean>(() => {
     const stored = localStorage.getItem(`chat_theme_${chatId || 'default'}`);
     if (stored) {
        try { return JSON.parse(stored).energyOn; } catch (e) {}
     }
     return true;
  });

  const moodStored = localStorage.getItem('chat_mood');
  const [mood, setMood] = useState<Mood>(() => {
    if (moodStored) {
      try {
        const parsed = JSON.parse(moodStored);
        if (new Date().toDateString() === new Date(parsed.timestamp).toDateString()) {
           return parsed.mood;
        }
      } catch (e) {}
    }
    return null;
  });
  
  const [otherMood, setOtherMood] = useState<Mood>('chill');
  
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [moodNotification, setMoodNotification] = useState<{name: string, mood: string} | null>(null);
  const [reactionToast, setReactionToast] = useState<{name: string, emoji: string, moodEmoji: string, moodLabel: string} | null>(null);

  useEffect(() => {
    if (mood) {
      localStorage.setItem('chat_mood', JSON.stringify({ mood, timestamp: Date.now() }));
    } else {
      localStorage.removeItem('chat_mood');
    }
  }, [mood]);
  
  const handleApplyCustomization = (settings: any) => {
     setCustomization(settings);
     localStorage.setItem(`chat_custom_${chatId || 'default'}`, JSON.stringify(settings));
     setShowCustomization(false);
     setSearchToast("Chat customized! 🎨");
     setTimeout(() => setSearchToast(null), 3000);
  };
  
  const handleResetCustomization = () => {
     localStorage.removeItem(`chat_custom_${chatId || 'default'}`);
     const defaultSettings = {
        nickname: '',
        wallpaper: 'dark_space',
        bubbleColor: 'purple',
        theirBubbleStyle: 'glass',
        textSize: 'medium',
        font: 'default'
     };
     setCustomization(defaultSettings);
     setShowCustomization(false);
     setSearchToast("Chat reset ↩️");
     setTimeout(() => setSearchToast(null), 3000);
  };
  
  const handleEnergyToggle = () => {
      const newVal = !energyOn;
      setEnergyOn(newVal);
      localStorage.setItem(`chat_theme_${chatId || 'default'}`, JSON.stringify({
        energyOn: newVal
     }));
  }

  const [autoTranslate, setAutoTranslate] = useState<boolean>(() => {
     const stored = localStorage.getItem(`translate_${chatId || 'default'}`);
     if (stored) {
         try { return JSON.parse(stored); } catch (e) {}
     }
     return true;
  });

  const handleToggleAutoTranslate = () => {
    const newVal = !autoTranslate;
    setAutoTranslate(newVal);
    localStorage.setItem(`translate_${chatId || 'default'}`, JSON.stringify(newVal));
    setMessages(prev => prev.map(m => {
       if (m.type === 'text' && m.language && m.language !== 'English') {
          return { ...m, showTranslation: newVal };
       }
       return m;
    }));
  };

  const toggleTranslateMessage = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
         return { ...m, showTranslation: !m.showTranslation };
      }
      return m;
    }));
  };

  useEffect(() => {
    // Process initial messages for translation display
    setMessages(prev => prev.map(m => {
       if (m.type === 'text' && m.language && m.language !== 'English') {
          if (m.showTranslation === undefined) {
             return { ...m, showTranslation: autoTranslate };
          }
       }
       return m;
    }));
    
    const handleHideTranslation = (e: any) => toggleTranslateMessage(e.detail);
    window.addEventListener('hide-translation', handleHideTranslation as EventListener);
    return () => window.removeEventListener('hide-translation', handleHideTranslation as EventListener);
  }, []);

  const energyLevel = useChatEnergy(messages);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const [smartRepliesEnabled, setSmartRepliesEnabled] = useState<boolean>(() => {
     const stored = localStorage.getItem('skrim_smart_replies');
     if (stored) {
         try { return JSON.parse(stored); } catch (e) {}
     }
     return true;
  });

  const [activeSmartReplies, setActiveSmartReplies] = useState<string[]>([]);
  const hideTimerRef = useRef<any>(null);
  const showTimerRef = useRef<any>(null);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    if (smartRepliesEnabled && lastMsg && lastMsg.sender !== 'me' && lastMsg.type === 'text') {
       showTimerRef.current = setTimeout(() => {
          setActiveSmartReplies(getSmartReplies((lastMsg as any).text, mood?.id));
          
          hideTimerRef.current = setTimeout(() => {
             setActiveSmartReplies([]);
          }, 8000);
       }, 300);
    } else {
       setActiveSmartReplies([]);
    }
    
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [messages, smartRepliesEnabled, mood]);

  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedMessagesPage, setShowPinnedMessagesPage] = useState(false);
  const [showAnnounceComposer, setShowAnnounceComposer] = useState(false);
  const [announceText, setAnnounceText] = useState('');
  const [announcePin, setAnnouncePin] = useState(true);
  const [announceNotify, setAnnounceNotify] = useState(true);
  const [announceSchedule, setAnnounceSchedule] = useState(false);
  
  // mock admin role
  const isAdmin = true; // Hardcode for now as per design
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  
  // Search state
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('All');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [searchToast, setSearchToast] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const stored = localStorage.getItem(`search_history_${chatId || 'default'}`);
    return stored ? JSON.parse(stored) : [];
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [reactionSheetMessage, setReactionSheetMessage] = useState<Message | null>(null);
  const [seenByMessage, setSeenByMessage] = useState<Message | null>(null);
  const [mediaViewer, setMediaViewer] = useState<any>(null);

  const [sparkFlow, setSparkFlow] = useState<SparkFlowData | null>(null);
  const [showSparkDetail, setShowSparkDetail] = useState(false);
  const [showMilestone, setShowMilestone] = useState<number | null>(null);
  const [showBrokenFlow, setShowBrokenFlow] = useState<number | null>(null);
  
  const [activeChallengeMessage, setActiveChallengeMessage] = useState<Message | null>(null);

  const [sendRipple, setSendRipple] = useState<{id: string, color: string} | null>(null);

  useEffect(() => {
    if (chatId) {
      const flow = getSparkFlow(chatId);
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const today = new Date().toDateString();
      if (flow && flow.lastDate !== today && flow.lastDate !== yesterday && flow.count > 1 && !flow.isFrozen) {
         setShowBrokenFlow(flow.bestSparkFlow);
      } else {
         setSparkFlow(flow);
      }
    }
    
    const handleOpenMediaViewer = (e: any) => setMediaViewer(e.detail);
    window.addEventListener('open-media-viewer', handleOpenMediaViewer as EventListener);
    return () => window.removeEventListener('open-media-viewer', handleOpenMediaViewer as EventListener);
  }, []);
  
  const triggerSparkFlowUpdate = () => {
    if (chatId) {
      const { sparkFlow: newFlow, milestoneReached } = updateSparkFlow(chatId);
      setSparkFlow(newFlow);
      if (milestoneReached) setShowMilestone(milestoneReached);
    }
  };

  const executeSendRipple = () => {
     let color = 'white';
     if (mood) {
         const obj = CHAT_MOODS.find(m => m.id === mood);
         if (obj) color = obj.bubbleGradient[0];
     } else {
         const tobj = CHAT_THEMES.find(t => t.id === customization.wallpaper);
         if (tobj) color = tobj.orbs[0];
     }
     setSendRipple({ id: Date.now().toString(), color });
     setTimeout(() => setSendRipple(null), 600);
  }

  const handleSetMood = (newMood: Mood) => {
    setMood(newMood);
    if (newMood) {
      setTimeout(() => {
        const nextMood = newMood === 'chill' ? 'love' : 'chill';
        const nextMoodObj = CHAT_MOODS.find(m => m.id === nextMood);
        if (nextMoodObj) {
           setOtherMood(nextMood);
           setMoodNotification({ name: 'Priya', mood: `${nextMoodObj.emoji} ${nextMoodObj.label}` });
           setTimeout(() => setMoodNotification(null), 3000);
        }
      }, 5000);
    }
  };

  // Search Logic
  useEffect(() => {
    if (!searchMode) {
      setSearchQuery('');
      setSearchResults([]);
      setActiveSearchIndex(-1);
    } else {
       if (searchInputRef.current) {
          searchInputRef.current.focus();
       }
    }
  }, [searchMode]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setActiveSearchIndex(-1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = messages.filter(m => {
       // Apply filters
       if (searchFilter === 'Media' && m.type !== 'image' && m.type !== 'video' && m.type !== 'voice') return false;
       if (searchFilter === 'Files' && m.type !== 'file') return false;
       if (searchFilter === 'Links' && m.type !== 'link' && !(m.type === 'text' && (m.text?.includes('http') || m.text?.includes('link')))) return false;
       if (searchFilter === 'Songs' && m.type !== 'music') return false;
       
       // Voice messages shouldn't be text searched directly, but let's say they match if we are just showing nearby
       if (m.type === 'voice') return false;

       // Search in text and translation, captions, file names, song titles
       const textMatch = m.text?.toLowerCase().includes(query) || false;
       const translationMatch = m.showTranslation && m.translation?.toLowerCase().includes(query) || false;
       const captionMatch = (m.type === 'image' || m.type === 'video') && (m as any).caption?.toLowerCase().includes(query);
       const fileMatch = m.type === 'file' && (m as any).file?.name?.toLowerCase().includes(query);
       const songMatch = m.type === 'song' && ((m as any).song?.title?.toLowerCase().includes(query) || (m as any).song?.artist?.toLowerCase().includes(query));
       
       return textMatch || translationMatch || captionMatch || fileMatch || songMatch;
    }).map(m => m.id);

    setSearchResults(results);
    setActiveSearchIndex(results.length > 0 ? results.length - 1 : -1);
  }, [searchQuery, searchFilter, messages]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`message-${msgId}`);
    if (el) {
       el.scrollIntoView({ behavior: 'smooth', block: 'center' });
       // Add a brief scale effect
       el.classList.add('scale-[1.03]');
       setTimeout(() => el.classList.remove('scale-[1.03]'), 300);
    }
  };

  useEffect(() => {
     if (activeSearchIndex >= 0 && activeSearchIndex < searchResults.length) {
        scrollToMessage(searchResults[activeSearchIndex]);
     }
  }, [activeSearchIndex, searchResults]);

  const saveSearchHistory = (q: string) => {
     const trimmed = q.trim();
     if (!trimmed) return;
     const newHistory = [trimmed, ...searchHistory.filter(h => h !== trimmed)].slice(0, 5);
     setSearchHistory(newHistory);
     localStorage.setItem(`search_history_${chatId || 'default'}`, JSON.stringify(newHistory));
  };
  
  const handleSendMessage = (text: string, isPulsed: boolean = false) => {
    const lang = detectLanguage(text);
    const translationData = getTranslation(text);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      mood: mood || undefined,
      status: 'sending',
      isPulsed,
      language: lang,
      translation: translationData ? translationData.translated : (lang !== 'English' ? 'Translated mock data' : undefined),
      showTranslation: lang !== 'English' ? autoTranslate : false,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        senderName: replyingTo.sender === 'me' ? 'You' : 'Priya Sharma',
        text: replyingTo.type === 'text' ? replyingTo.text : 'Attachment'
      } : undefined
    };
    
    setMessages(prev => [...prev, newMessage]);
    setReplyingTo(null);
    triggerSparkFlowUpdate();
    executeSendRipple();

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
      }, 1000);
    }, 800);
    
    if (messages.length % 2 === 0) {
      setTimeout(() => {
        setIsOtherTyping(true);
        setTimeout(() => {
          setIsOtherTyping(false);
          const reply: Message = {
             id: Date.now().toString(),
             sender: 'them',
             type: 'text',
             text: 'I know right?! 🤯 So crazy',
             mood: otherMood,
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, reply]);
          setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
        }, 2000);
      }, 2000);
    }
  };

  const handleAcceptChallenge = (message: Message) => {
    setActiveChallengeMessage(message);
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, challengeStatus: 'accepted' } : m));
  };

  const handleDeclineChallenge = (message: Message) => {
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, challengeStatus: 'declined' } : m));
  };

  const handleRematchChallenge = (message: Message) => {
    setActiveChallengeMessage(message);
  };

  const handleFinishGame = (myScore: number, opponentScore: number) => {
    if (!activeChallengeMessage) return;
    
    // We update the original message to 'completed'
    setMessages(prev => prev.map(m => m.id === activeChallengeMessage.id ? { ...m, challengeStatus: 'completed' } : m));
    
    const isChallenger = activeChallengeMessage.sender === 'me';
    const challengerId = 'me';
    const opponentId = 'them';
    
    const resultMessageId = Date.now().toString();
    const resultMessage: Message = {
      id: resultMessageId,
      sender: 'me',
      type: 'challenge_result',
      game: activeChallengeMessage.game || 'Game',
      gameLabel: activeChallengeMessage.gameLabel || 'Game',
      gameEmoji: activeChallengeMessage.gameEmoji || '🎮',
      challengerId,
      opponentId,
      challengerName: isChallenger ? 'You' : recipientUser.displayName,
      opponentName: isChallenger ? recipientUser.displayName : 'You',
      challengerScore: isChallenger ? myScore : opponentScore,
      opponentScore: isChallenger ? opponentScore : myScore,
      winnerId: myScore > opponentScore ? 'me' : (myScore < opponentScore ? 'them' : 'tie'),
      resultMessage: myScore > opponentScore ? `Haha! Beat that! 🔥` : (myScore < opponentScore ? `Argh, you got me! 😭` : `It's a tie! 🤝`),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };

    setActiveChallengeMessage(null);
    setMessages(prev => [...prev, resultMessage]);
    triggerSparkFlowUpdate();
    executeSendRipple();
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === resultMessageId ? { ...m, status: 'sent' } : m));
    }, 500);
  };

  const handleSendChallenge = (challengeData: any) => {
    setShowGamePicker(false);
    const newMessageId = Date.now().toString();
    const newMessage: Message = {
      id: newMessageId,
      sender: 'me',
      type: 'challenge',
      game: challengeData.game,
      gameLabel: challengeData.gameLabel,
      gameEmoji: challengeData.gameEmoji,
      score: challengeData.score,
      challengeMessage: challengeData.challengeMessage,
      challengeStatus: 'pending',
      expiresAt: challengeData.expiresAt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMessage]);
    triggerSparkFlowUpdate();
    executeSendRipple();
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, status: 'sent' } : m));
    }, 500);
  };

  const handleSendVoice = (duration: number, waveform: number[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'voice',
      duration,
      waveform,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    triggerSparkFlowUpdate();
    executeSendRipple();

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
      setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m)), 1000);
    }, 800);
  };

  const handleSendGif = (gif: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'gif',
      gif,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleSendSticker = (sticker: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'sticker',
      sticker,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };
    setMessages(prev => [...prev, newMessage]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleSendAttachment = (type: string, data: any) => {
    const newMessageId = Date.now().toString();
    const baseMessage = {
      id: newMessageId,
      sender: 'me' as const,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending' as const,
      uploadProgress: 0
    };

    let appendedMessage: Message | null = null;
    if (type === 'photo') appendedMessage = { ...baseMessage, type: 'photo', photo: data } as any;
    else if (type === 'video') appendedMessage = { ...baseMessage, type: 'video', video: data } as any;
    else if (type === 'file') appendedMessage = { ...baseMessage, type: 'file', file: data } as any;
    else if (type === 'song') { appendedMessage = { ...baseMessage, type: 'song', song: data } as any; delete appendedMessage?.uploadProgress; }
    else if (type === 'location') { appendedMessage = { ...baseMessage, type: 'location', location: data } as any; delete appendedMessage?.uploadProgress; }

    if (appendedMessage) {
      setMessages(prev => [...prev, appendedMessage!]);
      triggerSparkFlowUpdate();
      executeSendRipple();

      if (appendedMessage.uploadProgress !== undefined) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15 + 5;
          if (progress >= 100) {
            clearInterval(interval);
            setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, uploadProgress: undefined, status: 'sent' } : m));
          } else {
            setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, uploadProgress: Math.min(progress, 99) } : m));
          }
        }, 200);
      } else {
        setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessageId ? { ...m, status: 'sent' } : m)), 500);
      }
    }
  };

  const handleSendPoll = (pollData: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      type: 'poll',
      question: pollData.question,
      options: pollData.options.map((o: any) => ({ ...o, votes: 0, voters: [] })),
      totalVotes: 0,
      myVote: null,
      multipleVotes: pollData.multiple,
      anonymous: pollData.anonymous,
      expiresAt: Date.now() + 86400000,
      mood: mood || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    } as any;
    
    setMessages(prev => [...prev, newMessage]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleForwardMessage = (msg: Message) => {
    const forwardedMsg: Message = {
      ...msg,
      id: Date.now().toString(),
      sender: 'me',
      mood: mood || undefined,
      status: 'sending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, forwardedMsg]);
    executeSendRipple();
    setTimeout(() => setMessages(prev => prev.map(m => m.id === forwardedMsg.id ? { ...m, status: 'sent' } : m)), 500);
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions ? { ...m.reactions } : {};
        const isPulse = emoji === '⚡';
        const currentUsers = reactions[emoji] || [];
        if (currentUsers.includes('me')) {
          reactions[emoji] = currentUsers.filter(u => u !== 'me');
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...currentUsers, 'me'];
        }
        return { ...m, reactions };
      }
      return m;
    }));
    setActionMessage(null);
  };

  return (
    <div className="w-full h-full flex flex-col relative z-[999] bg-black overflow-hidden">
      <ChatBackground wallpaper={customization.wallpaper} mood={mood} energyLevel={energyLevel} energyOn={energyOn} />
      
      {/* Energy Level Indicator */}
      <div className="absolute top-16 right-4 z-[45] flex items-center gap-1 opacity-70 pointer-events-none">
        <span className="text-[10px] text-white/50 mr-1 select-none">⚡</span>
        <div className="flex gap-0.5">
           {[...Array(5)].map((_, i) => (
             <motion.div 
               key={i} 
               animate={
                  energyLevel > i * 20 
                    ? { backgroundColor: energyLevel >= 80 ? ['#FFD700', '#FFA500', '#FFD700'] : '#FFF', scale: energyLevel >= 80 ? [1, 1.2, 1] : 1 } 
                    : { backgroundColor: 'rgba(255,255,255,0.2)' }
               }
               transition={{ repeat: Infinity, duration: 1 }}
               className="w-1.5 h-1.5 rounded-full"
             />
           ))}
        </div>
      </div>

      {searchMode ? (
        <div className="flex-none p-4 pb-2 z-50 flex flex-col pt-safe bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-white/5">
           <div className="flex items-center gap-3 w-full relative">
              <button 
                 onClick={() => {
                    setSearchMode(false);
                 }} 
                 className="text-white/70 hover:text-white font-medium text-sm flex-none"
              >
                 Cancel
              </button>
              <div className="flex-1 relative flex items-center">
                 <input 
                    ref={searchInputRef}
                    autoFocus
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { 
                       if (e.key === 'Enter') saveSearchHistory(searchQuery); 
                    }}
                    placeholder="Search messages..." 
                    className="w-full bg-white/10 text-white rounded-full py-2 pl-10 pr-20 outline-none placeholder:text-white/30 text-[15px]" 
                 />
                 <div className="absolute left-3 text-white/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                 </div>
                 
                 {searchResults.length > 0 && searchQuery && (
                    <div className="absolute right-3 flex items-center gap-2 text-white/60 text-xs">
                       <span>{activeSearchIndex + 1} of {searchResults.length}</span>
                       <div className="flex items-center gap-1 border-l border-white/20 pl-2">
                          <button 
                             onClick={() => {
                                if (activeSearchIndex > 0) setActiveSearchIndex(prev => prev - 1);
                                else {
                                   setSearchToast("No more results above");
                                   setTimeout(() => setSearchToast(null), 2500);
                                }
                             }} 
                             className={`p-1 ${activeSearchIndex <= 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'}`}
                          >
                             ↑
                          </button>
                          <button 
                             onClick={() => {
                                if (activeSearchIndex < searchResults.length - 1) setActiveSearchIndex(prev => prev + 1);
                                else {
                                   setSearchToast("No more results below");
                                   setTimeout(() => setSearchToast(null), 2500);
                                }
                             }} 
                             className={`p-1 ${activeSearchIndex >= searchResults.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'}`}
                          >
                             ↓
                          </button>
                       </div>
                    </div>
                 )}
              </div>
           </div>
           
           {/* Filters */}
           <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar">
              {['All', '📷 Media', '📁 Files', '🔗 Links', '🎵 Songs'].map(filter => {
                 const isSelected = searchFilter === filter || (filter !== 'All' && searchFilter === filter.split(' ')[1]);
                 const filterName = filter.includes(' ') ? filter.split(' ')[1] : filter;
                 return (
                    <button 
                       key={filter}
                       onClick={() => setSearchFilter(filterName)}
                       className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                    >
                       {filter}
                    </button>
                 );
              })}
           </div>

           {/* Search History */}
           {!searchQuery && searchMode && searchHistory.length > 0 && (
              <div className="mt-4 px-2">
                 <div className="text-[10px] text-white/40 font-bold mb-2">RECENT SEARCHES</div>
                 <div className="flex flex-col gap-1">
                    {searchHistory.map((query, idx) => (
                       <div key={idx} className="flex items-center justify-between group">
                          <button 
                             className="flex-1 flex items-center gap-2 py-2 text-left text-white/80 hover:text-white"
                             onClick={() => setSearchQuery(query)}
                          >
                             <span className="text-white/30 text-xs">🕐</span>
                             <span className="text-sm">{query}</span>
                          </button>
                          <button 
                             onClick={() => {
                                const newHistory = searchHistory.filter((_, i) => i !== idx);
                                setSearchHistory(newHistory);
                                localStorage.setItem(`search_history_${chatId || 'default'}`, JSON.stringify(newHistory));
                             }}
                             className="p-2 text-white/30 hover:text-white/80"
                          >
                             ✕
                          </button>
                       </div>
                    ))}
                 </div>
                 <button 
                    onClick={() => {
                       setSearchHistory([]);
                       localStorage.setItem(`search_history_${chatId || 'default'}`, JSON.stringify([]));
                    }}
                    className="w-full text-center text-xs text-white/40 hover:text-white mt-2 py-2"
                 >
                    [Clear All]
                 </button>
              </div>
           )}
           
           {/* Results Bar or No Results */}
           {searchQuery.trim() && (
              <div className="mt-3 flex justify-center">
                 {searchResults.length > 0 ? (
                    <div className="bg-gradient-to-r from-[rgba(255,200,0,0.2)] to-[rgba(176,38,255,0.2)] border border-[rgba(255,200,0,0.3)] text-white text-xs px-4 py-1.5 rounded-full flex items-center gap-2 font-medium shadow-[0_4px_12px_rgba(255,200,0,0.15)]">
                       🔍 {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                       <button onClick={() => setSearchQuery('')} className="ml-1 text-white/60 hover:text-white">✕</button>
                    </div>
                 ) : (
                    <div className="bg-white/10 border border-white/5 text-white/60 text-xs px-4 py-1.5 rounded-full flex items-center gap-2">
                       🔍 No results for "{searchQuery}"
                    </div>
                 )}
              </div>
           )}
        </div>
      ) : (
        <ChatHeader 
          name={customization.nickname ? `${customization.nickname} 🎨` : (recipientUser?.displayName || "Priya Sharma")}
          avatar={recipientUser?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200"}
          isOnline={true}
          isTyping={isOtherTyping}
          currentMood={otherMood}
          onCustomizeClick={() => setShowCustomization(true)}
          onBack={() => navigate(-1)}
          onAvatarClick={() => navigate(`/group/info`)}
          isAdmin={isAdmin}
          onAnnounceClick={() => setShowAnnounceComposer(true)}
          translateEnabled={autoTranslate}
          onToggleTranslate={handleToggleAutoTranslate}
          smartRepliesEnabled={smartRepliesEnabled}
          onToggleSmartReplies={() => {
             const newVal = !smartRepliesEnabled;
             setSmartRepliesEnabled(newVal);
             localStorage.setItem('skrim_smart_replies', JSON.stringify(newVal));
          }}
          onSearchClick={() => setSearchMode(true)}
          sparkFlow={sparkFlow!}
          onSparkFlowClick={() => sparkFlow && setShowSparkDetail(true)}
          onReactToMood={(emoji) => {
             const myMoodObj = CHAT_MOODS.find(m => m.id === mood);
             if (!myMoodObj) return;

             setTimeout(() => {
                setReactionToast({
                  name: "Priya",
                  emoji: "💜",
                  moodEmoji: myMoodObj.emoji,
                  moodLabel: myMoodObj.label
                });
              
              setTimeout(() => {
                setReactionToast(null);
              }, 4000);
           }, 1500);
        }}
      />
      )}

      {moodNotification && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute top-24 inset-x-0 mx-auto w-max z-40 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 shadow-lg"
          >
             <span className="text-white/90 text-sm font-medium">{moodNotification.name} is feeling {moodNotification.mood}!</span>
          </motion.div>
        </AnimatePresence>
      )}

      {reactionToast && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.5 }}
            className="absolute bottom-24 inset-x-0 mx-auto w-max z-50 bg-[#1A1A24] border border-white/10 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-3"
          >
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                {reactionToast.emoji}
             </div>
             <div>
                <div className="text-white font-medium text-sm">
                   {reactionToast.name} reacted {reactionToast.emoji}
                </div>
                <div className="text-white/50 text-xs">
                   to your {reactionToast.moodEmoji} {reactionToast.moodLabel} mood!
                </div>
             </div>
          </motion.div>
        </AnimatePresence>
      )}

      {searchToast && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-44 inset-x-0 mx-auto w-max z-50 bg-[#1A1A24] border border-[#FFD700] shadow-[0_4px_24px_rgba(255,215,0,0.15)] px-5 py-2.5 rounded-full flex items-center gap-2"
          >
             <span className="text-[#FFD700]">🔍</span>
             <span className="text-white text-sm font-medium">{searchToast}</span>
          </motion.div>
        </AnimatePresence>
      )}

      {sparkFlow?.atRisk && (
        <div className="absolute top-[60px] inset-x-0 z-40 px-4 pt-2">
           <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3 flex justify-between items-center shadow-lg">
              <span className="text-white font-medium text-sm">⚠️ Your {sparkFlow.count}-day flow ends at midnight! Message now 🔥</span>
              <button className="text-white/70 hover:text-white"><Zap size={16}/></button>
           </div>
        </div>
      )}

      {pinnedMessages.length > 0 && (
        <div className="bg-[#1A1A2A] border-l-4 border-[#B026FF] px-4 py-2.5 flex items-center gap-3 relative z-[45] shadow-md mx-2 mt-2 rounded-r-xl" onClick={() => setShowPinnedMessagesPage(true)}>
           <div className="flex-1 overflow-hidden">
              <p className="text-white text-sm font-medium truncate flex gap-2">
                 <span>📌</span> {pinnedMessages[pinnedMessages.length - 1].type === 'announcement' ? (pinnedMessages[pinnedMessages.length - 1] as any).text : pinnedMessages[pinnedMessages.length - 1].type === 'text' ? (pinnedMessages[pinnedMessages.length - 1] as any).text : 'Pinned Message'}
              </p>
              <p className="text-white/50 text-xs ml-6">Tap to view all pinned</p>
           </div>
        </div>
      )}

      <MessageList 
        messages={messages}
        myMood={mood}
        customization={customization}
        isOtherTyping={isOtherTyping}
        onLongPress={(msg) => setActionMessage(msg)}
        onReactionClick={(msg) => setReactionSheetMessage(msg)}
        onSeenByClick={(msg) => setSeenByMessage(msg)}
        onAcceptChallenge={handleAcceptChallenge}
        onDeclineChallenge={handleDeclineChallenge}
        onRematchChallenge={handleRematchChallenge}
        searchMode={searchMode}
        searchQuery={searchQuery}
        searchResults={searchResults}
        activeSearchId={activeSearchIndex >= 0 ? searchResults[activeSearchIndex] : null}
      />

      {/* Ripple effect container */}
      <div className="relative w-full shrink-0">
         {sendRipple && (
            <motion.div 
               key={sendRipple.id}
               className="absolute bottom-0 left-1/2 rounded-full pointer-events-none z-0 mix-blend-screen"
               initial={{ width: 0, height: 0, x: '-50%', y: '50%', opacity: 0.5, border: `2px solid ${sendRipple.color}` }}
               animate={{ width: 600, height: 600, opacity: 0, border: `10px solid ${sendRipple.color}` }}
               transition={{ duration: 0.6, ease: 'easeOut' }}
            />
         )}
         
         <ChatInput 
            smartReplies={activeSmartReplies}
            onDismissSmartReplies={() => setActiveSmartReplies([])}
            currentMood={mood}
            onSetMood={handleSetMood}
            onSendMessage={handleSendMessage}
            onSendVoice={handleSendVoice}
            onSendGif={handleSendGif}
            onSendSticker={handleSendSticker}
            onSendAttachment={handleSendAttachment}
            onSendPoll={handleSendPoll}
            onOpenGamePicker={() => setShowGamePicker(true)}
            onTyping={() => {}}
            replyingTo={replyingTo ? {
               senderName: replyingTo.sender === 'me' ? 'You' : 'Priya Sharma',
               text: replyingTo.type === 'text' ? (replyingTo.text || '') : 'Attachment'
            } : null}
            onCancelReply={() => setReplyingTo(null)}
         />
      </div>

      <AnimatePresence>
        {showGamePicker && (
          <GameChallengePicker 
            onClose={() => setShowGamePicker(false)}
            onSendChallenge={handleSendChallenge}
            opponentName="Priya"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeChallengeMessage && (
          <GameModal
            game={AVAILABLE_GAMES.find(g => g.id === activeChallengeMessage.game) || AVAILABLE_GAMES[0]}
            scoreToBeat={activeChallengeMessage.score}
            opponentName={recipientUser.displayName}
            onClose={() => setActiveChallengeMessage(null)}
            onFinish={handleFinishGame}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
         {showCustomization && (
            <ChatCustomizationSheet 
               onClose={() => setShowCustomization(false)}
               onApply={handleApplyCustomization}
               onReset={handleResetCustomization}
               initialSettings={customization}
               originalName={recipientUser?.displayName || "Priya Sharma"}
            />
         )}
      </AnimatePresence>

      {/* existing modals  */}
      {showSparkDetail && sparkFlow && (
        <SparkFlowDetailModal 
          chatId={chatId!}
          contactName={recipientUser?.displayName || "Priya Sharma"}
          flow={sparkFlow}
          onClose={() => setShowSparkDetail(false)}
          onUpdate={(f) => setSparkFlow(f)}
        />
      )}

      {showMilestone && (
        <SparkFlowMilestoneModal 
          milestone={showMilestone}
          contactName={recipientUser?.displayName || "Priya Sharma"}
          onDismiss={() => setShowMilestone(null)}
        />
      )}

      {showBrokenFlow && (
        <BrokenSparkFlowScreen 
          contactName={recipientUser?.displayName || "Priya Sharma"}
          bestScore={showBrokenFlow}
          onDismiss={() => {
            setShowBrokenFlow(null);
            if (chatId) {
               updateSparkFlow(chatId);
               setSparkFlow(getSparkFlow(chatId));
            }
          }}
        />
      )}

      {mediaViewer && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent z-10 absolute top-0 inset-x-0">
               <div className="flex items-center gap-4">
                 <button onClick={() => setMediaViewer(null)} className="text-white hover:text-white/70">
                   <span className="text-2xl leading-none">✕</span>
                 </button>
                 <span className="text-white font-medium">{mediaViewer.sender === 'me' ? 'You' : 'Priya Sharma'}</span>
               </div>
               <div className="flex items-center gap-4 text-xl">
                 <button className="text-white hover:opacity-70">⬇️</button>
                 <button className="text-white hover:opacity-70">📤</button>
               </div>
            </div>
            
            {/* Media Content */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center">
               {mediaViewer.type === 'photo' && (
                 <div 
                   className="w-full flex-1 flex items-center justify-center text-[150px] relative"
                   style={{ backgroundColor: mediaViewer.photo.color, filter: mediaViewer.photo.filter === 'Vivid' ? 'saturate(200%)' : mediaViewer.photo.filter === 'Cool' ? 'hue-rotate(90deg)' : mediaViewer.photo.filter === 'Warm' ? 'sepia(50%)' : 'none' }}
                 >
                   {mediaViewer.photo.emoji}
                 </div>
               )}
               {mediaViewer.type === 'video' && (
                 <div 
                   className="w-full flex-1 flex items-center justify-center text-[150px] relative"
                   style={{ backgroundColor: mediaViewer.video.color }}
                 >
                   {mediaViewer.video.emoji}
                   <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                     <Play fill="white" size={80} className="text-white opacity-80" />
                   </div>
                 </div>
               )}
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 inset-x-0 text-center pointer-events-none transition-opacity">
               <span className="text-white/70 text-sm">Today, {mediaViewer.time}</span>
               {mediaViewer.type === 'photo' && mediaViewer.photo.caption && (
                 <div className="text-white mt-2 font-medium">{mediaViewer.photo.caption}</div>
               )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {actionMessage && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
             onClick={() => setActionMessage(null)} 
           />
           
           {/* Floating Reaction Bar */}
           <div className="relative bottom-8 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-full flex gap-1 shadow-2xl">
             {['❤️', '😂', '😮', '😢', '😤', '👑', '⚡'].map(emoji => (
               <button 
                 key={emoji}
                 className={`w-10 h-10 flex items-center justify-center text-2xl hover:scale-125 transition-transform origin-bottom ${emoji === '⚡' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]' : ''}`}
                 onClick={() => handleReact(actionMessage.id, emoji)}
               >
                 {emoji}
               </button>
             ))}
           </div>
           
           {/* Action Menu */}
           <div className="relative top-4 w-64 bg-[#1A1A24]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => { setReplyingTo(actionMessage); setActionMessage(null); }}>
               <span>↩️</span> Reply
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => {
                if (actionMessage.type === 'voice') {
                  alert("Voice message transcript unavailable");
                }
                setActionMessage(null);
             }}>
               <span>📋</span> {actionMessage.type === 'voice' ? 'Copy transcript' : 'Copy'}
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => { handleForwardMessage(actionMessage); setActionMessage(null); }}>
               <span>↪️</span> Forward
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => { 
                if (pinnedMessages.length >= 10) {
                  alert("Unpin an existing message first");
                } else {
                  setPinnedMessages(prev => [...prev, {...actionMessage, pinned: true}]); 
                  setMessages(prev => [...prev, {
                     id: Date.now().toString(),
                     sender: 'me',
                     type: 'text',
                     text: 'rajani pinned a message',
                     status: 'sent',
                     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }]);
                }
                setActionMessage(null); 
             }}>
               <span>📌</span> Pin Message
             </button>
             {actionMessage.type === 'text' && (
               <button className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-white/10 transition-colors border-b border-white/5" onClick={() => {
                 toggleTranslateMessage(actionMessage.id);
                 setActionMessage(null);
               }}>
                 <span>🌍</span> {actionMessage.showTranslation ? 'Hide Translation' : 'Translate'}
               </button>
             )}
             {actionMessage.sender === 'me' ? (
                <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-white/10 transition-colors" onClick={() => { setMessages(prev => prev.filter(m => m.id !== actionMessage.id)); setActionMessage(null); }}>
                  <span>🗑️</span> Delete
                </button>
             ) : (
                <button className="w-full flex items-center gap-3 px-4 py-3 text-orange-500 hover:bg-white/10 transition-colors" onClick={() => setActionMessage(null)}>
                  <span>⚠️</span> Report
                </button>
             )}
           </div>
        </div>
      )}

      {/* Reaction Summary Sheet */}
      {reactionSheetMessage && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReactionSheetMessage(null)} />
           <div className="relative bg-[#1A1A24] border-t border-white/10 rounded-t-3xl p-4 min-h-[50vh] max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-white text-lg font-bold">Reactions</h2>
                 <button onClick={() => setReactionSheetMessage(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
              </div>
              <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                 <button className="px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium whitespace-nowrap border border-white/5">
                   All {Object.values(reactionSheetMessage.reactions || {}).reduce((acc: number, arr) => acc + (arr as string[]).length, 0)}
                 </button>
                 {Object.entries(reactionSheetMessage.reactions || {}).map(([emoji, users]) => (
                   <button key={emoji} className={`px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium whitespace-nowrap border border-white/5 flex items-center gap-1.5 ${emoji === '⚡' ? 'text-yellow-400' : ''}`}>
                     {emoji} <span>{(users as string[]).length}</span>
                   </button>
                 ))}
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto">
                 {Object.entries(reactionSheetMessage.reactions || {}).flatMap(([emoji, users]) => 
                    (users as string[]).map((userId, idx) => (
                      <div key={`${emoji}-${idx}`} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                             {userId === 'me' ? 'Y' : 'U'}
                           </div>
                           <span className="text-white font-medium">{userId === 'me' ? 'You' : 'Priya Sharma'}</span>
                         </div>
                         <span className="text-2xl">{emoji}</span>
                      </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}
      {seenByMessage && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
           <div className="absolute inset-0 bg-black/50" onClick={() => setSeenByMessage(null)} />
           <motion.div 
             initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
             className="relative bg-[#1A1A24] rounded-t-3xl max-h-[70vh] flex flex-col border-t border-white/10"
           >
             <div className="flex justify-center p-3">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
             </div>
             <div className="px-6 pb-4">
                <h3 className="text-xl font-bold text-white mb-1">Seen by</h3>
                <p className="text-white/50 text-sm mb-4">{(seenByMessage as any).seenBy || 4} members have seen your announcement</p>
                
                <div className="space-y-4">
                   {[...Array((seenByMessage as any).seenBy || 4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                            <img src={`https://i.pravatar.cc/150?u=${i + 10}`} className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1">
                            <div className="text-white font-medium">Member {i + 1}</div>
                            <div className="text-white/50 text-xs">Seen Today at 10:{30 + i} AM</div>
                         </div>
                         <div className="text-green-500">
                            <CheckCheck size={18} />
                         </div>
                      </div>
                   ))}
                </div>
             </div>
           </motion.div>
        </div>
      )}
      
      {/* Modals placed before the final closing div */}
      {showPinnedMessagesPage && (
        <AnimatePresence>
           <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed inset-0 z-[100] bg-[#1A1A2A] flex flex-col"
           >
              <div className="flex items-center px-4 py-4 border-b border-white/5 bg-[#0A0A0A]">
                 <button onClick={() => setShowPinnedMessagesPage(false)} className="text-white mr-4"><ArrowLeft size={24}/></button>
                 <span className="text-white font-bold flex-1">Pinned Messages</span>
                 <span className="text-white/50 text-sm">({pinnedMessages.length} pinned)</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {pinnedMessages.map((pm, i) => (
                    <div key={i} className="flex flex-col gap-2">
                       <div className="text-xs text-white/50 font-medium">
                          📌 Pinned by {pm.sender === 'me' ? 'rajani' : 'Admin'} · {pm.time}
                       </div>
                       <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          {(pm.type === 'announcement') && (
                             <div className="text-[#B026FF] text-[10px] font-black tracking-widest flex items-center gap-1.5 uppercase mb-2">
                                <span>📢</span> ANNOUNCEMENT
                             </div>
                          )}
                          <div className="text-white text-sm line-clamp-3 mb-3">
                             {pm.type === 'text' || pm.type === 'announcement' ? (pm as any).text : 'Media Message'}
                          </div>
                          <div className="flex justify-end">
                             <button onClick={() => setShowPinnedMessagesPage(false)} className="text-[#B026FF] text-xs font-bold hover:underline">
                                Go to Message →
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
                 {pinnedMessages.length === 0 && (
                    <div className="text-white/50 text-center py-10">No pinned messages</div>
                 )}
              </div>
           </motion.div>
        </AnimatePresence>
      )}

      {showAnnounceComposer && (
        <AnimatePresence>
           <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed inset-0 z-[100] bg-[#1A1A2A] flex flex-col"
           >
              <div className="flex justify-between items-center px-4 py-4 border-b border-white/5 bg-[#0A0A0A]">
                 <button onClick={() => setShowAnnounceComposer(false)} className="text-white flex items-center gap-2"><ArrowLeft size={20}/> New Announcement</button>
                 <button 
                   onClick={() => {
                      if (announceText.trim()) {
                         const announceMsg: any = {
                           id: Date.now().toString(),
                           type: 'announcement',
                           sender: 'me',
                           text: announceText,
                           isAdmin: true,
                           pinned: announcePin,
                           seenBy: 4,
                           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                         };
                         setMessages(prev => [...prev, announceMsg]);
                         if (announcePin) {
                            setPinnedMessages(prev => [...prev, announceMsg]);
                         }
                         setShowAnnounceComposer(false);
                         setAnnounceText('');
                      }
                   }}
                   className={`font-bold px-3 py-1.5 rounded-full ${announceText.trim() ? 'bg-neon-purple text-white' : 'bg-white/10 text-white/40'}`}
                 >
                   Send 📢
                 </button>
              </div>
              <div className="p-4 bg-gradient-to-r from-[#B026FF]/20 to-transparent border-b border-[#B026FF]/30">
                 <div className="text-[#B026FF] text-[11px] font-black tracking-widest flex items-center gap-1.5 uppercase mb-2">
                    <span>📢</span> ANNOUNCEMENT
                 </div>
                 <p className="text-white/80 text-sm">This will be sent to all members and pinned.</p>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                 <textarea 
                   autoFocus
                   value={announceText}
                   onChange={e => {
                     if (e.target.value.length <= 500) setAnnounceText(e.target.value);
                   }}
                   placeholder="Type your announcement..."
                   className="w-full flex-1 bg-transparent text-white text-base outline-none resize-none"
                 />
                 <div className="text-right text-white/40 text-xs mt-2">{announceText.length}/500 characters</div>
              </div>
              
              <div className="p-4 bg-black/40 border-t border-white/5 space-y-4">
                 <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Options</div>
                 
                 <div className="flex items-center justify-between">
                   <div className="flex gap-2 items-center text-white"><span className="text-xl leading-none mr-1">📌</span> Pin this announcement</div>
                   <button onClick={() => setAnnouncePin(!announcePin)} className={`w-12 h-6 rounded-full relative transition-colors ${announcePin ? 'bg-neon-purple' : 'bg-white/20'}`}>
                      <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: announcePin ? '26px' : '2px' }} />
                   </button>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div className="flex gap-2 items-center text-white"><span className="text-xl leading-none mr-1">🔔</span> Notify all members</div>
                   <button onClick={() => setAnnounceNotify(!announceNotify)} className={`w-12 h-6 rounded-full relative transition-colors ${announceNotify ? 'bg-neon-purple' : 'bg-white/20'}`}>
                      <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: announceNotify ? '26px' : '2px' }} />
                   </button>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div className="flex gap-2 items-center text-white/60"><span className="text-xl leading-none mr-1">🗓️</span> Schedule for later</div>
                   <button onClick={() => setAnnounceSchedule(!announceSchedule)} className={`w-12 h-6 rounded-full relative transition-colors ${announceSchedule ? 'bg-neon-purple' : 'bg-white/20'}`}>
                      <motion.div className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md" animate={{ left: announceSchedule ? '26px' : '2px' }} />
                   </button>
                 </div>
              </div>
           </motion.div>
        </AnimatePresence>
      )}

    </div>
  );
}
