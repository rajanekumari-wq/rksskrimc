import React, { useState } from 'react';
import { ArrowLeft, Video, Phone, MoreVertical, Flame, Megaphone, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme, Mood } from '../types';
import { SparkFlowData } from '../lib/sparkFlowEngine';
import { SparkFlowIcon } from './SparkFlowIcon';
import { CHAT_MOODS } from '../constants/moods';

interface Props {
  name: string;
  avatar: string;
  isOnline: boolean;
  isTyping: boolean;
  currentMood?: Mood;
  onCustomizeClick: () => void;
  onBack: () => void;
  onAvatarClick?: () => void;
  sparkFlow?: SparkFlowData;
  onSparkFlowClick?: () => void;
  onReactToMood?: (emoji: string) => void;
  isAdmin?: boolean;
  onAnnounceClick?: () => void;
  translateEnabled?: boolean;
  onToggleTranslate?: () => void;
  smartRepliesEnabled?: boolean;
  onToggleSmartReplies?: () => void;
  onSearchClick?: () => void;
}

export function ChatHeader({
  name,
  avatar,
  isOnline,
  isTyping,
  currentMood,
  onCustomizeClick,
  onBack,
  onAvatarClick,
  sparkFlow,
  onSparkFlowClick,
  onReactToMood,
  isAdmin,
  onAnnounceClick,
  translateEnabled,
  onToggleTranslate,
  smartRepliesEnabled,
  onToggleSmartReplies,
  onSearchClick
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showMoodReactions, setShowMoodReactions] = useState(false);

  const moodObj = currentMood ? CHAT_MOODS.find(m => m.id === currentMood) : null;

  return (
    <div className="relative z-50">
      <header className="flex items-center justify-between px-4 py-3 bg-[rgba(10,10,18,0.95)] backdrop-blur-md border-b border-white/5 relative z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </button>
          
          <div onClick={onAvatarClick} className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left cursor-pointer">
            <img 
              src={avatar} 
              alt={name} 
              className="w-9 h-9 rounded-full object-cover border border-white/10"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 ">
                <span className="font-bold text-white text-[16px] leading-tight flex items-center gap-1">
                  {name}
                  {moodObj && (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setShowMoodReactions(!showMoodReactions)}
                        className="text-sm bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded-md transition-colors"
                      >
                        {moodObj.emoji}
                      </button>
                      <AnimatePresence>
                        {showMoodReactions && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMoodReactions(false)} />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 5 }}
                              className="absolute top-full left-0 mt-2 bg-[#1A1A24] border border-white/10 rounded-2xl shadow-xl flex flex-col p-1 z-50 whitespace-nowrap min-w-[150px]"
                            >
                              {[
                                { e: '🤝', l: 'Same' },
                                { e: '😂', l: 'No way' },
                                { e: '💜', l: 'Sending love' },
                                { e: '👀', l: 'Why??' }
                              ].map(reaction => (
                                <button 
                                  key={reaction.l}
                                  onClick={() => {
                                    onReactToMood?.(reaction.e);
                                    setShowMoodReactions(false);
                                  }}
                                  className="text-white text-sm hover:bg-white/10 px-3 py-2 rounded-xl text-left flex items-center gap-2"
                                >
                                  <span className="text-lg">{reaction.e}</span> {reaction.l}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </span>
              </div>
              <div className="text-[12px] leading-tight h-[15px]">
                {isTyping ? (
                  <span className="text-neon-purple flex items-center gap-1">
                    Typing
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
                    >
                      ...
                    </motion.span>
                  </span>
                ) : moodObj ? (
                  <span className="text-white/80 flex items-center gap-1" style={{ color: moodObj.bubbleGradient[0] }}>
                    {moodObj.emoji} Feeling {moodObj.label}
                  </span>
                ) : isOnline ? (
                  <span className="text-green-400">Online now</span>
                ) : (
                  <span className="text-white/50">Last seen 2 mins ago</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sparkFlow && sparkFlow.count > 0 && (
            <button onClick={onSparkFlowClick} className="bg-white/5 px-2.5 py-1 rounded-full border border-orange-500/30 hover:bg-white/10 transition-colors">
              <SparkFlowIcon flow={sparkFlow} />
            </button>
          )}

          {isAdmin && (
            <button onClick={onAnnounceClick} className="p-2 rounded-full text-white/80 hover:text-[#B026FF] hover:bg-[#B026FF]/10 transition-colors">
              <Megaphone size={20} />
            </button>
          )}
          
          <button onClick={onSearchClick} className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 hidden sm:block rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            <Phone size={20} />
          </button>
          
          <div className="relative">
            <button 
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={20} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 origin-top-right p-1.5"
                  >
                    <button
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-white hover:bg-white/10"
                      onClick={() => {
                        setShowMenu(false);
                        onCustomizeClick();
                      }}
                    >
                      <span className="text-lg">🎨</span>
                      <span className="font-medium">Customize Chat</span>
                    </button>
                    <div className="mx-2 my-1 h-px bg-white/10" />
                    <button
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-white hover:bg-white/10"
                      onClick={() => onToggleTranslate?.()}
                    >
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                           <span className="text-lg">🌍</span>
                           <span className="font-bold">Auto Translate</span>
                           <div className={`w-8 h-4 rounded-full relative transition-colors ml-2 ${translateEnabled ? 'bg-[#00F0FF]' : 'bg-white/20'}`}>
                              <div className={`absolute top-[2px] w-3 h-3 bg-white rounded-full transition-all ${translateEnabled ? 'left-4' : 'left-1'}`} />
                           </div>
                        </div>
                        <span className="text-[10px] text-white/50 mt-1 leading-tight w-full max-w-[180px] break-words">
                           Messages will be translated to English
                        </span>
                        <div className="mt-3 bg-black/20 p-2 rounded border border-white/5">
                           <div className="text-[9px] font-bold text-white/70 mb-1">SUPPORTED LANGUAGES:</div>
                           <div className="text-[9px] text-white/50 leading-[1.3] mb-1">
                              Telugu · Hindi · Tamil<br/>
                              Kannada · Malayalam<br/>
                              Bengali · Marathi<br/>
                              Punjabi · Gujarati
                           </div>
                           <div className="text-[9px] text-neon-blue font-medium text-right mt-2">
                              Powered by SkrimAI 🤖
                           </div>
                        </div>
                      </div>
                    </button>
                    <div className="mx-2 my-1 h-px bg-white/10" />
                    <button
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-white hover:bg-white/10"
                      onClick={() => onToggleSmartReplies?.()}
                    >
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2">
                           <span className="text-lg">⚡</span>
                           <span className="font-bold">Smart Replies</span>
                           <div className={`w-8 h-4 rounded-full relative transition-colors ml-2 ${smartRepliesEnabled ? 'bg-[#B026FF]' : 'bg-white/20'}`}>
                              <div className={`absolute top-[2px] w-3 h-3 bg-white rounded-full transition-all ${smartRepliesEnabled ? 'left-4' : 'left-1'}`} />
                           </div>
                        </div>
                        <span className="text-[10px] text-white/50 mt-1 leading-tight w-full max-w-[180px] break-words">
                           SkrimAI suggests replies based on messages
                        </span>
                      </div>
                    </button>
                    <div className="mx-2 my-1 h-px bg-white/10" />
                    <button
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-white hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                         <span className="text-lg">🔔</span>
                         <span className="font-medium">Mute</span>
                      </div>
                    </button>
                    <div className="mx-2 my-1 h-px bg-white/10" />
                    <button
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-white hover:bg-white/10"
                      onClick={() => {
                        setShowMenu(false);
                        onSearchClick?.();
                      }}
                    >
                      <div className="flex items-center gap-3">
                         <span className="text-lg">🔍</span>
                         <span className="font-medium">Search</span>
                      </div>
                    </button>
                    <div className="mx-2 my-1 h-px bg-white/10" />
                    <button
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm transition-colors text-[#FF3B30] hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                         <span className="text-lg">🚪</span>
                         <span className="font-medium">Clear Chat</span>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </div>
  );
}
