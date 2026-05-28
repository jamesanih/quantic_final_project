import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, TextField, IconButton, Paper, Avatar, Chip,
  alpha, Stack, Button, Card, CardContent, Grid, keyframes,
} from '@mui/material';
import {
  Send as SendIcon, Person as PersonIcon,
  SmartToy, Add,
} from '@mui/icons-material';
import { vectorApi } from '../../api/vector';
import { shortlistApi } from '../../api/matching';
import type { SearchResult } from '../../types';

const pulse = keyframes`
  0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
  30% { opacity: 1; transform: scale(1.2); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface Message {
  id: string; role: 'user' | 'assistant'; content: string; candidates?: SearchResult[];
}

const SUGGESTIONS = [
  'Python developers in Cape Town with 5+ years',
  'Senior data engineer with Spark and Kafka',
  'Finance manager Johannesburg',
  'React frontend developers remote',
];

export const RecruiterChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('tumaini_recruiter_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isThinking]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    localStorage.setItem('tumaini_recruiter_chat', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isThinking) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: q }]);
    setInput('');
    setIsThinking(true);
    try {
      const resp = await vectorApi.search({ query: q, limit: 5 });
      const results = resp.candidates || [];
      const top = results[0];
      const reply = results.length === 0
        ? "I couldn't find matching candidates for that query. Try broadening your search with more general terms."
        : `I found **${results.length}** candidate${results.length > 1 ? 's' : ''}. The strongest match is **${top.name}** at **${Math.round(top.score)}%** relevance.\n\nYou can shortlist anyone directly from this chat.`;
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, candidates: results }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Search failed. Please try again.' }]);
    } finally { setIsThinking(false); }
  };

  const handleShortlist = async (c: SearchResult) => {
    try {
      const lists = await shortlistApi.getShortlists();
      if (!Array.isArray(lists)) {
        throw new Error("Expected an array of shortlists");
      }
      let listId: string;
      const targetName = 'AI Chat Picks';
      
      const existing = lists.find(l => l.name === targetName);
      if (existing) {
        listId = existing.id;
      } else {
        const created = await shortlistApi.createShortlist(targetName);
        listId = created.id;
      }
      
      await shortlistApi.addCandidate(listId, c.candidate_id, c.name, c.score, c.matched_skills);
      setToast(`${c.name} added to shortlist`);
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error("Failed to add candidate to shortlist:", err);
      setToast("Failed to add candidate to shortlist");
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', maxWidth: 800, mx: 'auto', px: 1 }}>
      {/* Toast */}
      {toast && (
        <Box sx={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20, px: 3, py: 1, bgcolor: '#2E7D32', color: '#fff', borderRadius: 5, boxShadow: 4, animation: `${fadeIn} 0.3s ease` }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>✓ {toast}</Typography>
        </Box>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, px: 2, py: 1.5, borderRadius: 3, bgcolor: alpha('#7EC845', 0.04), border: `1px solid ${alpha('#7EC845', 0.1)}` }}>
        <Avatar sx={{ bgcolor: '#7EC845', width: 36, height: 36 }}><SmartToy sx={{ fontSize: 20 }} /></Avatar>
        <Box><Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>AI Talent Assistant</Typography><Typography variant="caption" color="text.secondary">Powered by DeepSeek</Typography></Box>
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={() => setMessages([])} title="New chat" sx={{ color: 'text.secondary' }}><Add /></IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', mb: 1.5, borderRadius: 3, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#000', 0.1), borderRadius: 3 } }}>
        {messages.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', px: 3, textAlign: 'center' }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '50%', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${alpha('#7EC845', 0.15)}, ${alpha('#1B2A4A', 0.1)})` }}>
              <SmartToy sx={{ fontSize: 36, color: '#7EC845' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>AI Talent Search</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 460, lineHeight: 1.7 }}>
              Describe your ideal candidate naturally — skills, experience, location, sector. I'll search the talent pool and return the best matches.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 560 }}>
              {SUGGESTIONS.map(s => (
                <Chip key={s} label={s} variant="outlined" onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  sx={{ borderRadius: 2.5, py: 2, px: 0.5, cursor: 'pointer', borderColor: alpha('#7EC845', 0.25), color: 'text.secondary', '&:hover': { bgcolor: alpha('#7EC845', 0.05), borderColor: '#7EC845', color: '#7EC845' }, transition: 'all 200ms ease' }} />
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ px: 1 }}>
            {messages.map((msg) => (
              <Box key={msg.id} sx={{ animation: `${fadeIn} 0.3s ease`, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: msg.role === 'user' ? '#1B2A4A' : '#7EC845', fontSize: '0.7rem', flexShrink: 0, mt: 0.3 }}>
                    {msg.role === 'user' ? <PersonIcon sx={{ fontSize: 15 }} /> : <SmartToy sx={{ fontSize: 15 }} />}
                  </Avatar>
                  <Box sx={{ maxWidth: '78%' }}>
                    <Typography variant="caption" sx={{ color: 'text.disabled', mb: 0.3, display: 'block', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </Typography>
                    <Paper elevation={0} sx={{ px: 2.5, py: 1.5, borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', bgcolor: msg.role === 'user' ? '#1B2A4A' : '#F1F3F5', color: msg.role === 'user' ? '#fff' : 'text.primary' }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={msg.role === 'assistant' ? { __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') } : undefined}>
                        {msg.role === 'user' ? msg.content : undefined}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>

                {msg.candidates && msg.candidates.length > 0 && (
                  <Box sx={{ ml: '50px', mt: 1.5 }}>
                    <Stack spacing={1}>
                      {msg.candidates.map(c => (
                        <Card key={c.candidate_id} elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#fff', '&:hover': { borderColor: '#7EC845', boxShadow: `0 2px 12px ${alpha('#7EC845', 0.1)}` }, transition: 'all 200ms ease' }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                              <Grid size={{ xs: 12, sm: 5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar sx={{ width: 34, height: 34, bgcolor: alpha('#7EC845', 0.1), color: '#7EC845', fontSize: '0.75rem', fontWeight: 700 }}>
                                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{c.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>{c.rationale}</Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 2 }} sx={{ textAlign: 'center' }}>
                                <Box sx={{ px: 1.5, py: 0.5, borderRadius: 5, bgcolor: c.score >= 80 ? alpha('#339345', 0.1) : c.score >= 60 ? alpha('#7EC845', 0.1) : alpha('#FF9800', 0.1) }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: c.score >= 80 ? '#2E7D32' : c.score >= 60 ? '#5F9F2F' : '#E65100' }}>{Math.round(c.score)}%</Typography>
                                </Box>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 5 }}>
                                <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
                                  {c.matched_skills.slice(0, 3).map(s => <Chip key={s} label={s} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', borderRadius: 1 }} />)}
                                  <Button size="small" variant="outlined" color="secondary" onClick={() => handleShortlist(c)} sx={{ borderRadius: 2, fontSize: '0.7rem', px: 1.5, py: 0.2, flexShrink: 0 }}>+</Button>
                                </Stack>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            ))}

            {isThinking && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3, animation: `${fadeIn} 0.3s ease` }}>
                <Avatar sx={{ width: 30, height: 30, bgcolor: '#7EC845', flexShrink: 0 }}><SmartToy sx={{ fontSize: 15 }} /></Avatar>
                <Paper elevation={0} sx={{ px: 2.5, py: 1.5, borderRadius: '20px 20px 20px 4px', bgcolor: '#F1F3F5' }}>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: 20 }}>
                    {[0, 1, 2].map(i => <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7EC845', animation: `${pulse} 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />)}
                  </Box>
                </Paper>
              </Box>
            )}
            <div ref={endRef} />
          </Box>
        )}
      </Box>

      {/* Input */}
      <Paper elevation={0} sx={{ p: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end', bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <TextField fullWidth multiline maxRows={5} placeholder="Describe your ideal candidate..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} inputRef={inputRef} variant="standard" slotProps={{ input: { disableUnderline: true, sx: { px: 1.5, fontSize: '0.9rem', py: 0.8 } } }} disabled={isThinking} />
        <IconButton onClick={handleSend} disabled={!input.trim() || isThinking}
          sx={{ bgcolor: input.trim() ? '#7EC845' : alpha('#000', 0.06), color: input.trim() ? '#fff' : 'text.disabled', '&:hover': { bgcolor: input.trim() ? '#5F9F2F' : alpha('#000', 0.1) }, borderRadius: 2.5, width: 38, height: 38, transition: 'all 200ms ease', flexShrink: 0 }}>
          <SendIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Paper>

      <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', mt: 1 }}>
        AI may produce inaccurate information. Verify before making hiring decisions.
      </Typography>
    </Box>
  );
};
