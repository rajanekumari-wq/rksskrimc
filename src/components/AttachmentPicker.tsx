import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image as ImageIcon, Video, Folder, Music, MapPin, X, File, Play, ChevronLeft, Gamepad2, BarChart2, Plus } from 'lucide-react';

interface Props {
  onSendPhoto: (photo: any) => void;
  onSendVideo: (video: any) => void;
  onSendFile: (file: any) => void;
  onSendSong: (song: any) => void;
  onSendLocation: (location: any) => void;
  onSendPoll?: (poll: any) => void;
  onOpenGamePicker?: () => void;
  onClose: () => void;
}

const ATTACH_OPTIONS = [
  { id: 'photo', icon: Camera, label: 'Photo', gradient: 'from-pink-500 to-purple-600' },
  { id: 'video', icon: Video, label: 'Video', gradient: 'from-red-500 to-orange-500' },
  { id: 'file', icon: Folder, label: 'File', gradient: 'from-blue-500 to-teal-500' },
  { id: 'song', icon: Music, label: 'Song', gradient: 'from-purple-500 to-pink-500' },
  { id: 'location', icon: MapPin, label: 'Location', gradient: 'from-green-500 to-teal-600' },
  { id: 'game', icon: Gamepad2, label: 'Game', gradient: 'from-orange-500 to-yellow-500' },
  { id: 'poll', icon: BarChart2, label: 'Poll', gradient: 'from-indigo-500 to-purple-600' }
];

const MOCK_PHOTOS = [
  { id: 'p1', emoji: '🌅', color: '#ff7e5f' }, { id: 'p2', emoji: '🎉', color: '#feb47b' },
  { id: 'p3', emoji: '🏏', color: '#228B22' }, { id: 'p4', emoji: '🌸', color: '#FF69B4' },
  { id: 'p5', emoji: '🌃', color: '#2b5876' }, { id: 'p6', emoji: '😂', color: '#FFD700' },
  { id: 'p7', emoji: '🍛', color: '#D2691E' }, { id: 'p8', emoji: '🔥', color: '#FF4500' }
];

const MOCK_VIDEOS = [
  { id: 'v1', emoji: '🏄', color: '#00C9FF', duration: '0:32' }, { id: 'v2', emoji: '🐕', color: '#f3a183', duration: '1:15' },
  { id: 'v3', emoji: '🎢', color: '#8E2DE2', duration: '2:40' }, { id: 'v4', emoji: '🎸', color: '#4A00E0', duration: '0:18' }
];

const MOCK_FILES = [
  { name: 'Project_Report.pdf', size: '2.4 MB', type: 'pdf' },
  { name: 'Sales_Data.xlsx', size: '1.1 MB', type: 'excel' },
  { name: 'Notes.docx', size: '340 KB', type: 'word' },
  { name: 'Design_Final.png', size: '4.2 MB', type: 'image' },
  { name: 'Resume_2025.pdf', size: '890 KB', type: 'pdf' },
  { name: 'Song_preview.mp3', size: '3.1 MB', type: 'audio' }
];

const MOCK_SONGS = [
  { title: 'Oo Antava', movie: 'Pushpa', artist: 'Devi Sri Prasad', duration: '3:24', color: '#8B0000' },
  { title: 'Naatu Naatu', movie: 'RRR', artist: 'MM Keeravani', duration: '4:15', color: '#B8860B' },
  { title: 'Chaleya', movie: 'Jawan', artist: 'Anirudh', duration: '3:20', color: '#4B0082' },
  { title: 'Tum Kya Mile', movie: 'Rocky Aur Rani Kii Prem Kahaani', artist: 'Pritam', duration: '4:05', color: '#DC143C' }
];

export function AttachmentPicker({ onSendPhoto, onSendVideo, onSendFile, onSendSong, onSendLocation, onSendPoll, onOpenGamePicker, onClose }: Props) {
  const [step, setStep] = useState<'menu' | 'photo' | 'photo_preview' | 'video' | 'file' | 'song' | 'location' | 'poll'>('menu');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState('Original');
  
  // Poll State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState([{id: '1', text: ''}, {id: '2', text: ''}]);
  const [pollMultiple, setPollMultiple] = useState(false);
  const [pollAnon, setPollAnon] = useState(false);
  
  const renderContent = () => {
    switch (step) {
      case 'menu':
        return (
          <div className="grid grid-cols-3 gap-y-6 gap-x-4 p-8">
            {ATTACH_OPTIONS.map((opt) => (
              <motion.button 
                key={opt.id}
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-2"
                onClick={() => {
                  if (opt.id === 'game') {
                    onOpenGamePicker?.();
                    onClose();
                  } else {
                    setStep(opt.id as any);
                  }
                }}
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${opt.gradient} flex items-center justify-center shadow-lg`}>
                  <opt.icon size={24} color="white" />
                </div>
                <span className="text-[11px] text-white font-medium">{opt.label}</span>
              </motion.button>
            ))}
          </div>
        );
      case 'photo':
        return (
          <div className="flex flex-col h-full bg-[#1A1A24]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
              <h3 className="text-white font-bold">📷 Send Photo</h3>
              <button onClick={onClose} className="text-white/50"><X size={20}/></button>
            </div>
            <div className="p-4 flex gap-2">
              <button className="flex-1 py-2 bg-white/10 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2"><Camera size={16}/> Camera</button>
              <button className="flex-1 py-2 bg-white/10 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2"><ImageIcon size={16}/> Gallery</button>
            </div>
            <div className="px-4 pb-2 text-[10px] uppercase font-bold text-white/40 tracking-wider">Recent Photos</div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
               <div className="grid grid-cols-4 gap-2">
                 {MOCK_PHOTOS.map(p => (
                   <button 
                     key={p.id}
                     className="aspect-square rounded-lg flex items-center justify-center text-3xl"
                     style={{ backgroundColor: p.color }}
                     onClick={() => { setSelectedItem(p); setStep('photo_preview'); }}
                   >
                     {p.emoji}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        );
      case 'photo_preview':
        return (
          <div className="flex flex-col h-full bg-[#1A1A24]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
              <button onClick={() => setStep('photo')} className="text-white flex items-center"><ChevronLeft size={20}/> Back</button>
              <button 
                onClick={() => {
                  onSendPhoto({ ...selectedItem, caption, filter });
                  onClose();
                }}
                className="text-neon-purple font-bold text-sm bg-neon-purple/20 px-3 py-1.5 rounded-full"
              >
                ✓ Send
              </button>
            </div>
            <div className="flex-1 flex flex-col p-4 items-center">
               <div 
                 className="w-full max-w-[280px] aspect-[4/5] rounded-xl flex items-center justify-center text-8xl mb-4 transition-all duration-300"
                 style={{ 
                   backgroundColor: selectedItem.color,
                   filter: filter === 'Vivid' ? 'saturate(200%)' : filter === 'Cool' ? 'hue-rotate(90deg)' : filter === 'Warm' ? 'sepia(50%)' : 'none'
                 }}
               >
                 {selectedItem.emoji}
               </div>
               <input 
                 type="text" 
                 placeholder="✏️ Add a caption..." 
                 value={caption}
                 onChange={e => setCaption(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple mb-4"
               />
               <div className="flex gap-2 w-full overflow-x-auto no-scrollbar">
                 {['Original', 'Vivid', 'Cool', 'Warm'].map(f => (
                   <button 
                     key={f}
                     onClick={() => setFilter(f)}
                     className={`px-4 py-2 rounded-full text-xs font-medium ${filter === f ? 'bg-neon-purple text-white' : 'bg-white/10 text-white/70'}`}
                   >
                     {f}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="flex flex-col h-full bg-[#1A1A24]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
              <h3 className="text-white font-bold">📹 Send Video</h3>
              <button onClick={onClose} className="text-white/50"><X size={20}/></button>
            </div>
            <div className="px-4 py-2 text-[10px] uppercase font-bold text-white/40 tracking-wider">Recent Videos</div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
               <div className="grid grid-cols-2 gap-2">
                 {MOCK_VIDEOS.map(v => (
                   <button 
                     key={v.id}
                     className="aspect-video rounded-lg flex flex-col items-center justify-center text-4xl relative overflow-hidden group"
                     style={{ backgroundColor: v.color }}
                     onClick={() => { onSendVideo(v); onClose(); }}
                   >
                     {v.emoji}
                     <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                        <Play fill="white" size={24} className="text-white opacity-80" />
                     </div>
                     <span className="absolute bottom-1 right-2 text-[10px] text-white font-mono bg-black/60 px-1 rounded">{v.duration}</span>
                   </button>
                 ))}
               </div>
            </div>
          </div>
        );
      case 'file':
        return (
          <div className="flex flex-col h-full bg-[#1A1A24]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
              <h3 className="text-white font-bold">📁 Choose File</h3>
              <button onClick={onClose} className="text-white/50"><X size={20}/></button>
            </div>
            <div className="px-4 py-2 text-[10px] uppercase font-bold text-white/40 tracking-wider">Recent Files</div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-2">
                {MOCK_FILES.map((f, i) => (
                  <button 
                    key={i}
                    onClick={() => { onSendFile(f); onClose(); }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 text-left"
                  >
                    <File size={20} className={f.type === 'pdf' ? 'text-red-400' : f.type === 'excel' ? 'text-green-400' : 'text-blue-400'} />
                    <div className="flex-1 flex justify-between items-center overflow-hidden">
                      <span className="text-white text-sm font-medium truncate">{f.name}</span>
                      <span className="text-white/40 text-xs whitespace-nowrap ml-2">{f.size}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'song':
        return (
          <div className="flex flex-col h-full bg-[#1A1A24]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
              <h3 className="text-white font-bold">🎵 Share a Song</h3>
              <button onClick={onClose} className="text-white/50"><X size={20}/></button>
            </div>
            <div className="px-4 py-2">
              <input type="text" placeholder="🔍 Search songs..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-purple" />
            </div>
            <div className="px-4 py-2 text-[10px] uppercase font-bold text-white/40 tracking-wider">Trending Songs</div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-3">
                {MOCK_SONGS.map((s, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                     <div className="w-16 h-16 rounded-md flex items-center justify-center" style={{ backgroundColor: s.color }}><Music size={24} className="text-white/50"/></div>
                     <div className="flex-1 flex flex-col justify-center">
                        <span className="text-white font-bold text-sm tracking-tight">{s.title}</span>
                        <span className="text-white/60 text-xs">{s.movie} · {s.artist}</span>
                        <div className="flex gap-2 mt-2">
                          <button className="text-[10px] bg-white/10 px-2 py-1 rounded text-white"><Play size={10} className="inline mr-1" />Preview</button>
                          <button onClick={() => { onSendSong(s); onClose(); }} className="text-[10px] bg-neon-purple text-white px-3 py-1 rounded font-bold shadow-[0_0_8px_rgba(176,38,255,0.4)]">Share</button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'poll':
        return (
          <div className="flex flex-col h-full bg-[#1A1A24]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5">
              <button onClick={() => setStep('menu')} className="text-white flex items-center"><ChevronLeft size={20}/> Back</button>
              <span className="text-white font-bold text-sm">Create Poll</span>
              <button 
                onClick={() => {
                  if (pollQuestion.trim() && pollOptions.filter(o => o.text.trim()).length >= 2) {
                    onSendPoll?.({
                      question: pollQuestion,
                      options: pollOptions.filter(o => o.text.trim()),
                      multiple: pollMultiple,
                      anonymous: pollAnon
                    });
                    onClose();
                  }
                }}
                className={`font-bold text-sm bg-neon-purple/20 px-3 py-1.5 rounded-full ${(pollQuestion.trim() && pollOptions.filter(o => o.text.trim()).length >= 2) ? 'text-neon-purple cursor-pointer' : 'text-white/30 cursor-not-allowed'}`}
              >
                Send
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
              <div className="mb-6">
                <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-2">Question</div>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Ask a question..." 
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple font-medium"
                />
              </div>

              <div className="mb-6">
                 <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-2">Options</div>
                 <div className="flex flex-col gap-3">
                   {pollOptions.map((opt, index) => (
                     <div key={opt.id} className="relative flex items-center">
                       <input 
                         type="text"
                         placeholder={`Option ${index + 1}`}
                         value={opt.text}
                         onChange={(e) => {
                           const newOpts = [...pollOptions];
                           newOpts[index].text = e.target.value;
                           setPollOptions(newOpts);
                         }}
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-purple pr-10"
                       />
                       {index >= 2 && (
                          <button 
                            onClick={() => setPollOptions(pollOptions.filter(o => o.id !== opt.id))}
                            className="absolute right-3 text-white/30 hover:text-red-400"
                          >
                            <X size={16} />
                          </button>
                       )}
                     </div>
                   ))}
                   {pollOptions.length < 10 && (
                     <button 
                       onClick={() => setPollOptions([...pollOptions, { id: Date.now().toString(), text: '' }])}
                       className="flex items-center gap-2 text-neon-purple font-medium text-sm py-2 px-1 w-fit mt-1"
                     >
                       <Plus size={16} /> Add Option
                     </button>
                   )}
                 </div>
              </div>

              <div className="mb-6">
                <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-3">Settings</div>
                
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-white text-sm">Allow multiple votes</span>
                  <button 
                    onClick={() => setPollMultiple(!pollMultiple)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${pollMultiple ? 'bg-neon-purple' : 'bg-white/20'}`}
                  >
                    <motion.div 
                       className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md"
                       animate={{ left: pollMultiple ? '18px' : '2px' }}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-white text-sm">Anonymous voting</span>
                  <button 
                    onClick={() => setPollAnon(!pollAnon)}
                    className={`w-10 h-6 rounded-full relative transition-colors ${pollAnon ? 'bg-neon-purple' : 'bg-white/20'}`}
                  >
                    <motion.div 
                       className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md"
                       animate={{ left: pollAnon ? '18px' : '2px' }}
                    />
                  </button>
                </div>

              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="flex flex-col h-full bg-[#1A1A24]">
            <div className="flex justify-between items-center px-4 py-3 border-b border-white/5 z-10">
              <h3 className="text-white font-bold">📍 Share Location</h3>
              <button onClick={onClose} className="text-white/50"><X size={20}/></button>
            </div>
            <div className="flex-1 relative flex flex-col">
               <div className="flex-1 bg-gradient-to-br from-green-500/20 to-teal-600/30 w-full relative flex items-center justify-center overflow-hidden">
                 {/* Mock map grid */}
                 <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 <div className="relative text-red-500 pb-8 animate-bounce"><MapPin size={48} fill="currentColor" className="text-white"/></div>
               </div>
               <div className="h-28 bg-[#1A1A24] p-4 flex flex-col justify-between border-t border-white/10">
                 <div>
                   <h4 className="text-white font-bold text-sm">Nellore, Andhra Pradesh</h4>
                   <p className="text-white/50 text-xs">India</p>
                 </div>
                 <button 
                   onClick={() => { onSendLocation({ name: 'Nellore, Andhra Pradesh', country: 'India' }); onClose(); }}
                   className="w-full py-2 bg-neon-purple rounded-lg text-white font-bold text-sm shadow-[0_0_10px_rgba(176,38,255,0.4)] flex justify-center items-center gap-2"
                 >
                   Share <ChevronLeft className="rotate-180" size={16}/>
                 </button>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} 
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-50 bg-[#1A1A24] rounded-t-3xl border-t border-white/10 shadow-2xl overflow-hidden"
        style={{ height: step === 'menu' ? 'auto' : '450px' }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}
